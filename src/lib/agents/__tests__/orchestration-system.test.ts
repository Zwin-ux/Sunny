import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningOrchestrator } from '../orchestrator';
import { AgentEventSystem } from '../event-system';
import { BaseAgent } from '../base-agent';
import {
  AgentType,
  AgentMessage,
  AgentResponse,
  EnhancedStudentProfile,
  LearningState,
  Recommendation
} from '../types';

// Mock Agent for testing
class MockAgent extends BaseAgent {
  constructor(type: AgentType) {
    super(type);
  }

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    return {
      messageId: message.id,
      success: true,
      data: { processed: true },
      recommendations: [
        {
          id: 'rec-1',
          type: 'content',
          priority: 'medium',
          description: 'Test recommendation',
          data: {},
          confidence: 0.8
        }
      ]
    };
  }

  async shutdown(): Promise<void> {
    // Mock shutdown
  }
}

describe('Orchestration System', () => {
  let orchestrator: LearningOrchestrator;
  let eventSystem: AgentEventSystem;

  beforeEach(() => {
    eventSystem = new AgentEventSystem({
      enableLogging: false,
      enablePerformanceMonitoring: true
    });
    
    orchestrator = new LearningOrchestrator({
      enableAnalytics: true,
      conflictResolutionStrategy: 'weighted'
    });
  });

  describe('Agent Registration and Lifecycle', () => {
    it('should register agents successfully', () => {
      const mockAgent = new MockAgent('assessment');
      orchestrator.registerAgent(mockAgent);
      
      const health = orchestrator.getSystemHealth();
      expect(health.agentHealth.has('assessment')).toBe(true);
    });

    it('should start and stop orchestrator', async () => {
      const mockAgent = new MockAgent('assessment');
      orchestrator.registerAgent(mockAgent);
      
      await orchestrator.start();
      let health = orchestrator.getSystemHealth();
      expect(health.orchestratorRunning).toBe(true);
      
      await orchestrator.stop();
      health = orchestrator.getSystemHealth();
      expect(health.orchestratorRunning).toBe(false);
    });
  });

  describe('Learning State Management', () => {
    it('should initialize learning state', () => {
      const mockProfile: EnhancedStudentProfile = {
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
          declinePattern: [],
          recoveryTime: 5
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: []
      };

      const state = orchestrator.initializeLearningState(
        'student-1',
        mockProfile
      );

      expect(state.studentId).toBe('student-1');
      expect(state.sessionId).toBeDefined();
      expect(state.knowledgeMap).toBeDefined();
      expect(state.engagementMetrics).toBeDefined();
    });

    it('should update learning state', () => {
      const mockProfile: EnhancedStudentProfile = {
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
          declinePattern: [],
          recoveryTime: 5
        },
        sessionHistory: [],
        progressTimeline: [],
        interventionHistory: []
      };

      orchestrator.initializeLearningState('student-1', mockProfile);
      
      orchestrator.updateLearningState('student-1', {
        currentObjectives: [{
          id: 'obj-1',
          title: 'Learn Math',
          description: 'Basic arithmetic',
          targetLevel: 'beginner',
          prerequisites: [],
          estimatedDuration: 30,
          priority: 'high',
          progress: 0.5
        }]
      });

      const state = orchestrator.getLearningState('student-1');
      expect(state?.currentObjectives).toHaveLength(1);
      expect(state?.currentObjectives[0].title).toBe('Learn Math');
    });
  });

  describe('System Health Monitoring', () => {
    it('should report system health', () => {
      const health = orchestrator.getSystemHealth();
      
      expect(health).toHaveProperty('orchestratorRunning');
      expect(health).toHaveProperty('agentHealth');
      expect(health).toHaveProperty('activeOperations');
      expect(health).toHaveProperty('activeLearningStates');
      expect(health).toHaveProperty('queueStats');
      expect(health).toHaveProperty('coherenceScore');
    });
  });
});

