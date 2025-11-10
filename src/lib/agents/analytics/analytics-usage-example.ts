/**
 * Analytics Usage Examples
 * Demonstrates how to use the data persistence and analytics infrastructure
 */

import { analyticsIntegration } from '../analytics-integration';
import {
  EnhancedStudentProfile,
  LearningState,
  EngagementData,
  ConceptMap
} from '../types';
import { PerformanceMetrics, EngagementMetrics } from '../student-profile';

/**
 * Example 1: Initialize and track a learning session
 */
export async function exampleTrackSession() {
  const userId = 'student-123';
  const sessionId = 'session-456';

  // Mock student profile
  const studentProfile: Partial<EnhancedStudentProfile> = {
    name: 'Alex',
    age: 10,
    gradeLevel: '5',
    cognitiveProfile: {
      processingSpeed: 0.7,
      workingMemoryCapacity: 0.6,
      attentionControl: 0.5,
      metacognition: 0.6
    },
    motivationFactors: {
      intrinsicMotivation: 0.8,
      extrinsicMotivation: 0.6,
      competitiveSpirit: 0.7,
      collaborativePreference: 0.5,
      autonomyPreference: 0.6
    },
    learningVelocity: {
      conceptAcquisitionRate: 1.2,
      skillDevelopmentRate: 1.0,
      retentionRate: 0.75,
      transferRate: 0.6
    },
    attentionSpanData: {
      averageSpan: 25,
      peakSpan: 35,
      declinePattern: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5],
      recoveryTime: 5
    },
    preferredActivityTypes: [],
    responsePatterns: [],
    engagementPatterns: [],
    sessionHistory: [],
    progressTimeline: [],
    interventionHistory: []
  };

  // Initialize session
  console.log('Initializing session...');
  await analyticsIntegration.initializeSession(
    userId,
    sessionId,
    studentProfile as EnhancedStudentProfile
  );

  // Track student message
  console.log('Tracking interaction...');
  await analyticsIntegration.trackInteraction(userId, sessionId, {
    type: 'message',
    content: 'I think the answer is 3/4',
    responseTime: 5.2,
    comprehensionLevel: 0.75,
    engagementLevel: 0.8,
    emotionalState: 'positive'
  });

  // Track performance
  console.log('Tracking performance...');
  const performanceMetrics: PerformanceMetrics = {
    studentId: userId,
    sessionId: sessionId,
    correctResponses: 8,
    totalResponses: 10,
    accuracyRate: 0.8,
    averageResponseTime: 6.5,
    responseTimeVariance: 2.1,
    conceptsMastered: 2,
    skillsAcquired: 3,
    objectivesCompleted: 1,
    responseQuality: 0.75,
    explanationDepth: 0.7,
    criticalThinking: 0.65
  };

  await analyticsIntegration.trackPerformance(userId, sessionId, performanceMetrics);

  // Track engagement
  console.log('Tracking engagement...');
  const engagementMetrics: EngagementMetrics = {
    studentId: userId,
    sessionId: sessionId,
    messageCount: 15,
    averageMessageLength: 45.5,
    questionAsked: 3,
    focusDuration: 1200, // 20 minutes
    distractionEvents: 1,
    reengagementTime: 30,
    positiveIndicators: 8,
    negativeIndicators: 1,
    frustrationLevel: 0.2,
    enthusiasmLevel: 0.8
  };

  await analyticsIntegration.trackEngagement(userId, sessionId, engagementMetrics);

  // Get dashboard metrics
  console.log('Getting dashboard metrics...');
  const dashboard = analyticsIntegration.getDashboardMetrics(userId, sessionId);
  
  if (dashboard) {
    console.log('Dashboard Metrics:');
    console.log('- Current Engagement:', dashboard.currentEngagement);
    console.log('- Current Comprehension:', dashboard.currentComprehension);
    console.log('- Current Frustration:', dashboard.currentFrustration);
    console.log('- Session Duration:', dashboard.sessionDuration, 'seconds');
    console.log('- Activities Completed:', dashboard.activitiesCompleted);
    console.log('- Accuracy Rate:', dashboard.accuracyRate);
    console.log('- Engagement Trend:', dashboard.engagementTrend);
    console.log('- Active Alerts:', dashboard.activeAlerts.length);
    console.log('- Recommendations:', dashboard.recommendations.length);
  }
}

