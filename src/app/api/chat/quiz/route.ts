import { NextRequest, NextResponse } from 'next/server'
import { getAIService } from '@/lib/ai-service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { topic = 'math', difficulty = 'easy', learningStyle = 'visual', studentId = 'anon' } = body || {}
  try {
    const ai = getAIService()
    const challenge = await ai.generateChallenge(topic, difficulty, learningStyle, studentId)
    return NextResponse.json({ challenge })
  } catch (e: any) {
    return NextResponse.json({
      challenge: {
        type: 'multiple-choice',
        question: `Quick check: What is 2 + 2?`,
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: '2 + 2 equals 4.',
        points: 10
      }
    })
  }
}

