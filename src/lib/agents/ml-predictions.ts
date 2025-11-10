/**
 * Machine Learning Model Integration for Predictions
 * Provides predictive analytics for learning optimization
 * 
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import {
  EnhancedStudentProfile,
  LearningState,
  ActivityType
} from './types';
import { DifficultyLevel } from '@/types/chat';
import {
  LearningAnalytics,
  RiskFactor
} from './student-profile';

/**
 * Prediction Result
 */
export interface PredictionResult {
  prediction: any;
  confidence: number;
  factors: string[];
  timestamp: number;
}

/**
 * Learning Outcome Prediction
 */
export interface LearningOutcomePrediction {
  conceptId: string;
  predictedMasteryLevel: number; // 0-1
  timeToMastery: number; // minutes
  confidence: number;
  recommendedActivities: ActivityType[];
}

/**
 * Engagement Prediction
 */
export interface EngagementPrediction {
  nextActivityEngagement: number; // 0-1
  optimalActivityType: ActivityType;
  optimalDifficulty: DifficultyLevel;
  confidence: number;
}

/**
 * Risk Prediction
 */
export interface RiskPrediction {
  riskType: 'disengagement' | 'frustration' | 'knowledge_gap' | 'pacing';
  probability: number; // 0-1
  timeframe: number; // minutes until risk materializes
  preventiveActions: string[];
}

/**
 * ML Model Interface
 * Abstract interface for different ML model implementations
 */
export interface MLModel {
  name: string;
  version: string;
  predict(input: any): Promise<PredictionResult>;
  train?(data: any[]): Promise<void>;
}

/**
 * Simple Linear Regression Model
 * Basic implementation for demonstration
 */
class SimpleLinearModel implements MLModel {
  name = 'SimpleLinear';
  version = '1.0';
  
  private weights: Map<string, number> = new Map();
  private bias: number = 0;

  async predict(input: Record<string, number>): Promise<PredictionResult> {
    let prediction = this.bias;
    const factors: string[] = [];

    for (const [feature, value] of Object.entries(input)) {
      const weight = this.weights.get(feature) || 0;
      prediction += weight * value;
      
      if (Math.abs(weight * value) > 0.1) {
        factors.push(feature);
      }
    }

    // Normalize to 0-1 range
    prediction = Math.max(0, Math.min(1, prediction));

    return {
      prediction,
      confidence: 0.7, // Fixed confidence for simple model
      factors,
      timestamp: Date.now()
    };
  }

  setWeights(weights: Record<string, number>, bias: number = 0): void {
    this.weights = new Map(Object.entries(weights));
    this.bias = bias;
  }
}

/**
 * ML Prediction Service
 * Manages ML models and provides prediction capabilities
 */
export class MLPredictionService {
  private models: Map<string, MLModel> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize ML models
   */
  private initializeModels(): void {
    // Engagement prediction model
    const engagementModel = new SimpleLinearModel();
    engagementModel.setWeights({
      currentEngagement: 0.4,
      motivationLevel: 0.3,
      activityPreference: 0.2,
      recentPerformance: 0.1
    }, 0.3);
    this.models.set('engagement', engagementModel);

    // Performance prediction model
    const performanceModel = new SimpleLinearModel();
    performanceModel.setWeights({
      currentMastery: 0.5,
      retentionRate: 0.2,
      practiceTime: 0.2,
      cognitiveLoad: -0.1
    }, 0.2);
    this.models.set('performance', performanceModel);

    // Risk prediction model
    const riskModel = new SimpleLinearModel();
    riskModel.setWeights({
      frustrationLevel: 0.4,
      engagementDrop: 0.3,
      errorRate: 0.2,
      responseTime: 0.1
    }, 0.1);
    this.models.set('risk', riskModel);
  }

