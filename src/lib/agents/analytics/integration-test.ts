/**
 * Integration Test for Enhanced Student Profiling and Analytics System
 * 
 * This file provides a comprehensive test of all analytics components working together.
 * Run this to verify the implementation is working correctly.
 */

import {
  studentProfileManager,
  conceptMapManager,
  learningAnalyticsEngine,
  accuracyTracker,
  type EnhancedStudentProfile,
  type ConceptMap,
  type LearningAnalytics
} from './index';
import { StudentProfile } from '@/types/chat';

/**
 * Integration test suite
 */
export class AnalyticsIntegrationTest {
  private testStudentId = 'test-student-001';
  private testSessionId = 'test-session-001';

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<TestResults> {
    console.log('🧪 Starting Analytics Integration Tests...\n');

    const results: TestResults = {
      passed: 0,
      failed: 0,
      tests: []
    };

    // Test 1: Profile Creation and Management
    await this.runTest(
      'Profile Creation and Management',
      () => this.testProfileManagement(),
      results
    );

    // Test 2: Concept Map Operations
    await this.runTest(
      'Concept Map Operations',
      () => this.testConceptMapOperations(),
      results
    );

    // Test 3: Conversation Analysis
    await this.runTest(
      'Conversation Analysis',
      () => this.testConversationAnalysis(),
      results
    );

    // Test 4: Response Time Tracking
    await this.runTest(
      'Response Time Tracking',
      () => this.testResponseTimeTracking(),
      results
    );

    // Test 5: Engagement Metrics
    await this.runTest(
      'Engagement Metrics Collection',
      () => this.testEngagementMetrics(),
      results
    );

    // Test 6: Accuracy Tracking
    await this.runTest(
      'Accuracy Tracking',
      () => this.testAccuracyTracking(),
      results
    );

    // Test 7: Predictive Analytics
    await this.runTest(
      'Predictive Analytics Generation',
      () => this.testPredictiveAnalytics(),
      results
    );

    // Test 8: End-to-End Workflow
    await this.runTest(
      'End-to-End Learning Session',
      () => this.testEndToEndWorkflow(),
      results
    );

    this.printResults(results);
    return results;
  }

  /**
   * Test profile creation and management
   */
  private testProfileManagement(): void {
    // Create basic profile
    const basicProfile: StudentProfile = {
      name: 'Test Student',
      level: 3,
      points: 500,
      completedLessons: [],
      learningStyle: 'visual',
      difficulty: 'medium'
    };

    // Create enhanced profile
    const enhanced = studentProfileManager.createEnhancedProfile(
      basicProfile,
      this.testStudentId
    );

    // Verify profile was created
    this.assert(enhanced !== null, 'Enhanced profile should be created');
    this.assert(enhanced.name === 'Test Student', 'Profile name should match');
    this.assert(enhanced.cognitiveProfile !== undefined, 'Cognitive profile should exist');
    this.assert(enhanced.motivationFactors !== undefined, 'Motivation factors should exist');

    // Update cognitive profile
    studentProfileManager.updateCognitiveProfile(this.testStudentId, {
      processingSpeed: 0.8,
      attentionControl: 0.7
    });

    const updated = studentProfileManager.getProfile(this.testStudentId);
    this.assert(updated?.cognitiveProfile.processingSpeed === 0.8, 'Processing speed should be updated');

    // Add response pattern
    studentProfileManager.addResponsePattern(this.testStudentId, {
      type: 'thoughtful',
      frequency: 0.7,
      contexts: ['math'],
      effectiveness: 0.8
    });

    const withPattern = studentProfileManager.getProfile(this.testStudentId);
    this.assert(withPattern?.responsePatterns.length === 1, 'Response pattern should be added');
  }

  /**
   * Test concept map operations
   */
  private testConceptMapOperations(): void {
    const conceptMap = conceptMapManager.createConceptMap();

    // Add concepts
    conceptMapManager.addConcept(conceptMap, {
      id: 'counting',
      name: 'Counting',
      description: 'Basic counting',
      category: 'math',
      difficulty: 'easy',
      prerequisites: [],
      relatedConcepts: []
    });

    conceptMapManager.addConcept(conceptMap, {
      id: 'addition',
      name: 'Addition',
      description: 'Adding numbers',
      category: 'math',
      difficulty: 'easy',
      prerequisites: ['counting'],
      relatedConcepts: []
    });

    this.assert(Object.keys(conceptMap.concepts).length === 2, 'Should have 2 concepts');

    // Add relationship
    conceptMapManager.addRelationship(conceptMap, {
      fromConcept: 'counting',
      toConcept: 'addition',
      type: 'prerequisite',
      strength: 0.9
    });

    this.assert(conceptMap.relationships.length === 1, 'Should have 1 relationship');

    // Update mastery
    conceptMapManager.updateMasteryLevel(
      conceptMap,
      'counting',
      'mastered',
      0.95,
      { type: 'response', value: 'correct', timestamp: Date.now(), weight: 1.0 }
    );

    const mastery = conceptMap.masteryLevels.get('counting');
    this.assert(mastery?.level === 'mastered', 'Mastery level should be updated');

    // Identify gaps
    const gaps = conceptMapManager.identifyKnowledgeGaps(conceptMap);
    this.assert(Array.isArray(gaps), 'Should return gaps array');
  }

