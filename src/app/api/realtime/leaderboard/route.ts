import { NextRequest } from 'next/server'
import { subscribe } from '@/lib/server-events'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      const unsub = subscribe(send)
      // heartbeat
      const hb = setInterval(() => controller.enqueue(encoder.encode(`: keep-alive\n\n`)), 15000)
      send({ type: 'hello' })
      controller.enqueue(encoder.encode(`retry: 5000\n\n`))
      return () => { clearInterval(hb); unsub() }
    }
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

