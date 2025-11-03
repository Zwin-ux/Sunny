/**
 * GET /api/mission/next
 * 
 * Adaptive mission selection using:
 * 1. Lowest mastery skills
 * 2. Spaced repetition (last_seen + decay_rate)
 * 3. Attention patterns
 * 
 * Returns a mission definition with AI-generated questions
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getAdminClient, TypedSupabaseClient } from '@/lib/supabase/admin';
import { getAIService } from '@/lib/ai-service';
import { logger } from '@/lib/logger';

interface Skill {
  id: string;
  domain: string;
  category: string;
  display_name: string;
  mastery: number;
  confidence: string;
  last_seen: string;
  decay_rate: number;
  total_attempts: number;
  typical_answer_style: string | null;
}

interface Mission {
  id: string;
  skill: Skill;
  sunny_goal: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_format: string;
  questions: Question[];
  estimated_duration_minutes: number;
}

interface Question {
  id: string;
  text: string;
  type: 'open_ended' | 'multiple_choice' | 'explanation';
  expected_reasoning: string;
  hints?: string[];
}

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

    logger.info('Getting next mission', { userId });

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
    // Step 1: Get user profile
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
    // Step 2: Get all skills for this user
    // ========================================================================

    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('mastery', { ascending: true });

    if (skillsError) {
      logger.error('Error fetching skills', { error: skillsError });
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      );
    }

    // If no skills exist, initialize default skills
    if (!skills || skills.length === 0) {
      await initializeDefaultSkills(supabase, userId, (user as any).grade_level || 3);
      
      // Fetch again
      const { data: newSkills } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId)
        .order('mastery', { ascending: true });
      
      if (!newSkills || newSkills.length === 0) {
        return NextResponse.json(
          { error: 'Failed to initialize skills' },
          { status: 500 }
        );
      }
      
      skills.push(...newSkills);
    }

    // ========================================================================
    // Step 3: Calculate urgency scores for each skill
    // ========================================================================

    const skillsWithUrgency = skills.map((skill: any) => {
      const daysSinceSeen = 
        (Date.now() - new Date(skill.last_seen).getTime()) / (1000 * 60 * 60 * 24);
      
      // Urgency formula:
      // (100 - mastery) * decay_rate * (1 + days_since_seen/7)
      // This prioritizes:
      // - Low mastery skills
      // - High decay rate (things they forget fast)
      // - Skills not seen recently
      const urgencyScore = 
        (100 - skill.mastery) * 
        skill.decay_rate * 
        (1 + daysSinceSeen / 7);

      return {
        ...skill,
        urgencyScore,
        daysSinceSeen,
      };
    });

    // Sort by urgency
    skillsWithUrgency.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Select top skill
    const targetSkill = skillsWithUrgency[0];

    logger.info('Selected target skill', {
      userId,
      skill: targetSkill.domain,
      mastery: targetSkill.mastery,
      urgencyScore: targetSkill.urgencyScore,
    });

    // ========================================================================
    // Step 4: Determine difficulty and format
    // ========================================================================

    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (targetSkill.mastery < 30) difficulty = 'easy';
    else if (targetSkill.mastery > 70) difficulty = 'hard';

    // Choose format based on user's learning style and past performance
    const questionFormat = selectQuestionFormat(
      (user as any).learning_style,
      targetSkill.typical_answer_style
    );

    // ========================================================================
    // Step 5: Generate questions using AI
    // ========================================================================

    const questions = await generateMissionQuestions(
      targetSkill,
      difficulty,
      questionFormat,
      user.name,
      user.grade_level || 3
    );

    // ========================================================================
    // Step 6: Create session in database
    // ========================================================================

    const sunnyGoal = generateSunnyGoal(targetSkill, difficulty);

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        mission_type: targetSkill.domain,
        sunny_goal: sunnyGoal,
        target_skill_id: targetSkill.id,
        difficulty_level: difficulty,
        question_format: questionFormat,
        mastery_before: targetSkill.mastery,
        status: 'active',
      })
      .select()
      .single();

    if (sessionError || !session) {
      logger.error('Failed to create session', { error: sessionError });
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // ========================================================================
    // Step 7: Return mission
    // ========================================================================

    const mission: Mission = {
      id: session.id,
      skill: targetSkill,
      sunny_goal: sunnyGoal,
      difficulty_level: difficulty,
      question_format: questionFormat,
      questions,
      estimated_duration_minutes: questions.length * 2, // ~2 min per question
    };

    logger.info('Mission created', {
      userId,
      sessionId: session.id,
      questionCount: questions.length,
    });

    return NextResponse.json({ mission });

  } catch (error: any) {
    logger.error('Error in get_next_mission', error);
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
 * Initialize default skills for a new user
 */
async function initializeDefaultSkills(
  supabase: any,
  userId: string,
  gradeLevel: number
) {
  const defaultSkills = getDefaultSkillsForGrade(gradeLevel);
  
  const skillsToInsert = defaultSkills.map(skill => ({
    user_id: userId,
    ...skill,
  }));

  const { error } = await supabase
    .from('skills')
    .insert(skillsToInsert);

  if (error) {
    logger.error('Failed to initialize skills', { error });
  }
}

