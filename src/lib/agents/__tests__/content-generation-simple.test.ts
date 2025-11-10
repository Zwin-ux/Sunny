/**
 * Simple integration test for Content Generation Agent
 * Tests core functionality without complex message handling
 */

import { describe, it, expect } from 'vitest';
import { ContentGenerationAgent } from '../content-generation-agent';
import { LearningState, ConceptMap, EngagementData } from '../types';

describe('ContentGenerationAgent - Core Functionality', () => {
  it('should create and initialize the agent', async () => {
    const agent = new ContentGenerationAgent();
    expect(agent).toBeDefined();
    expect(agent.type).toBe('contentGeneration');
    
    await agent.start();
    expect(agent.active).toBe(true);
    
    await agent.stop();
    expect(agent.active).toBe(false);
  });

  it('should process quiz generation request', async () => {
    const agent = new ContentGenerationAgent();
    await agent.start();

    const mockLearningState: LearningState = {
      studentId: 'test-student',
      sessionId: 'test-session',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.75,
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
      lastUpdated: Date.now(),
      currentDifficulty: 'medium'
    };

    const message = {
      id: 'test-1',
      request: {
        studentId: 'test-student',
        contentType: 'quiz' as const,
        topic: 'Math',
        difficulty: 'medium' as const
      },
      learningState: mockLearningState
    };

    const response = await agent.processMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.content.type).toBe('quiz');
    expect(response.data.content.content.questions).toBeDefined();
    expect(response.data.content.content.questions.length).toBeGreaterThan(0);

    await agent.stop();
  });

  it('should generate lesson with multi-modal content', async () => {
    const agent = new ContentGenerationAgent();
    await agent.start();

    const mockLearningState: LearningState = {
      studentId: 'test-student',
      sessionId: 'test-session',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.75,
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
    };

    const message = {
      id: 'test-2',
      request: {
        studentId: 'test-student',
        contentType: 'lesson' as const,
        topic: 'Science',
        duration: 20
      },
      learningState: mockLearningState
    };

    const response = await agent.processMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.content.type).toBe('lesson');
    expect(response.data.content.content.content.activities).toBeDefined();
    expect(response.data.content.metadata.adaptiveFeatures).toBeDefined();

    await agent.stop();
  });

  it('should generate practice activity with gamification', async () => {
    const agent = new ContentGenerationAgent();
    await agent.start();

    const mockLearningState: LearningState = {
      studentId: 'test-student',
      sessionId: 'test-session',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map([
          ['addition', {
            conceptId: 'addition',
            level: 'developing',
            confidence: 0.6,
            lastAssessed: Date.now(),
            evidence: []
          }]
        ]),
        knowledgeGaps: [
          {
            conceptId: 'addition',
            severity: 'moderate',
            suggestedActions: ['practice'],
            detectedAt: Date.now()
          }
        ]
      },
      engagementMetrics: {
        currentLevel: 0.75,
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
      lastUpdated: Date.now(),
      recentAchievements: ['completed-lesson-1']
    };

    const message = {
      id: 'test-3',
      request: {
        studentId: 'test-student',
        contentType: 'activity' as const,
        topic: 'Math Practice',
        targetGaps: ['addition']
      },
      learningState: mockLearningState
    };

    const response = await agent.processMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.content.content.content.gamification).toBeDefined();
    expect(response.data.content.content.content.difficultyProgression).toBeDefined();
    expect(response.data.content.content.content.extensionActivities).toBeDefined();

    await agent.stop();
  });
});
