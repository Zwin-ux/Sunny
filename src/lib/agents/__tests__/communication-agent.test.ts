/**
 * Communication Agent Tests
 * Tests for adaptive communication and contextual memory features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CommunicationAgent } from '../communication-agent';
import { AgentMessage, EnhancedStudentProfile, LearningState } from '../types';

describe('CommunicationAgent', () => {
  let agent: CommunicationAgent;

  beforeEach(async () => {
    agent = new CommunicationAgent();
    await agent.start();
  });

  afterEach(async () => {
    await agent.stop();
  });

  describe('Task 7.1: Adaptive Communication System', () => {
    it('should adapt communication based on student profile', async () => {
      const mockProfile: Partial<EnhancedStudentProfile> = {
        name: 'TestStudent',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'visual',
        cognitiveProfile: {
          processingSpeed: 0.7,
          workingMemoryCapacity: 0.6,
          attentionControl: 0.5,
          metacognition: 0.4,
        },
        motivationFactors: {
          intrinsicMotivation: 0.8,
          extrinsicMotivation: 0.5,
          competitiveSpirit: 0.6,
          collaborativePreference: 0.7,
          autonomyPreference: 0.5,
        },
        learningVelocity: {
          conceptAcquisitionRate: 0.8,
          skillDevelopmentRate: 0.7,
          retentionRate: 0.75,
          transferRate: 0.6,
        },
        responsePatterns: [],
        engagementPatterns: [],
        preferredActivityTypes: [],
        optimalLearningTimes: [],
        attentionSpanData: {
          averageSpan: 20,
          peakSpan: 30,
          declinePattern: [1.0, 0.9, 0.8],
          recoveryTime: 5,
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: [],
      };

      const message: AgentMessage = {
        id: 'test-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'adapt-communication',
          studentMessage: 'I want to learn about fractions',
          studentProfile: mockProfile,
          conversationHistory: [],
        },
        timestamp: Date.now(),
        priority: 'high',
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('adaptedResponse');
      expect(response.data.adaptedResponse).toHaveProperty('tone');
      expect(response.data.adaptedResponse).toHaveProperty('vocabulary_level');
      expect(response.data.adaptedResponse).toHaveProperty('strategy');
      expect(response.data.adaptedResponse).toHaveProperty('response_suggestions');
    });

    it('should incorporate cultural context', async () => {
      const mockProfile: Partial<EnhancedStudentProfile> = {
        name: 'TestStudent',
        age: 7,
        gradeLevel: '2nd',
        learningStyle: 'kinesthetic',
        cognitiveProfile: {
          processingSpeed: 0.5,
          workingMemoryCapacity: 0.5,
          attentionControl: 0.5,
          metacognition: 0.5,
        },
        motivationFactors: {
          intrinsicMotivation: 0.6,
          extrinsicMotivation: 0.6,
          competitiveSpirit: 0.5,
          collaborativePreference: 0.5,
          autonomyPreference: 0.5,
        },
        learningVelocity: {
          conceptAcquisitionRate: 0.5,
          skillDevelopmentRate: 0.5,
          retentionRate: 0.7,
          transferRate: 0.5,
        },
        responsePatterns: [],
        engagementPatterns: [],
        preferredActivityTypes: [],
        optimalLearningTimes: [],
        attentionSpanData: {
          averageSpan: 15,
          peakSpan: 25,
          declinePattern: [1.0, 0.8, 0.6],
          recoveryTime: 7,
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: [],
      };

      // First, update cultural context
      const updateMessage: AgentMessage = {
        id: 'test-cultural-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'update-cultural-context',
          studentId: 'TestStudent',
          culturalData: {
            language: 'en',
            culturalReferences: ['soccer', 'pizza', 'superheroes'],
            preferredExamples: ['sports', 'food'],
          },
        },
        timestamp: Date.now(),
        priority: 'medium',
      };

      await agent.handleMessage(updateMessage);

      // Then request adapted communication
      const message: AgentMessage = {
        id: 'test-cultural-2',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'adapt-communication',
          studentMessage: 'Tell me about addition',
          studentProfile: mockProfile,
          conversationHistory: [],
        },
        timestamp: Date.now(),
        priority: 'high',
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.adaptedResponse).toHaveProperty('culturalAdaptations');
      expect(response.data.adaptedResponse.culturalAdaptations.length).toBeGreaterThan(0);
    });
  });

  describe('Task 7.2: Contextual Memory and Continuity System', () => {
    it('should preserve conversation context across interactions', async () => {
      const mockProfile: Partial<EnhancedStudentProfile> = {
        name: 'TestStudent',
        age: 9,
        gradeLevel: '4th',
        learningStyle: 'auditory',
        cognitiveProfile: {
          processingSpeed: 0.7,
          workingMemoryCapacity: 0.7,
          attentionControl: 0.6,
          metacognition: 0.6,
        },
        motivationFactors: {
          intrinsicMotivation: 0.7,
          extrinsicMotivation: 0.5,
          competitiveSpirit: 0.6,
          collaborativePreference: 0.6,
          autonomyPreference: 0.6,
        },
        learningVelocity: {
          conceptAcquisitionRate: 0.7,
          skillDevelopmentRate: 0.7,
          retentionRate: 0.8,
          transferRate: 0.6,
        },
        responsePatterns: [],
        engagementPatterns: [],
        preferredActivityTypes: [],
        optimalLearningTimes: [],
        attentionSpanData: {
          averageSpan: 25,
          peakSpan: 35,
          declinePattern: [1.0, 0.9, 0.8],
          recoveryTime: 5,
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: [],
      };

      const learningState: Partial<LearningState> = {
        studentId: 'TestStudent',
        sessionId: 'session-1',
        currentObjectives: [
          {
            id: 'obj-1',
            title: 'Learn multiplication',
            description: 'Understand basic multiplication',
            targetLevel: 'beginner',
            prerequisites: [],
            estimatedDuration: 30,
            priority: 'high',
            progress: 0.5,
          },
        ],
        contextHistory: [],
        lastUpdated: Date.now(),
      };

      // First interaction
      const message1: AgentMessage = {
        id: 'test-context-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'adapt-communication',
          studentMessage: 'I learned about addition yesterday',
          studentProfile: mockProfile,
          conversationHistory: [],
          learningState,
        },
        timestamp: Date.now(),
        priority: 'high',
      };

      const response1 = await agent.handleMessage(message1);
      expect(response1.success).toBe(true);

      // Second interaction - should have context
      const message2: AgentMessage = {
        id: 'test-context-2',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'adapt-communication',
          studentMessage: 'Now I want to learn multiplication',
          studentProfile: mockProfile,
          conversationHistory: [
            { role: 'student', content: 'I learned about addition yesterday' },
            { role: 'assistant', content: 'Great! Addition is important.' },
          ],
          learningState,
        },
        timestamp: Date.now(),
        priority: 'high',
      };

      const response2 = await agent.handleMessage(message2);
      expect(response2.success).toBe(true);
      expect(response2.data.adaptedResponse).toHaveProperty('contextualReferences');
    });

    it('should generate seamless activity transitions', async () => {
      const fromActivity = {
        id: 'activity-1',
        type: 'quiz' as const,
        title: 'Addition Quiz',
        description: 'Practice addition problems',
        content: {},
        difficulty: 'beginner' as const,
        learningStyles: ['visual' as const],
        estimatedDuration: 15,
        objectives: ['obj-1'],
        metadata: {
          generatedBy: 'contentGeneration' as const,
          generatedAt: Date.now(),
          adaptationHistory: [],
        },
      };

      const toActivity = {
        id: 'activity-2',
        type: 'lesson' as const,
        title: 'Multiplication Lesson',
        description: 'Learn multiplication basics',
        content: {},
        difficulty: 'beginner' as const,
        learningStyles: ['visual' as const],
        estimatedDuration: 20,
        objectives: ['obj-2'],
        metadata: {
          generatedBy: 'contentGeneration' as const,
          generatedAt: Date.now(),
          adaptationHistory: [],
        },
      };

      const message: AgentMessage = {
        id: 'test-transition-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'activity-transition',
          transition: {
            fromActivity,
            toActivity,
            reason: 'Building on addition skills',
            continuityPoints: ['addition', 'repeated addition'],
          },
        },
        timestamp: Date.now(),
        priority: 'high',
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.transition).toHaveProperty('message');
      expect(response.data.transition).toHaveProperty('continuityPoints');
      expect(response.data.transition.message).toContain('quiz'); // References the activity type
    });

    it('should generate learning references to past experiences', async () => {
      const message: AgentMessage = {
        id: 'test-reference-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'learning-reference',
          studentId: 'TestStudent',
          currentConcept: 'multiplication',
          context: 'Starting multiplication lesson',
        },
        timestamp: Date.now(),
        priority: 'medium',
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data.reference).toHaveProperty('reference');
      expect(response.data.reference).toHaveProperty('connections');
      expect(response.data.reference).toHaveProperty('confidence');
    });

    it('should retrieve conversation context', async () => {
      const message: AgentMessage = {
        id: 'test-get-context-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'get-conversation-context',
          studentId: 'TestStudent',
        },
        timestamp: Date.now(),
        priority: 'low',
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('context');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete communication flow with context and culture', async () => {
      const mockProfile: Partial<EnhancedStudentProfile> = {
        name: 'IntegrationStudent',
        age: 8,
        gradeLevel: '3rd',
        learningStyle: 'visual',
        cognitiveProfile: {
          processingSpeed: 0.6,
          workingMemoryCapacity: 0.6,
          attentionControl: 0.6,
          metacognition: 0.5,
        },
        motivationFactors: {
          intrinsicMotivation: 0.7,
          extrinsicMotivation: 0.6,
          competitiveSpirit: 0.5,
          collaborativePreference: 0.6,
          autonomyPreference: 0.5,
        },
        learningVelocity: {
          conceptAcquisitionRate: 0.6,
          skillDevelopmentRate: 0.6,
          retentionRate: 0.75,
          transferRate: 0.55,
        },
        responsePatterns: [],
        engagementPatterns: [
          {
            trigger: 'new_topic',
            duration: 15,
            intensity: 0.8,
            recovery: 5,
          },
        ],
        preferredActivityTypes: [],
        optimalLearningTimes: [],
        attentionSpanData: {
          averageSpan: 20,
          peakSpan: 30,
          declinePattern: [1.0, 0.9, 0.8],
          recoveryTime: 5,
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: [],
      };

      // Setup cultural context
      await agent.handleMessage({
        id: 'integration-1',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'update-cultural-context',
          studentId: 'IntegrationStudent',
          culturalData: {
            language: 'en',
            culturalReferences: ['animals', 'nature'],
            preferredExamples: ['stories', 'games'],
          },
        },
        timestamp: Date.now(),
        priority: 'medium',
      });

      // Communicate with full context
      const response = await agent.handleMessage({
        id: 'integration-2',
        from: 'orchestrator',
        to: 'communication',
        type: 'request',
        payload: {
          action: 'adapt-communication',
          studentMessage: 'Can you teach me about shapes?',
          studentProfile: mockProfile,
          conversationHistory: [],
          learningState: {
            studentId: 'IntegrationStudent',
            sessionId: 'integration-session',
            currentObjectives: [],
            knowledgeMap: {
              concepts: {},
              relationships: [],
              masteryLevels: new Map(),
              knowledgeGaps: [],
            },
            engagementMetrics: {
              currentLevel: 0.8,
              attentionSpan: 20,
              interactionFrequency: 5,
              responseTime: 3,
              frustrationLevel: 0.2,
              motivationLevel: 0.8,
              preferredActivityTypes: [],
              engagementHistory: [],
            },
            learningPath: [],
            contextHistory: [],
            lastUpdated: Date.now(),
          },
        },
        timestamp: Date.now(),
        priority: 'high',
      });

      expect(response.success).toBe(true);
      expect(response.data.adaptedResponse).toBeDefined();
      expect(response.data.adaptedResponse.tone).toBeDefined();
      expect(response.data.adaptedResponse.contextualReferences).toBeDefined();
      expect(response.data.adaptedResponse.culturalAdaptations).toBeDefined();
    });
  });
});
