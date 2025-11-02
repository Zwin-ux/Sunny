import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';
import { QuizSession } from '@/types/quiz';

/**
 * POST /api/quiz/answer
 * Processes student answer with AI feedback and adaptive difficulty adjustment
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
    const { 
      sessionId, 
      questionIndex, 
      answer, 
      timeSpent, 
      hintsUsed = 0,
      confidence 
    } = body;

    if (!sessionId || questionIndex === undefined || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionIndex, answer' },
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

    // Reconstruct session object
    const session: QuizSession = {
      id: sessionData.id,
      userId: sessionData.user_id,
      topic: sessionData.topic,
      startedAt: new Date(sessionData.started_at),
      completedAt: sessionData.completed_at ? new Date(sessionData.completed_at) : undefined,
      questions: sessionData.questions as any,
      answers: sessionData.answers as any || [],
      totalQuestions: sessionData.total_questions,
      questionsCompleted: sessionData.questions_completed,
      correctAnswers: sessionData.correct_answers,
      totalPoints: sessionData.total_points,
      earnedPoints: sessionData.earned_points,
      difficultyAdjustments: sessionData.difficulty_adjustments as any || [],
      conceptsMastered: sessionData.concepts_mastered || [],
      conceptsToReview: sessionData.concepts_to_review || [],
      recommendedNextTopics: []
    };

    // Process answer with intelligent learning system
    const result = await intelligentLearningSystem.processAnswer(
      session,
      questionIndex,
      answer,
      timeSpent,
      hintsUsed,
      confidence
    );

    // Update session in database
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        answers: session.answers as any,
        questions_completed: session.questionsCompleted,
        correct_answers: session.correctAnswers,
        earned_points: session.earnedPoints,
        difficulty_adjustments: session.difficultyAdjustments as any,
        concepts_mastered: session.conceptsMastered,
        concepts_to_review: session.conceptsToReview,
        completed_at: result.sessionComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating quiz session:', updateError);
      // Don't fail the request, just log the error
    }

    // Update student performance state
    await updateStudentPerformance(supabase, user.id, session.topic, result);

    // Return result
    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
      nextQuestion: result.nextQuestion,
      sessionComplete: result.sessionComplete,
      difficultyAdjusted: result.difficultyAdjusted,
      currentStreak: result.currentStreak,
      progress: {
        questionsCompleted: session.questionsCompleted,
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        earnedPoints: session.earnedPoints,
        totalPoints: session.totalPoints
      }
    });

  } catch (error) {
    console.error('Error processing answer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process answer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update student performance state in database
 */
async function updateStudentPerformance(
  supabase: any,
  userId: string,
  topic: string,
  result: any
) {
  try {
    // Get current performance state
    const { data: perfData } = await supabase
      .from('student_performance')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .single();

    const currentStreak = result.currentStreak || 0;
    const longestStreak = perfData?.longest_streak || 0;

    // Upsert performance state
    await supabase
      .from('student_performance')
      .upsert({
        user_id: userId,
        topic: topic,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, longestStreak),
        updated_at: new Date().toISOString()
      } as any);
  } catch (error) {
    console.error('Error updating student performance:', error);
    // Don't fail the main request
  }
}
