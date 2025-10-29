import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || ''
  const key = req.nextUrl.searchParams.get('key') || ''
  if (!userId || !key) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ value: null })

  const { data, error } = await admin.from('users').select('progress, current_streak, longest_streak, last_active').eq('id', userId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const progress = (data?.progress as any) || {}

  if (key === 'activity_days') {
    return NextResponse.json({
      value: {
        days: progress.activity_days || [],
        current_streak: data?.current_streak || 0,
        longest_streak: data?.longest_streak || 0,
        last_active: data?.last_active || null,
      }
    })
  }

  return NextResponse.json({ value: progress[key] ?? null })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, key, value, op, isoDate, amount, reason } = body || {}
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ ok: false }, { status: 200 })

  if (op === 'append_activity') {
    const { data, error } = await admin.from('users').select('progress, current_streak, longest_streak').eq('id', userId).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const progress = (data?.progress as any) || {}
    const days: string[] = Array.isArray(progress.activity_days) ? progress.activity_days : []
    if (!days.includes(isoDate)) days.push(isoDate)
    // update streak (very simple; authoritative recalculation can be added server-side)
    const today = new Date(isoDate)
    const yesterdayIso = new Date(today.getTime() - 86400000).toISOString().slice(0, 10)
    const hasYesterday = days.includes(yesterdayIso)
    const current_streak = hasYesterday ? (data?.current_streak || 0) + 1 : 1
    const longest_streak = Math.max(current_streak, data?.longest_streak || 0)
    const { error: upErr } = await admin.from('users').update({
      progress: { ...progress, activity_days: days },
      current_streak,
      longest_streak,
      last_active: new Date().toISOString()
    }).eq('id', userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (op === 'add_xp') {
    const { data, error } = await admin.from('users').select('progress').eq('id', userId).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const progress = (data?.progress as any) || {}
    const total = Number(progress.total_xp || 0) + Number(amount || 0)
    const lvl = calcLevel(total)
    const { error: upErr } = await admin.from('users').update({
      progress: { ...progress, total_xp: total, last_reason: reason || null }
    }).eq('id', userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    // Broadcast to SSE listeners (best-effort)
    try {
      const { broadcast } = await import('@/lib/server-events')
      broadcast({ type: 'xp', userId, amount, total, level: lvl, reason })
    } catch {}
    return NextResponse.json({ ok: true, total, level: lvl })
  }

  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  // Generic key set/merge
  const { data, error } = await admin.from('users').select('progress').eq('id', userId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const progress = (data?.progress as any) || {}
  const next = { ...progress, [key]: value }
  const { error: upErr } = await admin.from('users').update({ progress: next }).eq('id', userId)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function calcLevel(xp: number) {
  // Mirror XPContext leveling curve
  const XP_PER_LEVEL = 100
  const LEVEL_MULTIPLIER = 1.5
  let level = 1
  let xpNeeded = XP_PER_LEVEL
  let totalXP = 0
  while (totalXP + xpNeeded <= xp) {
    totalXP += xpNeeded
    level++
    xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
  }
  return level
}

