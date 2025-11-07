/**
 * POST /api/agents/intervene
 *
 * Trigger intervention action
 * Uses Intervention Agent to detect and respond to frustration, confusion, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalAgentManager, globalEventSystem } from '@/lib/agents';
import { isDemoMode } from '@/lib/runtimeMode';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InterventionRequest {
  student_id: string;
  trigger:
    | 'frustration'
    | 'disengagement'
    | 'confusion'
    | 'fatigue'
    | 'success'
    | 'auto_detect';
  context?: {
    recent_performance?: Array<{ correct: boolean; time_spent_ms: number }>;
    session_duration_minutes?: number;
    current_activity?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(identifier, '/api/agents/intervene', 60, 40);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body: InterventionRequest = await request.json();

    const { student_id, trigger, context } = body;

    if (!student_id || !trigger) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, trigger' },
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

    // Publish intervention event
    globalEventSystem.publishEvent({
      id: `intervention-${Date.now()}`,
      type: 'intervention:triggered',
      priority: 'high',
      timestamp: Date.now(),
      sourceAgentId: 'api',
      targetAgentType: 'intervention',
      payload: {
        studentId: student_id,
        trigger,
        context,
        learningState,
      },
    });

    // Process through intervention agent
    const interventionResult = await globalAgentManager.processStudentMessage(
      student_id,
      `Intervention needed: ${trigger}`,
      {} as any
    );

    return NextResponse.json({
      success: true,
      intervention: {
        trigger,
        timestamp: Date.now(),
        action_taken: interventionResult.response,
        recommendations: interventionResult.actions,
        priority: trigger === 'frustration' || trigger === 'fatigue' ? 'urgent' : 'high',
      },
    });
  } catch (error) {
    console.error('[API /agents/intervene] Error:', error);

    if (isDemoMode()) {
      const interventions: Record<string, string> = {
        frustration: "Hey, I can see this is challenging! Let's take a different approach. How about we try with a simpler example? 💙",
        disengagement: "Let's make this more exciting! Want to try a game instead? 🎮",
        confusion: "No worries! Let me explain this in a different way with a cool example! 🌟",
        fatigue: "You've been working hard! How about a quick break? You've earned it! ☕",
        success: "Amazing work! You're crushing this! Ready for a bigger challenge? 🏆",
      };

      return NextResponse.json({
        success: true,
        demo_mode: true,
        intervention: {
          trigger: body.trigger,
          timestamp: Date.now(),
          action_taken: interventions[body.trigger] || interventions.confusion,
          recommendations: ['Adjust difficulty', 'Change activity type', 'Provide encouragement'],
          priority: 'high',
        },
      });
    }

    return NextResponse.json(
      { error: 'Intervention failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
