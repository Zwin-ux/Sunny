/**
 * POST /api/agents/reflect
 *
 * Generate session summaries and insights
 * Uses Reflection Agent for post-session analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalAgentManager } from '@/lib/agents';
import { isDemoMode } from '@/lib/runtimeMode';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReflectionRequest {
  student_id: string;
  session_id: string;
  reflection_type: 'session_summary' | 'progress_narrative' | 'self_evaluation';
  timeframe?: 'session' | 'week' | 'month';
}

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(identifier, '/api/agents/reflect', 60, 30);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body: ReflectionRequest = await request.json();

    const { student_id, session_id, reflection_type, timeframe } = body;

    if (!student_id || !session_id || !reflection_type) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, session_id, reflection_type' },
        { status: 400 }
      );
    }

    await globalAgentManager.initialize();

    // Get learning state
    const learningState = globalAgentManager.getLearningState(student_id);

    if (!learningState) {
      return NextResponse.json(
        { error: 'Student learning state not found' },
        { status: 404 }
      );
    }

    // Generate reflection through agent system
    // Note: In production, would route to ReflectionAgent specifically
    const reflection = await generateReflection(
      reflection_type,
      learningState,
      timeframe
    );

    return NextResponse.json({
      success: true,
      reflection: {
        student_id,
        session_id,
        type: reflection_type,
        timestamp: Date.now(),
        content: reflection,
      },
    });
  } catch (error) {
    console.error('[API /agents/reflect] Error:', error);

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        demo_mode: true,
        reflection: {
          student_id: body.student_id,
          session_id: body.session_id,
          type: body.reflection_type,
          timestamp: Date.now(),
          content: getDemoReflection(body.reflection_type),
        },
      });
    }

    return NextResponse.json(
      { error: 'Reflection generation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generateReflection(
  type: string,
  learningState: any,
  timeframe?: string
): Promise<any> {
  // Simplified implementation
  // In production, would call ReflectionAgent methods

  if (type === 'session_summary') {
    return {
      summary: 'Great session today!',
      topics_covered: learningState.contextHistory?.slice(-5).map((c: any) => c.topic) || [],
      key_insights: [
        'You showed strong problem-solving skills',
        'Your persistence paid off on challenging questions',
      ],
      next_steps: ['Practice multiplication facts', 'Try word problems'],
    };
  }

  if (type === 'progress_narrative') {
    return {
      title: 'Your Learning Journey',
      narrative: `Over the past ${timeframe || 'session'}, you've made incredible progress! You've tackled new challenges, asked great questions, and built your skills step by step. Keep up the amazing work! 🌟`,
      achievements: [
        'Completed 10+ activities',
        'Mastered 3 new concepts',
        'Improved accuracy by 15%',
      ],
    };
  }

  if (type === 'self_evaluation') {
    return {
      prompts: [
        'How do you feel about what you learned today?',
        'What was the most challenging part?',
        'What would you like to learn more about?',
      ],
    };
  }

  return { message: 'Reflection generated' };
}

function getDemoReflection(type: string): any {
  const reflections: Record<string, any> = {
    session_summary: {
      summary: 'Amazing session! You covered 5 topics and mastered 2 new concepts! 🎉',
      duration_minutes: 25,
      topics_covered: ['Addition', 'Subtraction', 'Word Problems'],
      concepts_mastered: ['Two-digit addition', 'Basic subtraction'],
      key_insights: [
        'You showed excellent persistence on challenging problems! 💪',
        'Your accuracy improved throughout the session! 📈',
        'You asked great clarifying questions! 💡',
      ],
      celebration_moments: [
        'Got 10 questions in a row correct! 🔥',
        'Completed your first word problem! 🎯',
      ],
      next_steps: [
        'Practice subtraction with borrowing',
        'Try more word problems',
        'Review multiplication basics',
      ],
    },
    progress_narrative: {
      title: 'Your Incredible Learning Adventure! 🚀',
      narrative:
        "Wow! What an amazing journey you've been on! This week, you've grown so much as a learner. You started by reviewing addition, then bravely tackled subtraction challenges. Even when things got tricky, you didn't give up - that's what makes you a true learning champion! Your curiosity and questions show that you're not just memorizing, you're truly understanding. You've built strong math skills and an even stronger growth mindset. The future is bright for you, superstar! 🌟",
      achievements: [
        'Mastered 5 new math concepts',
        'Improved accuracy from 65% to 85%',
        'Completed 47 activities',
        'Built a 7-day learning streak',
      ],
      growth_areas: [
        'Keep practicing word problems to build confidence',
        'Try explaining concepts to others to deepen understanding',
      ],
    },
    self_evaluation: {
      prompts: [
        'On a scale of 1-5, how well do you understand what we learned today? ⭐⭐⭐⭐⭐',
        'How confident do you feel trying this on your own?',
        'Was today\'s activity too easy, just right, or too hard?',
        'What was the most interesting thing you discovered?',
        'What\'s one question you still have?',
        'How would you explain this topic to a friend?',
      ],
    },
  };

  return reflections[type] || { message: 'Reflection generated' };
}
