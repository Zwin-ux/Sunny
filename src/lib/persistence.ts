// Client persistence helpers backed by server API (Supabase admin on server)

export type ProgressKey = 'daily_missions' | 'weekly_challenge' | 'badges' | 'activity_days' | 'xp_summary'

export async function getProgressKey<T = any>(userId: string, key: ProgressKey): Promise<T | null> {
  try {
    const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&key=${encodeURIComponent(key)}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data?.value ?? null
  } catch {
    return null
  }
}

export async function setProgressKey(userId: string, key: ProgressKey, value: any): Promise<boolean> {
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, key, value })
    })
    return res.ok
  } catch {
    return false
  }
}

export async function appendActivityDay(userId: string, isoDate: string): Promise<void> {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, op: 'append_activity', isoDate })
    })
  } catch {}
}

export async function recordXP(userId: string, amount: number, reason?: string): Promise<void> {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, op: 'add_xp', amount, reason })
    })
  } catch {}
}

