// Game system types for Sunny AI

export type GameType = 
  | 'pattern-recognition'
  | 'math-challenge'
  | 'memory-match'
  | 'word-builder'
  | 'science-experiment'
  | 'creative-challenge';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export type PerformanceLevel = 'struggling' | 'learning' | 'proficient' | 'mastering';

export interface GameConfig {
  id: string;
  type: GameType;
  difficulty: DifficultyLevel;
  topic: string;
  timeLimit?: number; // seconds
  targetAccuracy: number; // 0-1
  hintsAvailable: number;
  adaptiveScaling: boolean;
}

export interface GameState {
  gameId: string;
  startTime: number;
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  timeElapsed: number;
  isComplete: boolean;
  currentStreak: number;
  longestStreak: number;
}

export interface GamePerformance {
  gameId: string;
  studentId: string;
  gameType: GameType;
  difficulty: DifficultyLevel;
  topic: string;
  
  // Performance metrics
  accuracy: number; // 0-1
  speed: number; // questions per minute
  efficiency: number; // correct answers / total time
  completionRate: number; // 0-1
  
  // Engagement metrics
  attentionScore: number; // 0-1
  persistenceScore: number; // 0-1
  frustrationLevel: number; // 0-1
  
  // Learning indicators
  improvementRate: number; // change in accuracy over time
  conceptMastery: Record<string, number>; // concept -> mastery level
  knowledgeGaps: string[]; // concepts that need work
  
  // Recommendations
  suggestedDifficulty: DifficultyLevel;
  suggestedNextGame: GameType;
  teachingStrategy: 'reinforce' | 'advance' | 'remediate' | 'diversify';
  
  timestamp: number;
}

export interface GameQuestion {
  id: string;
  type: GameType;
  difficulty: DifficultyLevel;
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  concept: string; // what concept this tests
  visualAid?: string; // image URL or component
  timeLimit?: number;
}

export interface GameResult {
  questionId: string;
  studentAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number; // seconds
  hintsUsed: number;
  attempts: number;
  confidence?: number; // student's self-reported confidence
}

export interface AdaptiveGameSession {
  sessionId: string;
  studentId: string;
  startTime: number;
  endTime?: number;
  
  games: GameState[];
  results: GameResult[];
  performance: GamePerformance[];
  
  // Adaptive tracking
  initialDifficulty: DifficultyLevel;
  currentDifficulty: DifficultyLevel;
  difficultyAdjustments: Array<{
    timestamp: number;
    from: DifficultyLevel;
    to: DifficultyLevel;
    reason: string;
  }>;
  
  // Learning trajectory
  conceptsIntroduced: string[];
  conceptsMastered: string[];
  conceptsNeedingReview: string[];
  
  // Agent recommendations
  agentInsights: Array<{
    timestamp: number;
    agent: string;
    insight: string;
    action: string;
  }>;
}

export interface GameGenerationRequest {
  studentId: string;
  topic: string;
  difficulty: DifficultyLevel;
  gameType?: GameType; // if not specified, agent chooses
  previousPerformance?: GamePerformance;
  learningObjectives: string[];
  timeAvailable?: number; // minutes
}

export interface GameFeedback {
  type: 'encouragement' | 'correction' | 'hint' | 'celebration' | 'guidance';
  message: string;
  tone: 'supportive' | 'enthusiastic' | 'gentle' | 'excited';
  includeExplanation: boolean;
  suggestNextStep?: string;
  visualElement?: 'confetti' | 'star' | 'trophy' | 'thinking';
}
