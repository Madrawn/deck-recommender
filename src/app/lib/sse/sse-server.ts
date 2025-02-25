import { NextRequest, NextResponse } from 'next/server'

export class SseStream<T> {
  private encoder = new TextEncoder()
  private stream = new TransformStream()
  private writer = this.stream.writable.getWriter()

  constructor () {
    this.send = this.send.bind(this)
    this.complete = this.complete.bind(this)
  }

  async send (data: T): Promise<void> {
    await this.writer.write(
      this.encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    )
  }

  async complete (): Promise<void> {
    await this.writer.close()
  }

  async sendError (error: Error): Promise<void> {
    await this.send({
      type: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } as any)
  }

  createResponse (): NextResponse {
    return new NextResponse(this.stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  }
}

export function setupSseUtilities<T> (): [
  SseStream<T>['send'],
  SseStream<T>['complete'],
  NextResponse
] {
  const sse = new SseStream<T>()
  return [sse.send, sse.complete, sse.createResponse()]
}

export function withSseErrorHandling (
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const response = await handler(req)
      // Add SSE-specific headers
      response.headers.set('X-Accel-Buffering', 'no')
      response.headers.set('X-SSE-Protocol', '1.0')
      return response
    } catch (error) {
      const sse = new SseStream<{ type: 'error'; message: string }>()
      await sse.sendError(
        error instanceof Error ? error : new Error('Unknown error')
      )
      await sse.complete()
      return sse.createResponse()
    }
  }
}
