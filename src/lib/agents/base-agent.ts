// Base Agent class that all specialized agents extend
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentType, 
  AgentMessage, 
  AgentResponse, 
  AgentEvent, 
  EventHandler,
  LearningState,
  EnhancedStudentProfile,
  Recommendation,
  Priority
} from './types';

export abstract class BaseAgent extends EventEmitter {
  protected readonly agentType: AgentType;
  protected readonly agentId: string;
  protected isActive: boolean = false;
  protected eventHandlers: Map<string, EventHandler[]> = new Map();
  protected messageQueue: AgentMessage[] = [];
  protected processingMessage: boolean = false;

  constructor(agentType: AgentType) {
    super();
    this.agentType = agentType;
    this.agentId = `${agentType}-${uuidv4()}`;
    this.setupEventHandlers();
  }

  // Abstract methods that each agent must implement
  abstract initialize(): Promise<void>;
  abstract processMessage(message: AgentMessage): Promise<AgentResponse>;
  abstract shutdown(): Promise<void>;

  // Core agent lifecycle methods
  async start(): Promise<void> {
    if (this.isActive) {
      throw new Error(`Agent ${this.agentType} is already active`);
    }

    try {
      await this.initialize();
      this.isActive = true;
      this.emit('agent:started', { agentType: this.agentType, agentId: this.agentId });
      console.log(`Agent ${this.agentType} started successfully`);
    } catch (error) {
      console.error(`Failed to start agent ${this.agentType}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      this.isActive = false;
      await this.shutdown();
      this.emit('agent:stopped', { agentType: this.agentType, agentId: this.agentId });
      console.log(`Agent ${this.agentType} stopped successfully`);
    } catch (error) {
      console.error(`Error stopping agent ${this.agentType}:`, error);
      throw error;
    }
  }

  // Message handling
  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    if (!this.isActive) {
      return {
        messageId: message.id,
        success: false,
        error: `Agent ${this.agentType} is not active`
      };
    }

    // Add to queue if currently processing
    if (this.processingMessage) {
      this.messageQueue.push(message);
      return {
        messageId: message.id,
        success: true,
        data: { status: 'queued' }
      };
    }

    return this.processMessageWithQueue(message);
  }

  private async processMessageWithQueue(message: AgentMessage): Promise<AgentResponse> {
    this.processingMessage = true;
    
    try {
      const response = await this.processMessage(message);
      
      // Process next message in queue if any
      if (this.messageQueue.length > 0) {
        const nextMessage = this.messageQueue.shift()!;
        // Process asynchronously to avoid blocking current response
        setImmediate(() => this.processMessageWithQueue(nextMessage));
      }
      
      return response;
    } catch (error) {
      console.error(`Error processing message in agent ${this.agentType}:`, error);
      return {
        messageId: message.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.processingMessage = false;
    }
  }

  // Event handling
  protected setupEventHandlers(): void {
    // Override in subclasses to set up specific event handlers
  }

  protected registerEventHandler(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  async handleEvent(event: AgentEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    // Sort handlers by priority
    handlers.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
    
    // Execute handlers
    for (const handlerInfo of handlers) {
      try {
        await handlerInfo.handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type} in agent ${this.agentType}:`, error);
      }
    }
  }

  // Utility methods
  protected createMessage(
    to: AgentType | 'orchestrator',
    type: 'request' | 'response' | 'event' | 'notification' | 'error',
    payload: any,
    priority: Priority = 'medium',
    correlationId?: string
  ): AgentMessage {
    return {
      id: uuidv4(),
      from: this.agentType,
      to,
      type,
      payload,
      timestamp: Date.now(),
      priority,
      correlationId
    };
  }

  protected createRecommendation(
    type: 'action' | 'content' | 'strategy' | 'intervention',
    description: string,
    data: any,
    confidence: number,
    priority: Priority = 'medium',
    reasoning?: string
  ): Recommendation {
    return {
      id: uuidv4(),
      type,
      priority,
      description,
      data,
      confidence,
      reasoning
    };
  }

  protected emitEvent(eventType: string, data: any, priority: Priority = 'medium'): void {
    const event: AgentEvent = {
      id: uuidv4(),
      type: eventType,
      source: this.agentType,
      data,
      timestamp: Date.now(),
      priority
    };
    
    this.emit('agent:event', event);
  }

  private getPriorityValue(priority: Priority): number {
    const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
    return priorityMap[priority];
  }

  // Health check
  getHealthStatus(): { healthy: boolean; details: any } {
    return {
      healthy: this.isActive && !this.processingMessage,
      details: {
        agentType: this.agentType,
        agentId: this.agentId,
        isActive: this.isActive,
        processingMessage: this.processingMessage,
        queueLength: this.messageQueue.length,
        eventHandlerCount: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0)
      }
    };
  }

  // Getters
  get type(): AgentType {
    return this.agentType;
  }

  get id(): string {
    return this.agentId;
  }

  get active(): boolean {
    return this.isActive;
  }
}

// Agent factory for creating agents
export class AgentFactory {
  private static agentConstructors: Map<AgentType, new () => BaseAgent> = new Map();

  static registerAgent(agentType: AgentType, constructor: new () => BaseAgent): void {
    this.agentConstructors.set(agentType, constructor);
  }

  static createAgent(agentType: AgentType): BaseAgent {
    const AgentConstructor = this.agentConstructors.get(agentType);
    if (!AgentConstructor) {
      throw new Error(`No agent constructor registered for type: ${agentType}`);
    }
    return new AgentConstructor();
  }

  static getSupportedAgentTypes(): AgentType[] {
    return Array.from(this.agentConstructors.keys());
  }
}