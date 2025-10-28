// Sunny Focus Sessions - Type Definitions
// 20-minute adaptive learning sessions with concept extraction and practice artifacts

import { DifficultyLevel, LearningStyle } from './chat';
import { GameType } from './game';

// ============================================================================
// Session Management
// ============================================================================

export interface FocusSession {
  id: string;
  studentId: string;
  topic: string;
  startTime: number;
  endTime?: number;
  duration: number; // target duration in seconds (default: 1200 = 20 min)
  status: 'planning' | 'active' | 'completed' | 'cancelled';

  // Session configuration
  initialDifficulty: DifficultyLevel;
  currentDifficulty: DifficultyLevel;
  targetAccuracy: number; // 0-1

  // Content tracking
  conceptMap: ConceptMap;
  artifacts: SessionArtifact[];
  currentArtifact?: SessionArtifact;

  // Performance tracking
  loops: SessionLoop[];
  overallPerformance?: SessionPerformance;

  // Next steps
  reviewPlan?: ReviewPlan;
}

export interface SessionLoop {
  loopNumber: number;
  startTime: number;
  endTime?: number;
  artifact: SessionArtifact;
  results: ArtifactResult[];
  performance: LoopPerformance;
  difficultyAdjustment?: DifficultyAdjustment;
}

export interface SessionArtifact {
  id: string;
  type: ArtifactType;
  difficulty: DifficultyLevel;
  data: FlashcardSet | Quiz | MicroGameSpec;
  generatedAt: number;
  targetSubtopics: string[];
}

export type ArtifactType = 'flashcards' | 'quiz' | 'micro_game';

// ============================================================================
// Concept Mapping
// ============================================================================

export interface ConceptMap {
  topic: string;
  subtopics: Subtopic[];
  misconceptions: string[];
  examples: string[];
  learningGoals: string[];
  extractedAt: number;
  lastUpdated: number;
}

export interface Subtopic {
  name: string;
  description?: string;
  prerequisites: string[];
  status: 'new' | 'learning' | 'ok' | 'weak' | 'mastered';
  masteryLevel: number; // 0-1
  interactions: number; // times practiced
  lastPracticed?: number;
}

// ============================================================================
// Artifacts - Flashcards
// ============================================================================

export interface FlashcardSet {
  cards: Flashcard[];
  spacedRepetition: SpacedRepetitionConfig;
  totalCards: number;
  estimatedTime: number; // seconds
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: DifficultyLevel;
  imageUrl?: string;

  // Spaced repetition data
  easeFactor: number; // 1.3 - 2.5
  interval: number; // days until next review
  nextReviewDate?: number;
  timesReviewed: number;
  timesCorrect: number;
}

export interface SpacedRepetitionConfig {
  initialInterval: number; // days
  easeFactorMin: number;
  easeFactorMax: number;
  intervalMultiplier: number;
}

export interface FlashcardResult {
  cardId: string;
  recalled: boolean;
  confidence: 'hard' | 'good' | 'easy';
  timeSpent: number; // seconds
  timestamp: number;
}

// ============================================================================
// Artifacts - Quiz
// ============================================================================

export interface Quiz {
  id: string;
  title: string;
  description: string;
  items: QuizItem[];
  scoring: QuizScoring;
  timeLimit?: number; // seconds per question or total
  passingScore: number; // 0-1
}

export interface QuizItem {
  id: string;
  type: 'mcq' | 'short_answer' | 'true_false' | 'multiple_select';
  question: string;

  // For MCQ/multiple select
  choices?: string[];

  // Answer
  answer: string | string[];

  // Explanation and hints
  explanation: string;
  hints?: string[];

  // Metadata
  tags: string[];
  difficulty: DifficultyLevel;
  concept: string;
  points: number;
}

export interface QuizScoring {
  totalPoints: number;
  pointsPerCorrect: number;
  pointsPerIncorrect: number;
  passingThreshold: number; // 0-1
  partialCredit: boolean;
}

export interface QuizResult {
  questionId: string;
  studentAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  partialCredit?: number; // 0-1
  pointsEarned: number;
  timeSpent: number;
  hintsUsed: number;
  attempts: number;
  timestamp: number;
}

// ============================================================================
// Artifacts - Micro Games
// ============================================================================

