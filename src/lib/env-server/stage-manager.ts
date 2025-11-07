/**
 * Stage Manager
 *
 * Central coordinator for environmental learning stages.
 * Manages sessions, state transitions, and player progress.
 */

import { EventEmitter } from 'events';
import { isDemoMode } from '@/lib/demo-mode';
import type {
  StageDefinition,
  StageSession,
  PlayerState,
  StageManagerConfig,
  StageEvent,
  StageEventType,
  TaskResult,
  ItemResult,
  ReflectionResponse,
  SessionSummary,
  LessonReward,
} from '@/types/env-server';
import {
  LessonEngine,
  calculateEmotionalMetrics,
  generateSessionSummary,
} from './lesson-engine';
import { logger } from '@/lib/logger';

/**
 * StageManager - Singleton instance that manages all stage sessions
 */
class StageManager extends EventEmitter {
  private sessions: Map<string, StageSession> = new Map();
  private lessonEngines: Map<string, LessonEngine> = new Map();
  private config: StageManagerConfig;
  private autoSaveInterval?: NodeJS.Timeout;

  constructor(config?: Partial<StageManagerConfig>) {
    super();
    this.config = {
      demoMode: isDemoMode(),
      enableAI: !isDemoMode(),
      autoSave: true,
      maxSessionDuration: 30, // minutes
      ...config,
    };

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Initialize a new stage session
   */
  async startSession(
    playerId: string,
    stage: StageDefinition
  ): Promise<StageSession> {
    const sessionId = this.generateSessionId();

    const playerState: PlayerState = {
      playerId,
      stageId: stage.id,
      sessionId,
      currentStateId: stage.lessonPlan.states[0]?.id || 'intro',
      stateHistory: [],
      score: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      taskResults: [],
      reflectionResponses: [],
      emotionalMetrics: {
        engagementLevel: 1,
        frustrationLevel: 0,
        confidenceLevel: 0.5,
        pauseCount: 0,
        restartCount: 0,
        hintRequestCount: 0,
        persistenceScore: 0,
        improvementRate: 0,
      },
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    const session: StageSession = {
      id: sessionId,
      playerId,
      stageId: stage.id,
      stage,
      playerState,
      status: 'in-progress',
      startedAt: Date.now(),
      rewardsEarned: [],
    };

    // Initialize lesson engine
    const lessonEngine = new LessonEngine(stage.lessonPlan);
    lessonEngine.start();
    this.lessonEngines.set(sessionId, lessonEngine);

    // Store session
    this.sessions.set(sessionId, session);

    // Save to localStorage if in browser
    this.saveSession(session);

    // Emit event
    this.emitEvent('session:started', sessionId, { session });

    logger.info(`Stage session started: ${sessionId} for player ${playerId}`);

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): StageSession | null {
    return this.sessions.get(sessionId) || this.loadSession(sessionId);
  }

  /**
   * Advance to the next lesson state
   */
  nextState(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return;
    }

    const engine = this.lessonEngines.get(sessionId);
    if (!engine) {
      logger.error(`Lesson engine not found for session: ${sessionId}`);
      return;
    }

    const nextState = engine.nextState();
    if (nextState) {
      // Update player state
      session.playerState.stateHistory.push(session.playerState.currentStateId);
      session.playerState.currentStateId = nextState.id;
      session.playerState.lastActivityAt = Date.now();

      // Update time elapsed
      session.playerState.timeElapsed = Math.floor(
        (Date.now() - session.playerState.startedAt) / 1000
      );

      // Recalculate emotional metrics
      session.playerState.emotionalMetrics =
        calculateEmotionalMetrics(session.playerState);

      // Save session
      this.saveSession(session);

      // Emit event
      this.emitEvent('session:state-changed', sessionId, {
        newState: nextState,
        progress: engine.getProgress(),
      });

      logger.info(
        `Session ${sessionId} advanced to state: ${nextState.id} (${engine.getProgress()}%)`
      );
    } else {
      // Lesson is complete
      this.completeSession(sessionId);
    }
  }

  /**
   * Record a task result
   */
  recordTaskResult(sessionId: string, taskResult: TaskResult): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.playerState.taskResults.push(taskResult);
    session.playerState.score +=
      (taskResult.correct * 10) - (taskResult.incorrect * 5);

    // Update metrics
    session.playerState.emotionalMetrics =
      calculateEmotionalMetrics(session.playerState);

    // Save session
    this.saveSession(session);

    // Emit event
    this.emitEvent('session:task-completed', sessionId, { taskResult });

    logger.info(
      `Task result recorded for session ${sessionId}: ${taskResult.accuracy * 100}% accuracy`
    );
  }

