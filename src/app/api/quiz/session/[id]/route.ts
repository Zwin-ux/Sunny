import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/quiz/session/:id
 * Gets quiz session state and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sessionId = params.id;

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

    // Return session data
    return NextResponse.json({
      success: true,
      session: {
        id: (sessionData as any).id,
        topic: (sessionData as any).topic,
        startedAt: (sessionData as any).started_at,
        completedAt: (sessionData as any).completed_at,
        questions: (sessionData as any).questions,
        answers: (sessionData as any).answers || [],
        totalQuestions: (sessionData as any).total_questions,
        questionsCompleted: (sessionData as any).questions_completed,
        correctAnswers: (sessionData as any).correct_answers,
        totalPoints: (sessionData as any).total_points,
        earnedPoints: (sessionData as any).earned_points,
        difficultyAdjustments: (sessionData as any).difficulty_adjustments || [],
        conceptsMastered: (sessionData as any).concepts_mastered || [],
        conceptsToReview: (sessionData as any).concepts_to_review || [],
        progress: {
          percentage: ((sessionData as any).questions_completed / (sessionData as any).total_questions) * 100,
          accuracy: (sessionData as any).questions_completed > 0 
            ? ((sessionData as any).correct_answers / (sessionData as any).questions_completed) * 100 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting quiz session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get quiz session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
