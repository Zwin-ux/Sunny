import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { findUserByEmail, saveUsers, getUsers } from '@/lib/db'
import { getServerSession as getServerSessionHelper } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSessionHelper()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { message } = await req.json()
  const users = await getUsers()
  const user = users.find(u => u.email === session.user!.email!)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  user.chatHistory.push(message)
  await saveUsers(users)
  return NextResponse.json({ ok: true })
}
