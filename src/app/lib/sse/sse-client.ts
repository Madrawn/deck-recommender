import { useState, useCallback } from 'react'
import SSEClientError from './SSEClientError'

type EventStreamOptions = {
  onError?: (error: Error) => void
  onComplete?: () => void
}

export async function doEventStream<T> (
  url: string,
  callback: (data: T) => void,
  options?: EventStreamOptions
): Promise<() => void> {
  const eventSource = new EventSource(url)

  const close = () => {
    eventSource.close()
    options?.onComplete?.()
  }

  eventSource.onmessage = event => {
    try {
      callback(JSON.parse(event.data))
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error))
      )
    }
  }

  eventSource.onerror = event => {
    const error = new SSEClientError('EventSource error:')

    // Add diagnostic information
    error.name = 'EventStreamError'
    error.message = `Connection state: ${eventSource.readyState}`

    // Capture URL and status if available
    const statusMap = ['CONNECTING', 'OPEN', 'CLOSED']

    error.details = {
      url: eventSource.url,
      readyState: statusMap[eventSource.readyState],
      isTrusted: event.isTrusted
    }

    options?.onError?.(error)
    close()
  }

  return close
}

// React Hook version
export function useEventStream<T> () {
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  const startStream = useCallback(
    (
      url: string,
      callback: (data: T) => void,
      options?: EventStreamOptions
    ) => {
      const es = new EventSource(url)
      setEventSource(es)

      es.onmessage = event => {
        try {
          callback(JSON.parse(event.data))
        } catch (error) {
          options?.onError?.(
            error instanceof Error ? error : new Error(String(error))
          )
        }
      }

      es.onerror = error => {
        options?.onError?.(
          new Error('EventSource failed: ' + JSON.stringify(error))
        )
        es.close()
        setEventSource(null)
      }

      return () => {
        es.close()
        setEventSource(null)
      }
    },
    []
  )

  const closeStream = useCallback(() => {
    eventSource?.close()
    setEventSource(null)
  }, [eventSource])

  return { startStream, closeStream }
}
