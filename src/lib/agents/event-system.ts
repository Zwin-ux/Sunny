// Event-driven communication system for agents
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentEvent, 
  AgentMessage, 
  AgentType, 
  Priority,
  EventHandler
} from './types';

export interface EventSystemConfig {
  maxQueueSize: number;
  processingTimeout: number;
  retryAttempts: number;
  enableLogging: boolean;
}

export class AgentEventSystem extends EventEmitter {
  private eventQueue: AgentEvent[] = [];
  private messageQueue: AgentMessage[] = [];
  private processing: boolean = false;
  private config: EventSystemConfig;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private agentSubscriptions: Map<AgentType, Set<string>> = new Map();

  constructor(config: Partial<EventSystemConfig> = {}) {
    super();
    this.config = {
      maxQueueSize: 1000,
      processingTimeout: 5000,
      retryAttempts: 3,
      enableLogging: true,
      ...config
    };
  }

  // Event publishing
  publishEvent(event: AgentEvent): void {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn('Event queue is full, dropping oldest event');
      this.eventQueue.shift();
    }

    this.eventQueue.push(event);
    this.processEventQueue();

    if (this.config.enableLogging) {
      console.log(`Event published: ${event.type} from ${event.source}`);
    }
  }

  // Message routing
  routeMessage(message: AgentMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      console.warn('Message queue is full, dropping oldest message');
      this.messageQueue.shift();
    }

    this.messageQueue.push(message);
    this.processMessageQueue();

    if (this.config.enableLogging) {
      console.log(`Message routed: ${message.type} from ${message.from} to ${message.to}`);
    }
  }

  // Event subscription management
  subscribeAgent(agentType: AgentType, eventTypes: string[]): void {
    if (!this.agentSubscriptions.has(agentType)) {
      this.agentSubscriptions.set(agentType, new Set());
    }
    
    const subscriptions = this.agentSubscriptions.get(agentType)!;
    eventTypes.forEach(eventType => subscriptions.add(eventType));

    if (this.config.enableLogging) {
      console.log(`Agent ${agentType} subscribed to events: ${eventTypes.join(', ')}`);
    }
  }

  unsubscribeAgent(agentType: AgentType, eventTypes?: string[]): void {
    const subscriptions = this.agentSubscriptions.get(agentType);
    if (!subscriptions) return;

    if (eventTypes) {
      eventTypes.forEach(eventType => subscriptions.delete(eventType));
    } else {
      subscriptions.clear();
    }

    if (this.config.enableLogging) {
      console.log(`Agent ${agentType} unsubscribed from events: ${eventTypes?.join(', ') || 'all'}`);
    }
  }

  // Global event handlers
  registerGlobalHandler(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  unregisterGlobalHandler(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Queue processing
  private async processEventQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        await this.processMessage(message);
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(event: AgentEvent): Promise<void> {
    // Execute global handlers
    const globalHandlers = this.eventHandlers.get(event.type) || [];
    await this.executeHandlers(globalHandlers, event);

    // Notify subscribed agents
    for (const [agentType, subscriptions] of this.agentSubscriptions.entries()) {
      if (subscriptions.has(event.type)) {
        this.emit(`agent:${agentType}:event`, event);
      }
    }

    // Emit general event for orchestrator
    this.emit('event:processed', event);
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    // Route to specific agent or orchestrator
    if (message.to === 'orchestrator') {
      this.emit('orchestrator:message', message);
    } else {
      this.emit(`agent:${message.to}:message`, message);
    }

    // Emit general message event
    this.emit('message:routed', message);
  }

  private async executeHandlers(handlers: EventHandler[], event: AgentEvent): Promise<void> {
    // Sort by priority
    const sortedHandlers = handlers.sort((a, b) => 
      this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
    );

    for (const handlerInfo of sortedHandlers) {
      try {
        await Promise.race([
          handlerInfo.handler(event),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), this.config.processingTimeout)
          )
        ]);
      } catch (error) {
        console.error(`Error executing handler for event ${event.type}:`, error);
      }
    }
  }

  private getPriorityValue(priority: Priority): number {
    const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
    return priorityMap[priority];
  }

  // Utility methods
  createEvent(
    type: string,
    source: AgentType,
    data: any,
    priority: Priority = 'medium'
  ): AgentEvent {
    return {
      id: uuidv4(),
      type,
      source,
      data,
      timestamp: Date.now(),
      priority
    };
  }

  // Statistics and monitoring
  getQueueStats(): { eventQueue: number; messageQueue: number; processing: boolean } {
    return {
      eventQueue: this.eventQueue.length,
      messageQueue: this.messageQueue.length,
      processing: this.processing
    };
  }

  getSubscriptionStats(): Record<string, string[]> {
    const stats: Record<string, string[]> = {};
    for (const [agentType, subscriptions] of this.agentSubscriptions.entries()) {
      stats[agentType] = Array.from(subscriptions);
    }
    return stats;
  }

  // Cleanup
  clear(): void {
    this.eventQueue = [];
    this.messageQueue = [];
    this.eventHandlers.clear();
    this.agentSubscriptions.clear();
    this.processing = false;
  }
}

// Singleton instance for global use
export const globalEventSystem = new AgentEventSystem();