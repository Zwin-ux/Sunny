/**
 * Path Planning Agent Tests
 * Tests for personalized learning path generation and dynamic adaptation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PathPlanningAgent, LearningPath } from '../path-planning-agent';
import {
  AgentMessage,
  LearningState,
  EnhancedStudentProfile,
  LearningObjective,
  ConceptMap,
  EngagementData,
  DifficultyLevel
} from '../types';
import { v4 as uuidv4 } from 'uuid';

describe('PathPlanningAgent', () => {
  let agent: PathPlanningAgent;
  let mockStudentProfile: EnhancedStudentProfile;
  let mockLearningState: LearningState;

  beforeEach(async () => {
    agent = new PathPlanningAgent();
    await agent.start();

    // Create mock student profile
    mockStudentProfile = createMockStudentProfile();
    
    // Create mock learning state
    mockLearningState = createMockLearningState();
  });

  describe('Path Generation', () => {
    it('should generate a personalized learning path', async () => {
      const objectives: LearningObjective[] = [
        {
          id: 'obj-1',
          title: 'Learn Addition',
          description: 'Master basic addition',
          targetLevel: 'beginner' as DifficultyLevel,
          prerequisites: [],
          estimatedDuration: 30,
          priority: 'high',
          progress: 0
        }
      ];

      const message: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.path).toBeDefined();
      expect(response.data.path.nodes.length).toBeGreaterThan(0);
    });

    it('should include prerequisite nodes when knowledge gaps exist', async () => {
      // Add a concept to the knowledge map
      mockLearningState.knowledgeMap.concepts['counting'] = {
        id: 'counting',
        name: 'Counting',
        description: 'Basic counting skills',
        category: 'math',
        difficulty: 'beginner' as DifficultyLevel,
        prerequisites: [],
        relatedConcepts: []
      };

      // Add knowledge gaps to learning state
      mockLearningState.knowledgeMap.knowledgeGaps = [
        {
          conceptId: 'counting',
          severity: 'major',
          description: 'Missing counting skills',
          suggestedActions: ['Practice counting'],
          detectedAt: Date.now()
        }
      ];

      const objectives: LearningObjective[] = [
        {
          id: 'obj-1',
          title: 'Learn Addition',
          description: 'Master basic addition',
          targetLevel: 'beginner' as DifficultyLevel,
          prerequisites: ['counting'],
          estimatedDuration: 30,
          priority: 'high',
          progress: 0
        }
      ];

      const message: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      const path: LearningPath = response.data.path;
      
      // Should have prerequisite nodes
      const prerequisiteNodes = path.nodes.filter(n => n.type === 'concept');
      expect(prerequisiteNodes.length).toBeGreaterThan(0);
    });

    it('should optimize path based on student interests', async () => {
      mockStudentProfile.interests = ['space', 'dinosaurs'];

      const objectives: LearningObjective[] = [
        {
          id: 'obj-1',
          title: 'Learn Multiplication',
          description: 'Master multiplication',
          targetLevel: 'intermediate' as DifficultyLevel,
          prerequisites: [],
          estimatedDuration: 45,
          priority: 'medium',
          progress: 0
        }
      ];

      const message: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      const path: LearningPath = response.data.path;
      
      // Check that nodes have interest-based themes
      const nodesWithThemes = path.nodes.filter(n => n.content.theme);
      expect(nodesWithThemes.length).toBeGreaterThan(0);
    });
  });

  describe('Path Adaptation', () => {
    it('should adapt path when student is struggling', async () => {
      // First generate a path
      const generateMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives: [
            {
              id: 'obj-1',
              title: 'Learn Division',
              description: 'Master division',
              targetLevel: 'intermediate' as DifficultyLevel,
              prerequisites: [],
              estimatedDuration: 40,
              priority: 'high',
              progress: 0
            }
          ]
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      await agent.handleMessage(generateMessage);

      // Now adapt the path
      const adaptMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'adaptPath',
          studentId: mockLearningState.studentId,
          learningState: mockLearningState,
          progressData: {
            consecutiveFailures: 3,
            averageTimePerNode: 25,
            trigger: 'difficulty',
            reason: 'Student struggling with current content'
          }
        },
        timestamp: Date.now(),
        priority: 'urgent'
      };

      const response = await agent.handleMessage(adaptMessage);

      expect(response.success).toBe(true);
      expect(response.data.adaptedPath).toBeDefined();
      expect(response.data.adaptedPath.adaptations.length).toBeGreaterThan(0);
    });

    it('should adapt path when engagement drops', async () => {
      // Generate initial path
      const generateMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives: [
            {
              id: 'obj-1',
              title: 'Learn Fractions',
              description: 'Understand fractions',
              targetLevel: 'beginner' as DifficultyLevel,
              prerequisites: [],
              estimatedDuration: 35,
              priority: 'medium',
              progress: 0
            }
          ]
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      await agent.handleMessage(generateMessage);

      // Update engagement to low
      mockLearningState.engagementMetrics.currentLevel = 0.3;

      // Adapt path
      const adaptMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'adaptPath',
          studentId: mockLearningState.studentId,
          learningState: mockLearningState,
          progressData: {
            consecutiveFailures: 0,
            averageTimePerNode: 15,
            trigger: 'engagement',
            reason: 'Low engagement detected'
          }
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const response = await agent.handleMessage(adaptMessage);

      expect(response.success).toBe(true);
      expect(response.data.adaptedPath.adaptations).toContain('Added engagement boost activities');
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations for next learning steps', async () => {
      const message: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'recommend',
          studentId: mockLearningState.studentId,
          context: {
            learningState: mockLearningState
          }
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      const response = await agent.handleMessage(message);

      expect(response.success).toBe(true);
      expect(response.recommendations).toBeDefined();
      expect(Array.isArray(response.recommendations)).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress on learning path nodes', async () => {
      // Generate a path first
      const generateMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'generatePath',
          studentProfile: mockStudentProfile,
          learningState: mockLearningState,
          objectives: [
            {
              id: 'obj-1',
              title: 'Learn Subtraction',
              description: 'Master subtraction',
              targetLevel: 'beginner' as DifficultyLevel,
              prerequisites: [],
              estimatedDuration: 30,
              priority: 'high',
              progress: 0
            }
          ]
        },
        timestamp: Date.now(),
        priority: 'high'
      };

      const generateResponse = await agent.handleMessage(generateMessage);
      const path: LearningPath = generateResponse.data.path;
      const firstNodeId = path.nodes[0].id;

      // Update progress
      const updateMessage: AgentMessage = {
        id: uuidv4(),
        from: 'orchestrator',
        to: 'pathPlanning',
        type: 'request',
        payload: {
          action: 'updateProgress',
          studentId: mockLearningState.studentId,
          nodeId: firstNodeId,
          completed: true,
          performance: 0.85
        },
        timestamp: Date.now(),
        priority: 'medium'
      };

      const response = await agent.handleMessage(updateMessage);

      expect(response.success).toBe(true);
      expect(response.data.updatedPath).toBeDefined();
      
      const updatedNode = response.data.updatedPath.nodes.find((n: any) => n.id === firstNodeId);
      expect(updatedNode.completed).toBe(true);
    });
  });
});

// Helper functions

function createMockStudentProfile(): EnhancedStudentProfile {
  return {
    id: 'student-1',
    name: 'Test Student',
    age: 10,
    gradeLevel: '4th',
    learningStyle: 'visual',
    interests: ['science', 'math'],
    strengths: ['problem-solving'],
    challenges: ['reading comprehension'],
    
    cognitiveProfile: {
      processingSpeed: 0.7,
      workingMemoryCapacity: 0.6,
      attentionControl: 0.5,
      metacognition: 0.4
    },
    
    motivationFactors: {
      intrinsicMotivation: 0.8,
      extrinsicMotivation: 0.6,
      competitiveSpirit: 0.5,
      collaborativePreference: 0.7,
      autonomyPreference: 0.6
    },
    
    learningVelocity: {
      conceptAcquisitionRate: 2.0,
      skillDevelopmentRate: 1.5,
      retentionRate: 0.8,
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
      averageSpan: 20,
      peakSpan: 30,
      declinePattern: [1.0, 0.9, 0.8, 0.7, 0.6],
      recoveryTime: 5
    },
    
    sessionHistory: [],
    progressTimeline: [],
    interventionHistory: []
  };
}

function createMockLearningState(): LearningState {
  return {
    studentId: 'student-1',
    sessionId: uuidv4(),
    currentObjectives: [],
    knowledgeMap: createMockKnowledgeMap(),
    engagementMetrics: createMockEngagementData(),
    learningPath: [],
    contextHistory: [],
    lastUpdated: Date.now()
  };
}

function createMockKnowledgeMap(): ConceptMap {
  return {
    concepts: {},
    relationships: [],
    masteryLevels: new Map(),
    knowledgeGaps: []
  };
}

function createMockEngagementData(): EngagementData {
  return {
    currentLevel: 0.7,
    attentionSpan: 20,
    interactionFrequency: 5,
    responseTime: 3,
    frustrationLevel: 0.2,
    motivationLevel: 0.8,
    preferredActivityTypes: ['game', 'quiz'],
    engagementHistory: []
  };
}
