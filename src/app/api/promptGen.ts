'use server'
import { JSDOM } from 'jsdom'
interface CardMetadata {
  cardName: string
  stats: {
    Description: string
    Cost: string
    Attack: string
    Health: string
    Durability: string
    'Card type': string
    Class: string
    Runes: string
    Rarity: string
  }
}
interface CardError {
  cardName: string
  error: string
}

export type Card = CardMetadata | CardError
export type DeckPromptOutput = {
  promptString: string
  enrichedCards: Card[]
}

export default async function generatePromptFromDeckString (
  deckInput: string
): Promise<DeckPromptOutput> {
  //     const deckInput = `
  // ### Custom Death Knight
  // # Class: Deathknight
  // # Format: Standard
  // # Year of the Pegasus
  // #
  // # 1x (6) Corpse Explosion
  // # 1x (7) Kerrigan
  // `;

  const prefix = `Keyword explanation:
<b>Battlecry</b><br>Does something when you play it from your hand.
<b>Combo</b><br>A bonus if you already played a card this turn.
<b>Corpse</b><br>Resource gained when a friendly minion dies.
<b>Deathrattle</b><br>Does something when it dies.
<b>Discover</b><br>Choose one of three cards to add to your hand.
<b>Divine Shield</b><br>The first time a Shielded minion takes damage, ignore it.
<b>Freeze</b><br>Frozen characters lose their next attack.
<b>Lifesteal</b><br>Damage dealt also heals your hero.
<b>Outcast</b><br>A bonus if played as the left- or right-most card in hand.
<b>Overheal</b><br>A bonus if restored past full Health.
<b>Overload: X</b><br>You have X less mana next turn.
<b>Poisonous</b><br>Destroy any minion damaged by this.
<b>Reborn</b><br>Resurrects with 1 Health the first time it dies.
<b>Rush</b><br>Can attack minions immediately.
<b>Secret</b><br>Hidden until a specific action occurs on your opponent's turn.
<b>Silence</b><br>Removes all card text and enchantments.
<b>Spell Damage</b><br>Your spells deal extra damage.
<b>Stealth</b><br>Can't be attacked or targeted until it attacks.
<b>Taunt</b><br>Enemies must attack minions that have Taunt.
<b>Tradeable</b><br>Drag this into your deck to spend (1) Mana and draw a new card.
<b>Windfury</b><br>Can attack twice each turn.`
    .split('\n')
    .filter(x => x.match(/<b>(.*?)<\/b>/g))
    .map(x => {
      const match = x.match(/<b>(.*?)<\/b>/)
      const keyword = match ? match[1] : ''
      const explanation = x.replace(/<b>(.*?)<\/b><br>/, '')
      return {
        [keyword]: explanation
      }
    })
    .reduce(
      (acc, curr) => ({
        ...acc,
        ...curr
      }),
      {}
    )
  const delay = (ms: number | undefined) =>
    new Promise(resolve => setTimeout(resolve, ms))

  // Parse card names from deck list
  const cardLines = deckInput.split('\n').filter(line => line.includes('x ('))
  const prolog = deckInput
    .split('\n')
    .filter(line => !line.includes('x ('))
    .join('\n')
  const cards = cardLines.map(line => line.match(/\(\d+\)\s(.*)$/)?.[1].trim())

  // Fetch card data with rate limiting
  const enrichedCards: Card[] = []
  for (const cardName of cards) {
    if (!cardName) continue
    console.log('Fetching ' + cardName)
    const wikiName = cardName.replaceAll(' ', '_')
    try {
      const response = await fetch(
        `https://hearthstone.wiki.gg/wiki/${wikiName}`
      )
      const text = await response.text()
      const doc = new JSDOM(text).window.document
      const cardInfo = doc.querySelector(
        'aside > section:nth-child(2) > section > section:nth-child(1)'
      )

      if (cardInfo) {
        const cardData = await getCardData(doc)
        console.log('Parsed stats:', cardData)

        enrichedCards.push({
          cardName,
          stats: cardData
        })
      } else {
        enrichedCards.push({
          cardName,
          error: 'Card element not found'
        })
      }
    } catch (error: unknown) {
      enrichedCards.push({
        cardName,
        error: (error as Error).message
      })
      console.error('Error fetching card:', cardName, error)
    }
    await delay(500)
    // Be polite with requests
  }
  const curveData = calculateManaCurve(
    cardLines.map(line => ({
      line,
      stats: (() => {
        const foundCard = enrichedCards.find(
          c => c.cardName === line.match(/\(\d+\)\s(.*)$/)?.[1].trim()
        )
        if (foundCard && 'stats' in foundCard) {
          // Type guard using 'in' operator
          return foundCard.stats as CardMetadata['stats'] // Type assertion for clarity
        } else {
          return { Cost: '' } // Or handle the error case as needed, e.g., return an empty stats object
        }
      })()
    }))
  )
  // Generate enriched output
  const explanations = Object.entries(prefix)
    .filter(([keyword]) =>
      enrichedCards
        .filter(x => 'stats' in x)
        .some(obj => obj.stats.Description?.indexOf(keyword) != -1)
    )
    .map(([keyword, explanation]) => `${keyword}: ${explanation}`)
    .join('\n')
  const promptString = `Relevant Keyword explanations
${explanations}
${prolog}
# MANA CURVE ANALYSIS
# Average Cost: ${curveData.average}
# Highest Cost: ${curveData.highestCost}
# Curve Distribution:\n ${curveData.chart
    .split('\n')
    .map(l => `# ${l}`)
    .join('\n')}
