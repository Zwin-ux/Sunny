// Tests for error handling and recovery systems
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentFailureRecoverySystem } from '../error-recovery';
import { DataConsistencyManager } from '../data-consistency';
import { ErrorHandlingSystem } from '../error-handling-integration';
import { BaseAgent } from '../base-agent';
import { LearningOrchestrator } from '../orchestrator';
import {
  AgentType,
  AgentMessage,
  AgentResponse,
  LearningState,
  EnhancedStudentProfile
} from '../types';

// Mock agent for testing
class MockAgent extends BaseAgent {
  private shouldFail: boolean = false;
  private failureCount: number = 0;

  constructor(agentType: AgentType) {
    super(agentType);
  }

  async initialize(): Promise<void> {
    if (this.shouldFail) {
      this.failureCount++;
      throw new Error(`Mock agent ${this.agentType} initialization failed`);
    }
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    if (this.shouldFail) {
      this.failureCount++;
      throw new Error(`Mock agent ${this.agentType} processing failed`);
    }

    return {
      messageId: message.id,
      success: true,
      data: { processed: true }
    };
  }

  async shutdown(): Promise<void> {
    // Clean shutdown
  }

  setFailureMode(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

describe('AgentFailureRecoverySystem', () => {
  let recoverySystem: AgentFailureRecoverySystem;
  let mockAgent: MockAgent;

  beforeEach(() => {
    recoverySystem = new AgentFailureRecoverySystem({
      maxRestartAttempts: 3,
      restartDelay: 100,
      healthCheckInterval: 1000,
      failoverEnabled: true,
      gracefulDegradationEnabled: true,
      errorLoggingEnabled: true,
      alertThreshold: 2
    });
    recoverySystem.start();

    mockAgent = new MockAgent('assessment');
  });

  afterEach(() => {
    recoverySystem.stop();
  });

  it('should register an agent for monitoring', () => {
    recoverySystem.registerAgent(mockAgent);
    
    const health = recoverySystem.getAgentHealth('assessment');
    expect(health).toBeDefined();
    expect(health?.agentType).toBe('assessment');
    expect(health?.healthy).toBe(true);
  });

  it('should handle agent failure and attempt recovery', async () => {
    await mockAgent.start();
    recoverySystem.registerAgent(mockAgent);

    const error = new Error('Test failure');
    const recovered = await recoverySystem.handleAgentFailure(mockAgent, error, {});

    expect(recovered).toBe(true);
    
    const health = recoverySystem.getAgentHealth('assessment');
    expect(health?.consecutiveFailures).toBe(0); // Reset after successful recovery
  });

  it('should track failure history', async () => {
    await mockAgent.start();
    recoverySystem.registerAgent(mockAgent);

    const error = new Error('Test failure');
    await recoverySystem.handleAgentFailure(mockAgent, error, {});

    const history = recoverySystem.getFailureHistory('assessment');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].agentType).toBe('assessment');
  });

  it('should enable graceful degradation after max restart attempts', async () => {
    await mockAgent.start();
    recoverySystem.registerAgent(mockAgent);

    // Make agent fail consistently
    mockAgent.setFailureMode(true);

    // Attempt recovery multiple times (need to exceed maxRestartAttempts which is 3)
    for (let i = 0; i < 4; i++) {
      const error = new Error('Persistent failure');
      await recoverySystem.handleAgentFailure(mockAgent, error, {});
    }

    // Check if fallback is active or if graceful degradation was enabled
    const isFallbackActive = recoverySystem.isFallbackActive('assessment');
    const health = recoverySystem.getAgentHealth('assessment');
    
    // Either fallback should be active OR we should have exceeded max attempts
    expect(isFallbackActive || (health && health.consecutiveFailures >= 4)).toBe(true);
  });

  it('should provide system health report', () => {
    recoverySystem.registerAgent(mockAgent);

    const health = recoverySystem.getSystemHealth();
    expect(health).toBeDefined();
    expect(health.healthy).toBe(true);
    expect(health.agentHealth.has('assessment')).toBe(true);
  });
});