  /**
   * Predict learning outcome for a concept
   */
  async predictLearningOutcome(
    profile: EnhancedStudentProfile,
    state: LearningState,
    conceptId: string
  ): Promise<LearningOutcomePrediction> {
    const model = this.models.get('performance');
    if (!model) {
      throw new Error('Performance model not found');
    }

    // Get current mastery
    const currentMastery = state.knowledgeMap.masteryLevels.get(conceptId);
    const masteryValue = this.masteryLevelToNumber(currentMastery?.level || 'unknown');

    // Prepare input features
    const input = {
      currentMastery: masteryValue,
      retentionRate: profile.learningVelocity.retentionRate,
      practiceTime: this.calculatePracticeTime(profile, conceptId),
      cognitiveLoad: this.calculateCognitiveLoad(state)
    };

    // Get prediction
    const result = await model.predict(input);

    // Calculate time to mastery
    const timeToMastery = this.estimateTimeToMastery(
      masteryValue,
      result.prediction,
      profile.learningVelocity.conceptAcquisitionRate
    );

    // Recommend activities
    const recommendedActivities = this.recommendActivitiesForConcept(
      profile,
      conceptId,
      masteryValue
    );

    return {
      conceptId,
      predictedMasteryLevel: result.prediction,
      timeToMastery,
      confidence: result.confidence,
      recommendedActivities
    };
  }

  /**
   * Predict engagement for next activity
   */
  async predictEngagement(
    profile: EnhancedStudentProfile,
    state: LearningState,
    activityType: ActivityType
  ): Promise<EngagementPrediction> {
    const model = this.models.get('engagement');
    if (!model) {
      throw new Error('Engagement model not found');
    }

    // Get activity preference
    const preference = profile.preferredActivityTypes.find(
      p => p.activityType === activityType
    );

    // Prepare input features
    const input = {
      currentEngagement: state.engagementMetrics.currentLevel,
      motivationLevel: state.engagementMetrics.motivationLevel,
      activityPreference: preference?.preference || 0.5,
      recentPerformance: this.calculateRecentPerformance(profile)
    };

    // Get prediction
    const result = await model.predict(input);

    // Find optimal activity type
    const optimalActivityType = this.findOptimalActivityType(profile, state);

    // Determine optimal difficulty
    const optimalDifficulty = this.determineOptimalDifficulty(profile, state);

    return {
      nextActivityEngagement: result.prediction,
      optimalActivityType,
      optimalDifficulty,
      confidence: result.confidence
    };
  }

  /**
   * Predict risks
   */
  async predictRisks(
    profile: EnhancedStudentProfile,
    state: LearningState
  ): Promise<RiskPrediction[]> {
    const model = this.models.get('risk');
    if (!model) {
      throw new Error('Risk model not found');
    }

    const predictions: RiskPrediction[] = [];

    // Predict disengagement risk
    const disengagementInput = {
      frustrationLevel: state.engagementMetrics.frustrationLevel,
      engagementDrop: this.calculateEngagementDrop(state),
      errorRate: this.calculateErrorRate(state),
      responseTime: state.engagementMetrics.responseTime / 30 // Normalize
    };

    const disengagementResult = await model.predict(disengagementInput);
    if (disengagementResult.prediction > 0.5) {
      predictions.push({
        riskType: 'disengagement',
        probability: disengagementResult.prediction,
        timeframe: 5, // 5 minutes
        preventiveActions: [
          'Switch to more engaging activity',
          'Introduce gamification elements',
          'Take a short break'
        ]
      });
    }

    // Predict frustration risk
    if (state.engagementMetrics.frustrationLevel > 0.6) {
      predictions.push({
        riskType: 'frustration',
        probability: state.engagementMetrics.frustrationLevel,
        timeframe: 3,
        preventiveActions: [
          'Reduce difficulty level',
          'Provide scaffolding support',
          'Offer encouragement'
        ]
      });
    }

    // Predict knowledge gap risk
    if (state.knowledgeMap.knowledgeGaps.length > 2) {
      predictions.push({
        riskType: 'knowledge_gap',
        probability: Math.min(state.knowledgeMap.knowledgeGaps.length / 5, 1),
        timeframe: 10,
        preventiveActions: [
          'Review prerequisite concepts',
          'Adjust learning path',
          'Provide foundational content'
        ]
      });
    }

    return predictions;
  }

  /**
   * Predict optimal learning path
   */
  async predictOptimalPath(
    profile: EnhancedStudentProfile,
    state: LearningState,
    objectives: string[]
  ): Promise<{
    path: string[];
    estimatedDuration: number;
    confidence: number;
  }> {
    // Simple greedy approach - in production, use more sophisticated algorithms
    const path: string[] = [];
    let totalDuration = 0;

    for (const objective of objectives) {
      const prediction = await this.predictLearningOutcome(profile, state, objective);
      path.push(objective);
      totalDuration += prediction.timeToMastery;
    }

    return {
      path,
      estimatedDuration: totalDuration,
      confidence: 0.7
    };
  }

  // Helper methods

