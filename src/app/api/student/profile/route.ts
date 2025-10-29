/**
 * GET /api/student/profile
 *
 * Get complete student profile including:
 * - Basic info (name, grade, role)
 * - Skills with mastery levels
 * - Recent sessions
 * - Sunny notes
 * - Progress stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSkillsByUser, getRecentSessions, getSunnyNotes } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    logger.info('Getting student profile', { userId });

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // ========================================================================
    // Step 1: Get user basic info
    // ========================================================================

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('User not found', { userId, error: userError });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ========================================================================
    // Step 2: Get skills
    // ========================================================================

    const skills = await getSkillsByUser(userId);

    // Calculate average mastery
    const averageMastery = skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + s.mastery, 0) / skills.length)
      : 0;

    // ========================================================================
    // Step 3: Get recent sessions
    // ========================================================================

    const recentSessions = await getRecentSessions(userId, 10);

    // Calculate session stats
    const completedSessions = recentSessions.filter(s => s.status === 'completed');
    const totalQuestionsAttempted = recentSessions.reduce(
      (sum, s) => sum + (s.questions_attempted || 0),
      0
    );
    const totalQuestionsCorrect = recentSessions.reduce(
      (sum, s) => sum + (s.questions_correct || 0),
      0
    );
    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100)
      : 0;

    // ========================================================================
    // Step 4: Get Sunny notes
    // ========================================================================

    const allNotes = await getSunnyNotes(userId);
    const recentNotes = allNotes.slice(0, 5); // Last 5 notes

    // ========================================================================
    // Step 5: Build profile response
    // ========================================================================

    const profile = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gradeLevel: user.grade_level,
        learningStyle: user.learning_style,
        streakDays: user.streak_days,
        totalXp: user.total_xp,
        level: user.level,
        preferredDifficulty: user.preferred_difficulty,
        createdAt: user.created_at,
      },
      skills: {
        total: skills.length,
        averageMastery,
        list: skills.map(s => ({
          id: s.id,
          domain: s.domain,
          category: s.category,
          displayName: s.display_name,
          mastery: s.mastery,
          confidence: s.confidence,
          lastSeen: s.last_seen,
          totalAttempts: s.total_attempts,
          correctAttempts: s.correct_attempts,
        })),
      },
      sessions: {
        total: recentSessions.length,
        completed: completedSessions.length,
        overallAccuracy,
        recentSessions: recentSessions.map(s => ({
          id: s.id,
          startedAt: s.started_at,
          endedAt: s.ended_at,
          missionType: s.mission_type,
          sunnyGoal: s.sunny_goal,
          questionsAttempted: s.questions_attempted,
          questionsCorrect: s.questions_correct,
          durationSeconds: s.duration_seconds,
          status: s.status,
        })),
      },
      notes: {
        total: allNotes.length,
        recentNotes: recentNotes.map(n => ({
          id: n.id,
          comment: n.sunny_comment,
          noteType: n.note_type,
          priority: n.priority,
          actionable: n.actionable,
          timestamp: n.timestamp,
        })),
      },
      stats: {
        averageMastery,
        overallAccuracy,
        completedSessions: completedSessions.length,
        skillsCount: skills.length,
        streakDays: user.streak_days || 0,
        totalXp: user.total_xp || 0,
        level: user.level || 1,
      },
    };

    logger.info('Student profile retrieved', { userId, skillsCount: skills.length });

    return NextResponse.json(profile);

  } catch (error: any) {
    logger.error('Error in get_student_profile', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
