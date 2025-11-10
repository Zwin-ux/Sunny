/**
 * Real-Time Analytics Processing System
 * Streaming analytics for live learning assessment with ML integration
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import {
  LearningState,
  EnhancedStudentProfile,
  EngagementData,
  AgentEvent,
  Priority
} from './types';
import {
  LearningAnalytics,
  PerformanceMetrics,
  EngagementMetrics,
  RiskFactor,
  AnalyticsRecommendation
} from './student-profile';
import { learningAnalyticsEngine } from './analytics-engine';
import { dataPersistenceManager } from './data-persistence';

/**
 * Analytics Stream Event
 */
export interface AnalyticsStreamEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'interaction' | 'performance' | 'engagement' | 'assessment';
  data: any;
  timestamp: number;
}

/**
 * Alert Configuration
 */
export interface AlertConfig {
  id: string;
  name: string;
  condition: (state: LearningState, profile: EnhancedStudentProfile) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: string[];
}

/**
 * Alert Event
 */
export interface AlertEvent {
  id: string;
  alertConfigId: string;
  userId: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: string[];
  timestamp: number;
  acknowledged: boolean;
}

/**
 * Dashboard Metrics
 */
export interface DashboardMetrics {
  userId: string;
  sessionId: string;
  
  // Real-time metrics
  currentEngagement: number;
  currentComprehension: number;
  currentFrustration: number;
  
  // Session summary
  sessionDuration: number;
  activitiesCompleted: number;
  conceptsCovered: string[];
  
  // Performance
  accuracyRate: number;
  averageResponseTime: number;
  
  // Trends
  engagementTrend: 'improving' | 'stable' | 'declining';
  performanceTrend: 'improving' | 'stable' | 'declining';
  
  // Alerts
  activeAlerts: AlertEvent[];
  
  // Recommendations
  recommendations: AnalyticsRecommendation[];
  
  timestamp: number;
}

/**
 * Real-Time Analytics Processor
 * Processes streaming analytics data and generates insights
 */
export class RealTimeAnalyticsProcessor {
  private eventBuffer: Map<string, AnalyticsStreamEvent[]> = new Map();
  private alertConfigs: AlertConfig[] = [];
  private activeAlerts: Map<string, AlertEvent[]> = new Map();
  private dashboardCache: Map<string, DashboardMetrics> = new Map();
  private eventHandlers: Map<string, ((event: AnalyticsStreamEvent) => void)[]> = new Map();

  constructor() {
    this.initializeDefaultAlerts();
  }

  /**
   * Process incoming analytics event
   */
  async processEvent(event: AnalyticsStreamEvent): Promise<void> {
    // Add to buffer
    const buffer = this.eventBuffer.get(event.userId) || [];
    buffer.push(event);
    
    // Keep only recent events (last 100)
    if (buffer.length > 100) {
      buffer.shift();
    }
    this.eventBuffer.set(event.userId, buffer);

    // Trigger event handlers
    const handlers = this.eventHandlers.get(event.eventType) || [];
    handlers.forEach(handler => handler(event));

    // Process based on event type
    switch (event.eventType) {
      case 'interaction':
        await this.processInteractionEvent(event);
        break;
      case 'performance':
        await this.processPerformanceEvent(event);
        break;
      case 'engagement':
        await this.processEngagementEvent(event);
        break;
      case 'assessment':
        await this.processAssessmentEvent(event);
        break;
    }
  }

