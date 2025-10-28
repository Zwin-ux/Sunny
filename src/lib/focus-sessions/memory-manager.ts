// Memory Manager - Stores and retrieves session summaries and concept memories
// Handles localStorage persistence and future vector storage

import {
  SessionSummary,
  ConceptMemory,
  EvidencePoint,
  FocusSession,
  SessionPerformance,
} from '@/types/focus-session';
import { logger } from '@/lib/logger';

const STORAGE_KEYS = {
  SESSION_SUMMARIES: 'sunny_focus_session_summaries',
  CONCEPT_MEMORIES: 'sunny_concept_memories',
  ACTIVE_SESSION: 'sunny_active_focus_session',
};

const MAX_STORED_SUMMARIES = 50; // Keep last 50 sessions
const MAX_CONCEPT_MEMORIES = 200; // Keep top 200 concepts

export class MemoryManager {
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  // ========================================================================
  // Session Summary Management
  // ========================================================================

  /**
   * Store a session summary
   */
  storeSessionSummary(summary: SessionSummary): void {
    if (!this.isClient) {
      logger.warn('Cannot store session summary: not in browser environment');
      return;
    }

    try {
      const summaries = this.getAllSessionSummaries();
      summaries.unshift(summary); // Add to beginning

      // Keep only most recent summaries
      const trimmed = summaries.slice(0, MAX_STORED_SUMMARIES);

      localStorage.setItem(STORAGE_KEYS.SESSION_SUMMARIES, JSON.stringify(trimmed));
      logger.info(`Stored session summary: ${summary.id}`);
    } catch (error) {
      logger.error('Error storing session summary:', error);
    }
  }

