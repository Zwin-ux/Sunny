/**
 * POST /api/mission/grade
 * 
 * Grades a student's answer using OpenAI evaluation
 * Updates mastery scores with behavioral analysis
 * 
 * This is the CORE of the learning loop
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, TypedSupabaseClient } from '@/lib/supabase/admin';
import { getAIService } from '@/lib/ai-service';
import { logger } from '@/lib/logger';

interface GradeRequest {
  sessionId: string;
  userId: string;
  questionId: string;
  questionText: string;
  studentAnswer: string;
  timeToAnswerSeconds: number;
}

interface GradeResponse {
  correctness: 'correct' | 'incorrect' | 'partial';
  reasoning_quality: number; // 1-5
  answer_style: 'guess' | 'skip' | 'worked' | 'rushed';
  misunderstanding_label?: string;
  confidence_level: 'low' | 'medium' | 'high';
  ai_feedback: string;
  mastery_delta: number;
  new_mastery: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeRequest = await request.json();
    const { sessionId, userId, questionId, questionText, studentAnswer, timeToAnswerSeconds } = body;

    if (!sessionId || !userId || !questionText || !studentAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info('Grading attempt', { sessionId, questionId, userId });

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Type assertion after null check
    const db = supabase as TypedSupabaseClient;

    // ========================================================================
    // Step 1: Get session and skill info
    // ========================================================================

    const { data: session, error: sessionError } = await db
      .from('sessions')
      .select('*, skills(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      logger.error('Session not found', { sessionId, error: sessionError });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const skill = (session as any).skills;

    // ========================================================================
    // Step 2: AI Evaluation
    // ========================================================================

    const evaluation = await evaluateAnswer(
      questionText,
      studentAnswer,
      timeToAnswerSeconds,
      skill.display_name
    );

    logger.info('AI evaluation complete', {
      sessionId,
      correctness: evaluation.correctness,
      reasoning_quality: evaluation.reasoning_quality,
    });

    // ========================================================================
    // Step 3: Record attempt in database
    // ========================================================================

    const { error: attemptError } = await supabase
      .from('question_attempts')
      .insert({
        session_id: sessionId,
        skill_id: skill.id,
        question_text: questionText,
        student_answer: studentAnswer,
        time_to_answer_seconds: timeToAnswerSeconds,
        correctness: evaluation.correctness,
        reasoning_quality: evaluation.reasoning_quality,
        answer_style: evaluation.answer_style,
        misunderstanding_label: evaluation.misunderstanding_label,
        confidence_level: evaluation.confidence_level,
        ai_feedback: evaluation.ai_feedback,
      } as any);

    if (attemptError) {
      logger.error('Failed to record attempt', { error: attemptError });
    }

    // ========================================================================
    // Step 4: Update mastery score
    // ========================================================================

    const masteryDelta = calculateMasteryDelta(
      evaluation.correctness,
      evaluation.reasoning_quality,
      evaluation.answer_style,
      evaluation.confidence_level
    );

    const newMastery = Math.max(0, Math.min(100, skill.mastery + masteryDelta));

    const { error: skillError } = await (supabase as any)
      .from('skills')
      .update({
        mastery: newMastery,
        last_seen: new Date().toISOString(),
        total_attempts: skill.total_attempts + 1,
        correct_attempts: skill.correct_attempts + 
          (evaluation.correctness === 'correct' ? 1 : 0),
        typical_answer_style: evaluation.answer_style,
        // Update decay rate based on consistency
        decay_rate: updateDecayRate(
          skill.decay_rate,
          evaluation.correctness,
          evaluation.reasoning_quality
        ),
      })
      .eq('id', skill.id);

    if (skillError) {
      logger.error('Failed to update skill', { error: skillError });
    }

    // ========================================================================
    // Step 5: Update session stats
    // ========================================================================

    const { error: sessionUpdateError } = await (supabase as any)
      .from('sessions')
      .update({
        questions_attempted: ((session as any).questions_attempted || 0) + 1,
        questions_correct: ((session as any).questions_correct || 0) + 
          (evaluation.correctness === 'correct' ? 1 : 0),
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      logger.error('Failed to update session', { error: sessionUpdateError });
    }

    // ========================================================================
    // Step 6: Check if we should create a note
    // ========================================================================

    if (shouldCreateNote(evaluation, timeToAnswerSeconds, skill)) {
      await createSunnyNote(
        supabase,
        userId,
        skill.id,
        sessionId,
        evaluation,
        timeToAnswerSeconds
      );
    }

    // ========================================================================
    // Step 7: Return response
    // ========================================================================

    const response: GradeResponse = {
      ...evaluation,
      mastery_delta: masteryDelta,
      new_mastery: newMastery,
    };

    logger.info('Grading complete', {
      sessionId,
      masteryDelta,
      newMastery,
    });

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Error in grade_attempt', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Evaluate answer using OpenAI
 */
