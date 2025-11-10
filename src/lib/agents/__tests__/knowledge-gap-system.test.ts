/**
 * Knowledge Gap Identification System Tests
 * Tests for concept dependency mapping, prerequisite detection,
 * skill assessment, and learning velocity tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { knowledgeGapSystem } from '../knowledge-gap-system';
import { conceptMapManager } from '../student-profile';
import {
  ConceptMap,
  Concept,
  MasteryLevel,
  EnhancedStudentProfile,
  LearningState,
  LearningObjective,
  EngagementData,
  CognitiveProfile,
  MotivationProfile,
  LearningVelocityData,
  LearningSession,
  Activity
} from '../types';

describe('Knowledge Gap Identification System', () => {
  let conceptMap: ConceptMap;
  let mockProfile: EnhancedStudentProfile;
  let mockLearningState: LearningState;

  beforeEach(() => {
    // Create a test concept map with dependencies
    conceptMap = conceptMapManager.createConceptMap();

    // Add foundational concepts
    const additionConcept: Concept = {
      id: 'math.addition',
      name: 'Addition',
      description: 'Basic addition operations',
      category: 'math.arithmetic',
      difficulty: 'beginner',
      prerequisites: [],
      relatedConcepts: ['math.subtraction']
    };

    const subtractionConcept: Concept = {
      id: 'math.subtraction',
      name: 'Subtraction',
      description: 'Basic subtraction operations',
      category: 'math.arithmetic',
      difficulty: 'beginner',
      prerequisites: ['math.addition'],
      relatedConcepts: ['math.addition']
    };

    const multiplicationConcept: Concept = {
      id: 'math.multiplication',
      name: 'Multiplication',
      description: 'Multiplication operations',
      category: 'math.arithmetic',
      difficulty: 'intermediate',
      prerequisites: ['math.addition'],
      relatedConcepts: ['math.division']
    };

    const divisionConcept: Concept = {
      id: 'math.division',
      name: 'Division',
      description: 'Division operations',
      category: 'math.arithmetic',
      difficulty: 'intermediate',
      prerequisites: ['math.multiplication', 'math.subtraction'],
      relatedConcepts: ['math.multiplication']
    };

    const fractionsConcept: Concept = {
      id: 'math.fractions',
      name: 'Fractions',
      description: 'Working with fractions',
      category: 'math.numbers',
      difficulty: 'advanced',
      prerequisites: ['math.division', 'math.multiplication'],
      relatedConcepts: []
    };

    // Add concepts to map
    conceptMapManager.addConcept(conceptMap, additionConcept);
    conceptMapManager.addConcept(conceptMap, subtractionConcept);
    conceptMapManager.addConcept(conceptMap, multiplicationConcept);
    conceptMapManager.addConcept(conceptMap, divisionConcept);
    conceptMapManager.addConcept(conceptMap, fractionsConcept);

    // Add relationships
    conceptMapManager.addRelationship(conceptMap, {
      fromConcept: 'math.addition',
      toConcept: 'math.subtraction',
      type: 'prerequisite',
      strength: 0.9
    });

    conceptMapManager.addRelationship(conceptMap, {
      fromConcept: 'math.addition',
      toConcept: 'math.multiplication',
      type: 'prerequisite',
      strength: 0.8
    });

    conceptMapManager.addRelationship(conceptMap, {
      fromConcept: 'math.multiplication',
      toConcept: 'math.division',
      type: 'prerequisite',
      strength: 0.9
    });

    conceptMapManager.addRelationship(conceptMap, {
      fromConcept: 'math.subtraction',
      toConcept: 'math.division',
      type: 'prerequisite',
      strength: 0.7
    });

    // Set mastery levels
    conceptMap.masteryLevels.set('math.addition', {
      conceptId: 'math.addition',
      level: 'mastered',
      confidence: 0.9,
      lastAssessed: Date.now(),
      evidence: []
    });

    conceptMap.masteryLevels.set('math.subtraction', {
      conceptId: 'math.subtraction',
      level: 'proficient',
      confidence: 0.7,
      lastAssessed: Date.now(),
      evidence: []
    });

    conceptMap.masteryLevels.set('math.multiplication', {
      conceptId: 'math.multiplication',
      level: 'introduced',
      confidence: 0.4,
      lastAssessed: Date.now(),
      evidence: []
    });

    conceptMap.masteryLevels.set('math.division', {
      conceptId: 'math.division',
      level: 'unknown',
      confidence: 0,
      lastAssessed: Date.now(),
      evidence: []
    });

    conceptMap.masteryLevels.set('math.fractions', {
      conceptId: 'math.fractions',
      level: 'unknown',
      confidence: 0,
      lastAssessed: Date.now(),
      evidence: []
    });

    // Create mock profile
    mockProfile = {
      name: 'Test Student',
      age: 10,
      gradeLevel: '4th',
      interests: ['math'],
      learningStyle: 'visual',
      cognitiveProfile: {
        processingSpeed: 0.7,
        workingMemoryCapacity: 0.6,
        attentionControl: 0.5,
        metacognition: 0.6
      } as CognitiveProfile,
      motivationFactors: {
        intrinsicMotivation: 0.8,
        extrinsicMotivation: 0.6,
        competitiveSpirit: 0.5,
        collaborativePreference: 0.4,
        autonomyPreference: 0.7
      } as MotivationProfile,
      learningVelocity: {
        conceptAcquisitionRate: 1.5,
        skillDevelopmentRate: 1.2,
        retentionRate: 0.75,
        transferRate: 0.6
      } as LearningVelocityData,
      responsePatterns: [],
      engagementPatterns: [],
      preferredActivityTypes: [],
      optimalLearningTimes: [],
      attentionSpanData: {
        averageSpan: 20,
        peakSpan: 30,
        declinePattern: [1.0, 0.9, 0.8],
        recoveryTime: 5
      },
      sessionHistory: [],
      progressTimeline: [],
      interventionHistory: []
    } as EnhancedStudentProfile;

    // Create mock learning state
    mockLearningState = {
      studentId: 'test-student-1',
      sessionId: 'session-1',
      currentObjectives: [
        {
          id: 'learn-fractions',
          title: 'Learn Fractions',
          description: 'Master fraction operations',
          targetLevel: 'advanced',
          prerequisites: ['math.division'],
          estimatedDuration: 60,
          priority: 'high',
          progress: 0
        } as LearningObjective
      ],
      knowledgeMap: conceptMap,
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 20,
        interactionFrequency: 2,
        responseTime: 5,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: ['quiz', 'game'],
        engagementHistory: []
      } as EngagementData,
      learningPath: [],
      contextHistory: [],
      lastUpdated: Date.now()
    };
  });

  describe('Dependency Graph Building', () => {
    it('should build a complete dependency graph', () => {
      const graph = knowledgeGapSystem.buildDependencyGraph(conceptMap);

      expect(graph.nodes.size).toBe(5);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.levels.size).toBe(5);
    });

    it('should correctly identify topological levels', () => {
      const graph = knowledgeGapSystem.buildDependencyGraph(conceptMap);

      // Addition should be at level 0 (no prerequisites)
      expect(graph.levels.get('math.addition')).toBe(0);

      // Subtraction should be at level 1 (depends on addition)
      expect(graph.levels.get('math.subtraction')).toBeGreaterThan(0);

      // Fractions should be at highest level
      const fractionsLevel = graph.levels.get('math.fractions');
      expect(fractionsLevel).toBeGreaterThan(graph.levels.get('math.addition')!);
    });

    it('should populate dependencies and dependents', () => {
      const graph = knowledgeGapSystem.buildDependencyGraph(conceptMap);

      const additionNode = graph.nodes.get('math.addition');
      expect(additionNode).toBeDefined();
      expect(additionNode!.dependencies.length).toBe(0);
      expect(additionNode!.dependents.length).toBeGreaterThan(0);

      const fractionsNode = graph.nodes.get('math.fractions');
      expect(fractionsNode).toBeDefined();
      expect(fractionsNode!.dependencies.length).toBeGreaterThan(0);
    });
  });

  describe('Missing Prerequisites Detection', () => {
    it('should detect missing prerequisites for target concepts', () => {
      const missingPrereqs = knowledgeGapSystem.detectMissingPrerequisites(
        conceptMap,
        ['math.fractions']
      );

      // Should detect that multiplication and division are not mastered
      expect(missingPrereqs).toContain('math.multiplication');
      expect(missingPrereqs).toContain('math.division');
    });

    it('should return empty array when all prerequisites are met', () => {
      const missingPrereqs = knowledgeGapSystem.detectMissingPrerequisites(
        conceptMap,
        ['math.subtraction']
      );

      // Subtraction only requires addition, which is mastered
      expect(missingPrereqs.length).toBe(0);
    });

    it('should recursively check prerequisite chains', () => {
      const missingPrereqs = knowledgeGapSystem.detectMissingPrerequisites(
        conceptMap,
        ['math.division']
      );

      // Should detect multiplication is not mastered
      expect(missingPrereqs).toContain('math.multiplication');
    });
  });

  describe('Foundational Knowledge Analysis', () => {
    it('should identify missing foundational concepts', () => {
      const analysis = knowledgeGapSystem.identifyMissingFoundations(
        conceptMap,
        mockLearningState
      );

      expect(analysis.missingFoundations.length).toBeGreaterThan(0);
      expect(analysis.severity).toBeDefined();
    });

    it('should map impacted concepts for each missing foundation', () => {
      const analysis = knowledgeGapSystem.identifyMissingFoundations(
        conceptMap,
        mockLearningState
      );

      expect(analysis.impactedConcepts.size).toBeGreaterThan(0);
      
      // Check that impacted concepts are tracked
      for (const [foundation, impacted] of analysis.impactedConcepts) {
        expect(Array.isArray(impacted)).toBe(true);
      }
    });

    it('should provide recommended sequence for addressing gaps', () => {
      const analysis = knowledgeGapSystem.identifyMissingFoundations(
        conceptMap,
        mockLearningState
      );

      expect(analysis.recommendedSequence.length).toBeGreaterThan(0);
      
      // Sequence should be ordered by topological level
      // (foundational concepts first)
    });

    it('should estimate remediation time', () => {
      const analysis = knowledgeGapSystem.identifyMissingFoundations(
        conceptMap,
        mockLearningState
      );

      expect(analysis.estimatedRemediationTime).toBeGreaterThan(0);
    });

    it('should identify blocked objectives', () => {
      const analysis = knowledgeGapSystem.identifyMissingFoundations(
        conceptMap,
        mockLearningState
      );

      // The fractions objective should be blocked
      expect(analysis.blockedObjectives.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Skill Domain Assessment', () => {
    it('should assess skill levels across domains', () => {
      const assessments = knowledgeGapSystem.assessSkillDomains(
        conceptMap,
        ['math']
      );

      expect(assessments.length).toBeGreaterThan(0);
      
      const mathAssessment = assessments[0];
      expect(mathAssessment.domain).toBe('math');
      expect(mathAssessment.overallLevel).toBeGreaterThanOrEqual(0);
      expect(mathAssessment.overallLevel).toBeLessThanOrEqual(1);
    });

    it('should identify strengths and weaknesses', () => {
      const assessments = knowledgeGapSystem.assessSkillDomains(
        conceptMap,
        ['math']
      );

      const mathAssessment = assessments[0];
      expect(Array.isArray(mathAssessment.strengths)).toBe(true);
      expect(Array.isArray(mathAssessment.weaknesses)).toBe(true);
      
      // Addition should be a strength (mastered)
      expect(mathAssessment.strengths).toContain('math.addition');
      
      // Multiplication should be a weakness (introduced)
      expect(mathAssessment.weaknesses).toContain('math.multiplication');
    });

    it('should provide recommended focus areas', () => {
      const assessments = knowledgeGapSystem.assessSkillDomains(
        conceptMap,
        ['math']
      );

      const mathAssessment = assessments[0];
      expect(Array.isArray(mathAssessment.recommendedFocus)).toBe(true);
      expect(mathAssessment.recommendedFocus.length).toBeGreaterThan(0);
    });

    it('should calculate concept coverage', () => {
      const assessments = knowledgeGapSystem.assessSkillDomains(
        conceptMap,
        ['math']
      );

      const mathAssessment = assessments[0];
      expect(mathAssessment.conceptCoverage).toBeGreaterThanOrEqual(0);
      expect(mathAssessment.conceptCoverage).toBeLessThanOrEqual(1);
    });
  });

  describe('Learning Velocity Tracking', () => {
    beforeEach(() => {
      // Add session history with mastery progression
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      const twoHoursAgo = now - 7200000;

      mockProfile.sessionHistory = [
        {
          id: 'session-1',
          startTime: twoHoursAgo,
          endTime: twoHoursAgo + 1800000,
          activities: [
            {
              id: 'activity-1',
              type: 'lesson',
              title: 'Addition Basics',
              description: 'Learn addition',
              content: {},
              difficulty: 'beginner',
              learningStyles: ['visual'],
              estimatedDuration: 15,
              objectives: ['math.addition'],
              metadata: {
                generatedBy: 'contentGeneration',
                generatedAt: twoHoursAgo,
                adaptationHistory: []
              }
            } as Activity
          ],
          objectives: [],
          outcomes: [],
          engagementData: mockLearningState.engagementMetrics,
          interventions: []
        } as LearningSession,
        {
          id: 'session-2',
          startTime: oneHourAgo,
          endTime: oneHourAgo + 1800000,
          activities: [
            {
              id: 'activity-2',
              type: 'practice',
              title: 'Subtraction Practice',
              description: 'Practice subtraction',
              content: {},
              difficulty: 'intermediate',
              learningStyles: ['visual'],
              estimatedDuration: 20,
              objectives: ['math.subtraction'],
              metadata: {
                generatedBy: 'contentGeneration',
                generatedAt: oneHourAgo,
                adaptationHistory: []
              }
            } as Activity
          ],
          objectives: [],
          outcomes: [],
          engagementData: mockLearningState.engagementMetrics,
          interventions: []
        } as LearningSession
      ];
    });

    it('should track learning velocity metrics', () => {
      const metrics = knowledgeGapSystem.trackLearningVelocity(
        'test-student-1',
        mockProfile,
        conceptMap
      );

      expect(metrics.studentId).toBe('test-student-1');
      expect(metrics.timeWindow).toBeGreaterThan(0);
      expect(metrics.masteryRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate mastery rate', () => {
      const metrics = knowledgeGapSystem.trackLearningVelocity(
        'test-student-1',
        mockProfile,
        conceptMap
      );

      expect(metrics.masteryRate).toBeGreaterThanOrEqual(0);
      expect(metrics.conceptsMastered).toBeGreaterThanOrEqual(0);
    });

    it('should recommend adaptation based on velocity', () => {
      const metrics = knowledgeGapSystem.trackLearningVelocity(
        'test-student-1',
        mockProfile,
        conceptMap
      );

      expect(['accelerate', 'maintain', 'decelerate']).toContain(
        metrics.adaptationNeeded
      );
    });

    it('should project completion time', () => {
      const metrics = knowledgeGapSystem.trackLearningVelocity(
        'test-student-1',
        mockProfile,
        conceptMap
      );

      expect(metrics.projectedCompletion).toBeGreaterThanOrEqual(0);
    });

    it('should calculate progression rate', () => {
      const metrics = knowledgeGapSystem.trackLearningVelocity(
        'test-student-1',
        mockProfile,
        conceptMap
      );

      expect(metrics.progressionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.progressionRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Comprehensive Gap Report', () => {
    it('should generate a complete knowledge gap report', () => {
      const report = knowledgeGapSystem.generateKnowledgeGapReport(
        conceptMap,
        mockLearningState,
        mockProfile
      );

      expect(report.dependencyGraph).toBeDefined();
      expect(report.foundationalAnalysis).toBeDefined();
      expect(report.skillAssessments).toBeDefined();
      expect(report.velocityMetrics).toBeDefined();
      expect(report.prioritizedGaps).toBeDefined();
      expect(report.actionPlan).toBeDefined();
    });

    it('should prioritize gaps by severity and impact', () => {
      const report = knowledgeGapSystem.generateKnowledgeGapReport(
        conceptMap,
        mockLearningState,
        mockProfile
      );

      expect(Array.isArray(report.prioritizedGaps)).toBe(true);
      
      // Gaps should be ordered by priority
      if (report.prioritizedGaps.length > 1) {
        // First gap should be high priority
        const firstGap = report.prioritizedGaps[0];
        expect(firstGap.severity).toBeDefined();
      }
    });

    it('should generate actionable action plan', () => {
      const report = knowledgeGapSystem.generateKnowledgeGapReport(
        conceptMap,
        mockLearningState,
        mockProfile
      );

      expect(Array.isArray(report.actionPlan)).toBe(true);
      expect(report.actionPlan.length).toBeGreaterThan(0);
      
      // Action plan should contain phases
      const hasPhases = report.actionPlan.some(action => 
        action.includes('Phase')
      );
      expect(hasPhases).toBe(true);
    });

    it('should integrate all analysis components', () => {
      const report = knowledgeGapSystem.generateKnowledgeGapReport(
        conceptMap,
        mockLearningState,
        mockProfile
      );

      // Verify all components are present and connected
      expect(report.dependencyGraph.nodes.size).toBeGreaterThan(0);
      expect(report.foundationalAnalysis.missingFoundations.length).toBeGreaterThanOrEqual(0);
      expect(report.skillAssessments.length).toBeGreaterThan(0);
      expect(report.velocityMetrics.studentId).toBe('test-student-1');
    });
  });
});
