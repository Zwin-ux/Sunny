/**
 * Real-Time Learning Analytics Engine
 * Analyzes student interactions, tracks performance, and provides predictive insights
 */

import {
  LearningAnalytics,
  TimeWindow,
  ErrorPattern,
  DifficultyPoint,
  RiskFactor,
  AnalyticsRecommendation,
  PerformanceMetrics,
  EngagementMetrics
} from './student-profile';
import {
  EnhancedStudentProfile,
  LearningState,
  EngagementData,
  AssessmentEvidence,
  ResponsePattern
} from './types';
import { DifficultyLevel } from '@/types/chat';

/**
 * Conversation Analysis Result
 */
export interface ConversationAnalysis {
  comprehensionLevel: number; // 0-1
  knowledgeGaps: string[];
  detectedConcepts: string[];
  emotionalState: EmotionalState;
  responseQuality: number; // 0-1
  engagementLevel: number; // 0-1
}

export interface EmotionalState {
  primary: 'positive' | 'neutral' | 'frustrated' | 'confused' | 'excited';
  confidence: number;
  indicators: string[];
}

/**
 * Response Time Analysis
 */
export interface ResponseTimeAnalysis {
  averageTime: number;
  variance: number;
  pattern: 'quick' | 'thoughtful' | 'hesitant' | 'struggling';
  confidence: number;
}

/**
 * Real-Time Learning Analytics Engine
 * Core engine for analyzing student behavior and learning patterns
 */
export class LearningAnalyticsEngine {
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private engagementHistory: Map<string, EngagementMetrics[]> = new Map();

  /**
   * Analyze a conversation for comprehension and engagement
   */
  analyzeConversation(
    studentId: string,
    messages: Array<{ role: string; content: string; timestamp: number }>,
    context?: any
  ): ConversationAnalysis {
    const userMessages = messages.filter(m => m.role === 'user');
    
    // Analyze comprehension based on response patterns
    const comprehensionLevel = this.assessComprehension(userMessages);
    
    // Detect knowledge gaps from conversation
    const knowledgeGaps = this.detectKnowledgeGaps(userMessages);
    
    // Identify concepts discussed
    const detectedConcepts = this.extractConcepts(messages);
    
    // Analyze emotional state
    const emotionalState = this.analyzeEmotionalState(userMessages);
    
    // Assess response quality
    const responseQuality = this.assessResponseQuality(userMessages);
    
    // Calculate engagement level
    const engagementLevel = this.calculateEngagement(userMessages, messages);

    return {
      comprehensionLevel,
      knowledgeGaps,
      detectedConcepts,
      emotionalState,
      responseQuality,
      engagementLevel
    };
  }

  /**
   * Track response time and identify patterns
   */
  analyzeResponseTime(
    responseTimes: number[],
    context?: string
  ): ResponseTimeAnalysis {
    if (responseTimes.length === 0) {
      return {
        averageTime: 0,
        variance: 0,
        pattern: 'quick',
        confidence: 0
      };
    }

    const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const variance = this.calculateVariance(responseTimes, averageTime);
    
    // Determine pattern based on average time and variance
    let pattern: ResponseTimeAnalysis['pattern'];
    if (averageTime < 3) {
      pattern = 'quick';
    } else if (averageTime < 10 && variance < 5) {
      pattern = 'thoughtful';
    } else if (variance > 10) {
      pattern = 'hesitant';
    } else {
      pattern = 'struggling';
    }

    return {
      averageTime,
      variance,
      pattern,
      confidence: Math.min(responseTimes.length / 10, 1)
    };
  }

