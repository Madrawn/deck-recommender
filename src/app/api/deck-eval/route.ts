import {
  setupSseUtilities,
  withSseErrorHandling
} from '@/app/lib/sse/sse-server'
import { NextRequest } from 'next/server'
import generatePromptFromDeck, {
  Card,
  DeckStreamResult,
  retrieveCardInfo
} from '../promptGen'
import { formatCardsJson } from '../promptGen.util'

export const GET = withSseErrorHandling(async (req: NextRequest) => {
  const [send, complete, response] = setupSseUtilities<DeckStreamResult>()
  // Get encoded deck code from URL
  const { searchParams } = new URL(req.url)
  const encodedDeck = searchParams.get('d')

  if (!encodedDeck) {
    await send({
      type: 'error',
      data: { cardName: 'ArgError:', error: 'Missing deck code' }
    })
    await complete()
    return response
  }

  ;(async () => {
    try {
      const deckCode = Buffer.from(encodedDeck, 'base64').toString('utf-8')
      const { cards, cardLines, prolog } = parseDeckInput(deckCode)
      const enrichedCards = new Map<string, Card>()
      for (const { name: cardName, count } of cards) {
        try {
          if (!enrichedCards.has(cardName)) {
            const enrichedCard = await retrieveCardInfo(cardName, count)
            if ('error' in enrichedCard && enrichedCard.error) {
              throw new Error(enrichedCard.error)
            } else if ('stats' in enrichedCard) {
              await send({
                type: 'card',
                data: enrichedCard
              })
            }
            enrichedCards.set(enrichedCard.cardName, enrichedCard)
          }
        } catch (error) {
          const cardErrorInfo: Card = {
            cardName,
            error:
              error instanceof Error ? error.message : 'Card processing failed'
          }
          await send({
            type: 'error',
            data: cardErrorInfo
          })
          enrichedCards.set(cardErrorInfo.cardName, cardErrorInfo)
        }
      }
      const finalResult = generatePromptFromDeck(
        cardLines,
        [...enrichedCards.values()],
        prolog,
        formatCardsJson
      )
      await send({ type: 'complete', data: finalResult })
    } finally {
      await complete()
    }
  })()

  return response
})
function parseDeckInput(deckInput: string) {
  const cardLines = deckInput.split('\n').filter(line => line.includes('x ('))
  const prolog = deckInput.split('\n').filter(line => !line.includes('x (')).join('\n')

  const cardCounts = new Map<string, number>()
  for (const line of cardLines) {
    const match = line.match(/^#\s*(\d+)x\s+\(\d+\)\s+(.*)$/)
    if (match) {
      const count = parseInt(match[1], 10)
      const cardName = match[2].trim()
      cardCounts.set(cardName, (cardCounts.get(cardName) || 0) + count)
    }
  }

  const cards = Array.from(cardCounts.entries()).map(([name, count]) => ({ name, count }))
  return { cards, cardLines, prolog }
}