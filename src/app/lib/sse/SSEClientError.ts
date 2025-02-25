export default class SSEClientError extends Error {
  public details?: Record<string, unknown>

  constructor (message: string) {
    super(message)
    this.name = 'SSEClientError'
  }
}