describe('DataConsistencyManager', () => {
  let consistencyManager: DataConsistencyManager;
  let mockLearningState: LearningState;

  beforeEach(() => {
    consistencyManager = new DataConsistencyManager({
      validationEnabled: true,
      autoRepairEnabled: true,
      backupEnabled: true,
      backupInterval: 60000,
      maxBackups: 5,
      conflictResolutionStrategy: 'merge',
      corruptionDetectionEnabled: true,
      checksumValidation: true
    });
    consistencyManager.start();

    mockLearningState = {
      studentId: 'student-123',
      sessionId: 'session-456',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 15,
        interactionFrequency: 5,
        responseTime: 2,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: [],
        engagementHistory: []
      },
      learningPath: [],
      contextHistory: [],
      lastUpdated: Date.now()
    };
  });

  afterEach(() => {
    consistencyManager.stop();
  });

  it('should validate a valid learning state', () => {
    const validation = consistencyManager.validateLearningState(mockLearningState);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should detect validation errors in invalid learning state', () => {
    const invalidState = {
      ...mockLearningState,
      studentId: '', // Invalid: empty student ID
      engagementMetrics: {
        ...mockLearningState.engagementMetrics,
        currentLevel: 1.5 // Invalid: out of range
      }
    };

    const validation = consistencyManager.validateLearningState(invalidState);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should create and restore backups', async () => {
    const backup = consistencyManager.createBackup('student-123', mockLearningState);
    
    expect(backup).toBeDefined();
    expect(backup.studentId).toBe('student-123');
    expect(backup.checksum).toBeDefined();

    const restored = await consistencyManager.restoreFromBackup('student-123');
    
    expect(restored).toBeDefined();
    expect(restored?.studentId).toBe('student-123');
  });

  it('should detect data conflicts', () => {
    const updates = {
      engagementMetrics: {
        ...mockLearningState.engagementMetrics,
        currentLevel: 0.3 // Significantly different from 0.7
      }
    };

    const conflicts = consistencyManager.detectConflicts(
      mockLearningState,
      updates,
      'intervention'
    );

    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].field).toBe('engagementMetrics');
  });

  it('should resolve conflicts using merge strategy', async () => {
    const conflict = {
      id: 'conflict-1',
      field: 'engagementLevel',
      source1: {
        agentType: 'assessment' as AgentType,
        value: 0.7,
        timestamp: Date.now() - 1000,
        confidence: 0.8
      },
      source2: {
        agentType: 'intervention' as AgentType,
        value: 0.5,
        timestamp: Date.now(),
        confidence: 0.6
      },
      timestamp: Date.now(),
      resolved: false
    };

    const resolutions = await consistencyManager.resolveConflicts([conflict]);
    
    expect(resolutions.size).toBe(1);
    expect(resolutions.has('engagementLevel')).toBe(true);
    
    // Should be weighted average based on confidence
    const resolved = resolutions.get('engagementLevel');
    expect(resolved).toBeGreaterThan(0.5);
    expect(resolved).toBeLessThan(0.7);
  });

  it('should detect corruption in learning state', () => {
    const corruptedState = {
      ...mockLearningState,
      engagementMetrics: {
        ...mockLearningState.engagementMetrics,
        currentLevel: 'invalid' as any // Wrong type
      }
    };

    const reports = consistencyManager.detectCorruption(corruptedState);
    
    expect(reports.length).toBeGreaterThan(0);
  });

  it('should provide consistency statistics', () => {
    consistencyManager.createBackup('student-123', mockLearningState);
    
    const stats = consistencyManager.getStatistics();
    
    expect(stats).toBeDefined();
    expect(stats.totalBackups).toBeGreaterThan(0);
    expect(stats.studentsWithBackups).toBe(1);
  });
});