export interface MicroGameSpec {
  id: string;
  gameType: GameType;
  engine: 'react-dom' | 'phaser' | 'canvas';

  // Game configuration
  gameplayLoop: string;
  rounds: number; // reduced from regular games (e.g., 3 vs 10)
  timePerRound: number; // seconds

  // Content
  questions: MicroGameQuestion[];

  // Assets and UI
  assets: GameAsset[];
  theme: GameTheme;

  // Learning integration
  learningHooks: LearningHook[];
  targetConcepts: string[];

  // Difficulty params
  difficulty: DifficultyLevel;
  params: Record<string, any>;
}

export interface MicroGameQuestion {
  id: string;
  prompt: string;
  correctResponse: string | string[];
  distractors?: string[];
  hint?: string;
  concept: string;
  visualAid?: string;
}

export interface GameAsset {
  type: 'image' | 'audio' | 'emoji' | 'icon';
  url: string;
  alt?: string;
}

export interface GameTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  animations: boolean;
  sounds: boolean;
}

export interface LearningHook {
  trigger: 'onSuccess' | 'onFailure' | 'onStreak' | 'onComplete';
  action: 'advanceDifficulty' | 'reduceDifficulty' | 'giveHint' | 'celebrate';
  threshold?: number;
}

export interface MicroGameResult {
  questionId: string;
  roundNumber: number;
  isCorrect: boolean;
  responseTime: number;
  hintsUsed: number;
  timestamp: number;
}

// ============================================================================
// Performance Tracking
// ============================================================================

export interface ArtifactResult {
  artifactId: string;
  artifactType: ArtifactType;
  results: FlashcardResult[] | QuizResult[] | MicroGameResult[];
  startTime: number;
  endTime: number;
  completed: boolean;
}

export interface LoopPerformance {
  loopNumber: number;
  accuracy: number; // 0-1
  speed: number; // items per minute
  timeSpent: number; // seconds
  itemsCompleted: number;
  itemsTotal: number;
  hintsUsed: number;

  // Engagement indicators
  attentionScore: number; // 0-1
  frustrationLevel: number; // 0-1
  engagementLevel: number; // 0-1

  // Learning progress
  conceptsIntroduced: string[];
  conceptsPracticed: string[];
  conceptsImproved: string[];
  weakAreas: string[];
}

export interface SessionPerformance {
  sessionId: string;
  studentId: string;
  topic: string;

  // Overall metrics
  totalTime: number; // seconds
  loopsCompleted: number;
  averageAccuracy: number;
  improvementRate: number; // change in accuracy over loops

  // Artifact breakdown
  flashcardsCompleted: number;
  quizzesCompleted: number;
  gamesCompleted: number;

  // Concept mastery
  conceptsCovered: string[];
  conceptsMastered: string[];
  conceptsNeedingReview: string[];
  masteryMap: Record<string, number>; // concept -> mastery level (0-1)

  // Difficulty progression
  startDifficulty: DifficultyLevel;
  endDifficulty: DifficultyLevel;
  difficultyChanges: number;

  // Engagement
  averageEngagement: number;
  peakEngagement: number;
  frustratedMoments: number;

  // Recommendations
  suggestedNextTopic: string;
  suggestedNextDifficulty: DifficultyLevel;
  teachingStrategy: 'reinforce' | 'advance' | 'remediate' | 'diversify';

  timestamp: number;
}

export interface DifficultyAdjustment {
  timestamp: number;
  fromDifficulty: DifficultyLevel;
  toDifficulty: DifficultyLevel;
  reason: string;
  triggerMetric: 'accuracy' | 'frustration' | 'speed' | 'engagement';
  triggerValue: number;
}

// ============================================================================
// Review & Planning
// ============================================================================

export interface ReviewPlan {
  nextFocusMinutes: number;
  nextGoals: string[];
  recommendedModality: ArtifactType;
  targetDifficulty: DifficultyLevel;
  targetSubtopics: string[];
  reviewSubtopics: string[]; // need more practice
  newSubtopics: string[]; // ready to introduce

  reasoning: string; // short rationale
  estimatedMasteryGain: number; // 0-1 expected improvement

  spacedRepetitionDue: Flashcard[]; // cards due for review
}