/**
 * Example 2: Use ML predictions
 */
export async function exampleMLPredictions() {
  const userId = 'student-123';
  const sessionId = 'session-456';

  // Mock profile and state
  const profile: EnhancedStudentProfile = {
    name: 'Alex',
    age: 10,
    gradeLevel: '5',
    learningStyle: 'visual',
    interests: ['science', 'math'],
    cognitiveProfile: {
      processingSpeed: 0.7,
      workingMemoryCapacity: 0.6,
      attentionControl: 0.5,
      metacognition: 0.6
    },
    motivationFactors: {
      intrinsicMotivation: 0.8,
      extrinsicMotivation: 0.6,
      competitiveSpirit: 0.7,
      collaborativePreference: 0.5,
      autonomyPreference: 0.6
    },
    learningVelocity: {
      conceptAcquisitionRate: 1.2,
      skillDevelopmentRate: 1.0,
      retentionRate: 0.75,
      transferRate: 0.6
    },
    responsePatterns: [],
    engagementPatterns: [],
    preferredActivityTypes: [
      { activityType: 'game', preference: 0.9, effectiveness: 0.85, optimalDuration: 15 },
      { activityType: 'quiz', preference: 0.7, effectiveness: 0.8, optimalDuration: 10 }
    ],
    optimalLearningTimes: [],
    attentionSpanData: {
      averageSpan: 25,
      peakSpan: 35,
      declinePattern: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5],
      recoveryTime: 5
    },
    sessionHistory: [],
    progressTimeline: [],
    interventionHistory: []
  };

  const learningState: LearningState = {
    studentId: userId,
    sessionId: sessionId,
    currentObjectives: [
      {
        id: 'obj-1',
        title: 'Master fraction addition',
        description: 'Add fractions with unlike denominators',
        targetLevel: 'medium',
        prerequisites: [],
        estimatedDuration: 30,
        priority: 'high',
        progress: 0.6
      }
    ],
    knowledgeMap: {
      concepts: {},
      relationships: [],
      masteryLevels: new Map([
        ['fractions_addition', {
          conceptId: 'fractions_addition',
          level: 'developing',
          confidence: 0.7,
          lastAssessed: Date.now(),
          evidence: []
        }]
      ]),
      knowledgeGaps: []
    },
    engagementMetrics: {
      currentLevel: 0.75,
      attentionSpan: 25,
      interactionFrequency: 2.5,
      responseTime: 6.5,
      frustrationLevel: 0.2,
      motivationLevel: 0.8,
      preferredActivityTypes: ['game', 'quiz'],
      engagementHistory: []
    },
    learningPath: [],
    contextHistory: [],
    lastUpdated: Date.now()
  };

  // Predict learning outcome
  console.log('\nPredicting learning outcome...');
  const outcome = await analyticsIntegration.predictLearningOutcome(
    profile,
    learningState,
    'fractions_addition'
  );

  console.log('Learning Outcome Prediction:');
  console.log('- Predicted Mastery Level:', outcome.predictedMasteryLevel);
  console.log('- Time to Mastery:', outcome.timeToMastery, 'minutes');
  console.log('- Confidence:', outcome.confidence);
  console.log('- Recommended Activities:', outcome.recommendedActivities);

  // Predict engagement
  console.log('\nPredicting engagement...');
  const engagement = await analyticsIntegration.predictEngagement(
    profile,
    learningState,
    'quiz'
  );

  console.log('Engagement Prediction:');
  console.log('- Next Activity Engagement:', engagement.nextActivityEngagement);
  console.log('- Optimal Activity Type:', engagement.optimalActivityType);
  console.log('- Optimal Difficulty:', engagement.optimalDifficulty);
  console.log('- Confidence:', engagement.confidence);

  // Predict risks
  console.log('\nPredicting risks...');
  const risks = await analyticsIntegration.predictRisks(profile, learningState);

  console.log('Risk Predictions:');
  for (const risk of risks) {
    console.log(`\n- Risk Type: ${risk.riskType}`);
    console.log(`  Probability: ${risk.probability}`);
    console.log(`  Timeframe: ${risk.timeframe} minutes`);
    console.log(`  Preventive Actions:`, risk.preventiveActions);
  }
}

