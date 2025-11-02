import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';

/**
 * POST /api/quiz/create
 * Creates an adaptive quiz session
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
    const { topic, questionCount = 5 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create adaptive quiz session
    const session = await intelligentLearningSystem.createAdaptiveLearningSession(
      user.id,
      topic,
      questionCount
    );

    // Save session to database
    const { data: savedSession, error: dbError } = await supabase
      .from('quiz_sessions')
      .insert({
        id: session.id,
        user_id: user.id,
        topic: session.topic,
        questions: session.questions as any,
        total_questions: session.totalQuestions,
        total_points: session.totalPoints
      } as any)
      .select()
      .single();

    if (dbError) {
      console.error('Error saving quiz session:', dbError);
      return NextResponse.json(
        { error: 'Failed to save quiz session' },
        { status: 500 }
      );
    }

    // Return session with questions
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        topic: session.topic,
        questions: session.questions,
        totalQuestions: session.totalQuestions,
        totalPoints: session.totalPoints,
        startedAt: session.startedAt
      }
    });

  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
