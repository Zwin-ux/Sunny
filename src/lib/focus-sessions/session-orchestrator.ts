// Session Orchestrator - Main coordinator for 20-minute focus sessions
// Implements the 5-step loop: extract → choose → generate → score → plan

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  FocusSession,
  FocusSessionRequest,
  SessionLoop,
  LoopPerformance,
  SessionPerformance,
  ReviewPlan,
  ArtifactRequest,
  ArtifactResult,
  FlashcardResult,
  QuizResult,
  MicroGameResult,
  DifficultyAdjustment,
  DEFAULT_SESSION_CONFIG,
  FocusSessionEvent,
} from '@/types/focus-session';
import { DifficultyLevel } from '@/types/chat';
import { conceptExtractor } from './concept-extractor';
import { artifactGenerator } from './artifact-generator';
import { difficultyAdapter } from './difficulty-adapter';
import { memoryManager } from './memory-manager';
import { logger } from '@/lib/logger';

export class SessionOrchestrator extends EventEmitter {
  private config = DEFAULT_SESSION_CONFIG;
  private activeSessions: Map<string, FocusSession> = new Map();

  // ========================================================================
  // Session Lifecycle
  // ========================================================================

  /**
   * Start a new focus session
   */
  async start(request: FocusSessionRequest): Promise<FocusSession> {
    logger.info(`Starting focus session on "${request.topic}" for student ${request.studentId}`);

    // Step 1: Extract concepts from context
    const conceptMap = await conceptExtractor.extractConcepts(
      request.topic,
      request.inputContext || '',
      request.learningGoals
    );

    // Create session
    const session: FocusSession = {
      id: uuidv4(),
      studentId: request.studentId,
      topic: request.topic,
      startTime: Date.now(),
      duration: request.targetDuration || this.config.defaultDuration,
      status: 'planning',
      initialDifficulty: request.initialDifficulty || 'easy',
      currentDifficulty: request.initialDifficulty || 'easy',
      targetAccuracy: 0.7,
      conceptMap,
      artifacts: [],
      loops: [],
    };

    this.activeSessions.set(session.id, session);
    memoryManager.storeActiveSession(session);

    this.emit('session:started', { type: 'session:started', session } as FocusSessionEvent);

    return session;
  }

  /**
   * Start a new loop within the session
   */
  async startLoop(
    sessionId: string,
    loopNumber: number,
    preferredModality?: 'flashcards' | 'quiz' | 'micro_game'
  ): Promise<SessionLoop> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    logger.info(`Starting loop ${loopNumber} for session ${sessionId}`);

    // Step 2: Choose modality (or use preferred)
    const modality = preferredModality || this.chooseModality(session, loopNumber);

    // Step 3: Generate artifact
    const subtopics = conceptExtractor.suggestNextSubtopics(session.conceptMap, 3);
    const difficultyParams = difficultyAdapter.getDifficultyParameters(session.currentDifficulty);

    const artifactRequest: ArtifactRequest = {
      modality,
      targetSubtopics: subtopics,
      difficulty: session.currentDifficulty,
      constraints: {
        timeLimitSeconds: this.config.artifactTimeLimit,
        maxItems: modality === 'flashcards' ? this.config.flashcardSetSize : this.config.quizItemCount,
        includeHints: difficultyParams.hintsAvailable > 0,
        includeExplanations: true,
        visualAids: true,
      },
      conceptMap: session.conceptMap,
      previousPerformance: session.loops[session.loops.length - 1]?.performance,
    };

    const artifactData = await artifactGenerator.generateArtifact(artifactRequest);

    const artifact = {
      id: uuidv4(),
      type: modality,
      difficulty: session.currentDifficulty,
      data: artifactData,
      generatedAt: Date.now(),
      targetSubtopics: subtopics,
    };

    session.artifacts.push(artifact);
    session.currentArtifact = artifact;

    const loop: SessionLoop = {
      loopNumber,
      startTime: Date.now(),
      artifact,
      results: [],
      performance: this.createEmptyPerformance(loopNumber),
    };

    session.loops.push(loop);
    session.status = 'active';

    memoryManager.storeActiveSession(session);

    this.emit('session:loop:started', { type: 'session:loop:started', loop } as FocusSessionEvent);
    this.emit('session:artifact:generated', {
      type: 'session:artifact:generated',
      artifact,
    } as FocusSessionEvent);

