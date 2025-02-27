import { useChat } from '@ai-sdk/react'
import { useCallback } from 'react'

const useDeckChat = () => {
  // Memoize error handler to stabilize useChat config
  const handleError = useCallback((error: unknown) => {
    console.error(error)
    return `Error from chat API: ${(error as Error).message || 'Unknown error'}`
  }, [])

  const { messages, setMessages, setInput, error, handleSubmit, status, stop } =
    useChat({
      onError: handleError // Now stable reference
    })

  const resetChat = useCallback(() => {
    setMessages([])
  }, [setMessages])

  return {
    messages,
    error,
    status,
    handleSubmit,
    setInput,
    resetChat,
    stop
  }
}

export default useDeckChat
