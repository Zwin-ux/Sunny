/**
 * Analytics Integration Module
 * Unified interface for data persistence and real-time analytics
 * 
 * Requirements: 5.1, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import {
  EnhancedStudentProfile,
  LearningState,
  LearningSession,
  ProgressEvent,
  InterventionEvent,
  ResponsePattern,
  EngagementPattern,
  ActivityPreference
} from './types';
import {
  LearningAnalytics,
  PerformanceMetrics,
  EngagementMetrics
} from './student-profile';
import { dataPersistenceManager } from './data-persistence';
import {
  realTimeAnalyticsProcessor,
  AnalyticsStreamEvent,
  DashboardMetrics,
  AlertEvent
} from './real-time-analytics';
import {
  mlPredictionService,
  LearningOutcomePrediction,
  EngagementPrediction,
  RiskPrediction
} from './ml-predictions';

/**
 * Analytics Integration Service
 * Provides unified access to all analytics capabilities
 */
export class AnalyticsIntegrationService {
  /**
   * Initialize analytics for a new session
   */
  async initializeSession(
    userId: string,
    sessionId: string,
    profile: EnhancedStudentProfile
  ): Promise<void> {
    // Ensure profile is persisted
    await dataPersistenceManager.upsertStudentProfile(userId, profile);

    // Initialize real-time tracking
    const event: AnalyticsStreamEvent = {
      id: `init-${Date.now()}`,
      userId,
      sessionId,
      eventType: 'interaction',
      data: {
        type: 'session_start',
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    await realTimeAnalyticsProcessor.processEvent(event);
  }

  /**
   * Track student interaction
   */
  async trackInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: string;
      content?: string;
      metadata?: any;
      responseTime?: number;
      comprehensionLevel?: number;
      engagementLevel?: number;
      emotionalState?: string;
    }
  ): Promise<void> {
    const event: AnalyticsStreamEvent = {
      id: `interaction-${Date.now()}`,
      userId,
      sessionId,
      eventType: 'interaction',
      data: interaction,
      timestamp: Date.now()
    };

    await realTimeAnalyticsProcessor.processEvent(event);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    userId: string,
    sessionId: string,
    metrics: PerformanceMetrics
  ): Promise<void> {
    const event: AnalyticsStreamEvent = {
      id: `performance-${Date.now()}`,
      userId,
      sessionId,
      eventType: 'performance',
      data: { metrics },
      timestamp: Date.now()
    };

    await realTimeAnalyticsProcessor.processEvent(event);
  }

  /**
   * Track engagement metrics
   */
  async trackEngagement(
    userId: string,
    sessionId: string,
    metrics: EngagementMetrics
  ): Promise<void> {
    const event: AnalyticsStreamEvent = {
      id: `engagement-${Date.now()}`,
      userId,
      sessionId,
      eventType: 'engagement',
      data: { metrics },
      timestamp: Date.now()
    };

    await realTimeAnalyticsProcessor.processEvent(event);
  }

  /**
   * Track assessment results
   */
  async trackAssessment(
    userId: string,
    sessionId: string,
    assessment: {
      conceptId: string;
      conceptMastery?: any;
      knowledgeGaps?: any[];
    }
  ): Promise<void> {
    const event: AnalyticsStreamEvent = {
      id: `assessment-${Date.now()}`,
      userId,
      sessionId,
      eventType: 'assessment',
      data: assessment,
      timestamp: Date.now()
    };

    await realTimeAnalyticsProcessor.processEvent(event);
  }

