'use client';

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getProgressKey } from '@/lib/persistence'

export default function StreakCalendar() {
  const [days, setDays] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [longest, setLongest] = useState(0)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) return
    getProgressKey<any>(u.id || u.name, 'activity_days').then((res) => {
      if (!res) return
      setDays(res.days || [])
      setStreak(res.current_streak || 0)
      setLongest(res.longest_streak || 0)
    })
  }, [])

  const grid = buildLastNDays(42)
  const setDaysSet = new Set(days)

  return (
    <div>
      <div className="mb-2 text-sm font-semibold">Streak: {streak} • Longest: {longest}</div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map(d => {
          const iso = d.toISOString().slice(0,10)
          const active = setDaysSet.has(iso)
          return <div key={iso} title={iso} className={`h-4 w-4 rounded ${active ? 'bg-green-500' : 'bg-gray-200'} border border-black`}></div>
        })}
      </div>
    </div>
  )
}

function buildLastNDays(n: number) {
  const out: Date[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i))
  }
  return out
}

