import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';
import { AdaptiveQuestion, StudentPerformanceState } from '@/types/quiz';

/**
 * POST /api/quiz/hint
 * Gets next progressive hint for current question
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, questionIndex, attemptNumber, confidence } = body;

    if (!sessionId || questionIndex === undefined || !attemptNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionIndex, attemptNumber' },
        { status: 400 }
      );
    }

    // Get session from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Quiz session not found' },
        { status: 404 }
      );
    }

    // Get question
    const questions = (sessionData as any).questions as AdaptiveQuestion[];
    const question = questions[questionIndex];

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get student performance state
    const { data: perfData } = await supabase
      .from('student_performance')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic', (sessionData as any).topic)
      .single();

    const studentState: StudentPerformanceState = {
      userId: user.id,
      topic: (sessionData as any).topic,
      recentAnswers: (perfData as any)?.recent_answers || [],
      currentStreak: (perfData as any)?.current_streak || 0,
      longestStreak: (perfData as any)?.longest_streak || 0,
      currentDifficulty: (perfData as any)?.current_difficulty || 'medium',
      masteryLevel: (perfData as any)?.mastery_level || 50,
      averageTimePerQuestion: (perfData as any)?.average_time_per_question || 30000,
      accuracyRate: (perfData as any)?.accuracy_rate || 0.75,
      hintsUsageRate: (perfData as any)?.hints_usage_rate || 0.3,
      optimalDifficulty: (perfData as any)?.current_difficulty || 'medium',
      strugglingIndicators: (perfData as any)?.struggling_indicators || [],
      strengthAreas: (perfData as any)?.strength_areas || []
    };

    // Get next hint
    const hint = intelligentLearningSystem.getNextHint(
      question,
      attemptNumber,
      studentState,
      confidence
    );

    if (!hint) {
      return NextResponse.json(
        { error: 'No more hints available' },
        { status: 404 }
      );
    }

    // Return hint
    return NextResponse.json({
      success: true,
      hint: {
        id: hint.id,
        level: hint.level,
        text: hint.text,
        type: hint.type
      },
      hasMoreHints: question.scaffolding.hints.length > attemptNumber
    });

  } catch (error) {
    console.error('Error getting hint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get hint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