/**
 * Get default skills based on grade level
 */
function getDefaultSkillsForGrade(gradeLevel: number) {
  // Grade 3-6 Math skills
  const mathSkills = [
    {
      domain: 'fractions_comparison',
      category: 'math',
      display_name: 'Comparing Fractions',
      mastery: 0,
      confidence: 'low',
      decay_rate: 0.15,
    },
    {
      domain: 'fractions_addition',
      category: 'math',
      display_name: 'Adding Fractions',
      mastery: 0,
      confidence: 'low',
      decay_rate: 0.20,
    },
    {
      domain: 'multiplication_facts',
      category: 'math',
      display_name: 'Multiplication Facts',
      mastery: 0,
      confidence: 'low',
      decay_rate: 0.10,
    },
    {
      domain: 'word_problems_multi_step',
      category: 'math',
      display_name: 'Multi-Step Word Problems',
      mastery: 0,
      confidence: 'low',
      decay_rate: 0.25,
    },
    {
      domain: 'decimals_place_value',
      category: 'math',
      display_name: 'Decimal Place Value',
      mastery: 0,
      confidence: 'low',
      decay_rate: 0.18,
    },
  ];

  return mathSkills;
}

/**
 * Select question format based on learning style
 */
function selectQuestionFormat(
  learningStyle: string | null,
  typicalAnswerStyle: string | null
): string {
  // If student typically guesses, use formats that require explanation
  if (typicalAnswerStyle === 'guess' || typicalAnswerStyle === 'rushed') {
    return 'explanation_required';
  }

  // Match format to learning style
  switch (learningStyle) {
    case 'visual':
      return 'visual_word_problems';
    case 'kinesthetic':
      return 'hands_on_scenarios';
    case 'logical':
      return 'number_patterns';
    default:
      return 'mixed_format';
  }
}

/**
 * Generate Sunny's goal statement
 */
function generateSunnyGoal(skill: any, difficulty: string): string {
  const action = difficulty === 'easy' ? 'learning' : 
                 difficulty === 'medium' ? 'practicing' : 'mastering';
  
  return `We are ${action} ${skill.display_name.toLowerCase()}. Let's patch this skill.`;
}

/**
 * Generate mission questions using AI
 */
async function generateMissionQuestions(
  skill: Skill,
  difficulty: 'easy' | 'medium' | 'hard',
  format: string,
  studentName: string,
  gradeLevel: number
): Promise<Question[]> {
  const aiService = getAIService();

  if (!aiService.isAvailable()) {
    // Return fallback questions
    return getFallbackQuestions(skill, difficulty);
  }

  const prompt = buildMissionPrompt(skill, difficulty, format, studentName, gradeLevel);

  try {
    const response = await aiService.generateCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      maxTokens: 1500,
    });

    const questions = JSON.parse(response.content);
    return questions.map((q: any, index: number) => ({
      id: `q${index + 1}`,
      ...q,
    }));
  } catch (error) {
    logger.error('Failed to generate questions with AI', error as Error);
    return getFallbackQuestions(skill, difficulty);
  }
}

/**
 * Build OpenAI prompt for mission generation
 */
function buildMissionPrompt(
  skill: Skill,
  difficulty: string,
  format: string,
  studentName: string,
  gradeLevel: number
): string {
  return `You are Sunny, a patient math tutor. Generate 5-7 questions for ${studentName} (grade ${gradeLevel}).

TARGET SKILL: ${skill.display_name}
DIFFICULTY: ${difficulty}
FORMAT: ${format}

REQUIREMENTS:
1. Questions must require EXPLANATION, not just answers
2. Use real-world contexts (food, games, money, sports)
3. Build from simple to complex
4. Each question should reveal understanding, not just memory

OUTPUT FORMAT (JSON array):
[
  {
    "text": "You have 3/4 of a pizza and your friend has 2/3 of a pizza. Who has more? Explain how you know using the pizza slices.",
    "type": "explanation",
    "expected_reasoning": "Student should explain that 3/4 means 3 out of 4 equal pieces, and compare piece sizes or convert to common denominator",
    "hints": ["Think about how big each slice is", "What if both pizzas were cut into 12 slices?"]
  }
]

Generate ${difficulty === 'easy' ? '5' : difficulty === 'medium' ? '6' : '7'} questions now.`;
}

/**
 * Fallback questions when AI is unavailable
 */
function getFallbackQuestions(skill: Skill, difficulty: string): Question[] {
  return [
    {
      id: 'q1',
      text: `Let's work on ${skill.display_name}. Explain what you already know about this topic.`,
      type: 'explanation',
      expected_reasoning: 'Student demonstrates prior knowledge',
      hints: ['Think about what you remember', 'Any examples you can give?'],
    },
    {
      id: 'q2',
      text: 'Here\'s a practice problem. Show your work and explain your thinking.',
      type: 'explanation',
      expected_reasoning: 'Student shows problem-solving process',
    },
  ];
}