  /**
   * Collect and analyze engagement metrics
   */
  collectEngagementMetrics(
    studentId: string,
    sessionId: string,
    interactions: Array<{
      type: string;
      timestamp: number;
      content: string;
      metadata?: any;
    }>
  ): EngagementMetrics {
    const userInteractions = interactions.filter(i => i.type === 'user');
    
    const messageCount = userInteractions.length;
    const averageMessageLength = userInteractions.reduce(
      (sum, i) => sum + i.content.length, 0
    ) / Math.max(messageCount, 1);
    
    const questionAsked = userInteractions.filter(
      i => i.content.includes('?')
    ).length;

    // Calculate focus duration (time between first and last interaction)
    const focusDuration = interactions.length > 0
      ? (interactions[interactions.length - 1].timestamp - interactions[0].timestamp) / 1000
      : 0;

    // Detect distraction events (long gaps between interactions)
    const distractionEvents = this.detectDistractionEvents(interactions);
    
    // Calculate reengagement time
    const reengagementTime = this.calculateReengagementTime(interactions);
    
    // Analyze emotional indicators
    const { positiveIndicators, negativeIndicators } = this.analyzeEmotionalIndicators(
      userInteractions.map(i => i.content)
    );
    
    const frustrationLevel = this.calculateFrustrationLevel(userInteractions);
    const enthusiasmLevel = this.calculateEnthusiasmLevel(userInteractions);

    const metrics: EngagementMetrics = {
      studentId,
      sessionId,
      messageCount,
      averageMessageLength,
      questionAsked,
      focusDuration,
      distractionEvents,
      reengagementTime,
      positiveIndicators,
      negativeIndicators,
      frustrationLevel,
      enthusiasmLevel
    };

    // Store in history
    const history = this.engagementHistory.get(studentId) || [];
    history.push(metrics);
    this.engagementHistory.set(studentId, history);

    return metrics;
  }

  /**
   * Generate predictive analytics for learning optimization
   */
  generatePredictiveAnalytics(
    studentId: string,
    profile: EnhancedStudentProfile,
    learningState: LearningState
  ): LearningAnalytics {
    const timeWindow: TimeWindow = {
      start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      end: Date.now(),
      duration: 7 * 24 * 60 * 60 * 1000
    };

    // Calculate performance metrics
    const comprehensionRate = this.calculateComprehensionRate(profile);
    const retentionRate = profile.learningVelocity.retentionRate;
    const transferRate = profile.learningVelocity.transferRate;

    // Calculate engagement metrics
    const attentionSpan = profile.attentionSpanData.averageSpan;
    const interactionFrequency = this.calculateInteractionFrequency(profile);
    const motivationLevel = this.calculateMotivationLevel(profile);

    // Calculate learning efficiency
    const conceptAcquisitionRate = profile.learningVelocity.conceptAcquisitionRate;
    const errorPatterns = this.identifyErrorPatterns(profile);
    const optimalDifficultyCurve = this.calculateOptimalDifficulty(profile);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(profile, learningState);

    // Generate recommendations
    const recommendations = this.generateRecommendations(profile, learningState, riskFactors);

    // Predict next optimal activities
    const nextOptimalActivities = this.predictOptimalActivities(profile, learningState);

    return {
      studentId,
      timeWindow,
      comprehensionRate,
      retentionRate,
      transferRate,
      attentionSpan,
      interactionFrequency,
      motivationLevel,
      conceptAcquisitionRate,
      errorPatterns,
      optimalDifficultyCurve,
      riskFactors,
      recommendations,
      nextOptimalActivities
    };
  }

  // Private helper methods for analysis