${cardLines
  .map(line => {
    const cardName = line.match(/\(\d+\)\s(.*)$/)?.[1].trim()
    const cardData = enrichedCards.find(c => c.cardName === cardName)
    if (!cardData || ('error' in cardData && cardData.error))
      return `${line} | Error: ${cardData?.error || 'No data'}`
    else if ('stats' in cardData)
      return `${line}\n${formatStats(cardData.stats)}`
  })
  .join('\n')}`

  return { promptString, enrichedCards }

  // Copies to clipboard in most browsers
  async function getCardData (doc: Document): Promise<CardMetadata['stats']> {
    // Extract description from center element
    const descriptionElement = doc.querySelector(
      'aside > section:nth-child(2) > section > section:nth-child(1) center'
    )
    const description = descriptionElement
      ? descriptionElement.innerHTML
          .replace('<br>', '\n')
          .replaceAll(/<.*?>/g, '')
          .replace(/\n/g, ', ')
          .trim()
      : ''

    const items: HTMLElement[] = [
      ...doc
        .querySelectorAll('aside > section:nth-child(2) > section  div')
        .values()
    ] as HTMLElement[]
    const extractedRarityInfo = items
      .map(item => item.textContent?.trim().split('\n'))
      .filter(item => item?.length)
      .filter(item => {
        const hasTwoElements = item?.length == 2
        const isRarityPrefix = item?.[0].startsWith('Rarity')
        return hasTwoElements && isRarityPrefix
      })[0]
    const rarity = extractedRarityInfo?.[1].trim()

    // Extract other stats from the main aside section
    const mainSection = doc.querySelector(
      'aside > section:nth-child(2) > section > section:nth-child(1)'
    ) as HTMLElement
    const stats = parseCardInfo(mainSection?.textContent || '')

    // Create clean stats object
    return {
      Description: description,
      Cost: stats.Cost,
      Attack: stats.Attack,
      Health: stats.Health,
      Durability: stats.Durability,
      'Card type': stats['Card type'],
      Class: stats.Class,
      Runes: stats.Runes,
      Rarity: rarity
    }
  }
  function parseCardInfo (text: string) {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
    const stats: { [key: string]: string } = {}

    for (let i = 0; i < lines.length; i++) {
      // Skip lines that are part of the description
      if (lines[i].includes('Collectible') || lines[i].includes('Elite'))
        continue

      // Handle key-value pairs
      if (lines[i].endsWith(':') && i + 1 < lines.length) {
        const key = lines[i].replace(':', '').trim()
        stats[key] = lines[i + 1].trim()
        i++
      } else if (lines[i].includes(':')) {
        const [key, ...values] = lines[i].split(':')
        stats[key.trim()] = values.join(':').trim()
      }
    }

    return stats
  }

  function formatStats (stats: { [key: string]: string }) {
    const relevant = [
      'Description',
      'Rarity',
      'Cost',
      'Attack',
      'Health',
      'Durability',
      'Card type',
      'Class',
      'Runes'
    ]

    return relevant
      .map(k => (stats[k] ? `${k}: ${stats[k]}` : ''))
      .filter(Boolean)
      .join('\n')
  }
  function calculateManaCurve (
    cards: { line: string; stats: { Cost: string } }[]
  ) {
    const curve: { [key: number]: number } = {}
    let totalCards = 0
    let totalCost = 0

    cards.forEach(({ line, stats }) => {
      console.log(line, stats)
      const cost = parseInt(stats.Cost) || 0
      const count = parseInt(line.match(/\d+x/)?.[0] ?? '') || 1

      curve[cost] = (curve[cost] || 0) + count
      totalCards += count
      totalCost += cost * count
    })

    const maxCost = Math.max(...Object.keys(curve).map(Number))
    const averageCost = (totalCost / totalCards).toFixed(1)

    // Create ASCII bar chart
    const curveChart = Array.from(
      {
        length: maxCost + 1
      },
      (_, i) => {
        const count = curve[i] || 0
        const bar = '■'.repeat(count) + ` (${count})`
        return `${String(i).padStart(2)}: ${bar}`
      }
    ).join('\n')

    return {
      chart: curveChart,
      average: averageCost,
      highestCost: maxCost
    }
  }
}