  /**
   * Get all stored session summaries
   */
  getAllSessionSummaries(): SessionSummary[] {
    if (!this.isClient) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_SUMMARIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error retrieving session summaries:', error);
      return [];
    }
  }

  /**
   * Get session summaries for a specific student
   */
  getSessionSummariesForStudent(studentId: string): SessionSummary[] {
    return this.getAllSessionSummaries().filter((s) => s.studentId === studentId);
  }

  /**
   * Get session summaries by topic
   */
  getSessionSummariesByTopic(topic: string): SessionSummary[] {
    return this.getAllSessionSummaries().filter(
      (s) => s.topic.toLowerCase() === topic.toLowerCase()
    );
  }

  /**
   * Get most recent N session summaries
   */
  getRecentSessionSummaries(count: number = 10): SessionSummary[] {
    return this.getAllSessionSummaries().slice(0, count);
  }

  /**
   * Generate and store session summary from completed session
   */
  async generateSessionSummary(
    session: FocusSession,
    performance: SessionPerformance
  ): Promise<SessionSummary> {
    const summary: SessionSummary = {
      id: `summary-${session.id}`,
      sessionId: session.id,
      studentId: session.studentId,
      topic: session.topic,
      timestamp: session.endTime || Date.now(),
      duration: session.duration,

      // Performance metrics
      accuracy: performance.averageAccuracy,
      loopsCompleted: performance.loopsCompleted,
      conceptsCovered: performance.conceptsCovered,
      conceptsMastered: performance.conceptsMastered,
      weakAreas: performance.conceptsNeedingReview,

      // AI-generated narrative summary
      summary: this.generateNarrativeSummary(session, performance),

      // Insights
      strengths: this.identifyStrengths(performance),
      areasForImprovement: this.identifyAreasForImprovement(performance),
      nextSteps: this.suggestNextSteps(session, performance),

      // Metadata
      artifactTypes: session.artifacts.map((a) => a.type),
      difficultyProgression: [session.initialDifficulty, session.currentDifficulty],
    };

    this.storeSessionSummary(summary);
    return summary;
  }

  /**
   * Generate human-readable narrative summary
   */
  private generateNarrativeSummary(
    session: FocusSession,
    performance: SessionPerformance
  ): string {
    const accuracyPct = Math.round(performance.averageAccuracy * 100);
    const duration = Math.round(session.duration / 60); // minutes

    let summary = `In this ${duration}-minute focus session on ${session.topic}, `;

    if (accuracyPct >= 85) {
      summary += `you did amazing! You mastered ${performance.conceptsMastered.length} concepts `;
    } else if (accuracyPct >= 70) {
      summary += `you made great progress! You learned ${performance.conceptsCovered.length} concepts `;
    } else {
      summary += `you worked hard on ${performance.conceptsCovered.length} concepts `;
    }

    summary += `with ${accuracyPct}% accuracy. `;

    if (performance.improvementRate > 0.1) {
      summary += `You improved significantly as the session went on! `;
    }

    if (performance.conceptsNeedingReview.length > 0) {
      summary += `We'll review ${performance.conceptsNeedingReview.join(', ')} next time. `;
    }

    summary += `Keep up the great work! 🌟`;

    return summary;
  }

  private identifyStrengths(performance: SessionPerformance): string[] {
    const strengths: string[] = [];

    if (performance.averageAccuracy >= 0.85) {
      strengths.push('Excellent accuracy throughout the session');
    }

    if (performance.improvementRate > 0.15) {
      strengths.push('Showed strong improvement over time');
    }

    if (performance.conceptsMastered.length >= 3) {
      strengths.push(`Mastered ${performance.conceptsMastered.length} new concepts`);
    }

    if (performance.averageEngagement >= 0.7) {
      strengths.push('Stayed engaged and focused');
    }

    if (performance.difficultyChanges > 0 && performance.endDifficulty > performance.startDifficulty) {
      strengths.push('Advanced to a higher difficulty level');
    }

    return strengths.length > 0
      ? strengths
      : ['Completed the session and kept trying'];
  }

  private identifyAreasForImprovement(performance: SessionPerformance): string[] {
    const areas: string[] = [];

    if (performance.averageAccuracy < 0.6) {
      areas.push('Accuracy could improve with more practice');
    }

    if (performance.frustratedMoments > 2) {
      areas.push('Try different activity types to stay engaged');
    }

    if (performance.conceptsNeedingReview.length > 3) {
      areas.push('Several concepts need more review');
    }

    if (performance.averageEngagement < 0.5) {
      areas.push('Finding more engaging activities might help');
    }

    return areas;
  }

  private suggestNextSteps(session: FocusSession, performance: SessionPerformance): string[] {
    const steps: string[] = [];

    // Review weak concepts
    if (performance.conceptsNeedingReview.length > 0) {
      steps.push(`Review: ${performance.conceptsNeedingReview.slice(0, 2).join(', ')}`);
    }

    // Continue with mastered concepts
    if (performance.conceptsMastered.length > 0) {
      steps.push(`Build on: ${performance.conceptsMastered.slice(0, 2).join(', ')}`);
    }

    // Suggest next topic
    if (performance.suggestedNextTopic) {
      steps.push(`Explore: ${performance.suggestedNextTopic}`);
    }

    // Suggest modality
    const preferredModality = this.getPreferredModality(session);
    if (preferredModality) {
      steps.push(`Try more ${preferredModality}s - they worked well for you!`);
    }

    return steps.length > 0 ? steps : ['Keep practicing and learning!'];
  }

  private getPreferredModality(session: FocusSession): string | null {
    const modalityPerformance = {
      flashcards: 0,
      quiz: 0,
      micro_game: 0,
    };

    session.loops.forEach((loop) => {
      if (loop.performance.accuracy > 0.7) {
        modalityPerformance[loop.artifact.type] += 1;
      }
    });

    const best = Object.entries(modalityPerformance).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : null;
  }

  // ========================================================================
  // Concept Memory Management
  // ========================================================================

  /**
   * Store or update concept memory
   */
  storeConceptMemory(concept: ConceptMemory): void {
    if (!this.isClient) return;

    try {
      const memories = this.getAllConceptMemories();
      const existing = memories.findIndex((m) => m.concept === concept.concept);

      if (existing >= 0) {
        memories[existing] = concept;
      } else {
        memories.push(concept);
      }

      // Sort by mastery and recency
      memories.sort((a, b) => {
        const masteryDiff = b.currentMastery - a.currentMastery;
        if (Math.abs(masteryDiff) > 0.1) return masteryDiff;
        return b.lastPracticed - a.lastPracticed;
      });

      // Trim to max
      const trimmed = memories.slice(0, MAX_CONCEPT_MEMORIES);

      localStorage.setItem(STORAGE_KEYS.CONCEPT_MEMORIES, JSON.stringify(trimmed));
    } catch (error) {
      logger.error('Error storing concept memory:', error);
    }
  }

  /**
   * Get all concept memories
   */
  getAllConceptMemories(): ConceptMemory[] {
    if (!this.isClient) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONCEPT_MEMORIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error retrieving concept memories:', error);
      return [];
    }
  }

  /**
   * Get concept memory by name
   */
  getConceptMemory(concept: string): ConceptMemory | null {
    const memories = this.getAllConceptMemories();
    return memories.find((m) => m.concept.toLowerCase() === concept.toLowerCase()) || null;
  }

  /**
   * Update concept memory from performance
   */
  updateConceptMemory(
    concept: string,
    evidencePoint: EvidencePoint,
    newMastery?: number
  ): void {
    let memory = this.getConceptMemory(concept);

    if (!memory) {
      // Create new memory
      memory = {
        concept,
        description: '',
        firstEncountered: Date.now(),
        lastPracticed: Date.now(),
        timesEncountered: 1,
        currentMastery: newMastery ?? 0.5,
        peakMastery: newMastery ?? 0.5,
        masteryTrend: 'stable',
        prerequisites: [],
        relatedConcepts: [],
        buildsConcepts: [],
        evidencePoints: [evidencePoint],
        nextReviewDate: Date.now() + 24 * 60 * 60 * 1000, // tomorrow
        reviewInterval: 1,
      };
    } else {
      // Update existing memory
      memory.lastPracticed = Date.now();
      memory.timesEncountered += 1;
      memory.evidencePoints.push(evidencePoint);

      if (newMastery !== undefined) {
        const oldMastery = memory.currentMastery;
        memory.currentMastery = newMastery;

        if (newMastery > memory.peakMastery) {
          memory.peakMastery = newMastery;
        }

        // Determine trend
        if (newMastery > oldMastery + 0.1) {
          memory.masteryTrend = 'improving';
        } else if (newMastery < oldMastery - 0.1) {
          memory.masteryTrend = 'declining';
        } else {
          memory.masteryTrend = 'stable';
        }

        // Update spaced repetition
        this.updateSpacedRepetition(memory, evidencePoint.result === 'success');
      }

      // Keep only recent evidence (last 20 points)
      if (memory.evidencePoints.length > 20) {
        memory.evidencePoints = memory.evidencePoints.slice(-20);
      }
    }

    this.storeConceptMemory(memory);
  }

  /**
   * Update spaced repetition schedule
   */
  private updateSpacedRepetition(memory: ConceptMemory, wasSuccessful: boolean): void {
    if (wasSuccessful) {
      // Increase interval
      memory.reviewInterval = Math.min(30, memory.reviewInterval * 2);
    } else {
      // Reset to short interval
      memory.reviewInterval = 1;
    }

    memory.nextReviewDate = Date.now() + memory.reviewInterval * 24 * 60 * 60 * 1000;
  }

  /**
   * Get concepts due for review
   */
  getConceptsDueForReview(): ConceptMemory[] {
    const now = Date.now();
    return this.getAllConceptMemories().filter((m) => m.nextReviewDate <= now);
  }

  /**
   * Get weak concepts (low mastery)
   */
  getWeakConcepts(threshold: number = 0.6): ConceptMemory[] {
    return this.getAllConceptMemories()
      .filter((m) => m.currentMastery < threshold)
      .sort((a, b) => a.currentMastery - b.currentMastery);
  }

  /**
   * Get concepts by mastery level
   */
  getConceptsByMastery(
    minMastery: number,
    maxMastery: number = 1
  ): ConceptMemory[] {
    return this.getAllConceptMemories().filter(
      (m) => m.currentMastery >= minMastery && m.currentMastery <= maxMastery
    );
  }

  // ========================================================================
  // Active Session Management
  // ========================================================================

  /**
   * Store active session (for recovery on refresh)
   */
  storeActiveSession(session: FocusSession): void {
    if (!this.isClient) return;

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } catch (error) {
      logger.error('Error storing active session:', error);
    }
  }

  /**
   * Get active session
   */
  getActiveSession(): FocusSession | null {
    if (!this.isClient) return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error('Error retrieving active session:', error);
      return null;
    }
  }

  /**
   * Clear active session
   */
  clearActiveSession(): void {
    if (!this.isClient) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch (error) {
      logger.error('Error clearing active session:', error);
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Clear all stored data (for testing/reset)
   */
  clearAllData(): void {
    if (!this.isClient) return;

    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    logger.info('Cleared all focus session data');
  }

  /**
   * Get storage stats
   */
  getStorageStats(): {
    totalSessions: number;
    totalConcepts: number;
    storageUsed: number;
    hasActiveSession: boolean;
  } {
    if (!this.isClient) {
      return {
        totalSessions: 0,
        totalConcepts: 0,
        storageUsed: 0,
        hasActiveSession: false,
      };
    }

    const summaries = this.getAllSessionSummaries();
    const concepts = this.getAllConceptMemories();
    const activeSession = this.getActiveSession();

    // Estimate storage used
    let storageUsed = 0;
    Object.values(STORAGE_KEYS).forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        storageUsed += item.length * 2; // approximate bytes (UTF-16)
      }
    });

    return {
      totalSessions: summaries.length,
      totalConcepts: concepts.length,
      storageUsed,
      hasActiveSession: activeSession !== null,
    };
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();
