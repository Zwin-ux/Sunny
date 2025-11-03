import { getCurrentUser } from '@/lib/auth'

export type PersistedRole = 'user' | 'assistant' | 'system'

export async function loadChatMessages(limit = 50) {
  const u = getCurrentUser()
  if (!u) return []
  try {
    const res = await fetch(`/api/chat/messages?userId=${encodeURIComponent(u.id || u.name)}&limit=${limit}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json.messages || []
  } catch {
    return []
  }
}

export async function saveChatMessage(
  role: PersistedRole,
  content: string,
  messageType: 'chat' | 'challenge' | 'feedback' | 'game' = 'chat',
  metadata?: any
) {
  const u = getCurrentUser()
  if (!u) return false
  try {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id || u.name, role, content, messageType, metadata })
    })
    return res.ok
  } catch {
    return false
  }
}

