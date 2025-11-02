'use client';

import { useEffect, useMemo, useState } from 'react'
import { BADGES, getRarityColor, type Badge } from '@/lib/gamification'
import { getCurrentUser } from '@/lib/auth'
import { getProgressKey, setProgressKey } from '@/lib/persistence'

interface Props {
  stats: {
    totalPoints: number
    level: number
    currentStreak: number
    lessonsCompleted: number
    correctAnswers: number
    totalAnswers: number
    topicsExplored: number
    timeSpentMinutes: number
  }
}

export default function AchievementGallery({ stats }: Props) {
  const [unlocked, setUnlocked] = useState<Record<string, string>>({})

  useEffect(() => {
    const u = getCurrentUser()
    const run = async () => {
      if (u) {
        const remote = await getProgressKey<Record<string, string>>(u.id || u.name, 'badges')
        if (remote) { setUnlocked(remote); return }
      }
      const saved = localStorage.getItem('sunny_badges')
      if (saved) setUnlocked(JSON.parse(saved))
    }
    run()
  }, [])

  const items = useMemo(() => BADGES, [])

  useEffect(() => {
    // auto-unlock basic badges by checking conditions
    const next: Record<string, string> = { ...unlocked }
    items.forEach(b => {
      const already = next[b.id]
      if (!already) {
        try {
          if (b.condition({
            totalPoints: stats.totalPoints,
            level: stats.level,
            currentStreak: stats.currentStreak,
            longestStreak: stats.currentStreak,
            lessonsCompleted: stats.lessonsCompleted,
            quizzesCompleted: 0,
            correctAnswers: stats.correctAnswers,
            totalAnswers: stats.totalAnswers,
            timeSpentMinutes: stats.timeSpentMinutes,
            topicsExplored: stats.topicsExplored,
            challengesCompleted: 0,
          })) {
            next[b.id] = new Date().toISOString()
          }
        } catch {}
      }
    })
    if (JSON.stringify(next) !== JSON.stringify(unlocked)) {
      setUnlocked(next)
      const u = getCurrentUser()
      if (u) {
        setProgressKey(u.id || u.name, 'badges', next)
      }
      localStorage.setItem('sunny_badges', JSON.stringify(next))
    }
  }, [items, stats, unlocked])

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(b => {
        const isUnlocked = Boolean(unlocked[b.id])
        return (
          <div key={b.id} className={`p-4 rounded-xl border-2 ${isUnlocked ? 'border-black bg-white' : 'border-gray-300 bg-gray-100 opacity-80'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{b.emoji}</span>
                <div className="font-bold">{b.name}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRarityColor(b.rarity)}`}>{b.rarity}</span>
            </div>
            <p className="text-sm text-gray-700">{b.description}</p>
            <div className="text-xs mt-2 font-semibold">{isUnlocked ? `Unlocked ${new Date(unlocked[b.id]!).toLocaleDateString()}` : 'Locked'}</div>
          </div>
        )
      })}
    </div>
  )
}
