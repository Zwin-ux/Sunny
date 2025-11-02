/**
 * Enhanced Quiz System Types
 * Supports multiple question types and pedagogical metadata
 */

// Bloom's Taxonomy cognitive levels
export type BloomsLevel = 
  | 'remember'    // Recall facts and basic concepts
  | 'understand'  // Explain ideas or concepts
  | 'apply'       // Use information in new situations
  | 'analyze'     // Draw connections among ideas
  | 'evaluate'    // Justify a decision or course of action
  | 'create';     // Produce new or original work

// Enhanced question types
export type EnhancedQuestionType = 
  | 'multiple-choice'
  | 'multiple-select'      // Select all that apply
  | 'fill-in-blank'        // Complete the sentence
  | 'true-false'           // True or false
  | 'true-false-explain'   // T/F with justification
  | 'number-input'         // Type a number
  | 'short-answer'         // Brief text response
  | 'explain-thinking'     // Open-ended with rubric
  | 'matching'             // Match pairs
  | 'ordering'             // Put in correct order
  | 'drag-and-drop';       // FUTURE: Interactive drag-drop

// Cognitive load levels
export type CognitiveLoad = 'low' | 'medium' | 'high';

// Difficulty levels (aligned with existing system)
export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'advanced';

// Hint types
export interface Hint {
  id: string;
  level: 1 | 2 | 3; // Progressive disclosure
  text: string;
  type: 'nudge' | 'guidance' | 'reveal'; // How much to give away
}

// Worked example for scaffolding
export interface WorkedExample {
  problem: string;
  steps: {
    step: number;
    action: string;
    explanation: string;
    visual?: string; // Optional image/diagram URL
  }[];
  solution: string;
  reasoning: string;
}

// Visual aid for learning
export interface VisualAid {
  type: 'diagram' | 'chart' | 'image' | 'animation';
  url: string;
  caption: string;
  altText: string;
}

// Common misconceptions to address
export interface Misconception {
  id: string;
  misconception: string;
  correctConcept: string;
  explanation: string;
  commonWhen: string; // When students typically have this misconception
}

// Scaffolding support
export interface Scaffolding {
  hints: Hint[];
  workedExample?: WorkedExample;
  visualAid?: VisualAid;
  prerequisiteKnowledge?: string[];
}

// Assessment rubric for open-ended questions
export interface AssessmentRubric {
  criteria: {
    name: string;
    description: string;
    points: number;
  }[];
  totalPoints: number;
  passingScore: number;
}

// Question content by type
export interface MultipleChoiceContent {
  question: string;
  options: string[];
  correctIndex: number;
  distractors?: string[]; // Why wrong answers are tempting
}

export interface MultipleSelectContent {
  question: string;
  options: string[];
  correctIndices: number[];
  minSelect?: number;
  maxSelect?: number;
}

export interface FillInBlankContent {
  text: string; // Use ___ for blanks
  blanks: {
    position: number;
    correctAnswers: string[]; // Multiple acceptable answers
    caseSensitive?: boolean;
  }[];
}

export interface TrueFalseContent {
  statement: string;
  correct: boolean;
  explanation: string;
}

export interface TrueFalseExplainContent extends TrueFalseContent {
  requireExplanation: boolean;
  explanationPrompt: string;
}

export interface NumberInputContent {
  question: string;
  correctAnswer: number;
  tolerance?: number; // Allow range (e.g., 0.1 for rounding)
  unit?: string;
  min?: number;
  max?: number;
}

export interface ShortAnswerContent {
  question: string;
  acceptableAnswers: string[];
  keywords?: string[]; // Keywords that should appear
  minWords?: number;
  maxWords?: number;
}

export interface ExplainThinkingContent {
  question: string;
  rubric: AssessmentRubric;
  exampleAnswer?: string;
  thinkingPrompts?: string[]; // Guide their thinking
}

