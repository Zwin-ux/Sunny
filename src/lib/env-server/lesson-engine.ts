/**
 * Lesson Engine
 *
 * Manages progression through lesson states, evaluates completion criteria,
 * and handles transitions between states.
 */

import type {
  LessonPlan,
  LessonState,
  LessonStateType,
  CompletionCriteria,
  TaskResult,
  PlayerState,
  ItemResult,
} from '@/types/env-server';

export class LessonEngine {
  private lessonPlan: LessonPlan;
  private currentStateIndex: number = 0;
  private stateStartTime: number = 0;

  constructor(lessonPlan: LessonPlan) {
    this.lessonPlan = lessonPlan;
  }

  /**
   * Get the current lesson state
   */
  getCurrentState(): LessonState | null {
    return this.lessonPlan.states[this.currentStateIndex] || null;
  }

  /**
   * Get state by ID
   */
  getStateById(stateId: string): LessonState | null {
    return this.lessonPlan.states.find((s) => s.id === stateId) || null;
  }

  /**
   * Start the lesson
   */
  start(): LessonState {
    this.currentStateIndex = 0;
    this.stateStartTime = Date.now();
    return this.getCurrentState()!;
  }

  /**
   * Advance to the next state
   */
  nextState(): LessonState | null {
    const currentState = this.getCurrentState();
    if (!currentState) return null;

    // If nextState is explicitly defined, find it
    if (currentState.nextState) {
      const nextIndex = this.lessonPlan.states.findIndex(
        (s) => s.id === currentState.nextState
      );
      if (nextIndex !== -1) {
        this.currentStateIndex = nextIndex;
        this.stateStartTime = Date.now();
        return this.getCurrentState();
      }
    }

    // Otherwise, advance to next in sequence
    if (this.currentStateIndex < this.lessonPlan.states.length - 1) {
      this.currentStateIndex++;
      this.stateStartTime = Date.now();
      return this.getCurrentState();
    }

    // End of lesson
    return null;
  }

  /**
   * Go to a specific state by ID
   */
  goToState(stateId: string): LessonState | null {
    const index = this.lessonPlan.states.findIndex((s) => s.id === stateId);
    if (index !== -1) {
      this.currentStateIndex = index;
      this.stateStartTime = Date.now();
      return this.getCurrentState();
    }
    return null;
  }

  /**
   * Check if the current state is complete
   */
  isStateComplete(
    criteria: CompletionCriteria,
    taskResult?: TaskResult,
    elapsedSeconds?: number
  ): boolean {
    switch (criteria.type) {
      case 'all-correct':
        return taskResult ? taskResult.incorrect === 0 : false;

      case 'threshold':
        if (!taskResult || !criteria.threshold) return false;
        return taskResult.accuracy >= criteria.threshold;

      case 'time-elapsed':
        if (!criteria.timeSeconds) return false;
        const elapsed = elapsedSeconds ?? this.getStateElapsedSeconds();
        return elapsed >= criteria.timeSeconds;

      case 'manual':
        // Requires explicit completion call
        return false;

      default:
        return false;
    }
  }

  /**
   * Get elapsed time in current state
   */
  getStateElapsedSeconds(): number {
    return Math.floor((Date.now() - this.stateStartTime) / 1000);
  }

  /**
   * Check if lesson is complete
   */
  isLessonComplete(): boolean {
    return this.currentStateIndex >= this.lessonPlan.states.length - 1;
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return Math.floor(
      ((this.currentStateIndex + 1) / this.lessonPlan.states.length) * 100
    );
  }

  /**
   * Evaluate a task result
   */
  evaluateTaskResult(itemResults: ItemResult[]): TaskResult {
    const correct = itemResults.filter((r) => r.correct).length;
    const incorrect = itemResults.filter((r) => !r.correct).length;
    const total = itemResults.length;

    const startTime = Math.min(...itemResults.map((r) => r.timestamp));
    const endTime = Math.max(...itemResults.map((r) => r.timestamp));

    const currentState = this.getCurrentState();

    return {
      taskId: currentState?.id || 'unknown',
      taskType: currentState?.task?.type || 'sorting',
      startTime,
      endTime,
      correct,
      incorrect,
      accuracy: total > 0 ? correct / total : 0,
      itemResults,
      hintsUsed: 0, // Updated externally
    };
  }

  /**
   * Get reflection questions for current stage
   */
  getReflectionQuestions(): string[] {
    return this.lessonPlan.reflectionQuestions.map((q) => q.question);
  }