  private assessComprehension(messages: Array<{ content: string }>): number {
    if (messages.length === 0) return 0.5;

    let score = 0.5;
    
    // Check for indicators of understanding
    const understandingIndicators = [
      'i understand', 'i get it', 'that makes sense', 'i see',
      'oh okay', 'got it', 'makes sense', 'i know'
    ];
    
    // Check for indicators of confusion
    const confusionIndicators = [
      'i don\'t understand', 'confused', 'what does', 'i don\'t get',
      'help', 'stuck', 'lost', 'unclear'
    ];

    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      
      if (understandingIndicators.some(ind => content.includes(ind))) {
        score += 0.1;
      }
      
      if (confusionIndicators.some(ind => content.includes(ind))) {
        score -= 0.15;
      }
      
      // Longer, more detailed responses suggest better comprehension
      if (content.length > 100) {
        score += 0.05;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private detectKnowledgeGaps(messages: Array<{ content: string }>): string[] {
    const gaps: string[] = [];
    
    const gapIndicators = [
      { pattern: /don't know.*about/i, extract: true },
      { pattern: /never heard of/i, extract: true },
      { pattern: /what is/i, extract: true },
      { pattern: /confused about/i, extract: true },
      { pattern: /don't understand/i, extract: false }
    ];

    for (const msg of messages) {
      for (const indicator of gapIndicators) {
        if (indicator.pattern.test(msg.content)) {
          gaps.push(msg.content.substring(0, 50));
        }
      }
    }

    return gaps;
  }

  private extractConcepts(messages: Array<{ content: string }>): string[] {
    // Simple concept extraction - in production, use NLP
    const concepts = new Set<string>();
    
    // Common educational concepts
    const conceptKeywords = [
      'math', 'science', 'reading', 'writing', 'history',
      'addition', 'subtraction', 'multiplication', 'division',
      'fractions', 'decimals', 'geometry', 'algebra'
    ];

    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      for (const keyword of conceptKeywords) {
        if (content.includes(keyword)) {
          concepts.add(keyword);
        }
      }
    }

    return Array.from(concepts);
  }

  private analyzeEmotionalState(messages: Array<{ content: string }>): EmotionalState {
    const indicators: string[] = [];
    let positiveCount = 0;
    let negativeCount = 0;
    let confusedCount = 0;
    let excitedCount = 0;

    const positiveWords = ['great', 'awesome', 'love', 'fun', 'cool', 'yes', 'yay'];
    const negativeWords = ['hard', 'difficult', 'frustrated', 'boring', 'hate'];
    const confusedWords = ['confused', 'lost', 'don\'t understand', 'unclear'];
    const excitedWords = ['excited', 'can\'t wait', 'amazing', 'wow'];

    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      
      positiveWords.forEach(word => {
        if (content.includes(word)) {
          positiveCount++;
          indicators.push(`positive: ${word}`);
        }
      });
      
      negativeWords.forEach(word => {
        if (content.includes(word)) {
          negativeCount++;
          indicators.push(`negative: ${word}`);
        }
      });
      
      confusedWords.forEach(word => {
        if (content.includes(word)) {
          confusedCount++;
          indicators.push(`confused: ${word}`);
        }
      });
      
      excitedWords.forEach(word => {
        if (content.includes(word)) {
          excitedCount++;
          indicators.push(`excited: ${word}`);
        }
      });
    }

    // Determine primary emotional state
    let primary: EmotionalState['primary'] = 'neutral';
    let maxCount = 0;

    if (excitedCount > maxCount) {
      primary = 'excited';
      maxCount = excitedCount;
    }
    if (positiveCount > maxCount) {
      primary = 'positive';
      maxCount = positiveCount;
    }
    if (confusedCount > maxCount) {
      primary = 'confused';
      maxCount = confusedCount;
    }
    if (negativeCount > maxCount) {
      primary = 'frustrated';
      maxCount = negativeCount;
    }

    const totalIndicators = positiveCount + negativeCount + confusedCount + excitedCount;
    const confidence = Math.min(totalIndicators / 5, 1);

    return {
      primary,
      confidence,
      indicators
    };
  }

  private assessResponseQuality(messages: Array<{ content: string }>): number {
    if (messages.length === 0) return 0.5;

    let qualityScore = 0;
    
    for (const msg of messages) {
      const content = msg.content;
      
      // Length indicates thoughtfulness
      if (content.length > 50) qualityScore += 0.1;
      if (content.length > 150) qualityScore += 0.1;
      
      // Complete sentences
      if (content.includes('.') || content.includes('!') || content.includes('?')) {
        qualityScore += 0.05;
      }
      
      // Multiple sentences
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 1) qualityScore += 0.1;
    }

    return Math.min(qualityScore / messages.length, 1);
  }

  private calculateEngagement(
    userMessages: Array<{ timestamp: number }>,
    allMessages: Array<{ timestamp: number }>
  ): number {
    if (userMessages.length === 0) return 0;

    // Calculate engagement based on interaction frequency
    const sessionDuration = allMessages.length > 0
      ? (allMessages[allMessages.length - 1].timestamp - allMessages[0].timestamp) / 1000
      : 1;

    const interactionRate = userMessages.length / Math.max(sessionDuration / 60, 1);
    
    // Normalize to 0-1 scale (assuming 2 interactions per minute is high engagement)
    return Math.min(interactionRate / 2, 1);
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private detectDistractionEvents(
    interactions: Array<{ timestamp: number }>
  ): number {
    let distractions = 0;
    const DISTRACTION_THRESHOLD = 120000; // 2 minutes

    for (let i = 1; i < interactions.length; i++) {
      const gap = interactions[i].timestamp - interactions[i - 1].timestamp;
      if (gap > DISTRACTION_THRESHOLD) {
        distractions++;
      }
    }

    return distractions;
  }

  private calculateReengagementTime(
    interactions: Array<{ timestamp: number }>
  ): number {
    const gaps: number[] = [];
    const DISTRACTION_THRESHOLD = 120000; // 2 minutes

    for (let i = 1; i < interactions.length; i++) {
      const gap = interactions[i].timestamp - interactions[i - 1].timestamp;
      if (gap > DISTRACTION_THRESHOLD) {
        gaps.push(gap);
      }
    }

    if (gaps.length === 0) return 0;
    return gaps.reduce((a, b) => a + b, 0) / gaps.length / 1000; // Convert to seconds
  }

  private analyzeEmotionalIndicators(
    messages: string[]
  ): { positiveIndicators: number; negativeIndicators: number } {
    let positiveIndicators = 0;
    let negativeIndicators = 0;

    const positiveWords = ['great', 'awesome', 'love', 'fun', 'cool', 'yes', 'yay', 'thanks'];
    const negativeWords = ['hard', 'difficult', 'frustrated', 'boring', 'hate', 'no', 'stuck'];

    for (const msg of messages) {
      const content = msg.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveIndicators++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeIndicators++;
      });
    }

    return { positiveIndicators, negativeIndicators };
  }

