/**
 * POST /api/agents/assess
 *
 * Real-time assessment endpoint
 * Analyzes student interaction and provides assessment metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalAgentManager } from '@/lib/agents';
import { isDemoMode } from '@/lib/runtimeMode';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AssessmentRequest {
  student_id: string;
  interaction: {
    type: 'question_answer' | 'activity' | 'challenge';
    content: string;
    response_time_ms?: number;
    confidence_self_reported?: number; // 1-5
    context?: Record<string, any>;
  };
  current_topic?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(identifier, '/api/agents/assess', 60, 30);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body: AssessmentRequest = await request.json();

    const { student_id, interaction, current_topic } = body;

    if (!student_id || !interaction) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, interaction' },
        { status: 400 }
      );
    }

    // Initialize agent manager if needed
    await globalAgentManager.initialize();

    // Process assessment through agent system
    const assessmentResult = await globalAgentManager.processStudentMessage(
      student_id,
      JSON.stringify(interaction),
      {} as any // Simplified - would pass full profile
    );

    return NextResponse.json({
      success: true,
      assessment: {
        interaction_id: `${student_id}-${Date.now()}`,
        timestamp: Date.now(),
        metrics: assessmentResult.response,
        recommendations: assessmentResult.actions,
      },
    });
  } catch (error) {
    console.error('[API /agents/assess] Error:', error);

    if (isDemoMode()) {
      // Demo mode fallback
      return NextResponse.json({
        success: true,
        demo_mode: true,
        assessment: {
          interaction_id: `demo-${Date.now()}`,
          timestamp: Date.now(),
          metrics: {
            engagement: 0.75,
            understanding: 0.68,
            confidence: 0.7,
          },
          recommendations: ['Continue current difficulty', 'Provide more examples'],
        },
      });
    }

    return NextResponse.json(
      { error: 'Assessment failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
