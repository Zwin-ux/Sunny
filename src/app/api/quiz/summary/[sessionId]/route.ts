import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';
import { QuizSession } from '@/types/quiz';

/**
 * GET /api/quiz/summary/:sessionId
 * Gets session summary with brain analysis and recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

    const sessionId = params.sessionId;

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
      id: (sessionData as any).id,
      userId: (sessionData as any).user_id,
      topic: (sessionData as any).topic,
      startedAt: new Date((sessionData as any).started_at),
      completedAt: (sessionData as any).completed_at ? new Date((sessionData as any).completed_at) : undefined,
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
      recommendedNextTopics: []
    };

    // Generate session summary with brain analysis
    const summary = await intelligentLearningSystem.generateSessionSummary(session);

    // Return comprehensive summary
    return NextResponse.json({
      success: true,
      summary: {
        // Session metrics
        session: {
          id: session.id,
          topic: session.topic,
          duration: session.completedAt 
            ? (session.completedAt.getTime() - session.startedAt.getTime()) / 1000 
            : null,
          startedAt: session.startedAt,
          completedAt: session.completedAt
        },
        
        // Performance metrics
        performance: {
          totalQuestions: session.totalQuestions,
          questionsCompleted: session.questionsCompleted,
          correctAnswers: session.correctAnswers,
          accuracy: summary.accuracy,
          averageTimePerQuestion: summary.avgTime,
          earnedPoints: session.earnedPoints,
          totalPoints: session.totalPoints,
          scorePercentage: (session.earnedPoints / session.totalPoints) * 100
        },
        
        // Brain analysis
        brainAnalysis: {
          performancePattern: summary.brainAnalysis.performancePattern,
          learningStyle: summary.brainAnalysis.learningStyle,
          confidenceLevel: summary.brainAnalysis.confidenceLevel,
          insights: summary.brainAnalysis.insights,
          nextAction: summary.brainAnalysis.nextAction
        },
        
        // Adaptive behavior
        adaptation: {
          difficultyAdjustments: session.difficultyAdjustments,
          adjustmentCount: session.difficultyAdjustments.length,
          conceptsMastered: session.conceptsMastered,
          conceptsToReview: session.conceptsToReview
        },
        
        // Recommendations
        recommendations: summary.recommendations,
        nextTopics: summary.nextTopics,
        
        // Achievements (if any)
        achievements: calculateAchievements(session, summary)
      }
    });

  } catch (error) {
    console.error('Error getting quiz summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get quiz summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate achievements based on session performance
 */
function calculateAchievements(session: QuizSession, summary: any): any[] {
  const achievements = [];
  
  // Perfect score
  if (session.correctAnswers === session.totalQuestions) {
    achievements.push({
      id: 'perfect_score',
      title: 'Perfect Score! 🌟',
      description: 'Answered all questions correctly!',
      icon: '🏆'
    });
  }
  
  // Fast learner
  if (summary.avgTime < 20) {
    achievements.push({
      id: 'fast_learner',
      title: 'Speed Demon! ⚡',
      description: 'Completed questions in record time!',
      icon: '🚀'
    });
  }
  
  // No hints needed
  const totalHints = session.answers.reduce((sum: number, a: any) => sum + (a.hintsUsed || 0), 0);
  if (totalHints === 0 && session.questionsCompleted > 0) {
    achievements.push({
      id: 'independent',
      title: 'Independent Thinker! 💡',
      description: 'Solved all questions without hints!',
      icon: '🧠'
    });
  }
  
  // Improvement
  if (session.difficultyAdjustments.some((adj: any) => adj.to > adj.from)) {
    achievements.push({
      id: 'leveled_up',
      title: 'Leveled Up! 📈',
      description: 'Difficulty increased during session!',
      icon: '⬆️'
    });
  }
  
  // Persistence
  if (summary.brainAnalysis.performancePattern === 'steady') {
    achievements.push({
      id: 'persistent',
      title: 'Steady Progress! 🌱',
      description: 'Consistent performance throughout!',
      icon: '💪'
    });
  }
  
  return achievements;
}
