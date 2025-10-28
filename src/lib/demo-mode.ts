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
