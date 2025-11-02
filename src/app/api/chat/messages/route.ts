import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const limit = Number(req.nextUrl.searchParams.get('limit') || '50')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ messages: [] })

  const { data, error } = await admin
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: (data || []).reverse() })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, role, content, messageType, metadata } = body || {}
  if (!userId || !role || typeof content !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ ok: false }, { status: 200 })

  const { error } = await admin.from('chat_messages').insert({
    user_id: userId,
    role,
    content,
    message_type: messageType || 'chat',
    metadata: metadata || {}
  } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

