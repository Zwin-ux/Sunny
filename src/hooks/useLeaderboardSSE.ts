import { useEffect, useRef, useState } from 'react'

export interface XPEvent {
  type: 'xp'
  userId: string
  amount: number
  total: number
  level: number
  reason?: string
}

export function useLeaderboardSSE() {
  const [events, setEvents] = useState<XPEvent[]>([])
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/realtime/leaderboard')
    sourceRef.current = es
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg?.type === 'xp') {
          setEvents((prev) => [msg as XPEvent, ...prev].slice(0, 20))
        }
      } catch {}
    }
    return () => { try { es.close() } catch {} }
  }, [])

  return events
}

