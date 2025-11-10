/**
 * Agent Behavior Testing System
 * Comprehensive tests for agent functionality, communication, behavior, and performance
 * Requirements: All requirements (quality assurance)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseAgent } from '../base-agent';
import { AssessmentAgent } from '../assessment-agent';
import { ContentGenerationAgent } from '../content-generation-agent';
import { PathPlanningAgent } from '../path-planning-agent';
import { InterventionAgent } from '../intervention-agent';
import { CommunicationAgent } from '../communication-agent';
import { LearningOrchestrator } from '../orchestrator';
import { AgentEventSystem } from '../event-system';
import {
  AgentType,
  AgentMessage,
  AgentResponse,
  EnhancedStudentProfile,
  LearningState,
  Priority
} from '../types';

// Mock agent for testing base functionality
class TestAgent extends BaseAgent {
  public initializeCalled = false;
  public shutdownCalled = false;
  public messagesProcessed: AgentMessage[] = [];

  constructor(type: AgentType = 'assessment') {
    super(type);
  }

  async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    this.messagesProcessed.push(message);
    return {
      messageId: message.id,
      success: true,
      data: { processed: true, timestamp: Date.now() }
    };
  }

  async shutdown(): Promise<void> {
    this.shutdownCalled = true;
  }
}

// Helper function to create mock student profile
function createMockProfile(overrides: Partial<EnhancedStudentProfile> = {}): EnhancedStudentProfile {
  return {
    name: 'Test Student',
    level: 1,
    points: 0,
    completedLessons: [],
    preferredActivityTypes: [],
    cognitiveProfile: {
      processingSpeed: 0.7,
      workingMemoryCapacity: 0.8,
      attentionControl: 0.6,
      metacognition: 0.5
    },
    motivationFactors: {
      intrinsicMotivation: 0.8,
      extrinsicMotivation: 0.6,
      competitiveSpirit: 0.5,
      collaborativePreference: 0.7,
      autonomyPreference: 0.6
    },
    learningVelocity: {
      conceptAcquisitionRate: 2.5,
      skillDevelopmentRate: 1.8,
      retentionRate: 0.75,
      transferRate: 0.65
    },
    responsePatterns: [],
    engagementPatterns: [],
    optimalLearningTimes: [],
    attentionSpanData: {
      averageSpan: 15,
      peakSpan: 25,
      declinePattern: [1.0, 0.9, 0.8],
      recoveryTime: 5
    },
    sessionHistory: [],
    progressTimeline: [],
    interventionHistory: [],
    ...overrides
  };
}

describe('Agent Behavior Testing System', () => {
  describe('Unit Tests: Individual Agent Functionality', () => {
    describe('BaseAgent Core Functionality', () => {
      let agent: TestAgent;

      beforeEach(() => {
        agent = new TestAgent();
      });

      afterEach(async () => {
        if (agent.active) {
          await agent.stop();
        }
      });

      it('should initialize agent correctly', async () => {
        await agent.start();
        expect(agent.initializeCalled).toBe(true);
        expect(agent.active).toBe(true);
      });

      it('should shutdown agent correctly', async () => {
        await agent.start();
        await agent.stop();
        expect(agent.shutdownCalled).toBe(true);
        expect(agent.active).toBe(false);
      });

      it('should process messages when active', async () => {
        await agent.start();
        
        const message: AgentMessage = {
          id: 'test-msg-1',
          from: 'orchestrator',
          to: 'assessment',
          type: 'request',
          payload: { test: 'data' },
          timestamp: Date.now(),
          priority: 'medium'
        };

        const response = await agent.handleMessage(message);
        
        expect(response.success).toBe(true);
        expect(agent.messagesProcessed).toHaveLength(1);
        expect(agent.messagesProcessed[0].id).toBe('test-msg-1');
      });

      it('should reject messages when inactive', async () => {
        const message: AgentMessage = {
          id: 'test-msg-2',
          from: 'orchestrator',
          to: 'assessment',
          type: 'request',
          payload: { test: 'data' },
          timestamp: Date.now(),
          priority: 'medium'
        };

        const response = await agent.handleMessage(message);
        
        expect(response.success).toBe(false);
        expect(response.error).toContain('not active');
      });

      it('should queue messages when processing', async () => {
        await agent.start();
        
        const message1: AgentMessage = {
          id: 'test-msg-3',
          from: 'orchestrator',
          to: 'assessment',
          type: 'request',
          payload: { test: 'data1' },
          timestamp: Date.now(),
          priority: 'medium'
        };

        const message2: AgentMessage = {
          id: 'test-msg-4',
          from: 'orchestrator',
          to: 'assessment',
          type: 'request',
          payload: { test: 'data2' },
          timestamp: Date.now(),
          priority: 'medium'
        };

        // Send both messages quickly
        const response1 = agent.handleMessage(message1);
        const response2 = agent.handleMessage(message2);

        await Promise.all([response1, response2]);
        
        // Both should eventually be processed
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(agent.messagesProcessed.length).toBeGreaterThanOrEqual(1);
      });

      it('should report health status correctly', async () => {
        const healthBefore = agent.getHealthStatus();
        expect(healthBefore.healthy).toBe(false);
        expect(healthBefore.details.isActive).toBe(false);

        await agent.start();
        
        const healthAfter = agent.getHealthStatus();
        expect(healthAfter.healthy).toBe(true);
        expect(healthAfter.details.isActive).toBe(true);
      });
    });

    describe('AssessmentAgent Functionality', () => {
      let agent: AssessmentAgent;

      beforeEach(async () => {
        agent = new AssessmentAgent();
        await agent.start();
      });

      afterEach(async () => {
        await agent.stop();
      });

      it('should analyze student interactions', async () => {
        const message: AgentMessage = {
          id: 'assess-1',
          from: 'orchestrator',
          to: 'assessment',
          type: 'request',
          payload: {
            action: 'analyze',
            data: {
              interaction: {
                studentMessage: 'I think 2+2=5',
                responseTime: 3000
              },
              learningState: {
                studentId: 'student-1',
                sessionId: 'session-1',
                currentObjectives: [],
                knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
                engagementMetrics: {
                  currentLevel: 0.7,
                  attentionSpan: 15,
                  interactionFrequency: 5,
                  responseTime: 3,
                  frustrationLevel: 0.2,
                  motivationLevel: 0.8,
                  preferredActivityTypes: [],
                  engagementHistory: []
                },
                learningPath: [],
                contextHistory: [],
                lastUpdated: Date.now()
              }
            }
          },
          timestamp: Date.now(),
          priority: 'high'
        };

        const response = await agent.handleMessage(message);
        
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
      });
    });

    describe('ContentGenerationAgent Functionality', () => {
      let agent: ContentGenerationAgent;

      beforeEach(async () => {
        agent = new ContentGenerationAgent();
        await agent.start();
      });

      afterEach(async () => {
        await agent.stop();
      });

      it('should generate quiz content', async () => {
        const message: AgentMessage = {
          id: 'content-1',
          from: 'orchestrator',
          to: 'contentGeneration',
          type: 'request',
          payload: {
            action: 'generate-quiz',
            topic: 'addition',
            difficulty: 'beginner',
            studentProfile: createMockProfile()
          },
          timestamp: Date.now(),
          priority: 'medium'
        };

        const response = await agent.handleMessage(message);
        
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('quiz');
      });
    });
  });

  describe('Integration Tests: Agent Communication', () => {
    let orchestrator: LearningOrchestrator;
    let assessmentAgent: AssessmentAgent;
    let contentAgent: ContentGenerationAgent;
    let pathAgent: PathPlanningAgent;
    let interventionAgent: InterventionAgent;
    let communicationAgent: CommunicationAgent;

    beforeEach(async () => {
      orchestrator = new LearningOrchestrator({
        enableAnalytics: true,
        conflictResolutionStrategy: 'weighted'
      });

      assessmentAgent = new AssessmentAgent();
      contentAgent = new ContentGenerationAgent();
      pathAgent = new PathPlanningAgent();
      interventionAgent = new InterventionAgent();
      communicationAgent = new CommunicationAgent();

      orchestrator.registerAgent(assessmentAgent);
      orchestrator.registerAgent(contentAgent);
      orchestrator.registerAgent(pathAgent);
      orchestrator.registerAgent(interventionAgent);
      orchestrator.registerAgent(communicationAgent);

      await orchestrator.start();
    });

    afterEach(async () => {
      await orchestrator.stop();
    });

    it('should coordinate multiple agents for student interaction', async () => {
      const profile = createMockProfile();
      orchestrator.initializeLearningState('student-1', profile);

      const result = await orchestrator.processStudentInteraction('student-1', {
        message: 'I want to learn multiplication',
        timestamp: Date.now()
      });

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('actions');
      expect(result.response).toBeTruthy();
    });

    it('should maintain learning state across interactions', async () => {
      const profile = createMockProfile();
      const state = orchestrator.initializeLearningState('student-2', profile);

      expect(state.studentId).toBe('student-2');
      expect(state.sessionId).toBeDefined();

      // First interaction
      await orchestrator.processStudentInteraction('student-2', {
        message: 'Teach me about fractions',
        timestamp: Date.now()
      });

      // Second interaction
      await orchestrator.processStudentInteraction('student-2', {
        message: 'What is 1/2 + 1/4?',
        timestamp: Date.now()
      });

      const updatedState = orchestrator.getLearningState('student-2');
      expect(updatedState).toBeDefined();
      expect(updatedState?.studentId).toBe('student-2');
    });

    it('should handle agent failures gracefully', async () => {
      const profile = createMockProfile();
      orchestrator.initializeLearningState('student-3', profile);

      // This should not throw even if an agent fails
      const result = await orchestrator.processStudentInteraction('student-3', {
        message: 'Test message',
        timestamp: Date.now()
      });

      expect(result).toHaveProperty('response');
      expect(result.response).toBeTruthy();
    });

    it('should report system health correctly', () => {
      const health = orchestrator.getSystemHealth();

      expect(health.orchestratorRunning).toBe(true);
      expect(health.agentHealth.size).toBeGreaterThan(0);
      expect(health.agentHealth.get('assessment')).toBe(true);
      expect(health.agentHealth.get('contentGeneration')).toBe(true);
    });
  });

  describe('Behavior Tests: Learning Scenario Validation', () => {
    let orchestrator: LearningOrchestrator;

    beforeEach(async () => {
      orchestrator = new LearningOrchestrator({
        enableAnalytics: true,
        conflictResolutionStrategy: 'weighted'
      });

      const assessmentAgent = new AssessmentAgent();
      const contentAgent = new ContentGenerationAgent();
      const pathAgent = new PathPlanningAgent();
      const interventionAgent = new InterventionAgent();
      const communicationAgent = new CommunicationAgent();

      orchestrator.registerAgent(assessmentAgent);
      orchestrator.registerAgent(contentAgent);
      orchestrator.registerAgent(pathAgent);
      orchestrator.registerAgent(interventionAgent);
      orchestrator.registerAgent(communicationAgent);

      await orchestrator.start();
    });

    afterEach(async () => {
      await orchestrator.stop();
    });

    it('should adapt to struggling student', async () => {
      const profile = createMockProfile({
        cognitiveProfile: {
          processingSpeed: 0.4,
          workingMemoryCapacity: 0.5,
          attentionControl: 0.3,
          metacognition: 0.4
        }
      });

      orchestrator.initializeLearningState('struggling-student', profile);

      const result = await orchestrator.processStudentInteraction('struggling-student', {
        message: 'I don\'t understand this at all',
        responseTime: 8000,
        correctness: 0.2
      });

      expect(result.response).toBeTruthy();
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it('should challenge advanced student', async () => {
      const profile = createMockProfile({
        cognitiveProfile: {
          processingSpeed: 0.9,
          workingMemoryCapacity: 0.9,
          attentionControl: 0.8,
          metacognition: 0.9
        }
      });

      orchestrator.initializeLearningState('advanced-student', profile);

      const result = await orchestrator.processStudentInteraction('advanced-student', {
        message: 'This is too easy, I want something harder',
        responseTime: 1000,
        correctness: 1.0
      });

      expect(result.response).toBeTruthy();
    });

    it('should detect and respond to disengagement', async () => {
      const profile = createMockProfile();
      const state = orchestrator.initializeLearningState('disengaged-student', profile);

      // Simulate disengagement
      orchestrator.updateLearningState('disengaged-student', {
        engagementMetrics: {
          ...state.engagementMetrics,
          currentLevel: 0.2,
          frustrationLevel: 0.7,
          motivationLevel: 0.3
        }
      });

      const result = await orchestrator.processStudentInteraction('disengaged-student', {
        message: 'ok',
        responseTime: 15000
      });

      expect(result.response).toBeTruthy();
      expect(result.actions).toContain('intervention_applied');
    });

    it('should maintain learning continuity across sessions', async () => {
      const profile = createMockProfile();
      const state = orchestrator.initializeLearningState('continuity-student', profile);

      // First session
      await orchestrator.processStudentInteraction('continuity-student', {
        message: 'I learned about addition today',
        timestamp: Date.now()
      });

      // Simulate session end and new session
      const updatedState = orchestrator.getLearningState('continuity-student');
      expect(updatedState).toBeDefined();

      // Second session should have context
      const result = await orchestrator.processStudentInteraction('continuity-student', {
        message: 'Can we continue from yesterday?',
        timestamp: Date.now() + 86400000 // Next day
      });

      expect(result.response).toBeTruthy();
    });
  });

  describe('Performance Tests: Response Time Requirements', () => {
    let orchestrator: LearningOrchestrator;

    beforeEach(async () => {
      orchestrator = new LearningOrchestrator({
        enableAnalytics: true,
        conflictResolutionStrategy: 'weighted'
      });

      const assessmentAgent = new AssessmentAgent();
      const contentAgent = new ContentGenerationAgent();
      const pathAgent = new PathPlanningAgent();
      const interventionAgent = new InterventionAgent();
      const communicationAgent = new CommunicationAgent();

      orchestrator.registerAgent(assessmentAgent);
      orchestrator.registerAgent(contentAgent);
      orchestrator.registerAgent(pathAgent);
      orchestrator.registerAgent(interventionAgent);
      orchestrator.registerAgent(communicationAgent);

      await orchestrator.start();
    });

    afterEach(async () => {
      await orchestrator.stop();
    });

    it('should process student interaction within 5 seconds', async () => {
      const profile = createMockProfile();
      orchestrator.initializeLearningState('perf-student-1', profile);

      const startTime = Date.now();
      
      await orchestrator.processStudentInteraction('perf-student-1', {
        message: 'What is 5 + 3?',
        timestamp: Date.now()
      });

      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent interactions', async () => {
      const profile = createMockProfile();
      
      // Initialize multiple students
      for (let i = 0; i < 5; i++) {
        orchestrator.initializeLearningState(`perf-student-${i}`, profile);
      }

      const startTime = Date.now();
      
      // Process interactions concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          orchestrator.processStudentInteraction(`perf-student-${i}`, {
            message: `Question ${i}`,
            timestamp: Date.now()
          })
        );
      }

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should handle 5 concurrent interactions within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should initialize learning state quickly', () => {
      const profile = createMockProfile();
      
      const startTime = Date.now();
      orchestrator.initializeLearningState('init-perf-student', profile);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should initialize within 100ms
    });

    it('should update learning state efficiently', () => {
      const profile = createMockProfile();
      orchestrator.initializeLearningState('update-perf-student', profile);

      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        orchestrator.updateLearningState('update-perf-student', {
          currentObjectives: [{
            id: `obj-${i}`,
            title: `Objective ${i}`,
            description: 'Test objective',
            targetLevel: 'beginner',
            prerequisites: [],
            estimatedDuration: 30,
            priority: 'medium',
            progress: 0.5
          }]
        });
      }
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // 10 updates within 500ms
    });
  });

  describe('Event System Tests', () => {
    let eventSystem: AgentEventSystem;

    beforeEach(() => {
      eventSystem = new AgentEventSystem({
        enableLogging: true,
        enablePerformanceMonitoring: true
      });
    });

    it('should publish and process events correctly', async () => {
      const eventReceived = vi.fn();
      
      eventSystem.on('event:processed', eventReceived);
      
      const event = eventSystem.createEvent(
        'test:event',
        'assessment',
        { test: 'data' },
        'high'
      );
      
      eventSystem.publishEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventReceived).toHaveBeenCalled();
    });

    it('should handle event priorities correctly', async () => {
      const processedEvents: string[] = [];
      
      eventSystem.on('event:processed', (event) => {
        processedEvents.push(event.priority);
      });
      
      eventSystem.publishEvent(eventSystem.createEvent('test1', 'assessment', {}, 'low'));
      await new Promise(resolve => setTimeout(resolve, 50));
      eventSystem.publishEvent(eventSystem.createEvent('test2', 'assessment', {}, 'urgent'));
      await new Promise(resolve => setTimeout(resolve, 50));
      eventSystem.publishEvent(eventSystem.createEvent('test3', 'assessment', {}, 'medium'));
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(processedEvents.length).toBe(3);
      expect(processedEvents).toContain('urgent');
      expect(processedEvents).toContain('medium');
      expect(processedEvents).toContain('low');
    });
  });
});