  /**
   * Get real-time dashboard metrics
   */
  getDashboardMetrics(userId: string, sessionId: string): DashboardMetrics | null {
    return realTimeAnalyticsProcessor.getDashboardMetrics(userId, sessionId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(userId: string): AlertEvent[] {
    return realTimeAnalyticsProcessor.getActiveAlerts(userId);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    realTimeAnalyticsProcessor.acknowledgeAlert(alertId);
  }

  /**
   * Check alerts for current state
   */
  async checkAlerts(
    userId: string,
    sessionId: string,
    state: LearningState,
    profile: EnhancedStudentProfile
  ): Promise<void> {
    await realTimeAnalyticsProcessor.checkAlerts(userId, sessionId, state, profile);
  }

  /**
   * Predict learning outcome
   */
  async predictLearningOutcome(
    profile: EnhancedStudentProfile,
    state: LearningState,
    conceptId: string
  ): Promise<LearningOutcomePrediction> {
    return mlPredictionService.predictLearningOutcome(profile, state, conceptId);
  }

  /**
   * Predict engagement
   */
  async predictEngagement(
    profile: EnhancedStudentProfile,
    state: LearningState,
    activityType: any
  ): Promise<EngagementPrediction> {
    return mlPredictionService.predictEngagement(profile, state, activityType);
  }

  /**
   * Predict risks
   */
  async predictRisks(
    profile: EnhancedStudentProfile,
    state: LearningState
  ): Promise<RiskPrediction[]> {
    return mlPredictionService.predictRisks(profile, state);
  }

  /**
   * Update student profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<EnhancedStudentProfile>
  ): Promise<void> {
    await dataPersistenceManager.upsertStudentProfile(userId, updates);
  }

  /**
   * Record response pattern
   */
  async recordResponsePattern(
    userId: string,
    pattern: ResponsePattern
  ): Promise<void> {
    await dataPersistenceManager.upsertResponsePattern(userId, pattern);
  }

  /**
   * Record engagement pattern
   */
  async recordEngagementPattern(
    userId: string,
    pattern: EngagementPattern
  ): Promise<void> {
    await dataPersistenceManager.insertEngagementPattern(userId, pattern);
  }

  /**
   * Update activity preference
   */
  async updateActivityPreference(
    userId: string,
    preference: ActivityPreference
  ): Promise<void> {
    await dataPersistenceManager.upsertActivityPreference(userId, preference);
  }

  /**
   * Record progress event
   */
  async recordProgressEvent(
    userId: string,
    event: ProgressEvent
  ): Promise<void> {
    await dataPersistenceManager.insertProgressEvent(userId, event);
  }

  /**
   * Record intervention event
   */
  async recordInterventionEvent(
    userId: string,
    sessionId: string,
    event: InterventionEvent
  ): Promise<void> {
    await dataPersistenceManager.insertInterventionEvent(userId, sessionId, event);
  }

  /**
   * Get student profile
   */
  async getStudentProfile(userId: string): Promise<any> {
    return dataPersistenceManager.getStudentProfile(userId);
  }

  /**
   * Get concept mastery
   */
  async getConceptMastery(userId: string, conceptId?: string): Promise<any[]> {
    return dataPersistenceManager.getConceptMastery(userId, conceptId);
  }

  /**
   * Get active knowledge gaps
   */
  async getActiveKnowledgeGaps(userId: string): Promise<any[]> {
    return dataPersistenceManager.getActiveKnowledgeGaps(userId);
  }

  /**
   * Get interaction history
   */
  async getInteractionHistory(
    userId: string,
    sessionId?: string,
    limit?: number
  ): Promise<any[]> {
    return dataPersistenceManager.getInteractionHistory(userId, sessionId, limit);
  }

  /**
   * Get progress timeline
   */
  async getProgressTimeline(userId: string, limit?: number): Promise<any[]> {
    return dataPersistenceManager.getProgressTimeline(userId, limit);
  }

  /**
   * Get intervention history
   */
  async getInterventionHistory(
    userId: string,
    sessionId?: string,
    limit?: number
  ): Promise<any[]> {
    return dataPersistenceManager.getInterventionHistory(userId, sessionId, limit);
  }

  /**
   * Get recent analytics
   */
  async getRecentAnalytics(userId: string, days?: number): Promise<any[]> {
    return dataPersistenceManager.getRecentAnalytics(userId, days);
  }

  /**
   * Store learning analytics
   */
  async storeLearningAnalytics(
    userId: string,
    analytics: LearningAnalytics
  ): Promise<void> {
    await dataPersistenceManager.insertLearningAnalytics(userId, analytics);
  }

  /**
   * Register event handler for real-time events
   */
  onAnalyticsEvent(
    eventType: string,
    handler: (event: AnalyticsStreamEvent) => void
  ): void {
    realTimeAnalyticsProcessor.onEvent(eventType, handler);
  }
}

/**
 * Singleton instance for global access
 */
export const analyticsIntegration = new AnalyticsIntegrationService();

/**
 * Convenience exports
 */
export type {
  DashboardMetrics,
  AlertEvent,
  AnalyticsStreamEvent,
  LearningOutcomePrediction,
  EngagementPrediction,
  RiskPrediction
};
