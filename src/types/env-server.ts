/**
 * Environmental Server (Env Server) Type Definitions
 *
 * This system creates dynamic, contained learning environments (stages)
 * where children interact with emotional learning lessons through gameplay.
 */

// ============================================================================
// Core Stage Types
// ============================================================================

/**
 * Available stage themes for emotional learning
 */
export type StageTheme =
  | 'cloud-garden'      // Anxiety - thought sorting
  | 'confidence-tower'  // Self-worth - challenge climbing
  | 'focus-forest'      // ADHD - rhythm collection
  | 'echo-bridge'       // Grief - memory building
  | 'kindness-village'; // Empathy - community care

/**
 * Game mechanic types for stages
 */
export type GameMechanic =
  | 'sorting'           // Drag and drop sorting
  | 'climbing'          // Progressive level climbing
  | 'rhythm'            // Timed collection
  | 'building'          // Construction/repair
  | 'trading';          // Exchange and reciprocity

/**
 * Emotional learning focus for each stage
 */
export type EmotionalFocus =
  | 'anxiety'
  | 'self-worth'
  | 'focus'
  | 'grief'
  | 'empathy'
  | 'anger'
  | 'resilience';

/**
 * A complete stage definition
 */
export interface StageDefinition {
  id: string;
  theme: StageTheme;
  name: string;
  description: string;
  emotionalFocus: EmotionalFocus;
  gameMechanic: GameMechanic;

  // Visual configuration
  visual: {
    backgroundImage?: string;
    backgroundColor: string;
    musicTrack?: string;
    mascotPosition: 'left' | 'right' | 'center';
  };

  // Lesson configuration
  lessonPlan: LessonPlan;

  // Difficulty and age
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedAge: [number, number]; // [min, max]
  estimatedDuration: number; // minutes

  // Metadata
  tags: string[];
  learningOutcomes: string[];
}

// ============================================================================
// Lesson Engine Types
// ============================================================================

/**
 * Lesson state types - each lesson progresses through states
 */
export type LessonStateType =
  | 'intro'        // Introduction to the lesson
  | 'instruction'  // Instructions for the activity
  | 'activity'     // Interactive gameplay
  | 'reflection'   // AI-guided reflection
  | 'reward'       // Completion and reward
  | 'transition';  // Moving to next state

/**
 * Task types within a lesson
 */
export type TaskType =
  | 'sorting'
  | 'matching'
  | 'collection'
  | 'building'
  | 'dialogue'
  | 'multiple-choice';

/**
 * A single lesson state
 */
export interface LessonState {
  id: string;
  type: LessonStateType;
  name: string;

  // Content
  dialogue?: DialogueContent[];
  task?: TaskDefinition;

  // Progression
  duration?: number; // seconds, optional time limit
  completionCriteria?: CompletionCriteria;
  nextState?: string; // null = end of lesson

  // Visual effects
  effects?: VisualEffect[];
}

/**
 * Dialogue content from Sunny or NPCs
 */
export interface DialogueContent {
  speaker: 'sunny' | 'npc' | 'narrator';
  speakerName?: string;
  text: string;
  emotion?: 'happy' | 'encouraging' | 'thoughtful' | 'excited';
  pauseAfter?: number; // milliseconds
  options?: DialogueOption[];
}

/**
 * Dialogue response options
 */
export interface DialogueOption {
  text: string;
  value: string;
  nextDialogue?: string;
}

/**
 * Task definition for activities
 */
export interface TaskDefinition {
  type: TaskType;
  instructions: string;

  // Task-specific data
  items?: TaskItem[];
  targets?: TaskTarget[];

  // Scoring
  pointsPerCorrect?: number;
  pointsPerIncorrect?: number;

  // Hints
  hintsAvailable?: number;
  hintText?: string[];
}

/**
 * An item that can be interacted with in a task
 */
export interface TaskItem {
  id: string;
  type: string;
  content: string;
  correctTarget?: string; // ID of correct target
  metadata?: Record<string, any>;
}

/**
 * A target where items can be placed
 */
export interface TaskTarget {
  id: string;
  label: string;
  acceptsTypes?: string[];
  capacity?: number; // max items
  visual?: {
    icon?: string;
    color?: string;
  };
}

/**
 * Criteria for completing a state
 */
export interface CompletionCriteria {
  type: 'all-correct' | 'threshold' | 'time-elapsed' | 'manual';
  threshold?: number; // for threshold type (e.g., 80% correct)
  timeSeconds?: number; // for time-elapsed type
}

/**
 * Visual effect to apply during a state
 */
export interface VisualEffect {
  type: 'fade-in' | 'fade-out' | 'brighten' | 'particle' | 'shake' | 'grow';
  target: 'background' | 'character' | 'all';
  duration: number; // milliseconds
}

/**
 * Complete lesson plan
 */
export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  states: LessonState[];

  // AI reflection questions
  reflectionQuestions: ReflectionQuestion[];

  // Rewards
  rewards: LessonReward[];
}