  /**
   * Get all rewards for this lesson
   */
  getRewards() {
    return this.lessonPlan.rewards;
  }

  /**
   * Reset the lesson
   */
  reset() {
    this.currentStateIndex = 0;
    this.stateStartTime = Date.now();
  }
}

/**
 * Calculate emotional metrics from player state
 */
export function calculateEmotionalMetrics(
  playerState: PlayerState
): PlayerState['emotionalMetrics'] {
  const { taskResults, hintsUsed, timeElapsed, stateHistory } = playerState;

  // Engagement level based on activity
  const avgTimePerState = timeElapsed / Math.max(stateHistory.length, 1);
  const engagementLevel = Math.min(
    1,
    Math.max(0, 1 - Math.abs(avgTimePerState - 120) / 120)
  ); // Peak at 2 min/state

  // Frustration level based on hints, restarts, and accuracy
  const avgAccuracy =
    taskResults.length > 0
      ? taskResults.reduce((sum, t) => sum + t.accuracy, 0) / taskResults.length
      : 1;
  const frustrationFromAccuracy = Math.max(0, (0.5 - avgAccuracy) * 2); // High when accuracy < 50%
  const frustrationFromHints = Math.min(1, hintsUsed / 10);
  const frustrationLevel = Math.min(
    1,
    (frustrationFromAccuracy + frustrationFromHints) / 2
  );

  // Confidence level based on accuracy and persistence
  const confidenceFromAccuracy = Math.max(0, (avgAccuracy - 0.5) * 2); // High when accuracy > 50%
  const persistenceScore =
    taskResults.length > 0 ? Math.min(1, taskResults.length / 5) : 0;
  const confidenceLevel = Math.min(
    1,
    (confidenceFromAccuracy + persistenceScore) / 2
  );

  // Improvement rate
  let improvementRate = 0;
  if (taskResults.length >= 2) {
    const firstHalf = taskResults.slice(0, Math.floor(taskResults.length / 2));
    const secondHalf = taskResults.slice(Math.floor(taskResults.length / 2));
    const avgFirst =
      firstHalf.reduce((sum, t) => sum + t.accuracy, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((sum, t) => sum + t.accuracy, 0) / secondHalf.length;
    improvementRate = avgSecond - avgFirst;
  }

  return {
    engagementLevel: Math.round(engagementLevel * 100) / 100,
    frustrationLevel: Math.round(frustrationLevel * 100) / 100,
    confidenceLevel: Math.round(confidenceLevel * 100) / 100,
    pauseCount: 0, // Updated externally
    restartCount: 0, // Updated externally
    hintRequestCount: hintsUsed,
    persistenceScore: Math.round(persistenceScore * 100) / 100,
    improvementRate: Math.round(improvementRate * 100) / 100,
  };
}

/**
 * Generate a session summary
 */
export function generateSessionSummary(
  playerState: PlayerState,
  stageName: string,
  stageTheme: any,
  emotionalFocus: any,
  learningOutcomes: string[]
): any {
  const { taskResults, score, timeElapsed, reflectionResponses, emotionalMetrics } =
    playerState;

  // Calculate overall accuracy
  const accuracy =
    taskResults.length > 0
      ? taskResults.reduce((sum, t) => sum + t.accuracy, 0) / taskResults.length
      : 0;

  // Determine outcomes achieved
  const outcomesAchieved =
    accuracy >= 0.8
      ? learningOutcomes
      : learningOutcomes.slice(0, Math.ceil(learningOutcomes.length * accuracy));

  // Identify concepts mastered (>80% accuracy) and areas for growth (<60%)
  const conceptsMastered: string[] = [];
  const areasForGrowth: string[] = [];

  taskResults.forEach((result, i) => {
    const concept = `Activity ${i + 1}`;
    if (result.accuracy >= 0.8) {
      conceptsMastered.push(concept);
    } else if (result.accuracy < 0.6) {
      areasForGrowth.push(concept);
    }
  });

  // Extract key insights from reflections
  const keyInsights = reflectionResponses.map((r) => r.response);

  return {
    sessionId: playerState.sessionId,
    stageTheme,
    stageName,
    score,
    accuracy: Math.round(accuracy * 100) / 100,
    timeElapsed,
    outcomesAchieved,
    conceptsMastered,
    areasForGrowth,
    emotionalGrowth: {
      focus: emotionalFocus,
      beforeLevel: 0.5, // Could track this separately
      afterLevel: emotionalMetrics.confidenceLevel,
      keyInsights,
    },
    nextStageRecommendation: null, // Can be enhanced with logic
    completedAt: Date.now(),
  };
}
