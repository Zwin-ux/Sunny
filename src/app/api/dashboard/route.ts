/**
 * GET /api/dashboard
 * 
 * Returns student dashboard data:
 * - Skill cards with mastery levels
 * - Next recommended mission
 * - Streak info
 * - Recent Sunny notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, TypedSupabaseClient } from '@/lib/supabase/admin';
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

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Type assertion after null check
    const db = supabase as TypedSupabaseClient;

    // Get user info
    const { data: user } = await db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all skills
    const { data: skills } = await db
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('mastery', { ascending: false });

    // Get recent sessions
    const { data: recentSessions } = await db
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5);

    // Get recent notes
    const { data: recentNotes } = await db
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Calculate next mission recommendation
    const nextMission = calculateNextMission(skills || []);

    // Build dashboard
    const dashboard = {
      user: {
        name: user.name,
        level: Math.floor((user.current_streak || 0) / 7) + 1,
        streak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
      },
      skills: (skills || []).map((skill: any) => ({
        id: skill.id,
        name: skill.display_name,
        category: skill.category,
        mastery: skill.mastery,
        status: skill.mastery >= 70 ? 'mastered' : skill.mastery >= 40 ? 'learning' : 'struggling',
        lastSeen: skill.last_seen,
        totalAttempts: skill.total_attempts,
      })),
      nextMission: nextMission,
      recentActivity: (recentSessions || []).map((session: any) => ({
        id: session.id,
        goal: session.sunny_goal,
        date: session.started_at,
        masteryGain: session.mastery_delta || 0,
        questionsCorrect: session.questions_correct || 0,
        questionsTotal: session.questions_attempted || 0,
      })),
      sunnyNotes: (recentNotes || []).map((note: any) => ({
        id: note.id,
        comment: note.sunny_comment,
        type: note.note_type,
        priority: note.priority,
        timestamp: note.timestamp,
      })),
    };

    return NextResponse.json({ dashboard });

  } catch (error: any) {
    logger.error('Error in dashboard API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNextMission(skills: any[]) {
  if (!skills || skills.length === 0) {
    return {
      skill: 'Get Started',
      reason: 'Begin your learning journey',
      urgency: 'high',
    };
  }

  // Find skill with lowest mastery
  const lowestSkill = skills.reduce((min, skill) => 
    skill.mastery < min.mastery ? skill : min
  );

  return {
    skill: lowestSkill.display_name,
    reason: lowestSkill.mastery < 40 
      ? 'This needs attention' 
      : 'Time to level this up',
    urgency: lowestSkill.mastery < 30 ? 'high' : 'medium',
    masteryLevel: lowestSkill.mastery,
  };
}
