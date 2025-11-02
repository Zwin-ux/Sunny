/**
 * Demo mode configuration for Sunny
 * 
 * This module provides utilities to check if demo mode is active and
 * to provide mock data for various features when APIs are unavailable.
 */

import { logger } from './logger';

/**
 * Check if demo mode is enabled
 * Demo mode is enabled if:
 * 1. SUNNY_DEMO_MODE is explicitly set to 'true', OR
 * 2. In production AND missing required API keys (OpenAI or Supabase)
 *
 * This allows the app to gracefully degrade when:
 * - Running without API credentials
 * - Testing UI/UX without backend dependencies
 * - Showcasing the app in demos
 */
export function isDemoMode(): boolean {
  const explicitDemo = process.env.SUNNY_DEMO_MODE === 'true';

  // Check if required services are configured
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasSupabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // In production, enable demo mode if missing required services
  const productionFallback =
    process.env.NODE_ENV === 'production' &&
    (!hasOpenAI || !hasSupabase);

  const demoMode = explicitDemo || productionFallback;

  if (demoMode) {
    logger.info('Demo mode is active', {
      explicitDemo,
      hasOpenAI,
      hasSupabase,
      environment: process.env.NODE_ENV
    });
  }

  return demoMode;
}

/**
 * Check if a specific service is available
 */
export function isServiceAvailable(service: 'openai' | 'supabase'): boolean {
  if (process.env.SUNNY_DEMO_MODE === 'true') {
    return false;
  }

  switch (service) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'supabase':
      return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    default:
      return false;
  }
}

/**
 * Mock lesson plans for demo mode
 */
export const mockLessons = [
  {
    id: 'math-patterns',
    title: 'Pattern Game',
    subject: 'Math',
    duration: '15 min',
    difficulty: 'Beginner',
    content: {
      description: 'Learn to identify and create patterns using numbers and shapes.',
      objectives: [
        'Recognize repeating patterns',
        'Create your own patterns',
        'Solve pattern-based puzzles'
      ],
      activities: [
        {
          name: 'Pattern Spotting',
          description: 'Find the next item in the sequence'
        },
        {
          name: 'Pattern Creation',
          description: 'Create your own pattern for others to solve'
        }
      ]
    }
  },
  {
    id: 'robot-fun',
    title: 'Robot Fun',
    subject: 'Technology',
    duration: '20 min',
    difficulty: 'Intermediate',
    content: {
      description: 'Learn how robots work and program simple commands.',
      objectives: [
        'Understand robot components',
        'Learn basic programming concepts',
        'Control a virtual robot'
      ],
      activities: [
        {
          name: 'Robot Parts',
          description: 'Identify different robot components'
        },
        {
          name: 'Command Sequences',
          description: 'Program a robot to complete a task'
        }
      ]
    }
  },
  {
    id: 'space-adventure',
    title: 'Space Adventure',
    subject: 'Science',
    duration: '25 min',
    difficulty: 'Advanced',
    content: {
      description: 'Explore the solar system and learn about planets, stars, and space travel.',
      objectives: [
        'Name the planets in our solar system',
        'Understand basic astronomy concepts',
        'Learn about space missions'
      ],
      activities: [
        {
          name: 'Planet Explorer',
          description: 'Interactive tour of the solar system'
        },
        {
          name: 'Space Quiz',
          description: 'Test your knowledge of space facts'
        }
      ]
    }
  }
];

/**
 * Mock chat messages for demo mode
 */
export const mockChatHistory = [
  {
    role: 'system',
    content: 'You are Sunny, a friendly AI tutor for children.'
  },
  {
    role: 'assistant',
    content: 'Hi there! I\'m Sunny! What would you like to learn about today?'
  },
  {
    role: 'user',
    content: 'I want to learn about robots!'
  },
  {
    role: 'assistant',
    content: 'Robots are amazing! They\'re machines that can be programmed to do all sorts of tasks. Some robots look like humans (we call those humanoid robots), while others might look like animals or just have arms to help in factories. What would you like to know about robots specifically?'
  }
];

/**
 * Mock topics for demo mode
 */
export const mockTopics = [
  { id: 'math', name: 'Math Help', icon: '123' },
  { id: 'ideas', name: 'Cool Ideas', icon: '💡' },
  { id: 'robots', name: 'Robots', icon: '🤖' },
  { id: 'space', name: 'Space', icon: '🚀' }
];

/**
 * Mock user profile for demo mode
 */
export const mockUserProfile = {
  id: 'demo-user',
  name: 'Demo Student',
  age: 10,
  grade: 5,
  learningInterests: ['Math', 'Science', 'Technology'],
  learningLevel: 'intermediate',
  completedLessons: ['math-basics', 'intro-to-science'],
  quizProgress: {
    'math-basics': { correct: 7, total: 10 },
    'intro-to-science': { correct: 5, total: 8 }
  },
  preferences: {
    language: 'en',
    theme: 'light',
    readingLevel: 'intermediate'
  }
};