  /**
   * Register event handler
   */
  onEvent(eventType: string, handler: (event: AnalyticsStreamEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Process interaction event
   */
  private async processInteractionEvent(event: AnalyticsStreamEvent): Promise<void> {
    // Store interaction in database
    await dataPersistenceManager.insertInteraction(
      event.userId,
      event.sessionId,
      {
        type: event.data.type,
        content: event.data.content,
        metadata: event.data.metadata,
        responseTime: event.data.responseTime,
        comprehensionLevel: event.data.comprehensionLevel,
        engagementLevel: event.data.engagementLevel,
        emotionalState: event.data.emotionalState
      }
    );

    // Update dashboard metrics
    await this.updateDashboardMetrics(event.userId, event.sessionId);
  }

  /**
   * Process performance event
   */
  private async processPerformanceEvent(event: AnalyticsStreamEvent): Promise<void> {
    // Store performance metrics
    if (event.data.metrics) {
      await dataPersistenceManager.insertPerformanceMetrics(
        event.userId,
        event.sessionId,
        event.data.metrics
      );
    }

    // Update dashboard
    await this.updateDashboardMetrics(event.userId, event.sessionId);
  }

  /**
   * Process engagement event
   */
  private async processEngagementEvent(event: AnalyticsStreamEvent): Promise<void> {
    // Store engagement metrics
    if (event.data.metrics) {
      await dataPersistenceManager.insertEngagementMetrics(
        event.userId,
        event.sessionId,
        event.data.metrics
      );
    }

    // Check for engagement alerts
    await this.checkEngagementAlerts(event);

    // Update dashboard
    await this.updateDashboardMetrics(event.userId, event.sessionId);
  }

  /**
   * Process assessment event
   */
  private async processAssessmentEvent(event: AnalyticsStreamEvent): Promise<void> {
    // Update concept mastery if provided
    if (event.data.conceptMastery) {
      await dataPersistenceManager.upsertConceptMastery(
        event.userId,
        event.data.conceptId,
        event.data.conceptMastery
      );
    }

    // Check for knowledge gaps
    if (event.data.knowledgeGaps && event.data.knowledgeGaps.length > 0) {
      for (const gap of event.data.knowledgeGaps) {
        await dataPersistenceManager.insertKnowledgeGap(event.userId, gap);
      }
    }

    // Update dashboard
    await this.updateDashboardMetrics(event.userId, event.sessionId);
  }

  /**
   * Check for engagement-related alerts
   */
  private async checkEngagementAlerts(event: AnalyticsStreamEvent): Promise<void> {
    const metrics = event.data.metrics as EngagementMetrics;
    
    // Check frustration level
    if (metrics.frustrationLevel && metrics.frustrationLevel > 0.7) {
      await this.triggerAlert({
        alertConfigId: 'high-frustration',
        userId: event.userId,
        sessionId: event.sessionId,
        severity: 'high',
        message: 'Student showing high frustration levels',
        actions: [
          'Reduce difficulty',
          'Provide scaffolding support',
          'Take a break'
        ]
      });
    }

    // Check distraction events
    if (metrics.distractionEvents > 3) {
      await this.triggerAlert({
        alertConfigId: 'frequent-distractions',
        userId: event.userId,
        sessionId: event.sessionId,
        severity: 'medium',
        message: 'Student experiencing frequent distractions',
        actions: [
          'Switch to more engaging activity',
          'Shorten activity duration',
          'Introduce gamification'
        ]
      });
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alertData: Omit<AlertEvent, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const alert: AlertEvent = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: Date.now(),
      acknowledged: false
    };

    // Add to active alerts
    const userAlerts = this.activeAlerts.get(alertData.userId) || [];
    userAlerts.push(alert);
    this.activeAlerts.set(alertData.userId, userAlerts);

    // Update dashboard
    await this.updateDashboardMetrics(alertData.userId, alertData.sessionId);
  }

  /**
   * Update dashboard metrics
   */
  private async updateDashboardMetrics(userId: string, sessionId: string): Promise<void> {
    // Get recent events for this user
    const events = this.eventBuffer.get(userId) || [];
    const sessionEvents = events.filter(e => e.sessionId === sessionId);

    if (sessionEvents.length === 0) return;

    // Calculate current metrics
    const latestEngagement = this.getLatestMetric(sessionEvents, 'engagement', 'engagementLevel');
    const latestComprehension = this.getLatestMetric(sessionEvents, 'interaction', 'comprehensionLevel');
    const latestFrustration = this.getLatestMetric(sessionEvents, 'engagement', 'frustrationLevel');

    // Calculate session summary
    const sessionStart = Math.min(...sessionEvents.map(e => e.timestamp));
    const sessionDuration = (Date.now() - sessionStart) / 1000; // seconds

    const activitiesCompleted = sessionEvents.filter(
      e => e.eventType === 'interaction' && e.data.type === 'activity_complete'
    ).length;

    const conceptsCovered = new Set(
      sessionEvents
        .filter(e => e.eventType === 'assessment' && e.data.conceptId)
        .map(e => e.data.conceptId)
    );

    // Calculate performance metrics
    const performanceEvents = sessionEvents.filter(e => e.eventType === 'performance');
    const latestPerformance = performanceEvents[performanceEvents.length - 1];
    const accuracyRate = latestPerformance?.data.metrics?.accuracyRate || 0;
    const averageResponseTime = latestPerformance?.data.metrics?.averageResponseTime || 0;

    // Calculate trends
    const engagementTrend = this.calculateTrend(
      sessionEvents.filter(e => e.eventType === 'engagement'),
      'engagementLevel'
    );
    const performanceTrend = this.calculateTrend(
      performanceEvents,
      'accuracyRate'
    );

    // Get active alerts
    const activeAlerts = (this.activeAlerts.get(userId) || [])
      .filter(a => a.sessionId === sessionId && !a.acknowledged);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(userId, sessionId, sessionEvents);

    // Create dashboard metrics
    const metrics: DashboardMetrics = {
      userId,
      sessionId,
      currentEngagement: latestEngagement,
      currentComprehension: latestComprehension,
      currentFrustration: latestFrustration,
      sessionDuration,
      activitiesCompleted,
      conceptsCovered: Array.from(conceptsCovered),
      accuracyRate,
      averageResponseTime,
      engagementTrend,
      performanceTrend,
      activeAlerts,
      recommendations,
      timestamp: Date.now()
    };

    // Cache dashboard metrics
    this.dashboardCache.set(`${userId}-${sessionId}`, metrics);
  }

  /**
   * Get latest metric value from events
   */
  private getLatestMetric(
    events: AnalyticsStreamEvent[],
    eventType: string,
    metricKey: string
  ): number {
    const relevantEvents = events
      .filter(e => e.eventType === eventType)
      .reverse();

    for (const event of relevantEvents) {
      const value = event.data.metrics?.[metricKey] || event.data[metricKey];
      if (typeof value === 'number') {
        return value;
      }
    }

    return 0.5; // Default neutral value
  }

  /**
   * Calculate trend from events
   */
  private calculateTrend(
    events: AnalyticsStreamEvent[],
    metricKey: string
  ): 'improving' | 'stable' | 'declining' {
    if (events.length < 3) return 'stable';

    const recentEvents = events.slice(-5);
    const values = recentEvents.map(e => 
      e.data.metrics?.[metricKey] || e.data[metricKey] || 0
    );

    // Calculate simple linear trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Generate recommendations based on current state
   */
  private async generateRecommendations(
    userId: string,
    sessionId: string,
    events: AnalyticsStreamEvent[]
  ): Promise<AnalyticsRecommendation[]> {
    const recommendations: AnalyticsRecommendation[] = [];

    // Analyze engagement
    const avgEngagement = this.calculateAverageMetric(events, 'engagement', 'engagementLevel');
    if (avgEngagement < 0.4) {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        description: 'Switch to more engaging activity type',
        rationale: 'Engagement levels are consistently low',
        expectedImpact: 0.7
      });
    }

    // Analyze performance
    const avgAccuracy = this.calculateAverageMetric(events, 'performance', 'accuracyRate');
    if (avgAccuracy < 0.5) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        description: 'Reduce difficulty and provide more scaffolding',
        rationale: 'Student struggling with current difficulty level',
        expectedImpact: 0.8
      });
    } else if (avgAccuracy > 0.9) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        description: 'Increase challenge level',
        rationale: 'Student mastering current content easily',
        expectedImpact: 0.6
      });
    }

    // Analyze response times
    const avgResponseTime = this.calculateAverageMetric(events, 'performance', 'averageResponseTime');
    if (avgResponseTime > 30) {
      recommendations.push({
        type: 'pacing',
        priority: 'medium',
        description: 'Simplify questions or provide hints',
        rationale: 'Student taking longer than expected to respond',
        expectedImpact: 0.5
      });
    }

    return recommendations;
  }

  /**
   * Calculate average metric value
   */
  private calculateAverageMetric(
    events: AnalyticsStreamEvent[],
    eventType: string,
    metricKey: string
  ): number {
    const values = events
      .filter(e => e.eventType === eventType)
      .map(e => e.data.metrics?.[metricKey] || e.data[metricKey])
      .filter(v => typeof v === 'number');

    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(userId: string, sessionId: string): DashboardMetrics | null {
    return this.dashboardCache.get(`${userId}-${sessionId}`) || null;
  }

  /**
   * Get active alerts for user
   */
  getActiveAlerts(userId: string): AlertEvent[] {
    return (this.activeAlerts.get(userId) || [])
      .filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    for (const [userId, alerts] of this.activeAlerts.entries()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        break;
      }
    }
  }

  /**
   * Initialize default alert configurations
   */
  private initializeDefaultAlerts(): void {
    this.alertConfigs = [
      {
        id: 'high-frustration',
        name: 'High Frustration Level',
        condition: (state) => state.engagementMetrics.frustrationLevel > 0.7,
        severity: 'high',
        message: 'Student showing high frustration levels',
        actions: ['Reduce difficulty', 'Provide support', 'Take break']
      },
      {
        id: 'low-engagement',
        name: 'Low Engagement',
        condition: (state) => state.engagementMetrics.currentLevel < 0.3,
        severity: 'medium',
        message: 'Student engagement is low',
        actions: ['Switch activity', 'Add gamification', 'Change approach']
      },
      {
        id: 'knowledge-gaps',
        name: 'Multiple Knowledge Gaps',
        condition: (state) => state.knowledgeMap.knowledgeGaps.length > 3,
        severity: 'high',
        message: 'Multiple knowledge gaps detected',
        actions: ['Review prerequisites', 'Adjust learning path', 'Provide foundational content']
      },
      {
        id: 'slow-progress',
        name: 'Slow Progress',
        condition: (state) => {
          const objectives = state.currentObjectives;
          const avgProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0) / Math.max(objectives.length, 1);
          return avgProgress < 0.2;
        },
        severity: 'medium',
        message: 'Learning progress is slower than expected',
        actions: ['Simplify content', 'Provide more practice', 'Adjust pacing']
      }
    ];
  }

  /**
   * Check all alert conditions for a learning state
   */
  async checkAlerts(
    userId: string,
    sessionId: string,
    state: LearningState,
    profile: EnhancedStudentProfile
  ): Promise<void> {
    for (const config of this.alertConfigs) {
      if (config.condition(state, profile)) {
        // Check if alert already exists
        const existingAlerts = this.activeAlerts.get(userId) || [];
        const hasActiveAlert = existingAlerts.some(
          a => a.alertConfigId === config.id && 
               a.sessionId === sessionId && 
               !a.acknowledged
        );

        if (!hasActiveAlert) {
          await this.triggerAlert({
            alertConfigId: config.id,
            userId,
            sessionId,
            severity: config.severity,
            message: config.message,
            actions: config.actions
          });
        }
      }
    }
  }
}

/**
 * Singleton instance
 */
export const realTimeAnalyticsProcessor = new RealTimeAnalyticsProcessor();