  private calculateFrustrationLevel(
    interactions: Array<{ content: string }>
  ): number {
    let frustrationScore = 0;
    
    const frustrationIndicators = [
      'frustrated', 'stuck', 'hard', 'difficult', 'don\'t get it',
      'confused', 'help', 'i can\'t'
    ];

    for (const interaction of interactions) {
      const content = interaction.content.toLowerCase();
      frustrationIndicators.forEach(indicator => {
        if (content.includes(indicator)) frustrationScore += 0.2;
      });
    }

    return Math.min(frustrationScore, 1);
  }

  private calculateEnthusiasmLevel(
    interactions: Array<{ content: string }>
  ): number {
    let enthusiasmScore = 0;
    
    const enthusiasmIndicators = [
      'excited', 'love', 'awesome', 'cool', 'amazing', 'fun',
      '!', 'yay', 'yes'
    ];

    for (const interaction of interactions) {
      const content = interaction.content.toLowerCase();
      enthusiasmIndicators.forEach(indicator => {
        if (content.includes(indicator)) enthusiasmScore += 0.15;
      });
    }

    return Math.min(enthusiasmScore, 1);
  }

  private calculateComprehensionRate(profile: EnhancedStudentProfile): number {
    // Calculate based on recent session outcomes
    if (profile.sessionHistory.length === 0) return 0.5;

    const recentSessions = profile.sessionHistory.slice(-10);
    let totalProgress = 0;

    for (const session of recentSessions) {
      const sessionProgress = session.outcomes.reduce(
        (sum, outcome) => sum + outcome.progress, 0
      ) / Math.max(session.outcomes.length, 1);
      totalProgress += sessionProgress;
    }

    return totalProgress / recentSessions.length;
  }

  private calculateInteractionFrequency(profile: EnhancedStudentProfile): number {
    if (profile.sessionHistory.length === 0) return 0;

    const recentSessions = profile.sessionHistory.slice(-5);
    let totalInteractions = 0;
    let totalDuration = 0;

    for (const session of recentSessions) {
      totalInteractions += session.activities.length;
      totalDuration += (session.endTime - session.startTime) / 1000 / 60; // minutes
    }

    return totalDuration > 0 ? totalInteractions / totalDuration : 0;
  }

  private calculateMotivationLevel(profile: EnhancedStudentProfile): number {
    const { intrinsicMotivation, extrinsicMotivation } = profile.motivationFactors;
    return (intrinsicMotivation + extrinsicMotivation) / 2;
  }

