import { JSDOM } from 'jsdom'
import { unstable_cache } from 'next/cache'
import fs from 'fs'
import path from 'path'
import {
  calculateManaCurve,
  cleanHtmlContent,
  formatCardsHuman,
  parseCardInfo
} from './promptGen.util'
import cards from '../../../tool/cards.collectible.json'
import { HearthstoneCard } from '../types'
const CardDB = cards as HearthstoneCard[]
interface DeckStreamResultMap {
  card: CardMetadata
  complete: DeckPromptOutput
  error: CardError
}

type DeckStreamResultBase<T extends keyof DeckStreamResultMap> = {
  type: T
  data: DeckStreamResultMap[T]
  cardName?: string
  error?: string
}

export type DeckStreamResult = {
  [T in keyof DeckStreamResultMap]: DeckStreamResultBase<T>
}[keyof DeckStreamResultMap]
export interface CardMetadata {
  cardName: string
  stats: {
    Description: string
    Cost: string
    Attack?: string
    Health?: string
    Durability?: string
    'Card type': string
    Class?: string
    Runes?: string
    Rarity?: string
  }
}
export interface CardError {
  cardName: string
  error: string
}
export type Card = CardMetadata | CardError

export type DeckPromptOutput = {
  promptString: string
  enrichedCards: Card[]
  manaCurveAnalysis: string
}

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
export default function generatePromptFromDeck (
  cardLines: string[],
  enrichedCards: Card[],
  prolog: string,
  formatCards = formatCardsHuman
): DeckPromptOutput {
  //     const deckInput = `
  // ### Custom Death Knight
  // # Class: Deathknight
  // # Format: Standard
  // # Year of the Pegasus
  // #
  // # 1x (6) Corpse Explosion
  // # 1x (7) Kerrigan
  // `;

  const curveData = calculateManaCurve(
    cardLines.map(line => ({
      line,
      stats: (() => {
        const foundCard = enrichedCards.find(
          c => c.cardName === line.match(/\(\d+\)\s(.*)$/)?.[1].trim()
        )
        if (foundCard && 'stats' in foundCard) {
          // Type guard using 'in' operator
          return foundCard.stats as Pick<CardMetadata['stats'], 'Cost'> // Type assertion for clarity
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
  const manaCurveAnalysis = `# MANA CURVE ANALYSIS
# Average Cost: ${curveData.average}
# Highest Cost: ${curveData.highestCost}
# Curve Distribution:\n${curveData.chart
    .split('\n')
    .map(l => `# ${l}`)
    .join('\n')}`
  const promptString = `Relevant Keyword explanations
${explanations}
${prolog}
${manaCurveAnalysis}
${formatCards(cardLines, enrichedCards)}`

  return { promptString, enrichedCards, manaCurveAnalysis }
}
const delay = (ms: number | undefined) =>
  new Promise(resolve => setTimeout(resolve, ms))

async function getCardData (doc: Document): Promise<CardMetadata['stats']> {
  // Extract description from center element
  const descriptionElement = doc.querySelector(
    'aside > section:nth-child(2) > section > section:nth-child(1) center'
  )
  const description = descriptionElement
    ? cleanHtmlContent(descriptionElement)
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
  const rarity = extractedRarityInfo?.[1].trim() ?? ''

  // Extract other stats from the main aside section
  const cardInfoSection = doc.querySelector(
    'aside > section:nth-child(2) > section > section:nth-child(1)'
  ) as HTMLElement
  const stats = parseCardInfo(cardInfoSection?.textContent || '')

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
export async function retrieveCardInfo (cardName: string) {
  try {
    return _retrieveCardInfoLocal(cardName)
  } catch {
    console.log('Error fetching card from local database, trying network')
    return _retrieveCardInfoNet(cardName)
  }
}

function _retrieveCardInfoLocal (cardName: string) {
  const card = CardDB.find(c => c.name === cardName)
  if (card) {
    return {
      cardName,
      stats: {
        Description: card.text || '',
        Cost: card.cost.toString(),
        Attack: card.attack?.toString() || '',
        Health: card.health?.toString() || '',
        Durability: card.durability?.toString() || '',
        'Card type': card.type,
        Class: card.cardClass,
        Rarity: card.rarity
      }
    } as CardMetadata
  } else {
    return {
      cardName,
      error: 'Card not found in local database'
    } as CardError
  }
}
async function _retrieveCardInfoNet (cardName: string) {
  console.log('Fetching ' + cardName)
  const wikiName = cardName.replaceAll(' ', '_')
  const cacheDir = path.resolve(__dirname, 'siteCache')
  const cacheFile = path.join(cacheDir, `${wikiName}.html`)

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir)
    }

    const getCachedWikiPage = unstable_cache(
      async wikiName => {
        if (fs.existsSync(cacheFile)) {
          const stats = fs.statSync(cacheFile)
          const now = new Date().getTime()
          const modifiedTime = new Date(stats.mtime).getTime()
          const oneWeek = 7 * 24 * 60 * 60 * 1000

          if (now - modifiedTime < oneWeek) {
            return fs.readFileSync(cacheFile, 'utf-8')
          }
        }

        const response = await fetch(
          `https://hearthstone.wiki.gg/wiki/${wikiName}`
        )
        await delay(1000)
        const text = await response.text()
        fs.writeFileSync(cacheFile, text, 'utf-8')
        return text
      },
      ['wiki-pages'],
      { revalidate: 3600 } // 1 hour cache
    )

    const text = await getCachedWikiPage(wikiName)
    const doc = new JSDOM(text).window.document
    const cardInfo = doc.querySelector(
      'aside > section:nth-child(2) > section > section:nth-child(1)'
    )

    if (cardInfo) {
      const cardData = await getCardData(doc)
      console.log('Parsed stats:', cardData)

      return {
        cardName,
        stats: cardData
      } as CardMetadata
    } else {
      return {
        cardName,
        error: 'Card element not found'
      } as CardError
    }
  } catch (error: unknown) {
    console.error('Error fetching card:', cardName, error)
    return {
      cardName,
      error: (error as Error).message
    } as CardError
  }
}