/**
 * Reflection question for AI dialogue
 */
export interface ReflectionQuestion {
  id: string;
  question: string;
  purpose: string; // What this question aims to uncover
  followUps?: string[]; // Possible follow-up questions
}

/**
 * Reward given upon completion
 */
export interface LessonReward {
  type: 'badge' | 'points' | 'unlock';
  name: string;
  description: string;
  icon?: string;
  value?: number;
}

// ============================================================================
// Player State Types
// ============================================================================

/**
 * Player state within a stage
 */
export interface PlayerState {
  playerId: string;
  stageId: string;
  sessionId: string;

  // Current progress
  currentStateId: string;
  stateHistory: string[];

  // Performance tracking
  score: number;
  hintsUsed: number;
  timeElapsed: number; // seconds

  // Task results
  taskResults: TaskResult[];

  // Reflection responses
  reflectionResponses: ReflectionResponse[];

  // Emotional metrics
  emotionalMetrics: EmotionalMetrics;

  // Timestamps
  startedAt: number;
  lastActivityAt: number;
  completedAt?: number;
}

/**
 * Result of a single task
 */
export interface TaskResult {
  taskId: string;
  taskType: TaskType;
  startTime: number;
  endTime: number;

  // Performance
  correct: number;
  incorrect: number;
  accuracy: number;

  // Details
  itemResults: ItemResult[];
  hintsUsed: number;
}

/**
 * Result of a single item interaction
 */
export interface ItemResult {
  itemId: string;
  action: 'placed' | 'removed' | 'selected';
  targetId?: string;
  correct: boolean;
  timestamp: number;
  timeToComplete: number; // milliseconds
}

/**
 * Reflection response from player
 */
export interface ReflectionResponse {
  questionId: string;
  question: string;
  response: string;
  timestamp: number;
  aiFollowUp?: string;
}

/**
 * Emotional metrics tracked during session
 */
export interface EmotionalMetrics {
  engagementLevel: number; // 0-1
  frustrationLevel: number; // 0-1
  confidenceLevel: number; // 0-1

  // Behavioral indicators
  pauseCount: number;
  restartCount: number;
  hintRequestCount: number;

  // Progress indicators
  persistenceScore: number; // 0-1
  improvementRate: number; // change in accuracy over time
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * A complete stage session
 */
export interface StageSession {
  id: string;
  playerId: string;
  stageId: string;
  stage: StageDefinition;

  // State
  playerState: PlayerState;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';

  // Timing
  startedAt?: number;
  completedAt?: number;
  totalDuration?: number; // seconds

  // Rewards earned
  rewardsEarned: LessonReward[];
}

/**
 * Summary of a completed session
 */
export interface SessionSummary {
  sessionId: string;
  stageTheme: StageTheme;
  stageName: string;

  // Performance
  score: number;
  accuracy: number;
  timeElapsed: number;

  // Learning outcomes
  outcomesAchieved: string[];
  conceptsMastered: string[];
  areasForGrowth: string[];

  // Emotional insights
  emotionalGrowth: {
    focus: EmotionalFocus;
    beforeLevel: number; // 0-1
    afterLevel: number; // 0-1
    keyInsights: string[];
  };

  // Recommendations
  nextStageRecommendation?: StageTheme;
  teacherNotes?: string;

  // Timestamps
  completedAt: number;
}

// ============================================================================
// Stage Manager Types
// ============================================================================

/**
 * Configuration for stage manager
 */
export interface StageManagerConfig {
  demoMode: boolean;
  enableAI: boolean;
  autoSave: boolean;
  maxSessionDuration: number; // minutes
}

/**
 * Event types emitted by stage manager
 */
export type StageEventType =
  | 'session:started'
  | 'session:state-changed'
  | 'session:task-completed'
  | 'session:reflection-recorded'
  | 'session:completed'
  | 'session:abandoned'
  | 'player:hint-used'
  | 'player:achievement-unlocked';

/**
 * Stage event payload
 */
export interface StageEvent {
  type: StageEventType;
  sessionId: string;
  timestamp: number;
  data: any;
}

// ============================================================================
// Constants
// ============================================================================

export const STAGE_CONFIG = {
  DEFAULT_SESSION_DURATION: 15, // minutes
  MAX_HINTS_PER_TASK: 3,
  AUTO_SAVE_INTERVAL: 30, // seconds
  ENGAGEMENT_CHECK_INTERVAL: 60, // seconds

  // Thresholds
  HIGH_ACCURACY_THRESHOLD: 0.8,
  LOW_ACCURACY_THRESHOLD: 0.5,
  HIGH_FRUSTRATION_THRESHOLD: 0.7,
  LOW_ENGAGEMENT_THRESHOLD: 0.4,
} as const;

export const EMOTIONAL_LEVEL_LABELS = {
  0: 'Just Starting',
  0.25: 'Developing',
  0.5: 'Growing',
  0.75: 'Strong',
  1.0: 'Thriving',
} as const;
