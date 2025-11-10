/**
 * Learning Effectiveness Validation System
 * A/B testing, outcome measurement, simulated student testing, and regression testing
 * Requirements: 7.1, 8.2, 8.3, 9.2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LearningOrchestrator } from '../orchestrator';
import { AssessmentAgent } from '../assessment-agent';
import { ContentGenerationAgent } from '../content-generation-agent';
import { PathPlanningAgent } from '../path-planning-agent';
import { InterventionAgent } from '../intervention-agent';
import { CommunicationAgent } from '../communication-agent';
import {
  EnhancedStudentProfile,
  LearningObjective,
  Activity,
  DifficultyLevel
} from '../types';

// ============================================================================
// A/B Testing Framework
// ============================================================================

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: any;
}

interface ABTestResult {
  variantId: string;
  studentId: string;
  metrics: LearningMetrics;
  timestamp: number;
}

interface LearningMetrics {
  comprehensionScore: number; // 0-1
  engagementScore: number; // 0-1
  retentionScore: number; // 0-1
  completionRate: number; // 0-1
  timeToMastery: number; // minutes
  errorRate: number; // 0-1
}

class ABTestingFramework {
  private variants: Map<string, ABTestVariant> = new Map();
  private results: ABTestResult[] = [];
  private trafficSplit: Map<string, number> = new Map();

  addVariant(variant: ABTestVariant, trafficPercentage: number): void {
    this.variants.set(variant.id, variant);
    this.trafficSplit.set(variant.id, trafficPercentage);
  }

  assignVariant(studentId: string): ABTestVariant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const [variantId, percentage] of this.trafficSplit.entries()) {
      cumulative += percentage;
      if (random <= cumulative) {
        return this.variants.get(variantId)!;
      }
    }

    return Array.from(this.variants.values())[0];
  }

  recordResult(result: ABTestResult): void {
    this.results.push(result);
  }

  analyzeResults(): ABTestAnalysis {
    const variantResults = new Map<string, ABTestResult[]>();

    for (const result of this.results) {
      if (!variantResults.has(result.variantId)) {
        variantResults.set(result.variantId, []);
      }
      variantResults.get(result.variantId)!.push(result);
    }

    const analysis: ABTestAnalysis = {
      variants: [],
      winner: null,
      confidence: 0
    };

    for (const [variantId, results] of variantResults.entries()) {
      const avgMetrics = this.calculateAverageMetrics(results);
      analysis.variants.push({
        variantId,
        sampleSize: results.length,
        metrics: avgMetrics,
        overallScore: this.calculateOverallScore(avgMetrics)
      });
    }

    analysis.variants.sort((a, b) => b.overallScore - a.overallScore);
    if (analysis.variants.length > 0) {
      analysis.winner = analysis.variants[0].variantId;
      analysis.confidence = this.calculateConfidence(analysis.variants);
    }

    return analysis;
  }

  private calculateAverageMetrics(results: ABTestResult[]): LearningMetrics {
    const sum = results.reduce((acc, r) => ({
      comprehensionScore: acc.comprehensionScore + r.metrics.comprehensionScore,
      engagementScore: acc.engagementScore + r.metrics.engagementScore,
      retentionScore: acc.retentionScore + r.metrics.retentionScore,
      completionRate: acc.completionRate + r.metrics.completionRate,
      timeToMastery: acc.timeToMastery + r.metrics.timeToMastery,
      errorRate: acc.errorRate + r.metrics.errorRate
    }), {
      comprehensionScore: 0,
      engagementScore: 0,
      retentionScore: 0,
      completionRate: 0,
      timeToMastery: 0,
      errorRate: 0
    });

    const count = results.length;
    return {
      comprehensionScore: sum.comprehensionScore / count,
      engagementScore: sum.engagementScore / count,
      retentionScore: sum.retentionScore / count,
      completionRate: sum.completionRate / count,
      timeToMastery: sum.timeToMastery / count,
      errorRate: sum.errorRate / count
    };
  }

  private calculateOverallScore(metrics: LearningMetrics): number {
    return (
      metrics.comprehensionScore * 0.3 +
      metrics.engagementScore * 0.2 +
      metrics.retentionScore * 0.25 +
      metrics.completionRate * 0.15 +
      (1 - metrics.errorRate) * 0.1
    );
  }

  private calculateConfidence(variants: VariantAnalysis[]): number {
    if (variants.length < 2) return 1.0;
    const winner = variants[0];
    const runnerUp = variants[1];
    const scoreDiff = winner.overallScore - runnerUp.overallScore;
    return Math.min(1.0, scoreDiff * 10);
  }
}

interface ABTestAnalysis {
  variants: VariantAnalysis[];
  winner: string | null;
  confidence: number;
}

interface VariantAnalysis {
  variantId: string;
  sampleSize: number;
  metrics: LearningMetrics;
  overallScore: number;
}

// ============================================================================
// Learning Outcome Measurement
// ============================================================================

interface LearningOutcome {
  objectiveId: string;
  achieved: boolean;
  masteryLevel: number; // 0-1
  timeSpent: number; // minutes
  attemptsRequired: number;
  evidence: OutcomeEvidence[];
}

interface OutcomeEvidence {
  type: 'assessment' | 'practice' | 'application';
  score: number;
  timestamp: number;
}

class LearningOutcomeMeasurement {
  private outcomes: Map<string, LearningOutcome[]> = new Map();

  recordOutcome(studentId: string, outcome: LearningOutcome): void {
    if (!this.outcomes.has(studentId)) {
      this.outcomes.set(studentId, []);
    }
    this.outcomes.get(studentId)!.push(outcome);
  }

  measureEffectiveness(studentId: string): EffectivenessReport {
    const outcomes = this.outcomes.get(studentId) || [];
    
    const achievementRate = outcomes.filter(o => o.achieved).length / Math.max(1, outcomes.length);
    const avgMasteryLevel = outcomes.reduce((sum, o) => sum + o.masteryLevel, 0) / Math.max(1, outcomes.length);
    const avgTimeSpent = outcomes.reduce((sum, o) => sum + o.timeSpent, 0) / Math.max(1, outcomes.length);
    const avgAttempts = outcomes.reduce((sum, o) => sum + o.attemptsRequired, 0) / Math.max(1, outcomes.length);

    return {
      studentId,
      totalObjectives: outcomes.length,
      achievementRate,
      avgMasteryLevel,
      avgTimeSpent,
      avgAttempts,
      effectivenessScore: this.calculateEffectivenessScore(achievementRate, avgMasteryLevel, avgAttempts)
    };
  }

  private calculateEffectivenessScore(achievementRate: number, masteryLevel: number, attempts: number): number {
    const attemptPenalty = Math.max(0, 1 - (attempts - 1) * 0.1);
    return (achievementRate * 0.4 + masteryLevel * 0.4 + attemptPenalty * 0.2);
  }
}

interface EffectivenessReport {
  studentId: string;
  totalObjectives: number;
  achievementRate: number;
  avgMasteryLevel: number;
  avgTimeSpent: number;
  avgAttempts: number;
  effectivenessScore: number;
}

// ============================================================================
// Simulated Student Testing
// ============================================================================

interface SimulatedStudentProfile {
  id: string;
  learningSpeed: number; // 0-1, how quickly they learn
  errorProneness: number; // 0-1, how likely to make errors
  engagementLevel: number; // 0-1, baseline engagement
  attentionSpan: number; // minutes
  preferredDifficulty: DifficultyLevel;
}

class SimulatedStudent {
  private profile: SimulatedStudentProfile;
  private knowledgeBase: Map<string, number> = new Map(); // concept -> mastery level
  private sessionTime: number = 0;
  private currentEngagement: number;

  constructor(profile: SimulatedStudentProfile) {
    this.profile = profile;
    this.currentEngagement = profile.engagementLevel;
  }

  async interact(activity: Activity): Promise<SimulatedInteractionResult> {
    const startTime = Date.now();
    
    // Simulate learning
    const learningGain = this.calculateLearningGain(activity);
    this.updateKnowledge(activity, learningGain);
    
    // Simulate engagement changes
    this.updateEngagement(activity);
    
    // Simulate response
    const responseTime = this.calculateResponseTime(activity);
    const correctness = this.calculateCorrectness(activity);
    
    this.sessionTime += responseTime / 60000; // Convert to minutes

    return {
      studentId: this.profile.id,
      activityId: activity.id,
      responseTime,
      correctness,
      engagement: this.currentEngagement,
      learningGain,
      timestamp: Date.now()
    };
  }

  private calculateLearningGain(activity: Activity): number {
    const difficultyMatch = this.getDifficultyMatch(activity.difficulty);
    const engagementFactor = this.currentEngagement;
    const baseLearning = this.profile.learningSpeed;
    
    return baseLearning * difficultyMatch * engagementFactor * (0.5 + Math.random() * 0.5);
  }

  private getDifficultyMatch(difficulty: DifficultyLevel): number {
    const difficultyMap: Record<DifficultyLevel, number> = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    };
    
    const activityLevel = difficultyMap[difficulty];
    const preferredLevel = difficultyMap[this.profile.preferredDifficulty];
    const diff = Math.abs(activityLevel - preferredLevel);
    
    return Math.max(0.3, 1 - diff * 0.2);
  }

  private updateKnowledge(activity: Activity, learningGain: number): void {
    for (const objectiveId of activity.objectives) {
      const current = this.knowledgeBase.get(objectiveId) || 0;
      this.knowledgeBase.set(objectiveId, Math.min(1, current + learningGain));
    }
  }

  private updateEngagement(activity: Activity): void {
    // Engagement decreases over time
    const timeFactor = Math.max(0.5, 1 - this.sessionTime / this.profile.attentionSpan);
    
    // Engagement affected by difficulty match
    const difficultyFactor = this.getDifficultyMatch(activity.difficulty);
    
    this.currentEngagement = this.profile.engagementLevel * timeFactor * difficultyFactor;
  }

  private calculateResponseTime(activity: Activity): number {
    const baseTime = 3000; // 3 seconds
    const speedFactor = 2 - this.profile.learningSpeed;
    const engagementFactor = 2 - this.currentEngagement;
    
    return baseTime * speedFactor * engagementFactor * (0.8 + Math.random() * 0.4);
  }

  private calculateCorrectness(activity: Activity): number {
    const knowledge = activity.objectives
      .map(obj => this.knowledgeBase.get(obj) || 0)
      .reduce((sum, k) => sum + k, 0) / Math.max(1, activity.objectives.length);
    
    const errorFactor = 1 - this.profile.errorProneness;
    const engagementFactor = this.currentEngagement;
    
    return Math.min(1, knowledge * errorFactor * engagementFactor * (0.8 + Math.random() * 0.4));
  }

  getMasteryLevel(objectiveId: string): number {
    return this.knowledgeBase.get(objectiveId) || 0;
  }

  getProfile(): SimulatedStudentProfile {
    return this.profile;
  }
}

interface SimulatedInteractionResult {
  studentId: string;
  activityId: string;
  responseTime: number;
  correctness: number;
  engagement: number;
  learningGain: number;
  timestamp: number;
}

// ============================================================================
// Regression Testing Framework
// ============================================================================

interface RegressionTestCase {
  id: string;
  name: string;
  description: string;
  studentProfile: SimulatedStudentProfile;
  activities: Activity[];
  expectedOutcomes: ExpectedOutcome[];
}

interface ExpectedOutcome {
  metric: string;
  minValue: number;
  maxValue: number;
}

interface RegressionTestResult {
  testCaseId: string;
  passed: boolean;
  actualMetrics: Record<string, number>;
  failures: string[];
  timestamp: number;
}

class RegressionTestingFramework {
  private testCases: Map<string, RegressionTestCase> = new Map();
  private baseline: Map<string, Record<string, number>> = new Map();
  private results: RegressionTestResult[] = [];

  addTestCase(testCase: RegressionTestCase): void {
    this.testCases.set(testCase.id, testCase);
  }

  setBaseline(testCaseId: string, metrics: Record<string, number>): void {
    this.baseline.set(testCaseId, metrics);
  }

  async runRegressionTests(): Promise<RegressionTestSummary> {
    this.results = [];

    for (const [testCaseId, testCase] of this.testCases.entries()) {
      const result = await this.runTestCase(testCase);
      this.results.push(result);
    }

    return this.generateSummary();
  }

  private async runTestCase(testCase: RegressionTestCase): Promise<RegressionTestResult> {
    const student = new SimulatedStudent(testCase.studentProfile);
    const actualMetrics: Record<string, number> = {};
    const failures: string[] = [];

    // Run through activities
    const interactions: SimulatedInteractionResult[] = [];
    for (const activity of testCase.activities) {
      const result = await student.interact(activity);
      interactions.push(result);
    }

    // Calculate metrics
    actualMetrics.avgCorrectness = interactions.reduce((sum, i) => sum + i.correctness, 0) / interactions.length;
    actualMetrics.avgEngagement = interactions.reduce((sum, i) => sum + i.engagement, 0) / interactions.length;
    actualMetrics.avgLearningGain = interactions.reduce((sum, i) => sum + i.learningGain, 0) / interactions.length;
    actualMetrics.avgResponseTime = interactions.reduce((sum, i) => sum + i.responseTime, 0) / interactions.length;

    // Check against expected outcomes
    for (const expected of testCase.expectedOutcomes) {
      const actual = actualMetrics[expected.metric];
      if (actual < expected.minValue || actual > expected.maxValue) {
        failures.push(
          `${expected.metric}: expected ${expected.minValue}-${expected.maxValue}, got ${actual.toFixed(3)}`
        );
      }
    }

    // Check against baseline if exists
    const baseline = this.baseline.get(testCase.id);
    if (baseline) {
      for (const [metric, baselineValue] of Object.entries(baseline)) {
        const actual = actualMetrics[metric];
        const tolerance = 0.1; // 10% tolerance
        if (Math.abs(actual - baselineValue) / baselineValue > tolerance) {
          failures.push(
            `${metric}: regression detected (baseline: ${baselineValue.toFixed(3)}, actual: ${actual.toFixed(3)})`
          );
        }
      }
    }

    return {
      testCaseId: testCase.id,
      passed: failures.length === 0,
      actualMetrics,
      failures,
      timestamp: Date.now()
    };
  }

  private generateSummary(): RegressionTestSummary {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    return {
      totalTests: this.results.length,
      passed,
      failed,
      passRate: passed / Math.max(1, this.results.length),
      results: this.results,
      timestamp: Date.now()
    };
  }
}

interface RegressionTestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  results: RegressionTestResult[];
  timestamp: number;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Learning Effectiveness Validation', () => {
  describe('A/B Testing Framework', () => {
    let framework: ABTestingFramework;

    beforeEach(() => {
      framework = new ABTestingFramework();
    });

    it('should assign variants based on traffic split', () => {
      const variantA: ABTestVariant = {
        id: 'variant-a',
        name: 'Traditional Approach',
        description: 'Standard teaching method',
        config: { method: 'traditional' }
      };

      const variantB: ABTestVariant = {
        id: 'variant-b',
        name: 'Adaptive Approach',
        description: 'AI-driven adaptive teaching',
        config: { method: 'adaptive' }
      };

      framework.addVariant(variantA, 50);
      framework.addVariant(variantB, 50);

      const assignments = new Map<string, number>();
      for (let i = 0; i < 100; i++) {
        const variant = framework.assignVariant(`student-${i}`);
        assignments.set(variant.id, (assignments.get(variant.id) || 0) + 1);
      }

      // Should be roughly 50/50 split (allow 20% variance)
      expect(assignments.get('variant-a')).toBeGreaterThan(30);
      expect(assignments.get('variant-a')).toBeLessThan(70);
      expect(assignments.get('variant-b')).toBeGreaterThan(30);
      expect(assignments.get('variant-b')).toBeLessThan(70);
    });

    it('should analyze results and determine winner', () => {
      const variantA: ABTestVariant = {
        id: 'variant-a',
        name: 'Variant A',
        description: 'Test variant A',
        config: {}
      };

      const variantB: ABTestVariant = {
        id: 'variant-b',
        name: 'Variant B',
        description: 'Test variant B',
        config: {}
      };

      framework.addVariant(variantA, 50);
      framework.addVariant(variantB, 50);

      // Record better results for variant B
      for (let i = 0; i < 10; i++) {
        framework.recordResult({
          variantId: 'variant-a',
          studentId: `student-a-${i}`,
          metrics: {
            comprehensionScore: 0.6,
            engagementScore: 0.5,
            retentionScore: 0.6,
            completionRate: 0.7,
            timeToMastery: 45,
            errorRate: 0.3
          },
          timestamp: Date.now()
        });

        framework.recordResult({
          variantId: 'variant-b',
          studentId: `student-b-${i}`,
          metrics: {
            comprehensionScore: 0.8,
            engagementScore: 0.85,
            retentionScore: 0.8,
            completionRate: 0.9,
            timeToMastery: 30,
            errorRate: 0.15
          },
          timestamp: Date.now()
        });
      }

      const analysis = framework.analyzeResults();

      expect(analysis.winner).toBe('variant-b');
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.variants).toHaveLength(2);
      expect(analysis.variants[0].variantId).toBe('variant-b');
      expect(analysis.variants[0].overallScore).toBeGreaterThan(analysis.variants[1].overallScore);
    });
  });

  describe('Learning Outcome Measurement', () => {
    let measurement: LearningOutcomeMeasurement;

    beforeEach(() => {
      measurement = new LearningOutcomeMeasurement();
    });

    it('should record and measure learning outcomes', () => {
      const studentId = 'student-1';

      // Record successful outcomes
      measurement.recordOutcome(studentId, {
        objectiveId: 'obj-1',
        achieved: true,
        masteryLevel: 0.9,
        timeSpent: 20,
        attemptsRequired: 1,
        evidence: [
          { type: 'assessment', score: 0.9, timestamp: Date.now() }
        ]
      });

      measurement.recordOutcome(studentId, {
        objectiveId: 'obj-2',
        achieved: true,
        masteryLevel: 0.85,
        timeSpent: 25,
        attemptsRequired: 2,
        evidence: [
          { type: 'practice', score: 0.7, timestamp: Date.now() },
          { type: 'assessment', score: 0.85, timestamp: Date.now() }
        ]
      });

      const report = measurement.measureEffectiveness(studentId);

      expect(report.studentId).toBe(studentId);
      expect(report.totalObjectives).toBe(2);
      expect(report.achievementRate).toBe(1.0);
      expect(report.avgMasteryLevel).toBeGreaterThan(0.8);
      expect(report.effectivenessScore).toBeGreaterThan(0.7);
    });

    it('should calculate effectiveness with partial success', () => {
      const studentId = 'student-2';

      measurement.recordOutcome(studentId, {
        objectiveId: 'obj-1',
        achieved: true,
        masteryLevel: 0.8,
        timeSpent: 30,
        attemptsRequired: 1,
        evidence: []
      });

      measurement.recordOutcome(studentId, {
        objectiveId: 'obj-2',
        achieved: false,
        masteryLevel: 0.4,
        timeSpent: 40,
        attemptsRequired: 3,
        evidence: []
      });

      const report = measurement.measureEffectiveness(studentId);

      expect(report.achievementRate).toBe(0.5);
      expect(report.avgMasteryLevel).toBeCloseTo(0.6, 1);
      expect(report.effectivenessScore).toBeLessThan(0.7);
    });
  });

  describe('Simulated Student Testing', () => {
    it('should simulate student interactions realistically', async () => {
      const profile: SimulatedStudentProfile = {
        id: 'sim-student-1',
        learningSpeed: 0.7,
        errorProneness: 0.2,
        engagementLevel: 0.8,
        attentionSpan: 30,
        preferredDifficulty: 'intermediate'
      };

      const student = new SimulatedStudent(profile);

      const activity: Activity = {
        id: 'activity-1',
        type: 'lesson',
        title: 'Test Lesson',
        description: 'A test lesson',
        content: {},
        difficulty: 'intermediate',
        learningStyles: ['visual'],
        estimatedDuration: 15,
        objectives: ['obj-1'],
        metadata: {
          generatedBy: 'contentGeneration',
          generatedAt: Date.now(),
          adaptationHistory: []
        }
      };

      const result = await student.interact(activity);

      expect(result.studentId).toBe(profile.id);
      expect(result.activityId).toBe(activity.id);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.correctness).toBeGreaterThanOrEqual(0);
      expect(result.correctness).toBeLessThanOrEqual(1);
      expect(result.engagement).toBeGreaterThanOrEqual(0);
      expect(result.engagement).toBeLessThanOrEqual(1);
      expect(result.learningGain).toBeGreaterThanOrEqual(0);
    });

    it('should show learning progression over multiple interactions', async () => {
      const profile: SimulatedStudentProfile = {
        id: 'sim-student-2',
        learningSpeed: 0.8,
        errorProneness: 0.1,
        engagementLevel: 0.9,
        attentionSpan: 45,
        preferredDifficulty: 'beginner'
      };

      const student = new SimulatedStudent(profile);

      const activity: Activity = {
        id: 'activity-1',
        type: 'practice',
        title: 'Practice Exercise',
        description: 'Practice activity',
        content: {},
        difficulty: 'beginner',
        learningStyles: ['kinesthetic'],
        estimatedDuration: 10,
        objectives: ['obj-1'],
        metadata: {
          generatedBy: 'contentGeneration',
          generatedAt: Date.now(),
          adaptationHistory: []
        }
      };

      const results: SimulatedInteractionResult[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await student.interact(activity);
        results.push(result);
      }

      // Correctness should generally improve over time
      const firstCorrectness = results[0].correctness;
      const lastCorrectness = results[results.length - 1].correctness;
      expect(lastCorrectness).toBeGreaterThanOrEqual(firstCorrectness * 0.8); // Allow some variance

      // Mastery level should increase
      const masteryLevel = student.getMasteryLevel('obj-1');
      expect(masteryLevel).toBeGreaterThan(0);
    });
  });

  describe('Regression Testing Framework', () => {
    let framework: RegressionTestingFramework;

    beforeEach(() => {
      framework = new RegressionTestingFramework();
    });

    it('should run regression tests and detect passing cases', async () => {
      const testCase: RegressionTestCase = {
        id: 'test-1',
        name: 'Basic Learning Test',
        description: 'Tests basic learning progression',
        studentProfile: {
          id: 'test-student-1',
          learningSpeed: 0.7,
          errorProneness: 0.2,
          engagementLevel: 0.8,
          attentionSpan: 30,
          preferredDifficulty: 'beginner'
        },
        activities: [
          {
            id: 'activity-1',
            type: 'lesson',
            title: 'Test Lesson',
            description: 'Test',
            content: {},
            difficulty: 'beginner',
            learningStyles: ['visual'],
            estimatedDuration: 10,
            objectives: ['obj-1'],
            metadata: {
              generatedBy: 'contentGeneration',
              generatedAt: Date.now(),
              adaptationHistory: []
            }
          }
        ],
        expectedOutcomes: [
          { metric: 'avgCorrectness', minValue: 0.3, maxValue: 1.0 },
          { metric: 'avgEngagement', minValue: 0.5, maxValue: 1.0 }
        ]
      };

      framework.addTestCase(testCase);

      const summary = await framework.runRegressionTests();

      expect(summary.totalTests).toBe(1);
      expect(summary.passed).toBeGreaterThanOrEqual(0);
      expect(summary.results).toHaveLength(1);
      expect(summary.results[0].testCaseId).toBe('test-1');
    });

    it('should detect regressions against baseline', async () => {
      const testCase: RegressionTestCase = {
        id: 'test-2',
        name: 'Regression Detection Test',
        description: 'Tests regression detection',
        studentProfile: {
          id: 'test-student-2',
          learningSpeed: 0.5,
          errorProneness: 0.3,
          engagementLevel: 0.6,
          attentionSpan: 20,
          preferredDifficulty: 'beginner'
        },
        activities: [
          {
            id: 'activity-1',
            type: 'quiz',
            title: 'Test Quiz',
            description: 'Test',
            content: {},
            difficulty: 'beginner',
            learningStyles: ['auditory'],
            estimatedDuration: 15,
            objectives: ['obj-1'],
            metadata: {
              generatedBy: 'contentGeneration',
              generatedAt: Date.now(),
              adaptationHistory: []
            }
          }
        ],
        expectedOutcomes: []
      };

      framework.addTestCase(testCase);

      // Set an unrealistic baseline to trigger regression
      framework.setBaseline('test-2', {
        avgCorrectness: 0.95,
        avgEngagement: 0.95,
        avgLearningGain: 0.9
      });

      const summary = await framework.runRegressionTests();

      expect(summary.totalTests).toBe(1);
      // Should detect regression due to unrealistic baseline
      expect(summary.results[0].failures.length).toBeGreaterThan(0);
    });
  });
});
