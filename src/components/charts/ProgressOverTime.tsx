'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
export default function ProgressOverTime({ data }: { data: Array<{ started_at: string; questions_attempted: number; questions_correct: number; }> }) {
  const chart = data.map(s => ({
    date: new Date(s.started_at).toLocaleDateString(),
    accuracy: s.questions_attempted ? Math.round((s.questions_correct / s.questions_attempted) * 100) : 0
  }))
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Progress Over Time</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <RTooltip />
            <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

