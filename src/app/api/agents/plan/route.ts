/**
 * POST /api/agents/plan
 *
 * Generate or update learning plan
 * Uses Path Planner Agent to create adaptive learning paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalAgentManager } from '@/lib/agents';
import { isDemoMode } from '@/lib/runtimeMode';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PlanRequest {
  student_id: string;
  learning_goal: string;
  current_knowledge?: string[];
  time_available_minutes?: number;
  preferred_difficulty?: 'easy' | 'medium' | 'hard';
}

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(identifier, '/api/agents/plan', 60, 20);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body: PlanRequest = await request.json();

    const { student_id, learning_goal, current_knowledge, time_available_minutes, preferred_difficulty } = body;

    if (!student_id || !learning_goal) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, learning_goal' },
        { status: 400 }
      );
    }

    await globalAgentManager.initialize();

    // Get learning state
    const learningState = globalAgentManager.getLearningState(student_id);

    // Generate personalized content through agent system
    const plan = await globalAgentManager.generatePersonalizedContent(
      student_id,
      learning_goal,
      'lesson' // Or 'learning_path' type
    );

    return NextResponse.json({
      success: true,
      plan: {
        learning_goal,
        estimated_duration_minutes: time_available_minutes || 30,
        difficulty: preferred_difficulty || 'medium',
        path: plan,
        prerequisites: current_knowledge || [],
        next_steps: learningState?.learningPath || [],
      },
    });
  } catch (error) {
    console.error('[API /agents/plan] Error:', error);

    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        demo_mode: true,
        plan: {
          learning_goal: body.learning_goal,
          estimated_duration_minutes: 30,
          difficulty: 'medium',
          path: [
            { step: 1, topic: 'Introduction', duration: 5 },
            { step: 2, topic: 'Core Concepts', duration: 15 },
            { step: 3, topic: 'Practice', duration: 10 },
          ],
          prerequisites: [],
          next_steps: ['Complete practice exercises', 'Review key concepts'],
        },
      });
    }

    return NextResponse.json(
      { error: 'Plan generation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
