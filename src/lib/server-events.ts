// Simple in-memory SSE broadcaster (dev/demo)

type Listener = (msg: any) => void

const listeners = new Set<Listener>()

export function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function broadcast(msg: any) {
  for (const l of Array.from(listeners)) {
    try { l(msg) } catch {}
  }
}

