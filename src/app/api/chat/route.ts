import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIService } from '@/lib/openai'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Rate limit by IP (fall back to user-agent)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || req.headers.get('user-agent') || 'anonymous'
  const rl = await rateLimit(ip, 'chat', 60, 20)
  if (!rl.success) {
    return NextResponse.json({ message: 'Too many requests. Please wait a moment and try again.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const { messages, emotion } = body || {}
  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ message: "Hello! How can I help you today?" })
    }

    // Clamp input length (keep last 12 messages)
    const sanitized = messages.slice(-12).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))

    // Prepend a small system prompt for Sunny tone
    const system = { role: 'system', content: `You are Sunny, a cheerful, concise AI tutor for kids. Keep answers brief (2-3 sentences), friendly, and age-appropriate. Current emotion: ${emotion || 'neutral'}.` }

    const svc = getOpenAIService()
    const text = await svc.generateChatCompletion([system, ...sanitized])
    return NextResponse.json({ message: text || 'I\'m here to help!' })
  } catch (e: any) {
    logger.error('Chat route error', e)
    return NextResponse.json({ message: 'I\'m having trouble right now, but I\'m here to help!' }, { status: 200 })
  }
}
