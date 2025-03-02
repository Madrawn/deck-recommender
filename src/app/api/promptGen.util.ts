import { Card, CardMetadata } from './promptGen'

export function formatCardsHuman (cardLines: string[], enrichedCards: Card[]) {
  return cardLines.map(formatCardDetailsHuman(enrichedCards)).join('\n')
}

export function formatCardDetailsHuman (
  enrichedCards: Card[]
): (value: string, index: number, array: string[]) => string | undefined {
  return line => {
    const cardName = line.match(/\(\d+\)\s(.*)$/)?.[1].trim()
    const cardData = enrichedCards.find(c => c.cardName === cardName)
    if (!cardData || ('error' in cardData && cardData.error))
      return `${line} | Error: ${cardData?.error || 'No data'}`
    else if ('stats' in cardData)
      return `${line}\n${formatStatsHuman(cardData.stats)}`
  }
}
export function formatCardsJson (cardLines: string[], enrichedCards: Card[]) {
  return JSON.stringify(enrichedCards)
}

export function cleanHtmlContent (descriptionElement: Element): string {
  return descriptionElement.innerHTML
    .replace('<br>', '\n')
    .replaceAll(/<.*?>/g, '')
    .replace(/\n/g, ', ')
    .trim()
}
export function parseCardInfo (text: string) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l)
  const stats: { [key: string]: string } = {}

  for (let i = 0; i < lines.length; i++) {
    // Skip lines that are part of the description
    if (lines[i].includes('Collectible') || lines[i].includes('Elite')) continue

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
export function computeTotalCardsAndCost (cards: Card[]) {
  const curve: { [key: number]: number } = {}

  let totalCards = 0
  let totalCost = 0
  cards
    .filter(card => 'stats' in card)
    .filter(card => "Cost" in card.stats)
    .forEach(({ stats, count }) => {
      const cost = parseInt(stats.Cost)
      const cardCount = count || 1
      curve[cost] = (curve[cost] ?? 0) + cardCount
      totalCards += cardCount
      totalCost += cost * cardCount
    })
  return { totalCards, totalCost, curve }
}
export function buildCostBarGraph (
  maxCost: number,
  curve: { [key: number]: number }
): string[] {
  return Array.from(
    {
      length: maxCost + 1
    },
    (_, i) => {
      const count = curve[i] || 0
      const bar = '■'.repeat(count) + ` (${count})`
      return `${String(i).padStart(2)}: ${bar}`
    }
  )
}
export function calculateManaCurve (cards: Card[]) {
  const { totalCards, totalCost, curve } = computeTotalCardsAndCost(cards)

  const maxCost = Math.max(...Object.keys(curve).map(Number))
  const averageCost = (totalCost / totalCards).toFixed(1)

  // Create ASCII bar chart
  const curveChart = buildCostBarGraph(maxCost, curve).join('\n')

  return {
    chart: curveChart,
    average: averageCost,
    highestCost: maxCost
  }
}
const cardAttributes = [
  'Cost',
  'Description',
  'Attack',
  'Health',
  'Durability',
  'Card type',
  'Rarity',
  'Class',
  'Runes'
]
export function formatStatsHuman (stats: { [key: string]: string }) {
  const relevant = cardAttributes

  return relevant
    .map(k => (stats[k] ? `• ${k}: ${stats[k]}` : ''))
    .filter(Boolean)
    .join('\n')
}
