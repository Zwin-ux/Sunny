import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getUsers, saveUsers } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { points } = await req.json()
  const increment = typeof points === 'number' ? points : 0

  const users = await getUsers()
  const user = users.find(u => u.email === session.user!.email!)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  user.points = (user.points || 0) + increment
  await saveUsers(users)
  return NextResponse.json({ points: user.points })
}

export async function GET() {
  const users = await getUsers()
  const sorted = users
    .map(u => ({ name: u.name, points: u.points || 0 }))
    .sort((a, b) => b.points - a.points)
  return NextResponse.json(sorted)
}