async function evaluateAnswer(
  questionText: string,
  studentAnswer: string,
  timeSeconds: number,
  skillName: string
): Promise<Omit<GradeResponse, 'mastery_delta' | 'new_mastery'>> {
  const aiService = getAIService();

  if (!aiService.isAvailable()) {
    return getFallbackEvaluation(studentAnswer, timeSeconds);
  }

  const prompt = `You are Sunny, evaluating a student's math answer. Be honest but kind.

QUESTION: ${questionText}
STUDENT ANSWER: ${studentAnswer}
TIME TAKEN: ${timeSeconds} seconds
SKILL: ${skillName}

Evaluate this response and return ONLY valid JSON:
{
  "correctness": "correct" | "incorrect" | "partial",
  "reasoning_quality": 1-5,
  "answer_style": "guess" | "skip" | "worked" | "rushed",
  "misunderstanding_label": "specific misconception or null",
  "confidence_level": "low" | "medium" | "high",
  "ai_feedback": "2-3 sentences of encouraging, specific feedback"
}

EVALUATION CRITERIA:
- correctness: Is the answer right?
- reasoning_quality: 
  1 = pure guess
  2 = confused attempt
  3 = partial understanding
  4 = solid reasoning
  5 = expert explanation
- answer_style: How did they approach it?
- misunderstanding_label: What specific concept are they missing? (e.g., "confuses numerator and denominator")
- confidence_level: How sure were they?
- ai_feedback: Systems language, not praise. Focus on the work, not the student.

Example feedback:
"Your answer shows you understand that bigger numerators mean more pieces. The next step is checking if the pieces are the same size. Let's practice that."

NOT:
"Great job! You're so smart!"`;

  try {
    const response = await aiService.generateCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3, // More precise for evaluation
      maxTokens: 400,
    });

    const evaluation = JSON.parse(response.content);
    return evaluation;
  } catch (error) {
    logger.error('AI evaluation failed, using fallback', error as Error);
    return getFallbackEvaluation(studentAnswer, timeSeconds);
  }
}

/**
 * Fallback evaluation when AI is unavailable
 */
function getFallbackEvaluation(
  answer: string,
  timeSeconds: number
): Omit<GradeResponse, 'mastery_delta' | 'new_mastery'> {
  const isSkip = answer.trim().toLowerCase() === 'skip' || 
                 answer.trim().toLowerCase() === 'idk' ||
                 answer.trim().length < 3;

  return {
    correctness: 'partial',
    reasoning_quality: 3,
    answer_style: isSkip ? 'skip' : timeSeconds < 5 ? 'rushed' : 'worked',
    confidence_level: 'medium',
    ai_feedback: 'Keep working on this. Show your thinking step by step.',
  };
}

/**
 * Calculate mastery delta based on performance
 */
function calculateMasteryDelta(
  correctness: string,
  reasoningQuality: number,
  answerStyle: string,
  confidenceLevel: string
): number {
  // Don't update mastery for skips or pure guesses
  if (answerStyle === 'skip' || reasoningQuality === 1) {
    return 0;
  }

  let delta = 0;

  // Base delta on correctness
  if (correctness === 'correct') {
    delta = reasoningQuality >= 4 ? 3 : 2; // More for solid reasoning
  } else if (correctness === 'partial') {
    delta = reasoningQuality >= 3 ? 0 : -1; // Neutral if trying, slight penalty if confused
  } else {
    // Incorrect
    if (confidenceLevel === 'high' && reasoningQuality <= 2) {
      delta = -3; // Big penalty for confident wrong answers (misconception)
    } else if (reasoningQuality >= 3) {
      delta = -1; // Small penalty if they tried but got it wrong
    } else {
      delta = -2; // Medium penalty for confused wrong answers
    }
  }

  return delta;
}

/**
 * Update decay rate based on consistency
 */
function updateDecayRate(
  currentDecay: number,
  correctness: string,
  reasoningQuality: number
): number {
  // If they're getting it right with good reasoning, they're stabilizing
  if (correctness === 'correct' && reasoningQuality >= 4) {
    return Math.max(0.05, currentDecay - 0.02); // Reduce decay (they remember better)
  }
  
  // If they're struggling, increase decay slightly
  if (correctness === 'incorrect' && reasoningQuality <= 2) {
    return Math.min(0.50, currentDecay + 0.01);
  }

  return currentDecay;
}

/**
 * Determine if we should create a Sunny note
 */
function shouldCreateNote(
  evaluation: any,
  timeSeconds: number,
  skill: any
): boolean {
  // Create note if:
  // 1. Significant misconception detected
  if (evaluation.misunderstanding_label) return true;

  // 2. Unusual time pattern (much slower or faster than average)
  if (skill.average_time_seconds) {
    const timeDiff = Math.abs(timeSeconds - skill.average_time_seconds);
    if (timeDiff > skill.average_time_seconds * 0.5) return true;
  }

  // 3. High confidence but wrong
  if (evaluation.correctness === 'incorrect' && 
      evaluation.confidence_level === 'high') return true;

  return false;
}

/**
 * Create a Sunny note about student behavior
 */
async function createSunnyNote(
  supabase: any,
  userId: string,
  skillId: string,
  sessionId: string,
  evaluation: any,
  timeSeconds: number
) {
  let comment = '';
  let noteType: 'pattern' | 'insight' | 'intervention' = 'insight';
  let priority: 'low' | 'medium' | 'high' = 'medium';

  if (evaluation.misunderstanding_label) {
    comment = `Pattern detected: ${evaluation.misunderstanding_label}. We should reteach this concept with a different approach.`;
    noteType = 'intervention';
    priority = 'high';
  } else if (timeSeconds > 30) {
    comment = `This question took ${timeSeconds} seconds, much longer than usual. Something here is confusing. Let's slow down and fix only that part.`;
    noteType = 'pattern';
  } else if (evaluation.correctness === 'incorrect' && evaluation.confidence_level === 'high') {
    comment = `High confidence but wrong answer. This suggests a misconception, not just a mistake. Needs targeted correction.`;
    noteType = 'intervention';
    priority = 'high';
  }

  if (comment) {
    await supabase.from('notes').insert({
      user_id: userId,
      sunny_comment: comment,
      related_skill_id: skillId,
      related_session_id: sessionId,
      note_type: noteType,
      priority,
      actionable: priority === 'high',
    });
  }
}
