'use server'
// Please install OpenAI SDK first: `npm install openai`

import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText } from 'ai'

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
})
export async function POST (req: Request) {
  console.log('req', req)
  const { messages } = await req.json()
  const result = await streamText({
    model: deepseek('deepseek-reasoner'),
    messages,
    temperature: 0.2
  })
  result.warnings.then(warnings => {
    console.log('warnings', warnings)
  })
  return result.toDataStreamResponse({
    sendReasoning: true
  })
}