  private masteryLevelToNumber(level: string): number {
    const mapping: Record<string, number> = {
      'unknown': 0,
      'introduced': 0.2,
      'developing': 0.4,
      'proficient': 0.7,
      'mastered': 1.0
    };
    return mapping[level] || 0;
  }

  private calculatePracticeTime(profile: EnhancedStudentProfile, conceptId: string): number {
    // Calculate total practice time for concept from session history
    let totalTime = 0;
    for (const session of profile.sessionHistory) {
      const relevantActivities = session.activities.filter(
        a => a.objectives.includes(conceptId)
      );
      totalTime += relevantActivities.reduce((sum, a) => sum + a.estimatedDuration, 0);
    }
    return Math.min(totalTime / 60, 1); // Normalize to 0-1 (hours)
  }

  private calculateCognitiveLoad(state: LearningState): number {
    // Simple cognitive load estimation
    const activeObjectives = state.currentObjectives.length;
    const knowledgeGaps = state.knowledgeMap.knowledgeGaps.length;
    return Math.min((activeObjectives * 0.1 + knowledgeGaps * 0.15), 1);
  }

  private estimateTimeToMastery(
    currentMastery: number,
    predictedMastery: number,
    acquisitionRate: number
  ): number {
    const masteryGap = Math.max(0.9 - currentMastery, 0);
    const baseTime = (masteryGap / acquisitionRate) * 60; // Convert to minutes
    return Math.round(baseTime);
  }

  private recommendActivitiesForConcept(
    profile: EnhancedStudentProfile,
    conceptId: string,
    currentMastery: number
  ): ActivityType[] {
    const activities: ActivityType[] = [];

    if (currentMastery < 0.3) {
      // Early learning - focus on lessons and practice
      activities.push('lesson', 'practice');
    } else if (currentMastery < 0.7) {
      // Developing - mix of practice and assessment
      activities.push('practice', 'quiz', 'game');
    } else {
      // Advanced - focus on application and assessment
      activities.push('quiz', 'creative', 'exploration');
    }

    // Add preferred activity types
    const topPreferences = profile.preferredActivityTypes
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 2)
      .map(p => p.activityType);

    for (const pref of topPreferences) {
      if (!activities.includes(pref)) {
        activities.push(pref);
      }
    }

    return activities.slice(0, 3);
  }

  private calculateRecentPerformance(profile: EnhancedStudentProfile): number {
    if (profile.sessionHistory.length === 0) return 0.5;

    const recentSessions = profile.sessionHistory.slice(-5);
    let totalProgress = 0;

    for (const session of recentSessions) {
      const sessionProgress = session.outcomes.reduce(
        (sum, outcome) => sum + outcome.progress,
        0
      ) / Math.max(session.outcomes.length, 1);
      totalProgress += sessionProgress;
    }

    return totalProgress / recentSessions.length;
  }

  private findOptimalActivityType(
    profile: EnhancedStudentProfile,
    state: LearningState
  ): ActivityType {
    // Find activity type with best effectiveness and high preference
    const sorted = [...profile.preferredActivityTypes].sort((a, b) => {
      const scoreA = a.effectiveness * 0.6 + a.preference * 0.4;
      const scoreB = b.effectiveness * 0.6 + b.preference * 0.4;
      return scoreB - scoreA;
    });

    return sorted[0]?.activityType || 'lesson';
  }

  private determineOptimalDifficulty(
    profile: EnhancedStudentProfile,
    state: LearningState
  ): DifficultyLevel {
    // Use recent performance to determine difficulty
    const recentPerformance = this.calculateRecentPerformance(profile);

    if (recentPerformance > 0.8) return 'hard';
    if (recentPerformance > 0.5) return 'medium';
    return 'easy';
  }

  private calculateEngagementDrop(state: LearningState): number {
    const history = state.engagementMetrics.engagementHistory;
    if (history.length < 2) return 0;

    const recent = history.slice(-5);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.level, 0) / secondHalf.length;

    return Math.max(0, firstAvg - secondAvg);
  }

  private calculateErrorRate(state: LearningState): number {
    // Simple error rate calculation from context history
    const assessmentEntries = state.contextHistory.filter(
      e => e.type === 'assessment'
    );

    if (assessmentEntries.length === 0) return 0;

    const errors = assessmentEntries.filter(
      e => e.content?.correct === false
    ).length;

    return errors / assessmentEntries.length;
  }
}

/**
 * Singleton instance
 */
export const mlPredictionService = new MLPredictionService();