  private identifyErrorPatterns(profile: EnhancedStudentProfile): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Analyze response patterns for error indicators
    for (const pattern of profile.responsePatterns) {
      if (pattern.type === 'impulsive' && pattern.effectiveness < 0.5) {
        patterns.push({
          type: 'impulsive_errors',
          frequency: pattern.frequency,
          contexts: pattern.contexts,
          suggestedInterventions: [
            'Encourage taking more time to think',
            'Provide reflection prompts',
            'Use think-aloud strategies'
          ]
        });
      }
      
      if (pattern.type === 'hesitant' && pattern.effectiveness < 0.5) {
        patterns.push({
          type: 'confidence_issues',
          frequency: pattern.frequency,
          contexts: pattern.contexts,
          suggestedInterventions: [
            'Build confidence with easier problems',
            'Provide positive reinforcement',
            'Use scaffolding techniques'
          ]
        });
      }
    }

    return patterns;
  }

  private calculateOptimalDifficulty(profile: EnhancedStudentProfile): DifficultyPoint[] {
    const points: DifficultyPoint[] = [];
    
    // Analyze session history to find optimal difficulty levels
    for (const session of profile.sessionHistory.slice(-20)) {
      for (const activity of session.activities) {
        points.push({
          timestamp: session.startTime,
          difficulty: activity.difficulty,
          performance: session.outcomes.reduce((sum, o) => sum + o.progress, 0) / 
                      Math.max(session.outcomes.length, 1),
          engagement: session.engagementData.currentLevel
        });
      }
    }

    return points;
  }

  private identifyRiskFactors(
    profile: EnhancedStudentProfile,
    learningState: LearningState
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Check for disengagement
    if (learningState.engagementMetrics.currentLevel < 0.3) {
      risks.push({
        type: 'disengagement',
        severity: 1 - learningState.engagementMetrics.currentLevel,
        description: 'Student showing signs of disengagement',
        indicators: ['Low interaction rate', 'Short responses', 'Declining participation'],
        recommendedActions: [
          'Switch to more engaging activity type',
          'Introduce gamification elements',
          'Take a short break'
        ]
      });
    }

    // Check for frustration
    if (learningState.engagementMetrics.frustrationLevel > 0.6) {
      risks.push({
        type: 'frustration',
        severity: learningState.engagementMetrics.frustrationLevel,
        description: 'Student experiencing frustration',
        indicators: ['Negative language', 'Repeated errors', 'Help requests'],
        recommendedActions: [
          'Reduce difficulty level',
          'Provide additional scaffolding',
          'Offer encouragement and support'
        ]
      });
    }

    // Check for knowledge gaps
    if (learningState.knowledgeMap.knowledgeGaps.length > 3) {
      risks.push({
        type: 'knowledge_gap',
        severity: Math.min(learningState.knowledgeMap.knowledgeGaps.length / 10, 1),
        description: 'Multiple knowledge gaps detected',
        indicators: learningState.knowledgeMap.knowledgeGaps.map(g => g.description || ''),
        recommendedActions: [
          'Review prerequisite concepts',
          'Provide foundational content',
          'Adjust learning path'
        ]
      });
    }

    // Check for pacing issues
    const avgResponseTime = learningState.engagementMetrics.responseTime;
    if (avgResponseTime > 30 || avgResponseTime < 2) {
      risks.push({
        type: 'pacing',
        severity: 0.5,
        description: avgResponseTime > 30 ? 'Learning pace too slow' : 'Learning pace too fast',
        indicators: [`Average response time: ${avgResponseTime}s`],
        recommendedActions: [
          avgResponseTime > 30 ? 'Simplify content' : 'Increase challenge level',
          'Adjust activity duration',
          'Modify difficulty progression'
        ]
      });
    }

    return risks;
  }

  private generateRecommendations(
    profile: EnhancedStudentProfile,
    learningState: LearningState,
    riskFactors: RiskFactor[]
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = [];

    // Generate recommendations based on risk factors
    for (const risk of riskFactors) {
      if (risk.severity > 0.6) {
        recommendations.push({
          type: 'intervention',
          priority: 'high',
          description: risk.recommendedActions[0],
          rationale: risk.description,
          expectedImpact: 0.7
        });
      }
    }

    // Recommend based on activity preferences
    const topPreference = profile.preferredActivityTypes
      .sort((a, b) => b.effectiveness - a.effectiveness)[0];
    
    if (topPreference && topPreference.effectiveness > 0.7) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        description: `Use more ${topPreference.activityType} activities`,
        rationale: `Student shows high effectiveness with ${topPreference.activityType}`,
        expectedImpact: 0.6
      });
    }

    // Recommend based on learning velocity
    if (profile.learningVelocity.conceptAcquisitionRate > 2) {
      recommendations.push({
        type: 'pacing',
        priority: 'medium',
        description: 'Increase learning pace and challenge level',
        rationale: 'Student acquiring concepts faster than average',
        expectedImpact: 0.5
      });
    } else if (profile.learningVelocity.conceptAcquisitionRate < 0.5) {
      recommendations.push({
        type: 'pacing',
        priority: 'high',
        description: 'Slow down and provide more practice',
        rationale: 'Student needs more time to master concepts',
        expectedImpact: 0.7
      });
    }

    return recommendations;
  }

  private predictOptimalActivities(
    profile: EnhancedStudentProfile,
    learningState: LearningState
  ): string[] {
    const activities: string[] = [];

    // Sort activity preferences by effectiveness
    const sortedPreferences = [...profile.preferredActivityTypes]
      .sort((a, b) => b.effectiveness - a.effectiveness);

    // Recommend top 3 most effective activity types
    for (let i = 0; i < Math.min(3, sortedPreferences.length); i++) {
      activities.push(sortedPreferences[i].activityType);
    }

    // Consider current engagement level
    if (learningState.engagementMetrics.currentLevel < 0.5) {
      // Prioritize engaging activities
      if (!activities.includes('game')) activities.unshift('game');
      if (!activities.includes('creative')) activities.push('creative');
    }

    // Consider knowledge gaps
    if (learningState.knowledgeMap.knowledgeGaps.length > 0) {
      if (!activities.includes('practice')) activities.push('practice');
      if (!activities.includes('lesson')) activities.push('lesson');
    }

    return activities.slice(0, 5);
  }
}

