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
  const requestBody = await req.json()
  const { messages, model } = requestBody; // Get model from request body
  const result = await streamText({
    model: deepseek(model), // Use selected model
    messages,
    topP: 0.7,
  })
  result.warnings.then(warnings => {
    console.log('warnings', warnings)
  })
  return result.toDataStreamResponse({
    sendReasoning: true
  })
}