  /**
   * Test conversation analysis
   */
  private testConversationAnalysis(): void {
    const messages = [
      { role: 'assistant', content: 'Let\'s learn about addition!', timestamp: Date.now() },
      { role: 'user', content: 'Okay! What is 2 + 2?', timestamp: Date.now() + 1000 },
      { role: 'assistant', content: 'Great question! What do you think?', timestamp: Date.now() + 2000 },
      { role: 'user', content: 'I think it\'s 4! That makes sense!', timestamp: Date.now() + 5000 }
    ];

    const analysis = learningAnalyticsEngine.analyzeConversation(
      this.testStudentId,
      messages
    );

    this.assert(analysis !== null, 'Analysis should be returned');
    this.assert(typeof analysis.comprehensionLevel === 'number', 'Comprehension level should be a number');
    this.assert(analysis.comprehensionLevel >= 0 && analysis.comprehensionLevel <= 1, 'Comprehension should be 0-1');
    this.assert(Array.isArray(analysis.knowledgeGaps), 'Knowledge gaps should be an array');
    this.assert(Array.isArray(analysis.detectedConcepts), 'Detected concepts should be an array');
    this.assert(analysis.emotionalState !== null, 'Emotional state should exist');
    this.assert(typeof analysis.engagementLevel === 'number', 'Engagement level should be a number');
  }

  /**
   * Test response time tracking
   */
  private testResponseTimeTracking(): void {
    const responseTimes = [3.5, 4.0, 3.8, 4.2, 3.9];

    const analysis = learningAnalyticsEngine.analyzeResponseTime(responseTimes);

    this.assert(analysis !== null, 'Analysis should be returned');
    this.assert(typeof analysis.averageTime === 'number', 'Average time should be a number');
    this.assert(analysis.averageTime > 0, 'Average time should be positive');
    this.assert(['quick', 'thoughtful', 'hesitant', 'struggling'].includes(analysis.pattern), 'Pattern should be valid');
    this.assert(analysis.confidence >= 0 && analysis.confidence <= 1, 'Confidence should be 0-1');
  }

  /**
   * Test engagement metrics collection
   */
  private testEngagementMetrics(): void {
    const interactions = [
      { type: 'user', timestamp: Date.now(), content: 'Hi!' },
      { type: 'assistant', timestamp: Date.now() + 1000, content: 'Hello!' },
      { type: 'user', timestamp: Date.now() + 3000, content: 'Let\'s learn!' },
      { type: 'assistant', timestamp: Date.now() + 4000, content: 'Great!' }
    ];

    const metrics = learningAnalyticsEngine.collectEngagementMetrics(
      this.testStudentId,
      this.testSessionId,
      interactions
    );

    this.assert(metrics !== null, 'Metrics should be returned');
    this.assert(metrics.messageCount > 0, 'Message count should be positive');
    this.assert(metrics.focusDuration >= 0, 'Focus duration should be non-negative');
    this.assert(typeof metrics.frustrationLevel === 'number', 'Frustration level should be a number');
    this.assert(typeof metrics.enthusiasmLevel === 'number', 'Enthusiasm level should be a number');
  }

  /**
   * Test accuracy tracking
   */
  private testAccuracyTracking(): void {
    // Record some responses
    accuracyTracker.recordResponse(this.testStudentId, true, 'addition', 'easy');
    accuracyTracker.recordResponse(this.testStudentId, true, 'addition', 'easy');
    accuracyTracker.recordResponse(this.testStudentId, false, 'multiplication', 'medium');
    accuracyTracker.recordResponse(this.testStudentId, true, 'addition', 'medium');

    // Get accuracy metrics
    const overallAccuracy = accuracyTracker.getAccuracyRate(this.testStudentId);
    const additionAccuracy = accuracyTracker.getAccuracyByTopic(this.testStudentId, 'addition');
    const easyAccuracy = accuracyTracker.getAccuracyByDifficulty(this.testStudentId, 'easy');

    this.assert(typeof overallAccuracy === 'number', 'Overall accuracy should be a number');
    this.assert(overallAccuracy >= 0 && overallAccuracy <= 1, 'Overall accuracy should be 0-1');
    this.assert(additionAccuracy === 1.0, 'Addition accuracy should be 100%');
    this.assert(easyAccuracy === 1.0, 'Easy difficulty accuracy should be 100%');
  }