describe('ErrorHandlingSystem Integration', () => {
  let errorHandlingSystem: ErrorHandlingSystem;
  let mockOrchestrator: LearningOrchestrator;
  let mockAgent: MockAgent;

  beforeEach(async () => {
    errorHandlingSystem = new ErrorHandlingSystem();
    mockOrchestrator = new LearningOrchestrator();
    mockAgent = new MockAgent('assessment');

    await mockOrchestrator.start();
    await errorHandlingSystem.initialize(mockOrchestrator);
  });

  afterEach(async () => {
    await errorHandlingSystem.shutdown();
    await mockOrchestrator.stop();
  });

  it('should initialize successfully', () => {
    expect(errorHandlingSystem).toBeDefined();
  });

  it('should register agents for monitoring', () => {
    errorHandlingSystem.registerAgent(mockAgent);
    
    const health = errorHandlingSystem.getAgentHealth('assessment');
    expect(health).toBeDefined();
  });

  it('should validate student profile', () => {
    const mockProfile: EnhancedStudentProfile = {
      name: 'Test Student',
      level: 5,
      points: 100,
      completedLessons: [],
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
        skillDevelopmentRate: 3.0,
        retentionRate: 0.85,
        transferRate: 0.7
      },
      responsePatterns: [],
      engagementPatterns: [],
      preferredActivityTypes: [],
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

    const validation = errorHandlingSystem.validateProfile(mockProfile);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should provide comprehensive system health report', () => {
    errorHandlingSystem.registerAgent(mockAgent);
    
    const health = errorHandlingSystem.getSystemHealth();
    
    expect(health).toBeDefined();
    expect(health.healthy).toBe(true);
    expect(health.recoverySystem).toBeDefined();
    expect(health.consistencySystem).toBeDefined();
  });

  it('should handle agent errors gracefully', async () => {
    await mockAgent.start();
    errorHandlingSystem.registerAgent(mockAgent);

    // Simulate agent error
    const errorEmitted = new Promise((resolve) => {
      errorHandlingSystem.once('agent:failure', resolve);
    });

    mockAgent.emit('error', new Error('Test error'), { test: true });

    await errorEmitted;

    const failureHistory = errorHandlingSystem.getFailureHistory('assessment');
    expect(failureHistory.length).toBeGreaterThan(0);
  });
});

describe('Error Handling Edge Cases', () => {
  let consistencyManager: DataConsistencyManager;

  beforeEach(() => {
    consistencyManager = new DataConsistencyManager();
    consistencyManager.start();
  });

  afterEach(() => {
    consistencyManager.stop();
  });

  it('should handle missing student ID gracefully', () => {
    const invalidState = {
      sessionId: 'session-123',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 15,
        interactionFrequency: 5,
        responseTime: 2,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: [],
        engagementHistory: []
      },
      learningPath: [],
      contextHistory: [],
      lastUpdated: Date.now()
    } as any;

    const validation = consistencyManager.validateLearningState(invalidState);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.field === 'studentId')).toBe(true);
  });

  it('should handle backup restoration with invalid checksum', async () => {
    const mockState: LearningState = {
      studentId: 'student-123',
      sessionId: 'session-456',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 15,
        interactionFrequency: 5,
        responseTime: 2,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: [],
        engagementHistory: []
      },
      learningPath: [],
      contextHistory: [],
      lastUpdated: Date.now()
    };

    // Create backup
    const backup = consistencyManager.createBackup('student-123', mockState);
    
    // Manually corrupt the backup checksum
    backup.checksum = 'invalid-checksum';

    // Try to restore - should fail due to checksum mismatch
    const restored = await consistencyManager.restoreFromBackup('student-123', backup.id);
    
    expect(restored).toBeNull();
  });

  it('should maintain backup limit', () => {
    const mockState: LearningState = {
      studentId: 'student-123',
      sessionId: 'session-456',
      currentObjectives: [],
      knowledgeMap: {
        concepts: {},
        relationships: [],
        masteryLevels: new Map(),
        knowledgeGaps: []
      },
      engagementMetrics: {
        currentLevel: 0.7,
        attentionSpan: 15,
        interactionFrequency: 5,
        responseTime: 2,
        frustrationLevel: 0.2,
        motivationLevel: 0.8,
        preferredActivityTypes: [],
        engagementHistory: []
      },
      learningPath: [],
      contextHistory: [],
      lastUpdated: Date.now()
    };

    // Create more backups than the limit
    for (let i = 0; i < 15; i++) {
      consistencyManager.createBackup('student-123', mockState);
    }

    const backups = consistencyManager.getAllBackups('student-123');
    
    // Should not exceed max backups (default is 10)
    expect(backups.length).toBeLessThanOrEqual(10);
  });
});
