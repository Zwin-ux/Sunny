/**
 * Tests for Intervention Agent
 * Verifies frustration detection, engagement monitoring, and scaffolding support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InterventionAgent } from '../intervention-agent';
import { LearningState, EngagementData } from '../types';

describe('InterventionAgent', () => {
  let agent: InterventionAgent;

  beforeEach(async () => {
    agent = new InterventionAgent();
    await agent.start();
  });

  describe('Frustration Detection', () => {
    it('should detect frustration from multiple incorrect attempts', async () => {
      const recentInteractions = [
        { correct: false, content: 'I don\'t know', responseTime: 5000 },
        { correct: false, content: 'This is too hard', responseTime: 6000 },
        { correct: false, content: 'I give up', responseTime: 7000 }
      ];

      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.3,
          attentionSpan: 5,
          interactionFrequency: 0.5,
          responseTime: 6000,
          frustrationLevel: 0.8,
          motivationLevel: 0.3,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'detect_intervention_needs',
          studentId: 'test-student',
          learningState,
          recentInteractions
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.triggers).toBeDefined();
      
      const frustrationTrigger = response.data.triggers.find((t: any) => t.type === 'frustration');
      expect(frustrationTrigger).toBeDefined();
      expect(frustrationTrigger.severity).toBeGreaterThan(0.5);
    });

    it('should detect negative sentiment in responses', async () => {
      const recentInteractions = [
        { correct: false, content: 'I hate this', responseTime: 5000 },
        { correct: false, content: 'This is stupid', responseTime: 6000 }
      ];

      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.4,
          attentionSpan: 5,
          interactionFrequency: 0.5,
          responseTime: 5500,
          frustrationLevel: 0.7,
          motivationLevel: 0.4,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'detect_intervention_needs',
          studentId: 'test-student',
          learningState,
          recentInteractions
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      const frustrationTrigger = response.data.triggers.find((t: any) => t.type === 'frustration');
      expect(frustrationTrigger).toBeDefined();
      expect(frustrationTrigger.indicators).toContain('negative_sentiment');
    });
  });

  describe('Engagement Drop Detection', () => {
    it('should detect critical engagement drop', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.15, // Critical level
          attentionSpan: 2,
          interactionFrequency: 0.2,
          responseTime: 10000,
          frustrationLevel: 0.5,
          motivationLevel: 0.2,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'detect_engagement_drop',
          studentId: 'test-student',
          learningState
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.engagementDrop).toBeDefined();
      expect(response.data.engagementDrop.currentLevel).toBeLessThan(0.2);
    });
  });

  describe('Difficulty Adjustment', () => {
    it('should recommend reducing difficulty for low accuracy', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.4,
          attentionSpan: 5,
          interactionFrequency: 0.5,
          responseTime: 8000,
          frustrationLevel: 0.8,
          motivationLevel: 0.3,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now(),
        currentDifficulty: 'hard'
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'recommend_difficulty_adjustment',
          studentId: 'test-student',
          learningState,
          recentPerformance: { accuracyRate: 0.3 }
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.adjustment).toBeDefined();
      expect(response.data.adjustment.adjustmentType).toBe('decrease');
      expect(response.data.adjustment.recommendedDifficulty).not.toBe('hard');
    });

    it('should recommend increasing difficulty for high accuracy with low engagement', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.4,
          attentionSpan: 5,
          interactionFrequency: 0.5,
          responseTime: 3000,
          frustrationLevel: 0.2,
          motivationLevel: 0.5,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now(),
        currentDifficulty: 'easy'
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'recommend_difficulty_adjustment',
          studentId: 'test-student',
          learningState,
          recentPerformance: { accuracyRate: 0.9 }
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.adjustment).toBeDefined();
      expect(response.data.adjustment.adjustmentType).toBe('increase');
    });
  });

  describe('Scaffolding Support', () => {
    it('should provide maximum scaffolding for high frustration', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.3,
          attentionSpan: 3,
          interactionFrequency: 0.4,
          responseTime: 10000,
          frustrationLevel: 0.9,
          motivationLevel: 0.2,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'provide_scaffolding',
          studentId: 'test-student',
          learningState,
          currentActivity: { id: 'test-activity' },
          strugglingConcepts: ['math-addition']
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.scaffolding).toBeDefined();
      expect(response.data.scaffolding.level).toBe('maximum');
      expect(response.data.scaffolding.hints.length).toBeGreaterThan(0);
      expect(response.data.scaffolding.stepByStep).toBe(true);
    });

    it('should provide minimal scaffolding for low frustration', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.8,
          attentionSpan: 10,
          interactionFrequency: 0.8,
          responseTime: 5000,
          frustrationLevel: 0.2,
          motivationLevel: 0.8,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'provide_scaffolding',
          studentId: 'test-student',
          learningState,
          currentActivity: { id: 'test-activity' },
          strugglingConcepts: []
        },
        timestamp: Date.now(),
        priority: 'medium'
      });

      expect(response.success).toBe(true);
      expect(response.data.scaffolding).toBeDefined();
      expect(response.data.scaffolding.level).toBe('minimal');
    });
  });

  describe('Gamification Injection', () => {
    it('should inject heavy gamification for critical engagement', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.2,
          attentionSpan: 2,
          interactionFrequency: 0.3,
          responseTime: 8000,
          frustrationLevel: 0.5,
          motivationLevel: 0.3,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'inject_gamification',
          studentId: 'test-student',
          learningState,
          engagementLevel: 0.2
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.gamification).toBeDefined();
      expect(response.data.gamification.intensity).toBe('heavy');
      expect(response.data.gamification.elements.length).toBeGreaterThan(3);
      expect(response.data.gamification.timing).toBe('immediate');
    });
  });

  describe('Break Recommendations', () => {
    it('should suggest urgent break for fatigue', async () => {
      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.3,
          attentionSpan: 0.2,
          interactionFrequency: 0.3,
          responseTime: 12000,
          frustrationLevel: 0.6,
          motivationLevel: 0.3,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now(),
        sessionStartTime: Date.now() - (70 * 60 * 1000) // 70 minutes ago
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'suggest_break',
          studentId: 'test-student',
          learningState,
          reason: 'fatigue_detected'
        },
        timestamp: Date.now(),
        priority: 'urgent'
      });

      expect(response.success).toBe(true);
      expect(response.data.breakRecommendation).toBeDefined();
      expect(response.data.breakRecommendation.priority).toBe('urgent');
      expect(response.data.breakRecommendation.breakDuration).toBeGreaterThan(5);
    });
  });

  describe('Emotional State Monitoring', () => {
    it('should detect frustrated emotional state', async () => {
      const recentInteractions = [
        { correct: false, content: 'This is so frustrating!', responseTime: 8000 },
        { correct: false, content: 'I can\'t do this', responseTime: 9000 },
        { correct: false, content: 'Help me please', responseTime: 10000 }
      ];

      const learningState: LearningState = {
        studentId: 'test-student',
        sessionId: 'test-session',
        currentObjectives: [],
        knowledgeMap: { concepts: {}, relationships: [], masteryLevels: new Map(), knowledgeGaps: [] },
        engagementMetrics: {
          currentLevel: 0.3,
          attentionSpan: 4,
          interactionFrequency: 0.4,
          responseTime: 9000,
          frustrationLevel: 0.8,
          motivationLevel: 0.3,
          preferredActivityTypes: [],
          engagementHistory: []
        },
        learningPath: [],
        contextHistory: [],
        lastUpdated: Date.now()
      };

      const response = await agent.processMessage({
        id: 'test-msg',
        from: 'orchestrator',
        to: 'intervention',
        type: 'request',
        payload: {
          action: 'monitor_emotional_state',
          studentId: 'test-student',
          recentInteractions,
          learningState
        },
        timestamp: Date.now(),
        priority: 'high'
      });

      expect(response.success).toBe(true);
      expect(response.data.emotionalState).toBeDefined();
      expect(response.data.emotionalState.primary).toBe('frustrated');
    });
  });
});