// ============================================================================
// Session Summary & Memory
// ============================================================================

export interface SessionSummary {
  id: string;
  sessionId: string;
  studentId: string;
  topic: string;
  timestamp: number;
  duration: number;

  // Condensed performance (≤200 tokens when stringified)
  accuracy: number;
  loopsCompleted: number;
  conceptsCovered: string[];
  conceptsMastered: string[];
  weakAreas: string[];

  // Narrative summary (AI-generated)
  summary: string; // ≤150 tokens

  // Key insights
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];

  // Metadata
  artifactTypes: ArtifactType[];
  difficultyProgression: DifficultyLevel[];
}

export interface ConceptMemory {
  concept: string;
  description: string;
  firstEncountered: number;
  lastPracticed: number;
  timesEncountered: number;

  // Performance
  currentMastery: number; // 0-1
  peakMastery: number;
  masteryTrend: 'improving' | 'stable' | 'declining';

  // Related concepts
  prerequisites: string[];
  relatedConcepts: string[];
  buildsConcepts: string[];

  // Evidence
  evidencePoints: EvidencePoint[];

  // Spaced repetition
  nextReviewDate: number;
  reviewInterval: number; // days
}

export interface EvidencePoint {
  timestamp: number;
  type: 'quiz' | 'flashcard' | 'game' | 'conversation';
  result: 'success' | 'partial' | 'failure';
  context: string;
  weight: number; // 0-1 importance
}

// ============================================================================
// Requests & Configuration
// ============================================================================

export interface FocusSessionRequest {
  studentId: string;
  topic: string;
  targetDuration: number; // seconds (default 1200)
  inputContext?: string; // recent chat messages, notes, etc.
  initialDifficulty?: DifficultyLevel;
  preferredArtifact?: ArtifactType;
  learningGoals?: string[];
}

export interface ArtifactRequest {
  modality: ArtifactType;
  targetSubtopics: string[];
  difficulty: DifficultyLevel;
  constraints: ArtifactConstraints;
  conceptMap: ConceptMap;
  previousPerformance?: LoopPerformance;
}

export interface ArtifactConstraints {
  timeLimitSeconds: number;
  maxItems: number;
  minItems?: number;
  includeHints: boolean;
  includeExplanations: boolean;
  visualAids: boolean;
}

// ============================================================================
// Events
// ============================================================================

export type FocusSessionEvent =
  | { type: 'session:started'; session: FocusSession }
  | { type: 'session:loop:started'; loop: SessionLoop }
  | { type: 'session:loop:completed'; loop: SessionLoop; performance: LoopPerformance }
  | { type: 'session:artifact:generated'; artifact: SessionArtifact }
  | { type: 'session:difficulty:adjusted'; adjustment: DifficultyAdjustment }
  | { type: 'session:concept:mastered'; concept: string; masteryLevel: number }
  | { type: 'session:completed'; session: FocusSession; performance: SessionPerformance }
  | { type: 'session:cancelled'; sessionId: string; reason: string };

// ============================================================================
// Utility Types
// ============================================================================

export interface SessionConfig {
  defaultDuration: number; // 1200 seconds (20 min)
  loopDuration: number; // 300-420 seconds (5-7 min)
  minLoops: number; // 3
  maxLoops: number; // 4

  // Difficulty thresholds
  difficultyUpThreshold: number; // 0.8 accuracy
  difficultyDownThreshold: number; // 0.5 accuracy
  frustrationThreshold: number; // 0.6

  // Artifact constraints
  flashcardSetSize: number; // 8-12 cards
  quizItemCount: number; // 6-10 items
  microGameRounds: number; // 3 rounds

  // Timing
  artifactTimeLimit: number; // 300 seconds (5 min)
  reviewPlanningTime: number; // 180 seconds (3 min)
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  defaultDuration: 1200,
  loopDuration: 360,
  minLoops: 3,
  maxLoops: 4,

  difficultyUpThreshold: 0.8,
  difficultyDownThreshold: 0.5,
  frustrationThreshold: 0.6,

  flashcardSetSize: 10,
  quizItemCount: 8,
  microGameRounds: 3,

  artifactTimeLimit: 300,
  reviewPlanningTime: 180,
};
