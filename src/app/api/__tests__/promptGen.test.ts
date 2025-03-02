import {
  calculateManaCurve,
  formatCardsHuman,
  formatCardDetailsHuman,
  formatCardsJson,
  parseCardInfo
} from '@/app/api/promptGen.util'
import generatePromptFromDeck, { Card } from '../promptGen'

describe('Mana Curve Calculations', () => {
  test('should calculate basic curve', () => {
    const cards = [
      { count: 2,stats: { Cost: '1' } },
      { count: 1, stats: { Cost: '3' } }
    ]

    const result = calculateManaCurve((cards as unknown) as Card[])
    expect(result.average).toBe(((2 * 1 + 1 * 3) / 3).toFixed(1))
    expect(result.chart).toContain('1: ■■ (2)')
  })
})

describe('Card Parsing', () => {
  test('should extract card stats', () => {
    const text = `Card type: Spell\nCost: 3\nDescription: Freeze all enemies`
    expect(parseCardInfo(text)).toEqual({
      'Card type': 'Spell',
      Cost: '3',
      Description: 'Freeze all enemies'
    })
  })
})
describe('Card Formatting For Humans', () => {
  const enrichedCards: Card[] = [
    {
      cardName: 'Arcane Intellect',
      count: 2,
      stats: {
        Cost: '3',
        Description: 'Draw 2 cards',
        'Card type': 'Spell'
      }
    },
    {
      cardName: 'Corrupted Card',
      error: 'Invalid data format'
    }
  ]

  test('should format valid card with stats', () => {
    const formatter = formatCardDetailsHuman(enrichedCards)
    const line = '2x (3) Arcane Intellect'
    expect(formatter(line, 0, [])).toBe(
      '2x (3) Arcane Intellect\n' +
        '• Cost: 3\n' +
        '• Description: Draw 2 cards\n' +
        '• Card type: Spell'
    )
  })

  test('should handle cards with errors', () => {
    const formatter = formatCardDetailsHuman(enrichedCards)
    const line = '1x (2) Corrupted Card'
    expect(formatter(line, 0, [])).toBe(
      '1x (2) Corrupted Card | Error: Invalid data format'
    )
  })

  test('should handle missing cards', () => {
    const formatter = formatCardDetailsHuman(enrichedCards)
    const line = '1x (4) Missing Card'
    expect(formatter(line, 0, [])).toBe('1x (4) Missing Card | Error: No data')
  })
  test('should handle missing cards', () => {
    const line = [
      '2x (3) Arcane Intellect',
      `1x (2) Corrupted Card`,
      `1x (4) Missing Card`
    ]
    const formatted = formatCardsHuman(line, enrichedCards)
    expect(formatted).toBe(
      '2x (3) Arcane Intellect\n' +
        '• Cost: 3\n' +
        '• Description: Draw 2 cards\n' +
        '• Card type: Spell\n' +
        '1x (2) Corrupted Card | Error: Invalid data format\n' +
        '1x (4) Missing Card | Error: No data'
    )
  })
})
describe('Card Formatting For Json', () => {
  const enrichedCards: Card[] = [
    {
      cardName: 'Arcane Intellect',
      count: 2,
      stats: {
        Cost: '3',
        Description: 'Draw 2 cards',
        'Card type': 'Spell'
      }
    },
    {
      cardName: 'Corrupted Card',
      error: 'Invalid data format'
    }
  ]

  test('should handle missing cards', () => {
    const line = [
      '2x (3) Arcane Intellect',
      `1x (2) Corrupted Card`,
      `1x (4) Missing Card`
    ]
    const formatted = formatCardsJson(line, enrichedCards)
    expect(formatted).toBe(
      '[{"cardName":"Arcane Intellect","count":2,"stats":{"Cost":"3","Description":"Draw 2 cards","Card type":"Spell"}},{"cardName":"Corrupted Card","error":"Invalid data format"}]'
    )
  })
})

describe('Card Formatting Full', () => {
  const enrichedCards: Card[] = [
    {
      cardName: 'Arcane Intellect',
      count: 2,
      stats: {
        Cost: '3',
        Description: 'Draw 2 cards',
        'Card type': 'Spell'
      }
    },
    {
      cardName: 'Corrupted Card',
      error: 'Invalid data format'
    }
  ]
  const prolog = `### Custom Death Knight
# Class: Deathknight
# Format: Standard
# Year of the Pegasus
#`
  const lines = `# 2x (3) Arcane Intellect
# 1x (2) Corrupted Card
# 1x (4) Missing Card`.split('\n')

  test('human', () => {
    const formatted = generatePromptFromDeck(
      lines,
      enrichedCards,
      prolog,
      formatCardsHuman
    )
    expect(formatted).toStrictEqual({
      enrichedCards: [
        {
          cardName: 'Arcane Intellect',
          count: 2,
          stats: {
            'Card type': 'Spell',
            Cost: '3',
            Description: 'Draw 2 cards'
          }
        },
        { cardName: 'Corrupted Card', error: 'Invalid data format' }
      ],
      manaCurveAnalysis: `# MANA CURVE ANALYSIS
# Average Cost: 3.0
# Highest Cost: 3
# Curve Distribution:
#  0:  (0)
#  1:  (0)
#  2:  (0)
#  3: ■■ (2)`,
      promptString: `Relevant Keyword explanations

### Custom Death Knight
# Class: Deathknight
# Format: Standard
# Year of the Pegasus
#
# MANA CURVE ANALYSIS
# Average Cost: 3.0
# Highest Cost: 3
# Curve Distribution:
#  0:  (0)
#  1:  (0)
#  2:  (0)
#  3: ■■ (2)
# 2x (3) Arcane Intellect
• Cost: 3
• Description: Draw 2 cards
• Card type: Spell
# 1x (2) Corrupted Card | Error: Invalid data format
# 1x (4) Missing Card | Error: No data`
    })
  })
  test('json', () => {
    const formatted = generatePromptFromDeck(
      lines,
      enrichedCards,
      prolog,
      formatCardsJson
    )
    expect(formatted).toStrictEqual({
      enrichedCards: [
        {
          cardName: 'Arcane Intellect',
          count: 2,
          stats: {
            'Card type': 'Spell',
            Cost: '3',
            Description: 'Draw 2 cards'
          }
        },
        { cardName: 'Corrupted Card', error: 'Invalid data format' }
      ],
      manaCurveAnalysis: `# MANA CURVE ANALYSIS
# Average Cost: 3.0
# Highest Cost: 3
# Curve Distribution:
#  0:  (0)
#  1:  (0)
#  2:  (0)
#  3: ■■ (2)`,
      promptString: `Relevant Keyword explanations

### Custom Death Knight
# Class: Deathknight
# Format: Standard
# Year of the Pegasus
#
# MANA CURVE ANALYSIS
# Average Cost: 3.0
# Highest Cost: 3
# Curve Distribution:
#  0:  (0)
#  1:  (0)
#  2:  (0)
#  3: ■■ (2)
${JSON.stringify(enrichedCards)}`
    })
  })
})