  /**
   * Record item interaction
   */
  recordItemResult(sessionId: string, itemResult: ItemResult): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    // Item results are tracked within task results
    session.playerState.lastActivityAt = Date.now();
    this.saveSession(session);
  }

  /**
   * Use a hint
   */
  useHint(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.playerState.hintsUsed++;
    session.playerState.emotionalMetrics.hintRequestCount++;

    this.saveSession(session);
    this.emitEvent('player:hint-used', sessionId, {
      totalHints: session.playerState.hintsUsed,
    });
  }

  /**
   * Record a reflection response
   */
  recordReflection(
    sessionId: string,
    questionId: string,
    question: string,
    response: string,
    aiFollowUp?: string
  ): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const reflection: ReflectionResponse = {
      questionId,
      question,
      response,
      timestamp: Date.now(),
      aiFollowUp,
    };

    session.playerState.reflectionResponses.push(reflection);
    this.saveSession(session);

    this.emitEvent('session:reflection-recorded', sessionId, { reflection });

    logger.info(`Reflection recorded for session ${sessionId}`);
  }

  /**
   * Award a reward to the player
   */
  awardReward(sessionId: string, reward: LessonReward): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.rewardsEarned.push(reward);
    if (reward.value) {
      session.playerState.score += reward.value;
    }

    this.saveSession(session);
    this.emitEvent('player:achievement-unlocked', sessionId, { reward });

    logger.info(`Reward awarded in session ${sessionId}: ${reward.name}`);
  }

  /**
   * Complete a session
   */
  completeSession(sessionId: string): SessionSummary | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.status = 'completed';
    session.completedAt = Date.now();
    session.totalDuration = Math.floor(
      (session.completedAt - (session.startedAt || session.completedAt)) / 1000
    );

    // Generate summary
    const summary = generateSessionSummary(
      session.playerState,
      session.stage.name,
      session.stage.theme,
      session.stage.emotionalFocus,
      session.stage.learningOutcomes
    );

    // Save summary to localStorage
    this.saveSessionSummary(summary);

    // Save final session state
    this.saveSession(session);

    // Emit event
    this.emitEvent('session:completed', sessionId, { session, summary });

    logger.info(`Session completed: ${sessionId}`);

    return summary;
  }

  /**
   * Abandon a session
   */
  abandonSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.status = 'abandoned';
    this.saveSession(session);

    this.emitEvent('session:abandoned', sessionId, { session });

    logger.info(`Session abandoned: ${sessionId}`);
  }

  /**
   * Get all sessions for a player
   */
  getPlayerSessions(playerId: string): StageSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.playerId === playerId
    );
  }

  /**
   * Get session summaries from localStorage
   */
  getSessionSummaries(limit: number = 10): SessionSummary[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('sunny_stage_summaries');
      if (!stored) return [];

      const summaries: SessionSummary[] = JSON.parse(stored);
      return summaries.slice(0, limit);
    } catch (error) {
      logger.error('Error loading session summaries:', error);
      return [];
    }
  }

  /**
   * Private helper: Generate a session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private helper: Save session to localStorage
   */
  private saveSession(session: StageSession): void {
    if (typeof window === 'undefined') return;

    try {
      const key = `sunny_stage_session_${session.id}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      logger.error(`Error saving session ${session.id}:`, error);
    }
  }

  /**
   * Private helper: Load session from localStorage
   */
  private loadSession(sessionId: string): StageSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const key = `sunny_stage_session_${sessionId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const session: StageSession = JSON.parse(stored);

      // Restore lesson engine
      const engine = new LessonEngine(session.stage.lessonPlan);
      // Restore engine state
      const currentStateIndex = session.stage.lessonPlan.states.findIndex(
        (s) => s.id === session.playerState.currentStateId
      );
      if (currentStateIndex !== -1) {
        for (let i = 0; i < currentStateIndex; i++) {
          engine.nextState();
        }
      }
      this.lessonEngines.set(sessionId, engine);

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      logger.error(`Error loading session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Private helper: Save session summary
   */
  private saveSessionSummary(summary: SessionSummary): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('sunny_stage_summaries');
      const summaries: SessionSummary[] = stored ? JSON.parse(stored) : [];

      summaries.unshift(summary);

      // Keep only last 50 summaries
      if (summaries.length > 50) {
        summaries.splice(50);
      }

      localStorage.setItem('sunny_stage_summaries', JSON.stringify(summaries));
    } catch (error) {
      logger.error('Error saving session summary:', error);
    }
  }

  /**
   * Private helper: Start auto-save interval
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.sessions.forEach((session) => {
        if (session.status === 'in-progress') {
          this.saveSession(session);
        }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Private helper: Emit an event
   */
  private emitEvent(
    type: StageEventType,
    sessionId: string,
    data: any
  ): void {
    const event: StageEvent = {
      type,
      sessionId,
      timestamp: Date.now(),
      data,
    };

    this.emit(type, event);
    this.emit('*', event); // Wildcard listener
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.removeAllListeners();
  }
}

// Singleton instance
export const stageManager = new StageManager();

// Export class for testing
export { StageManager };
