import { getUsers } from '@/lib/db'

interface ScoreEntry {
  name: string
  points: number
}

export default async function ScoreboardPage() {
  const users = await getUsers()
  const sorted: ScoreEntry[] = users
    .map(u => ({ name: u.name, points: u.points || 0 }))
    .sort((a, b) => b.points - a.points)
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Sunny Scoreboard</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u, idx) => (
            <tr key={u.name} className={idx % 2 ? 'bg-gray-50' : ''}>
              <td className="border p-2 text-center font-semibold">{idx + 1}</td>
              <td className="border p-2">{u.name}</td>
              <td className="border p-2 text-right">{u.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
