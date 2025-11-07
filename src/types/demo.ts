/**
 * TypeScript types for the demo experience
 */

export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard';

export type MathTopic = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type EnglishTopic = 'vocabulary' | 'grammar' | 'reading' | 'writing';
export type LogicTopic = 'patterns' | 'sequences' | 'logic' | 'programming';
export type LearningTopic = MathTopic | EnglishTopic | LogicTopic;

export type DemoStep = 'welcome' | 'check' | 'mission' | 'results' | 'playground' | 'waitlist';

export interface Question {
  id: string;
  text: string;
  answers: string[];
  correctIndex: number;
  difficulty: DifficultyLevel;
  topic: LearningTopic;
  voiceText?: string;
  hint?: string;
}

export interface Answer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  timeSpent: number; // milliseconds
  difficulty: DifficultyLevel;
  topic: LearningTopic;
}

export interface DemoState {
  step: DemoStep;
  level: DifficultyLevel;
  answers: Answer[];
  score: number;
  startTime: number;
  currentQuestionIndex: number;
  streak: number;
  consecutiveWrong: number;
}

export interface DemoInsights {
  strongAreas: string[];
  growingAreas: string[];
  nextTopics: string[];
  learningSpeed: 'slow' | 'medium' | 'fast';
  preferredStyle?: string;
  recommendedLevel: DifficultyLevel;
  accuracy: number;
  totalTime: number;
}

export interface DemoResults {
  score: number;
  total: number;
  accuracy: number;
  timeSpent: number;
  level: DifficultyLevel;
  insights: DemoInsights;
  answers: Answer[];
}

// Gamification types
export type BadgeType = 
  | 'first_correct'
  | 'streak_3'
  | 'streak_5'
  | 'perfect_mission'
  | 'speed_demon'
  | 'persistent'
  | 'math_master'
  | 'world_explorer';

export type WorldType = 'math_galaxy' | 'robot_city' | 'space_quest' | 'ocean_deep';

export interface Badge {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: number;
}

export interface World {
  id: WorldType;
  name: string;
  description: string;
  icon: string;
  requiredXP: number;
  unlocked: boolean;
  color: string;
}

export interface GameProgress {
  xp: number;
  level: number;
  badges: Badge[];
  unlockedWorlds: WorldType[];
  currentWorld: WorldType;
}