/**
 * Example 3: Monitor alerts
 */
export async function exampleAlertMonitoring() {
  const userId = 'student-123';
  const sessionId = 'session-456';

  // Simulate high frustration
  await analyticsIntegration.trackEngagement(userId, sessionId, {
    studentId: userId,
    sessionId: sessionId,
    messageCount: 20,
    averageMessageLength: 30,
    questionAsked: 5,
    focusDuration: 600,
    distractionEvents: 4,
    reengagementTime: 60,
    positiveIndicators: 2,
    negativeIndicators: 8,
    frustrationLevel: 0.85, // High frustration!
    enthusiasmLevel: 0.2
  });

  // Check for alerts
  console.log('\nChecking for alerts...');
  const alerts = analyticsIntegration.getActiveAlerts(userId);

  console.log(`Found ${alerts.length} active alerts:`);
  for (const alert of alerts) {
    console.log(`\n- Alert: ${alert.message}`);
    console.log(`  Severity: ${alert.severity}`);
    console.log(`  Actions:`, alert.actions);
    console.log(`  Acknowledged: ${alert.acknowledged}`);
  }

  // Acknowledge an alert
  if (alerts.length > 0) {
    console.log('\nAcknowledging first alert...');
    analyticsIntegration.acknowledgeAlert(alerts[0].id);
    console.log('Alert acknowledged');
  }
}

/**
 * Example 4: Real-time event streaming
 */
export function exampleEventStreaming() {
  console.log('\nSetting up real-time event handlers...');

  // Listen for engagement events
  analyticsIntegration.onAnalyticsEvent('engagement', (event) => {
    console.log('\n[Engagement Event]');
    console.log('User:', event.userId);
    console.log('Session:', event.sessionId);
    console.log('Frustration Level:', event.data.metrics?.frustrationLevel);
    
    // Trigger intervention if needed
    if (event.data.metrics?.frustrationLevel > 0.7) {
      console.log('⚠️  High frustration detected - triggering intervention');
    }
  });

  // Listen for performance events
  analyticsIntegration.onAnalyticsEvent('performance', (event) => {
    console.log('\n[Performance Event]');
    console.log('User:', event.userId);
    console.log('Accuracy:', event.data.metrics?.accuracyRate);
    
    if (event.data.metrics?.accuracyRate < 0.5) {
      console.log('⚠️  Low accuracy - consider reducing difficulty');
    }
  });

  // Listen for assessment events
  analyticsIntegration.onAnalyticsEvent('assessment', (event) => {
    console.log('\n[Assessment Event]');
    console.log('User:', event.userId);
    console.log('Concept:', event.data.conceptId);
    console.log('Knowledge Gaps:', event.data.knowledgeGaps?.length || 0);
  });

  console.log('Event handlers registered');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Analytics Usage Examples ===\n');

  try {
    console.log('Example 1: Track Session');
    await exampleTrackSession();

    console.log('\n\nExample 2: ML Predictions');
    await exampleMLPredictions();

    console.log('\n\nExample 3: Alert Monitoring');
    await exampleAlertMonitoring();

    console.log('\n\nExample 4: Event Streaming');
    exampleEventStreaming();

    console.log('\n\n=== Examples Complete ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