export interface MatchingContent {
  instructions: string;
  pairs: {
    left: string;
    right: string;
    id: string;
  }[];
  shuffle?: boolean;
}

export interface OrderingContent {
  instructions: string;
  items: string[];
  correctOrder: number[]; // Indices in correct order
}

// Union type for all content types
export type QuestionContent = 
  | MultipleChoiceContent
  | MultipleSelectContent
  | FillInBlankContent
  | TrueFalseContent
  | TrueFalseExplainContent
  | NumberInputContent
  | ShortAnswerContent
  | ExplainThinkingContent
  | MatchingContent
  | OrderingContent;

// Main adaptive question interface
export interface AdaptiveQuestion {
  id: string;
  type: EnhancedQuestionType;
  content: QuestionContent;
  
  // Pedagogical metadata
  topic: string;
  subtopic?: string;
  bloomsLevel: BloomsLevel;
  cognitiveLoad: CognitiveLoad;
  difficulty: DifficultyLevel;
  
  // Prerequisites and dependencies
  prerequisiteKnowledge: string[];
  relatedConcepts?: string[];
  
  // Scaffolding
  scaffolding: Scaffolding;
  
  // Assessment
  rubric?: AssessmentRubric;
  commonMisconceptions?: Misconception[];
  
  // Metadata
  estimatedTime: number; // seconds
  points: number;
  tags?: string[];
  
  // Tracking
  timesAsked?: number;
  averageCorrect?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Student answer
export interface StudentAnswer {
  questionId: string;
  answer: string | number | string[] | number[] | boolean;
  timeSpent: number; // milliseconds
  hintsUsed: number;
  confidence?: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Answer evaluation result
export interface AnswerEvaluation {
  correct: boolean;
  partialCredit?: number; // 0-1 for partial correctness
  feedback: string;
  explanation: string;
  misconceptionDetected?: Misconception;
  nextSteps: string[];
  encouragement: string;
}

// Student performance state
export interface StudentPerformanceState {
  userId: string;
  topic: string;
  
  // Recent performance
  recentAnswers: StudentAnswer[];
  currentStreak: number;
  longestStreak: number;
  
  // Skill level
  currentDifficulty: DifficultyLevel;
  masteryLevel: number; // 0-100
  
  // Learning patterns
  averageTimePerQuestion: number;
  accuracyRate: number;
  hintsUsageRate: number;
  
  // Adaptive metrics
  optimalDifficulty: DifficultyLevel; // ZPD target
  strugglingIndicators: string[];
  strengthAreas: string[];
}

// Quiz session
export interface QuizSession {
  id: string;
  userId: string;
  topic: string;
  startedAt: Date;
  completedAt?: Date;
  
  questions: AdaptiveQuestion[];
  answers: StudentAnswer[];
  
  // Session metrics
  totalQuestions: number;
  questionsCompleted: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  
  // Adaptive behavior
  difficultyAdjustments: {
    questionNumber: number;
    from: DifficultyLevel;
    to: DifficultyLevel;
    reason: string;
  }[];
  
  // Learning outcomes
  conceptsMastered: string[];
  conceptsToReview: string[];
  recommendedNextTopics: string[];
}

// Zone of Proximal Development calculation
export interface ZPDAnalysis {
  currentLevel: DifficultyLevel;
  optimalLevel: DifficultyLevel;
  confidence: number; // 0-1
  reasoning: string;
  adjustmentNeeded: boolean;
}

// Question selection criteria
export interface QuestionSelectionCriteria {
  topic: string;
  bloomsLevel?: BloomsLevel;
  difficulty?: DifficultyLevel;
  excludeQuestionIds?: string[];
  targetGaps?: string[]; // Knowledge gaps to address
  maxCognitiveLoad?: CognitiveLoad;
}

// Spaced repetition card (for future Phase 2)
export interface SpacedRepetitionCard {
  questionId: string;
  userId: string;
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  lastReviewed?: Date;
}
