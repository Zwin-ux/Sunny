'use client';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RTooltip } from 'recharts'

export default function SkillMastery({ data }: { data: Array<{ domain: string; category: string; mastery: number }> }) {
  const chart = aggregate(data)
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Skill Mastery</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chart}>
            <PolarGrid />
            <PolarAngleAxis dataKey="domain" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Mastery" dataKey="mastery" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
            <RTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function aggregate(skills: any[]) {
  const map = new Map<string, { total: number; count: number }>()
  skills.forEach((s) => {
    const key = s.domain || s.category || 'General'
    const cur = map.get(key) || { total: 0, count: 0 }
    cur.total += s.mastery
    cur.count += 1
    map.set(key, cur)
  })
  return Array.from(map.entries()).map(([domain, v]) => ({ domain, mastery: Math.round(v.total / Math.max(1, v.count)) }))
}