/**
 * Accuracy Tracking System
 */
export class AccuracyTracker {
  private accuracyHistory: Map<string, Array<{
    timestamp: number;
    correct: boolean;
    topic: string;
    difficulty: DifficultyLevel;
  }>> = new Map();

  /**
   * Record a response accuracy
   */
  recordResponse(
    studentId: string,
    correct: boolean,
    topic: string,
    difficulty: DifficultyLevel
  ): void {
    const history = this.accuracyHistory.get(studentId) || [];
    history.push({
      timestamp: Date.now(),
      correct,
      topic,
      difficulty
    });
    
    // Keep only recent history (last 100 responses)
    if (history.length > 100) {
      history.shift();
    }
    
    this.accuracyHistory.set(studentId, history);
  }

  /**
   * Calculate overall accuracy rate
   */
  getAccuracyRate(studentId: string, timeWindow?: number): number {
    const history = this.accuracyHistory.get(studentId) || [];
    if (history.length === 0) return 0;

    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const relevantHistory = history.filter(h => h.timestamp > cutoff);
    
    const correct = relevantHistory.filter(h => h.correct).length;
    return correct / relevantHistory.length;
  }

  /**
   * Get accuracy by topic
   */
  getAccuracyByTopic(studentId: string, topic: string): number {
    const history = this.accuracyHistory.get(studentId) || [];
    const topicHistory = history.filter(h => h.topic === topic);
    
    if (topicHistory.length === 0) return 0;
    
    const correct = topicHistory.filter(h => h.correct).length;
    return correct / topicHistory.length;
  }

  /**
   * Get accuracy by difficulty
   */
  getAccuracyByDifficulty(studentId: string, difficulty: DifficultyLevel): number {
    const history = this.accuracyHistory.get(studentId) || [];
    const difficultyHistory = history.filter(h => h.difficulty === difficulty);
    
    if (difficultyHistory.length === 0) return 0;
    
    const correct = difficultyHistory.filter(h => h.correct).length;
    return correct / difficultyHistory.length;
  }
}

/**
 * Singleton instances for global access
 */
export const learningAnalyticsEngine = new LearningAnalyticsEngine();
export const accuracyTracker = new AccuracyTracker();