/**
 * Generate realistic mock skills with varying mastery levels
 * Shows progression from beginner to mastered skills
 */
export function generateMockSkills() {
  const skillCategories = [
    { name: 'Addition', mastery: 95, confidence: 'high', attempts: 45, correct: 43 },
    { name: 'Subtraction', mastery: 88, confidence: 'high', attempts: 38, correct: 33 },
    { name: 'Multiplication', mastery: 72, confidence: 'medium', attempts: 32, correct: 23 },
    { name: 'Division', mastery: 58, confidence: 'medium', attempts: 25, correct: 14 },
    { name: 'Fractions', mastery: 45, confidence: 'low', attempts: 18, correct: 8 },
    { name: 'Decimals', mastery: 32, confidence: 'low', attempts: 12, correct: 4 },
    { name: 'Geometry Basics', mastery: 78, confidence: 'high', attempts: 28, correct: 22 },
    { name: 'Pattern Recognition', mastery: 92, confidence: 'high', attempts: 40, correct: 37 },
    { name: 'Word Problems', mastery: 65, confidence: 'medium', attempts: 30, correct: 19 },
    { name: 'Time & Measurement', mastery: 81, confidence: 'high', attempts: 35, correct: 28 },
    { name: 'Data & Graphs', mastery: 55, confidence: 'medium', attempts: 20, correct: 11 },
    { name: 'Logical Reasoning', mastery: 70, confidence: 'medium', attempts: 26, correct: 18 },
  ];

  return skillCategories.map((skill, index) => ({
    id: `skill-${index + 1}`,
    user_id: 'demo-user',
    skill_name: skill.name,
    mastery: skill.mastery,
    confidence: skill.confidence as 'low' | 'medium' | 'high',
    attempts: skill.attempts,
    correct_attempts: skill.correct,
    last_practiced: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
    updated_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(), // Last 3 days
    decay_rate: 0.02
  }));
}

/**
 * Generate realistic mock session history
 * Shows learning progression over the last 14 days
 */
export function generateMockSessions() {
  const sessions = [];
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Generate sessions for last 14 days with realistic progression
  for (let day = 13; day >= 0; day--) {
    const sessionsPerDay = Math.floor(Math.random() * 2) + 1; // 1-2 sessions per day

    for (let sessionNum = 0; sessionNum < sessionsPerDay; sessionNum++) {
      const sessionDate = new Date(now - day * oneDayMs - sessionNum * 4 * 60 * 60 * 1000);

      // Accuracy improves over time (from 50-60% early to 75-85% recent)
      const accuracyBase = 50 + (13 - day) * 2.5; // Gradual improvement
      const accuracy = Math.min(95, Math.max(45, accuracyBase + (Math.random() * 10 - 5)));

      // Questions attempted varies (5-15 per session)
      const questionsAttempted = Math.floor(Math.random() * 11) + 5;
      const questionsCorrect = Math.round(questionsAttempted * (accuracy / 100));

      // Duration varies (10-25 minutes)
      const duration = Math.floor(Math.random() * 16) + 10;

      // Mission types rotate
      const missionTypes = ['Math', 'Reading', 'Science', 'Creative', 'Problem Solving'];
      const missionType = missionTypes[Math.floor(Math.random() * missionTypes.length)];

      sessions.push({
        id: `session-${sessions.length + 1}`,
        user_id: 'demo-user',
        mission_type: missionType,
        duration_seconds: duration * 60,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        mastery_before: Math.max(0, accuracy - 10),
        mastery_after: accuracy,
        attention_quality: Math.min(1, Math.max(0.5, 0.7 + (Math.random() * 0.3))),
        status: 'completed' as const,
        started_at: sessionDate.toISOString(),
        completed_at: new Date(sessionDate.getTime() + duration * 60 * 1000).toISOString(),
        sunny_summary: `Great progress on ${missionType}! ${questionsCorrect}/${questionsAttempted} correct.`,
      });
    }
  }

  return sessions.reverse(); // Oldest first
}

/**
 * Get realistic demo XP that grows over time
 * Returns XP based on how long the demo has been "running"
 */
export function getDemoXP(): number {
  // Check localStorage for existing XP
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('demoXP');
    if (stored) {
      return parseInt(stored, 10);
    }

    // Initialize with realistic starting XP (200-400 range)
    const initialXP = Math.floor(Math.random() * 200) + 200;
    localStorage.setItem('demoXP', initialXP.toString());
    return initialXP;
  }

  // Fallback if no localStorage
  return 300;
}

/**
 * Award XP in demo mode (persists to localStorage)
 */
export function awardDemoXP(amount: number): void {
  if (typeof window !== 'undefined') {
    const current = getDemoXP();
    const newXP = current + amount;
    localStorage.setItem('demoXP', newXP.toString());
  }
}
