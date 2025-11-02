'use client';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, BarChart, Bar } from 'recharts'

export default function TimePerSubject({ data, games }: { data: any[]; games?: any[] }) {
  const chart = aggregate(data, games)
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Time per Subject</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <RTooltip />
            <Bar dataKey="minutes" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function aggregate(sessions: any[], games?: any[]) {
  const map = new Map<string, number>()
  sessions.forEach((s) => {
    const subject = s.mission_type || 'Mission'
    map.set(subject, (map.get(subject) || 0) + Math.round((s.duration_seconds || 0) / 60))
  })
  ;(games || []).forEach((g) => {
    const subject = `Game: ${g.game_type}`
    map.set(subject, (map.get(subject) || 0) + Math.round((g.duration || 0) / 60))
  })
  return Array.from(map.entries()).map(([subject, minutes]) => ({ subject, minutes }))
}

