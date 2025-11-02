import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { findUserByEmail } from '@/lib/db'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await findUserByEmail(session!.user!.email!)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h1>
      <h2 className="text-xl font-semibold">Progress</h2>
      <ul className="mb-4 list-disc list-inside">
        {Object.entries(user?.progress || {}).map(([lesson, pct]) => (
          <li key={lesson}>{lesson}: {pct}%</li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold">Chat History</h2>
      <ul className="list-disc list-inside">
        {user?.chatHistory.slice(-10).map((m) => (
          <li key={m.timestamp}>{m.role}: {typeof m.content === 'string' ? m.content : ''}</li>
        ))}
      </ul>
    </div>
  )
}
