/**
 * TypeScript types for the demo experience
 */

export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard';

export type MathTopic = 'addition' | 'subtraction' | 'multiplication' | 'division';

export type DemoStep = 'welcome' | 'check' | 'mission' | 'results' | 'waitlist';

export interface Question {
  id: string;
  text: string;
  answers: string[];
  correctIndex: number;
  difficulty: DifficultyLevel;
  topic: MathTopic;
  voiceText?: string;
  hint?: string;
}

export interface Answer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  timeSpent: number; // milliseconds
  difficulty: DifficultyLevel;
  topic: MathTopic;
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
