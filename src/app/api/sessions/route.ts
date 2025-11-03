/**
 * GET /api/sessions
 *
 * Get session history for a user
 *
 * Query params:
 * - userId: required
 * - limit: optional, default 10
 * - status: optional filter (active/completed/abandoned)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getRecentSessions } from '@/lib/db';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const statusFilter = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const limit = limitParam ? parseInt(limitParam) : 10;

    logger.info('Getting session history', { userId, limit, statusFilter });

    // Get sessions
    let sessions = await getRecentSessions(userId, limit);

    // Apply status filter if provided
    if (statusFilter) {
      sessions = sessions.filter(s => s.status === statusFilter);
    }

    // Calculate aggregate stats
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0);
    const overallAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    // Format sessions
    const formattedSessions = sessions.map(s => ({
      id: s.id,
      userId: s.user_id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationSeconds: s.duration_seconds,
      missionType: s.mission_type,
      sunnyGoal: s.sunny_goal,
      targetSkillId: s.target_skill_id,
      difficultyLevel: s.difficulty_level,
      questionFormat: s.question_format,
      questionsAttempted: s.questions_attempted,
      questionsCorrect: s.questions_correct,
      masteryBefore: s.mastery_before,
      masteryAfter: s.mastery_after,
      masteryDelta: s.mastery_delta,
      attentionQuality: s.attention_quality,
      status: s.status,
      sunnySummary: s.sunny_summary,
    }));

    const response = {
      sessions: formattedSessions,
      count: formattedSessions.length,
      stats: {
        total: sessions.length,
        completed: completedSessions.length,
        totalQuestions,
        totalCorrect,
        overallAccuracy,
        totalDurationMinutes: Math.round(totalDuration / 60),
        averageSessionMinutes: sessions.length > 0
          ? Math.round((totalDuration / 60) / sessions.length)
          : 0,
      },
    };

    logger.info('Session history retrieved', {
      userId,
      count: sessions.length,
      completed: completedSessions.length
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Error in get_sessions', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
