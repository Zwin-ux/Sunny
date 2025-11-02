'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip } from 'recharts'

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa']

export default function ActivityDistribution({ sessions, games }: { sessions: any[]; games?: any[] }) {
  const data = build(sessions, games)
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Activity Distribution</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <RTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function build(sessions: any[], games?: any[]) {
  const missionsCompleted = sessions.filter((s) => s.status === 'completed').length
  const missionsActive = sessions.length - missionsCompleted
  const gameCount = (games || []).length
  return [
    { name: 'Missions Completed', value: missionsCompleted },
    { name: 'Missions Active', value: missionsActive },
    { name: 'Games', value: gameCount },
  ]
}