    return loop;
  }

  /**
   * Record results for an artifact
   */
  recordResults(
    sessionId: string,
    loopNumber: number,
    results: FlashcardResult[] | QuizResult[] | MicroGameResult[]
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const loop = session.loops.find((l) => l.loopNumber === loopNumber);
    if (!loop) {
      throw new Error(`Loop ${loopNumber} not found in session ${sessionId}`);
    }

    const artifactResult: ArtifactResult = {
      artifactId: loop.artifact.id,
      artifactType: loop.artifact.type,
      results,
      startTime: loop.startTime,
      endTime: Date.now(),
      completed: true,
    };

    loop.results.push(artifactResult);
    logger.info(`Recorded ${results.length} results for loop ${loopNumber}`);
  }

  /**
   * Complete a loop and calculate performance
   */
  async completeLoop(sessionId: string, loopNumber: number): Promise<LoopPerformance> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const loop = session.loops.find((l) => l.loopNumber === loopNumber);
    if (!loop) {
      throw new Error(`Loop ${loopNumber} not found`);
    }

    loop.endTime = Date.now();

    // Step 4: Score and analyze performance
    const performance = this.calculateLoopPerformance(loop);
    loop.performance = performance;

    // Update concept map based on performance
    const performanceBySubtopic = loop.artifact.targetSubtopics.map((subtopic) => ({
      subtopic,
      accuracy: performance.accuracy, // simplified - ideally per-concept
      timestamp: Date.now(),
    }));

    session.conceptMap = await conceptExtractor.updateConceptMap(
      session.conceptMap,
      '',
      performanceBySubtopic
    );

    // Update concept memories
    loop.artifact.targetSubtopics.forEach((concept) => {
      memoryManager.updateConceptMemory(
        concept,
        {
          timestamp: Date.now(),
          type: loop.artifact.type === 'flashcards' ? 'flashcard' : loop.artifact.type === 'quiz' ? 'quiz' : 'game',
          result: performance.accuracy >= 0.7 ? 'success' : performance.accuracy >= 0.5 ? 'partial' : 'failure',
          context: `Loop ${loopNumber} of focus session`,
          weight: 0.8,
        },
        performance.accuracy
      );
    });

    // Check if difficulty should adjust
    const adjustmentCheck = difficultyAdapter.shouldAdjustDifficulty(
      performance,
      session.currentDifficulty
    );

    if (adjustmentCheck.shouldAdjust && adjustmentCheck.newDifficulty) {
      const adjustment: DifficultyAdjustment = {
        timestamp: Date.now(),
        fromDifficulty: session.currentDifficulty,
        toDifficulty: adjustmentCheck.newDifficulty,
        reason: adjustmentCheck.reason || 'Performance-based adjustment',
        triggerMetric: adjustmentCheck.triggerMetric || 'accuracy',
        triggerValue: adjustmentCheck.triggerValue || performance.accuracy,
      };

      session.currentDifficulty = adjustmentCheck.newDifficulty;
      loop.difficultyAdjustment = adjustment;

      this.emit('session:difficulty:adjusted', {
        type: 'session:difficulty:adjusted',
        adjustment,
      } as FocusSessionEvent);
    }

    // Track concept mastery
    performance.conceptsImproved.forEach((concept) => {
      const subtopic = session.conceptMap.subtopics.find((s) => s.name === concept);
      if (subtopic && subtopic.masteryLevel >= 0.85) {
        this.emit('session:concept:mastered', {
          type: 'session:concept:mastered',
          concept,
          masteryLevel: subtopic.masteryLevel,
        } as FocusSessionEvent);
      }
    });

    memoryManager.storeActiveSession(session);

    this.emit('session:loop:completed', {
      type: 'session:loop:completed',
      loop,
      performance,
    } as FocusSessionEvent);

    return performance;
  }

  /**
   * Complete the entire session
   */
  async complete(sessionId: string): Promise<{ session: FocusSession; performance: SessionPerformance }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    logger.info(`Completing session ${sessionId}`);

    session.endTime = Date.now();
    session.status = 'completed';

    // Step 5: Generate review plan
    const performance = this.calculateSessionPerformance(session);
    const reviewPlan = await this.generateReviewPlan(session, performance);

    session.overallPerformance = performance;
    session.reviewPlan = reviewPlan;

    // Generate and store session summary
    const summary = await memoryManager.generateSessionSummary(session, performance);
    logger.info(`Generated session summary: ${summary.summary}`);

    this.activeSessions.delete(sessionId);
    memoryManager.clearActiveSession();

    this.emit('session:completed', {
      type: 'session:completed',
      session,
      performance,
    } as FocusSessionEvent);

    return { session, performance };
  }

  /**
   * Cancel a session
   */
  cancel(sessionId: string, reason: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'cancelled';
    session.endTime = Date.now();

    this.activeSessions.delete(sessionId);
    memoryManager.clearActiveSession();

    this.emit('session:cancelled', {
      type: 'session:cancelled',
      sessionId,
      reason,
    } as FocusSessionEvent);

    logger.info(`Cancelled session ${sessionId}: ${reason}`);
  }

  // ========================================================================
  // Performance Calculation
  // ========================================================================

  private calculateLoopPerformance(loop: SessionLoop): LoopPerformance {
    const results = loop.results.flatMap((r) => r.results);
    const timeSpent = loop.endTime ? (loop.endTime - loop.startTime) / 1000 : 0;

    let correctCount = 0;
    let totalItems = results.length;
    let hintsUsed = 0;
    let consecutiveFailures = 0;
    let maxConsecutiveFailures = 0;

    results.forEach((result: any) => {
      const isCorrect = 'isCorrect' in result ? result.isCorrect : 'recalled' in result ? result.recalled : false;

      if (isCorrect) {
        correctCount++;
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
        maxConsecutiveFailures = Math.max(maxConsecutiveFailures, consecutiveFailures);
      }

      if ('hintsUsed' in result) {
        hintsUsed += result.hintsUsed;
      }
    });

    const accuracy = totalItems > 0 ? correctCount / totalItems : 0;
    const speed = timeSpent > 0 ? (totalItems / timeSpent) * 60 : 0; // items per minute

    // Calculate engagement metrics
    const avgTimePerItem = totalItems > 0 ? timeSpent / totalItems : 0;
    const frustrationLevel = difficultyAdapter.calculateFrustrationLevel({
      accuracy,
      consecutiveFailures: maxConsecutiveFailures,
      hintsUsed,
      averageTimePerItem: avgTimePerItem,
      engagementLevel: 0.7, // placeholder
    });

    const attentionScore = Math.max(0, 1 - frustrationLevel * 0.5);
    const engagementLevel = accuracy >= 0.7 ? 0.8 : accuracy >= 0.5 ? 0.6 : 0.4;

    return {
      loopNumber: loop.loopNumber,
      accuracy,
      speed,
      timeSpent,
      itemsCompleted: totalItems,
      itemsTotal: totalItems,
      hintsUsed,
      attentionScore,
      frustrationLevel,
      engagementLevel,
      conceptsIntroduced: loop.artifact.targetSubtopics,
      conceptsPracticed: loop.artifact.targetSubtopics,
      conceptsImproved: loop.artifact.targetSubtopics.filter(() => accuracy >= 0.7),
      weakAreas: loop.artifact.targetSubtopics.filter(() => accuracy < 0.5),
    };
  }

  private calculateSessionPerformance(session: FocusSession): SessionPerformance {
    const loops = session.loops;
    const totalTime = session.endTime ? (session.endTime - session.startTime) / 1000 : 0;

    const avgAccuracy = loops.reduce((sum, l) => sum + l.performance.accuracy, 0) / loops.length;
    const avgEngagement = loops.reduce((sum, l) => sum + l.performance.engagementLevel, 0) / loops.length;

    // Calculate improvement rate
    const firstAccuracy = loops[0]?.performance.accuracy || 0;
    const lastAccuracy = loops[loops.length - 1]?.performance.accuracy || 0;
    const improvementRate = lastAccuracy - firstAccuracy;

    // Aggregate concepts
    const allConcepts = new Set(loops.flatMap((l) => l.artifact.targetSubtopics));
    const masteredConcepts = new Set<string>();
    const needReviewConcepts = new Set<string>();

    session.conceptMap.subtopics.forEach((subtopic) => {
      if (allConcepts.has(subtopic.name)) {
        if (subtopic.masteryLevel >= 0.85) {
          masteredConcepts.add(subtopic.name);
        } else if (subtopic.masteryLevel < 0.6) {
          needReviewConcepts.add(subtopic.name);
        }
      }
    });

    // Build mastery map
    const masteryMap: Record<string, number> = {};
    session.conceptMap.subtopics.forEach((subtopic) => {
      if (allConcepts.has(subtopic.name)) {
        masteryMap[subtopic.name] = subtopic.masteryLevel;
      }
    });

    // Count frustrated moments
    const frustratedMoments = loops.filter((l) => l.performance.frustrationLevel >= 0.6).length;

    // Determine teaching strategy
    const lastPerformance = loops[loops.length - 1]?.performance;
    const teachingStrategy = lastPerformance
      ? difficultyAdapter.determineTeachingStrategy(lastPerformance, session.currentDifficulty)
      : 'reinforce';

    return {
      sessionId: session.id,
      studentId: session.studentId,
      topic: session.topic,
      totalTime,
      loopsCompleted: loops.length,
      averageAccuracy: avgAccuracy,
      improvementRate,
      flashcardsCompleted: loops.filter((l) => l.artifact.type === 'flashcards').length,
      quizzesCompleted: loops.filter((l) => l.artifact.type === 'quiz').length,
      gamesCompleted: loops.filter((l) => l.artifact.type === 'micro_game').length,
      conceptsCovered: Array.from(allConcepts),
      conceptsMastered: Array.from(masteredConcepts),
      conceptsNeedingReview: Array.from(needReviewConcepts),
      masteryMap,
      startDifficulty: session.initialDifficulty,
      endDifficulty: session.currentDifficulty,
      difficultyChanges: loops.filter((l) => l.difficultyAdjustment).length,
      averageEngagement: avgEngagement,
      peakEngagement: Math.max(...loops.map((l) => l.performance.engagementLevel)),
      frustratedMoments,
      suggestedNextTopic: session.topic, // could be smarter
      suggestedNextDifficulty: session.currentDifficulty,
      teachingStrategy,
      timestamp: Date.now(),
    };
  }

  private createEmptyPerformance(loopNumber: number): LoopPerformance {
    return {
      loopNumber,
      accuracy: 0,
      speed: 0,
      timeSpent: 0,
      itemsCompleted: 0,
      itemsTotal: 0,
      hintsUsed: 0,
      attentionScore: 0,
      frustrationLevel: 0,
      engagementLevel: 0,
      conceptsIntroduced: [],
      conceptsPracticed: [],
      conceptsImproved: [],
      weakAreas: [],
    };
  }

  // ========================================================================
  // Review Plan Generation
  // ========================================================================

  private async generateReviewPlan(
    session: FocusSession,
    performance: SessionPerformance
  ): Promise<ReviewPlan> {
    // Determine next focus
    const weakConcepts = performance.conceptsNeedingReview;
    const masteredConcepts = performance.conceptsMastered;

    // Get spaced repetition cards due
    const dueForReview = memoryManager.getConceptsDueForReview();

    // Suggest next subtopics
    const nextSubtopics = conceptExtractor.suggestNextSubtopics(session.conceptMap, 3);

    // Determine modality
    let recommendedModality: 'flashcards' | 'quiz' | 'micro_game' = 'flashcards';
    if (performance.averageAccuracy >= 0.8) {
      recommendedModality = 'quiz'; // ready for active recall
    } else if (performance.averageEngagement < 0.5) {
      recommendedModality = 'micro_game'; // need more engagement
    }

    // Build reasoning
    let reasoning = '';
    if (weakConcepts.length > 0) {
      reasoning = `Focus on reviewing ${weakConcepts.slice(0, 2).join(' and ')} to strengthen understanding. `;
    } else if (masteredConcepts.length >= 2) {
      reasoning = `Great progress! Ready to explore new concepts: ${nextSubtopics.slice(0, 2).join(' and ')}. `;
    } else {
      reasoning = `Continue building confidence with ${nextSubtopics.slice(0, 2).join(' and ')}. `;
    }

    reasoning += `Using ${recommendedModality} for optimal learning.`;

    return {
      nextFocusMinutes: this.config.defaultDuration / 60,
      nextGoals: [
        ...weakConcepts.slice(0, 2).map((c) => `Master ${c}`),
        ...nextSubtopics.slice(0, 2).map((c) => `Understand ${c}`),
      ],
      recommendedModality,
      targetDifficulty: performance.suggestedNextDifficulty,
      targetSubtopics: nextSubtopics,
      reviewSubtopics: weakConcepts,
      newSubtopics: nextSubtopics.filter((s) => !performance.conceptsCovered.includes(s)),
      reasoning,
      estimatedMasteryGain: performance.improvementRate > 0 ? 0.15 : 0.10,
      spacedRepetitionDue: [], // would map concept memories to flashcards
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private chooseModality(session: FocusSession, loopNumber: number): 'flashcards' | 'quiz' | 'micro_game' {
    // First loop: start with flashcards (gentlest)
    if (loopNumber === 1) {
      return 'flashcards';
    }

    const lastLoop = session.loops[session.loops.length - 1];
    if (!lastLoop) {
      return 'flashcards';
    }

    // Check if modality switch is suggested
    const switchCheck = difficultyAdapter.suggestModalitySwitch(
      lastLoop.artifact.type,
      lastLoop.performance
    );

    if (switchCheck.shouldSwitch && switchCheck.suggestedModality) {
      logger.info(`Switching modality: ${switchCheck.reason}`);
      return switchCheck.suggestedModality;
    }

    // Cycle through modalities for variety
    const modalityOrder: Array<'flashcards' | 'quiz' | 'micro_game'> = [
      'flashcards',
      'quiz',
      'micro_game',
    ];

    const currentIndex = modalityOrder.indexOf(lastLoop.artifact.type);
    return modalityOrder[(currentIndex + 1) % modalityOrder.length];
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): FocusSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): FocusSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Recover active session from storage
   */
  recoverSession(): FocusSession | null {
    const stored = memoryManager.getActiveSession();
    if (stored) {
      this.activeSessions.set(stored.id, stored);
      logger.info(`Recovered active session: ${stored.id}`);
    }
    return stored;
  }
}

// Singleton instance
export const sessionOrchestrator = new SessionOrchestrator();
