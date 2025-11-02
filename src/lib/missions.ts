export type MissionCategory = 'Math' | 'Reading' | 'Science' | 'Creative'

export type MissionDifficulty = 'easy' | 'medium' | 'hard'

export interface DailyMissionMeta {
  id: string
  title: string
  category: MissionCategory
  difficulty: MissionDifficulty
  xpReward: number
  completed: boolean
}

function getDailySeed(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}

export function getDailyResetTimestamp(): number {
  // Reset at local midnight
  const d = new Date()
  const reset = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0)
  return reset.getTime()
}

export async function loadDailyMissions(userId?: string): Promise<DailyMissionMeta[]> {
  const seed = getDailySeed()
  // Try server persistence first
  if (userId) {
    try {
      const { getProgressKey, setProgressKey } = await import('@/lib/persistence')
      const fromServer = await getProgressKey<any>(userId, 'daily_missions')
      if (fromServer && fromServer.seed === seed && Array.isArray(fromServer.items)) {
        return fromServer.items
      }
      // generate and persist
      const items = generateDaily(seed)
      await setProgressKey(userId, 'daily_missions', { seed, items })
      return items
    } catch {}
  }

  const storageKey = `sunny_daily_missions_${seed}`
  const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
  if (stored) return JSON.parse(stored)

  // Deterministic selection per day (simple rotation)
  const missions: DailyMissionMeta[] = generateDaily(seed)

  if (typeof window !== 'undefined') localStorage.setItem(storageKey, JSON.stringify(missions))
  return missions
}

function generateDaily(seed: string): DailyMissionMeta[] {
  const categories: MissionCategory[] = ['Math', 'Reading', 'Science', 'Creative']
  const dayIndex = new Date().getDate() % categories.length
  const picks = [
    categories[dayIndex],
    categories[(dayIndex + 1) % categories.length],
    categories[(dayIndex + 2) % categories.length],
  ]

  const difficulties: MissionDifficulty[] = ['easy', 'medium', 'hard']
  return picks.map((category, idx) => ({
    id: `${seed}-${category.toLowerCase()}-${idx}`,
    title: `${category} Mission ${idx + 1}`,
    category,
    difficulty: difficulties[idx]!,
    xpReward: [30, 50, 70][idx]!,
    completed: false,
  }))
}

export async function markMissionComplete(id: string, userId?: string) {
  const seed = getDailySeed()
  let xpReward = 0;

  if (userId) {
    try {
      const { getProgressKey, setProgressKey } = await import('@/lib/persistence')
      const current = await getProgressKey<any>(userId, 'daily_missions')
      if (current && current.seed === seed) {
        const mission = (current.items as DailyMissionMeta[]).find(m => m.id === id);
        if (mission && !mission.completed) {
          xpReward = mission.xpReward;
        }
        const updated = (current.items as DailyMissionMeta[]).map((m) => (m.id === id ? { ...m, completed: true } : m))
        await setProgressKey(userId, 'daily_missions', { seed, items: updated })

        // Auto-award XP via custom event
        if (xpReward > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sunny:xp', {
            detail: { amount: xpReward, reason: `Completed ${mission?.category} Mission` }
          }));
        }
        return
      }
    } catch {}
  }

  const storageKey = `sunny_daily_missions_${seed}`
  const stored = localStorage.getItem(storageKey)
  if (!stored) return
  const missions: DailyMissionMeta[] = JSON.parse(stored)
  const mission = missions.find(m => m.id === id);
  if (mission && !mission.completed) {
    xpReward = mission.xpReward;
  }
  const updated = missions.map(m => (m.id === id ? { ...m, completed: true } : m))
  localStorage.setItem(storageKey, JSON.stringify(updated))

  // Auto-award XP via custom event
  if (xpReward > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sunny:xp', {
      detail: { amount: xpReward, reason: `Completed ${mission?.category} Mission` }
    }));
  }
}

export interface WeeklyChallengeMeta {
  id: string
  title: string
  description: string
  progress: number // 0-100
  xpReward: number
}

export function getWeeklyChallenge(): WeeklyChallengeMeta {
  const d = new Date()
  // Week key (ISO week approximate)
  const weekKey = `${d.getFullYear()}-W${Math.ceil(((+d - +new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}`
  const key = `sunny_weekly_${weekKey}`
  const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
  if (stored) return JSON.parse(stored)
  const challenge: WeeklyChallengeMeta = {
    id: key,
    title: 'Complete 5 Missions This Week',
    description: 'Stay consistent and finish 5 missions before Sunday!'
      ,
    progress: 0,
    xpReward: 200,
  }
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(challenge))
  return challenge
}

export function incrementWeeklyProgress(amount = 1) {
  const d = new Date()
  const weekKey = `${d.getFullYear()}-W${Math.ceil(((+d - +new Date(d.getFullYear(), 0, 1)) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)}`
  const key = `sunny_weekly_${weekKey}`
  const stored = localStorage.getItem(key)
  if (!stored) return
  const challenge: WeeklyChallengeMeta = JSON.parse(stored)
  const missionsTarget = 5
  const newProgress = Math.min(100, Math.round(((challenge.progress / 100) * missionsTarget + amount) / missionsTarget * 100))
  const updated = { ...challenge, progress: newProgress }
  localStorage.setItem(key, JSON.stringify(updated))
}