  /**
   * Test predictive analytics generation
   */
  private testPredictiveAnalytics(): void {
    const profile = studentProfileManager.getProfile(this.testStudentId);
    this.assert(profile !== undefined, 'Profile should exist for predictive analytics');

    if (!profile) return;

    const learningState = {
      studentId: this.testStudentId,
      sessionId: this.testSessionId,
      currentObjectives: [],
      knowledgeMap: conceptMapManager.createConceptMap(),
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 20,
        interactionFrequency: 2.0,
        responseTime: 4.0,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: ['quiz' as const],
        engagementHistory: []
      },
      learningPath: [],
      currentActivity: undefined,
      contextHistory: [],
      lastUpdated: Date.now()
    };

    const analytics = learningAnalyticsEngine.generatePredictiveAnalytics(
      this.testStudentId,
      profile,
      learningState
    );

    this.assert(analytics !== null, 'Analytics should be returned');
    this.assert(typeof analytics.comprehensionRate === 'number', 'Comprehension rate should be a number');
    this.assert(Array.isArray(analytics.riskFactors), 'Risk factors should be an array');
    this.assert(Array.isArray(analytics.recommendations), 'Recommendations should be an array');
    this.assert(Array.isArray(analytics.nextOptimalActivities), 'Next activities should be an array');
  }

  /**
   * Test end-to-end workflow
   */
  private testEndToEndWorkflow(): void {
    // Simulate a complete learning session
    const sessionId = 'workflow-session';
    
    // 1. Student starts session
    const profile = studentProfileManager.getProfile(this.testStudentId);
    this.assert(profile !== undefined, 'Profile should exist');

    // 2. Student has conversation
    const messages = [
      { role: 'user', content: 'I want to learn multiplication', timestamp: Date.now() },
      { role: 'assistant', content: 'Great! Let\'s start with 2 x 3', timestamp: Date.now() + 1000 },
      { role: 'user', content: 'Is it 6?', timestamp: Date.now() + 4000 },
      { role: 'assistant', content: 'Correct! Well done!', timestamp: Date.now() + 5000 }
    ];

    const conversationAnalysis = learningAnalyticsEngine.analyzeConversation(
      this.testStudentId,
      messages
    );
    this.assert(conversationAnalysis.comprehensionLevel > 0, 'Should detect comprehension');

    // 3. Track accuracy
    accuracyTracker.recordResponse(this.testStudentId, true, 'multiplication', 'easy');
    const accuracy = accuracyTracker.getAccuracyRate(this.testStudentId);
    this.assert(accuracy > 0, 'Should have positive accuracy');

    // 4. Collect engagement
    const interactions = messages.map(m => ({
      type: m.role,
      timestamp: m.timestamp,
      content: m.content
    }));

    const engagement = learningAnalyticsEngine.collectEngagementMetrics(
      this.testStudentId,
      sessionId,
      interactions
    );
    this.assert(engagement.messageCount > 0, 'Should track interactions');

    // 5. Update profile based on session
    if (profile) {
      studentProfileManager.updateLearningVelocity(this.testStudentId, {
        conceptAcquisitionRate: 1.5
      });

      const updatedProfile = studentProfileManager.getProfile(this.testStudentId);
      this.assert(
        updatedProfile?.learningVelocity.conceptAcquisitionRate === 1.5,
        'Should update learning velocity'
      );
    }
  }

  /**
   * Helper method to run a test
   */
  private async runTest(
    name: string,
    testFn: () => void,
    results: TestResults
  ): Promise<void> {
    try {
      testFn();
      results.passed++;
      results.tests.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper assertion method
   */
  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Print test results
   */
  private printResults(results: TestResults): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');
  }
}

interface TestResults {
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    passed: boolean;
    error?: string;
  }>;
}

/**
 * Run the integration tests
 */
export async function runIntegrationTests(): Promise<TestResults> {
  const tester = new AnalyticsIntegrationTest();
  return await tester.runAllTests();
}

// Export for use in other files
export default AnalyticsIntegrationTest;
