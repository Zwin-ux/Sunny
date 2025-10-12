// Agent Manager - Main interface for integrating with existing Sunny application
import { LearningOrchestrator } from './orchestrator';
import { BaseAgent, AgentFactory } from './base-agent';
import { globalEventSystem } from './event-system';
import { 
  AgentType, 
  EnhancedStudentProfile, 
  LearningState,
  AgentEvent
} from './types';
import { StudentProfile } from '../../types/chat';

export interface AgentManagerConfig {
  enabledAgents: AgentType[];
  autoStart: boolean;
  enableLogging: boolean;
}

export class AgentManager {
  private orchestrator: LearningOrchestrator;
  private config: AgentManagerConfig;
  private initialized: boolean = false;

  constructor(config: Partial<AgentManagerConfig> = {}) {
    this.config = {
      enabledAgents: ['assessment', 'contentGeneration', 'pathPlanning', 'intervention', 'communication'],
      autoStart: true,
      enableLogging: true,
      ...config
    };

    this.orchestrator = new LearningOrchestrator({
      enableAnalytics: true,
      conflictResolutionStrategy: 'weighted'
    });

    this.setupEventHandlers();
  }

  // Initialization
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Register placeholder agents for now (will be implemented in subsequent tasks)
      this.registerPlaceholderAgents();

      if (this.config.autoStart) {
        await this.orchestrator.start();
      }

      this.initialized = true;
      
      if (this.config.enableLogging) {
        console.log('Agent Manager initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Agent Manager:', error);
      throw error;
    }
  }

  // Main interface methods for Sunny integration
  async processStudentMessage(
    studentId: string,
    message: string,
    profile: StudentProfile
  ): Promise<{ response: string; actions: string[] }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Convert StudentProfile to EnhancedStudentProfile
    const enhancedProfile = this.convertToEnhancedProfile(profile);

    // Initialize learning state if not exists
    let learningState = this.orchestrator.getLearningState(studentId);
    if (!learningState) {
      learningState = this.orchestrator.initializeLearningState(studentId, enhancedProfile);
    }

    // Process the interaction through orchestrator
    return await this.orchestrator.processStudentInteraction(studentId, {
      type: 'message',
      content: message,
      timestamp: Date.now()
    });
  }

  async generatePersonalizedContent(
    studentId: string,
    topic: string,
    contentType: 'quiz' | 'lesson' | 'activity'
  ): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    const learningState = this.orchestrator.getLearningState(studentId);
    if (!learningState) {
      throw new Error(`No learning state found for student: ${studentId}`);
    }

    // This will be implemented when ContentGeneration agent is created
    return {
      type: contentType,
      topic,
      content: `Placeholder ${contentType} for ${topic}`,
      generated: true
    };
  }

  async updateStudentProgress(
    studentId: string,
    activity: string,
    performance: any
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Emit progress event for agents to process
    globalEventSystem.publishEvent({
      id: `progress-${Date.now()}`,
      type: 'student:progress',
      source: 'orchestrator',
      data: {
        studentId,
        activity,
        performance,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      priority: 'medium'
    });
  }

  // Learning state access
  getLearningState(studentId: string): LearningState | undefined {
    return this.orchestrator.getLearningState(studentId);
  }

  // System health and monitoring
  getSystemHealth(): any {
    return this.orchestrator.getSystemHealth();
  }

  // Event subscription for external listeners
  onLearningEvent(callback: (event: AgentEvent) => void): void {
    globalEventSystem.on('event:processed', callback);
  }

  // Cleanup
  async shutdown(): Promise<void> {
    if (this.initialized) {
      await this.orchestrator.stop();
      globalEventSystem.clear();
      this.initialized = false;
      
      if (this.config.enableLogging) {
        console.log('Agent Manager shut down successfully');
      }
    }
  }

  // Private helper methods
  private setupEventHandlers(): void {
    this.orchestrator.on('orchestrator:started', () => {
      if (this.config.enableLogging) {
        console.log('Learning Orchestrator started');
      }
    });

    this.orchestrator.on('learning:state:initialized', (data) => {
      if (this.config.enableLogging) {
        console.log(`Learning state initialized for student: ${data.studentId}`);
      }
    });

    this.orchestrator.on('learning:state:updated', (data) => {
      if (this.config.enableLogging) {
        console.log(`Learning state updated for student: ${data.studentId}`);
      }
    });
  }

  private registerPlaceholderAgents(): void {
    // Register placeholder agents that will be implemented in subsequent tasks
    const placeholderAgents: AgentType[] = [
      'assessment',
      'contentGeneration', 
      'pathPlanning',
      'intervention',
      'communication'
    ];

    placeholderAgents.forEach(agentType => {
      if (this.config.enabledAgents.includes(agentType)) {
        const agent = new PlaceholderAgent(agentType);
        this.orchestrator.registerAgent(agent);
      }
    });
  }

  private convertToEnhancedProfile(profile: StudentProfile): EnhancedStudentProfile {
    // Convert basic StudentProfile to EnhancedStudentProfile with sensible defaults
    return {
      ...profile,
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
      responsePatterns: [
        { type: 'thoughtful', frequency: 0.7, contexts: ['complex'], effectiveness: 0.8 }
      ],
      engagementPatterns: [
        { trigger: 'new_topic', duration: 15, intensity: 0.8, recovery: 5 }
      ],
      preferredActivityTypes: [
        { activityType: 'quiz', preference: 0.7, effectiveness: 0.8, optimalDuration: 10 },
        { activityType: 'game', preference: 0.9, effectiveness: 0.9, optimalDuration: 15 }
      ],
      optimalLearningTimes: [
        { timeOfDay: 'morning', dayOfWeek: 'weekday', effectiveness: 0.9 }
      ],
      attentionSpanData: {
        averageSpan: 15,
        peakSpan: 25,
        declinePattern: [1.0, 0.9, 0.7, 0.5, 0.3],
        recoveryTime: 5
      },
      sessionHistory: [],
      progressTimeline: [],
      interventionHistory: []
    };
  }
}

// Placeholder agent implementation for testing
class PlaceholderAgent extends BaseAgent {
  constructor(agentType: AgentType) {
    super(agentType);
  }

  async initialize(): Promise<void> {
    // Placeholder initialization
    console.log(`Placeholder ${this.agentType} agent initialized`);
  }

  async processMessage(message: any): Promise<any> {
    // Placeholder message processing
    return {
      messageId: message.id,
      success: true,
      data: { 
        message: `Placeholder response from ${this.agentType} agent`,
        processed: true 
      },
      recommendations: []
    };
  }

  async shutdown(): Promise<void> {
    // Placeholder shutdown
    console.log(`Placeholder ${this.agentType} agent shut down`);
  }
}

// Singleton instance for easy access
export const globalAgentManager = new AgentManager();