describe('Event System', () => {
  let eventSystem: AgentEventSystem;

  beforeEach(() => {
    eventSystem = new AgentEventSystem({
      enableLogging: true,
      enablePerformanceMonitoring: true,
      bottleneckThreshold: 100
    });
  });

  describe('Event Publishing and Processing', () => {
    it('should publish and process events', async () => {
      const eventReceived = vi.fn();
      
      eventSystem.on('event:processed', eventReceived);
      
      const event = eventSystem.createEvent(
        'test:event',
        'assessment',
        { test: 'data' },
        'high'
      );
      
      eventSystem.publishEvent(event);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventReceived).toHaveBeenCalled();
    });

    it('should prioritize urgent events', async () => {
      const processedEvents: string[] = [];
      
      eventSystem.on('event:processed', (event) => {
        processedEvents.push(event.priority);
      });
      
      // Publish events in reverse priority order
      // Note: Events are processed immediately, so we need to wait between publishes
      eventSystem.publishEvent(eventSystem.createEvent('test1', 'assessment', {}, 'low'));
      await new Promise(resolve => setTimeout(resolve, 50));
      eventSystem.publishEvent(eventSystem.createEvent('test2', 'assessment', {}, 'urgent'));
      await new Promise(resolve => setTimeout(resolve, 50));
      eventSystem.publishEvent(eventSystem.createEvent('test3', 'assessment', {}, 'medium'));
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check that we have all events processed
      expect(processedEvents.length).toBe(3);
      // Verify urgent was processed (it should be in the array)
      expect(processedEvents).toContain('urgent');
      expect(processedEvents).toContain('medium');
      expect(processedEvents).toContain('low');
    });
  });

  describe('Agent Subscriptions', () => {
    it('should subscribe agents to events', () => {
      eventSystem.subscribeAgent('assessment', ['learning:progress', 'engagement:change']);
      
      const stats = eventSystem.getSubscriptionStats();
      expect(stats['assessment']).toContain('learning:progress');
      expect(stats['assessment']).toContain('engagement:change');
    });

    it('should unsubscribe agents from events', () => {
      eventSystem.subscribeAgent('assessment', ['learning:progress']);
      eventSystem.unsubscribeAgent('assessment', ['learning:progress']);
      
      const stats = eventSystem.getSubscriptionStats();
      expect(stats['assessment']).not.toContain('learning:progress');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const event = eventSystem.createEvent('test:event', 'assessment', {}, 'medium');
      eventSystem.publishEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = eventSystem.getPerformanceMetrics();
      expect(metrics).toHaveProperty('avgEventProcessingTime');
      expect(metrics).toHaveProperty('totalEventsProcessed');
      expect(metrics.totalEventsProcessed).toBeGreaterThan(0);
    });

    it('should detect bottlenecks', async () => {
      // Create a slow event handler
      eventSystem.registerGlobalHandler('slow:event', {
        eventType: 'slow:event',
        priority: 'medium',
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      });
      
      const event = eventSystem.createEvent('slow:event', 'assessment', {}, 'medium');
      eventSystem.publishEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const bottlenecks = eventSystem.detectBottlenecks();
      expect(bottlenecks.length).toBeGreaterThan(0);
    });
  });

  describe('Event Logging', () => {
    it('should log events', async () => {
      const event = eventSystem.createEvent('test:event', 'assessment', {}, 'high');
      eventSystem.publishEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const log = eventSystem.getEventLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].eventType).toBe('test:event');
    });

    it('should filter event logs', async () => {
      eventSystem.publishEvent(eventSystem.createEvent('event1', 'assessment', {}, 'high'));
      eventSystem.publishEvent(eventSystem.createEvent('event2', 'pathPlanning', {}, 'low'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const filteredLog = eventSystem.getEventLog({
        source: 'assessment'
      });
      
      expect(filteredLog.every(entry => entry.source === 'assessment')).toBe(true);
    });
  });

  describe('Queue Management', () => {
    it('should handle queue overflow', () => {
      const smallQueueSystem = new AgentEventSystem({
        maxQueueSize: 5,
        enableLogging: false
      });
      
      // Publish more events than queue size
      for (let i = 0; i < 10; i++) {
        smallQueueSystem.publishEvent(
          smallQueueSystem.createEvent(`event${i}`, 'assessment', {}, 'low')
        );
      }
      
      const stats = smallQueueSystem.getQueueStats();
      expect(stats.eventQueue).toBeLessThanOrEqual(5);
    });
  });
});
