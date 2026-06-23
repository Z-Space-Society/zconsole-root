import { useEffect, useRef, useState } from 'react'

interface UseWebSocketsOptions {
  userId: string | undefined
  isAdmin: boolean
  onReset?: () => void
}

export function useWebSockets({ userId, isAdmin, onReset }: UseWebSocketsOptions) {
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!userId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'reset') {
          setResetMessage(data.data.message)
          if (!isAdmin) {
            onReset?.()
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [userId, isAdmin, onReset])

  return { resetMessage, setResetMessage }
}
