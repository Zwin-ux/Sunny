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
  enablePerformanceMonitoring: boolean;
  bottleneckThreshold: number; // milliseconds
  eventPersistence: boolean;
}

export class AgentEventSystem extends EventEmitter {
  private eventQueue: PrioritizedEvent[] = [];
  private messageQueue: PrioritizedMessage[] = [];
  private processing: boolean = false;
  private config: EventSystemConfig;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private agentSubscriptions: Map<AgentType, Set<string>> = new Map();
  private eventLog: EventLogEntry[] = [];
  private performanceMonitor: PerformanceMonitor;
  private maxLogSize: number = 1000;

  constructor(config: Partial<EventSystemConfig> = {}) {
    super();
    this.config = {
      maxQueueSize: 1000,
      processingTimeout: 5000,
      retryAttempts: 3,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      bottleneckThreshold: 1000,
      eventPersistence: false,
      ...config
    };
    this.performanceMonitor = new PerformanceMonitor(this.config.bottleneckThreshold);
  }

  // Event publishing with priority queuing
  publishEvent(event: AgentEvent): void {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn('Event queue is full, dropping lowest priority event');
      this.dropLowestPriorityEvent();
    }

    const prioritizedEvent: PrioritizedEvent = {
      event,
      priority: this.getPriorityValue(event.priority),
      timestamp: Date.now()
    };

    this.eventQueue.push(prioritizedEvent);
    this.sortEventQueue();
    this.processEventQueue();

    // Log event
    this.logEvent(event, 'published');

    if (this.config.enableLogging) {
      console.log(`Event published: ${event.type} from ${event.source} [priority: ${event.priority}]`);
    }
  }

  // Message routing with priority queuing
  routeMessage(message: AgentMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      console.warn('Message queue is full, dropping lowest priority message');
      this.dropLowestPriorityMessage();
    }

    const prioritizedMessage: PrioritizedMessage = {
      message,
      priority: this.getPriorityValue(message.priority),
      timestamp: Date.now()
    };

    this.messageQueue.push(prioritizedMessage);
    this.sortMessageQueue();
    this.processMessageQueue();

    // Log message
    this.logMessage(message, 'routed');

    if (this.config.enableLogging) {
      console.log(`Message routed: ${message.type} from ${message.from} to ${message.to} [priority: ${message.priority}]`);
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

  // Queue processing with performance monitoring
  private async processEventQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;
    const queueStartTime = Date.now();

    try {
      while (this.eventQueue.length > 0) {
        const prioritizedEvent = this.eventQueue.shift()!;
        const startTime = Date.now();
        
        await this.processEvent(prioritizedEvent.event);
        
        const processingTime = Date.now() - startTime;
        
        // Monitor performance
        if (this.config.enablePerformanceMonitoring) {
          this.performanceMonitor.recordEventProcessing(
            prioritizedEvent.event.type,
            processingTime,
            this.eventQueue.length
          );
        }

        // Log processing
        this.logEvent(prioritizedEvent.event, 'processed', processingTime);
      }

      const totalTime = Date.now() - queueStartTime;
      if (this.config.enablePerformanceMonitoring && totalTime > this.config.bottleneckThreshold) {
        console.warn(`Event queue processing took ${totalTime}ms - potential bottleneck detected`);
        this.emit('performance:bottleneck', { type: 'event', duration: totalTime });
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
    const queueStartTime = Date.now();

    try {
      while (this.messageQueue.length > 0) {
        const prioritizedMessage = this.messageQueue.shift()!;
        const startTime = Date.now();
        
        await this.processMessage(prioritizedMessage.message);
        
        const processingTime = Date.now() - startTime;
        
        // Monitor performance
        if (this.config.enablePerformanceMonitoring) {
          this.performanceMonitor.recordMessageProcessing(
            prioritizedMessage.message.type,
            processingTime,
            this.messageQueue.length
          );
        }

        // Log processing
        this.logMessage(prioritizedMessage.message, 'processed', processingTime);
      }

      const totalTime = Date.now() - queueStartTime;
      if (this.config.enablePerformanceMonitoring && totalTime > this.config.bottleneckThreshold) {
        console.warn(`Message queue processing took ${totalTime}ms - potential bottleneck detected`);
        this.emit('performance:bottleneck', { type: 'message', duration: totalTime });
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

  // Priority queue management
  private sortEventQueue(): void {
    this.eventQueue.sort((a, b) => {
      // Higher priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Earlier timestamp first for same priority
      return a.timestamp - b.timestamp;
    });
  }

  private sortMessageQueue(): void {
    this.messageQueue.sort((a, b) => {
      // Higher priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Earlier timestamp first for same priority
      return a.timestamp - b.timestamp;
    });
  }

  private dropLowestPriorityEvent(): void {
    // Find and remove the lowest priority event
    let lowestIndex = 0;
    let lowestPriority = this.eventQueue[0]?.priority || 0;

    for (let i = 1; i < this.eventQueue.length; i++) {
      if (this.eventQueue[i].priority < lowestPriority) {
        lowestPriority = this.eventQueue[i].priority;
        lowestIndex = i;
      }
    }

    this.eventQueue.splice(lowestIndex, 1);
  }

  private dropLowestPriorityMessage(): void {
    // Find and remove the lowest priority message
    let lowestIndex = 0;
    let lowestPriority = this.messageQueue[0]?.priority || 0;

    for (let i = 1; i < this.messageQueue.length; i++) {
      if (this.messageQueue[i].priority < lowestPriority) {
        lowestPriority = this.messageQueue[i].priority;
        lowestIndex = i;
      }
    }

    this.messageQueue.splice(lowestIndex, 1);
  }

  // Event and message logging
  private logEvent(event: AgentEvent, action: 'published' | 'processed', processingTime?: number): void {
    if (!this.config.enableLogging) return;

    const logEntry: EventLogEntry = {
      id: event.id,
      type: 'event',
      eventType: event.type,
      source: event.source,
      action,
      timestamp: Date.now(),
      processingTime,
      queueSize: this.eventQueue.length
    };

    this.eventLog.push(logEntry);
    this.maintainLogSize();

    // Emit for external logging systems
    this.emit('log:event', logEntry);
  }

  private logMessage(message: AgentMessage, action: 'routed' | 'processed', processingTime?: number): void {
    if (!this.config.enableLogging) return;

    const logEntry: EventLogEntry = {
      id: message.id,
      type: 'message',
      eventType: message.type,
      source: message.from,
      target: message.to,
      action,
      timestamp: Date.now(),
      processingTime,
      queueSize: this.messageQueue.length
    };

    this.eventLog.push(logEntry);
    this.maintainLogSize();

    // Emit for external logging systems
    this.emit('log:message', logEntry);
  }

  private maintainLogSize(): void {
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.splice(0, this.eventLog.length - this.maxLogSize);
    }
  }

  // Debugging capabilities
  getEventLog(filter?: EventLogFilter): EventLogEntry[] {
    if (!filter) return [...this.eventLog];

    return this.eventLog.filter(entry => {
      if (filter.type && entry.type !== filter.type) return false;
      if (filter.eventType && entry.eventType !== filter.eventType) return false;
      if (filter.source && entry.source !== filter.source) return false;
      if (filter.startTime && entry.timestamp < filter.startTime) return false;
      if (filter.endTime && entry.timestamp > filter.endTime) return false;
      return true;
    });
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  detectBottlenecks(): BottleneckReport[] {
    return this.performanceMonitor.detectBottlenecks();
  }

  // Cleanup
  clear(): void {
    this.eventQueue = [];
    this.messageQueue = [];
    this.eventHandlers.clear();
    this.agentSubscriptions.clear();
    this.eventLog = [];
    this.performanceMonitor.reset();
    this.processing = false;
  }
}

// Supporting interfaces and classes
interface PrioritizedEvent {
  event: AgentEvent;
  priority: number;
  timestamp: number;
}

interface PrioritizedMessage {
  message: AgentMessage;
  priority: number;
  timestamp: number;
}

interface EventLogEntry {
  id: string;
  type: 'event' | 'message';
  eventType: string;
  source: AgentType;
  target?: AgentType | 'orchestrator';
  action: 'published' | 'routed' | 'processed';
  timestamp: number;
  processingTime?: number;
  queueSize: number;
}

interface EventLogFilter {
  type?: 'event' | 'message';
  eventType?: string;
  source?: AgentType;
  startTime?: number;
  endTime?: number;
}

interface PerformanceMetrics {
  avgEventProcessingTime: number;
  avgMessageProcessingTime: number;
  totalEventsProcessed: number;
  totalMessagesProcessed: number;
  peakQueueSize: number;
  bottlenecksDetected: number;
}

interface BottleneckReport {
  type: 'event' | 'message';
  eventType: string;
  avgProcessingTime: number;
  occurrences: number;
  severity: 'low' | 'medium' | 'high';
}

// Performance Monitor
class PerformanceMonitor {
  private eventMetrics: Map<string, MetricData> = new Map();
  private messageMetrics: Map<string, MetricData> = new Map();
  private bottleneckThreshold: number;
  private totalEventsProcessed: number = 0;
  private totalMessagesProcessed: number = 0;
  private peakQueueSize: number = 0;

  constructor(bottleneckThreshold: number) {
    this.bottleneckThreshold = bottleneckThreshold;
  }

  recordEventProcessing(eventType: string, processingTime: number, queueSize: number): void {
    this.totalEventsProcessed++;
    this.peakQueueSize = Math.max(this.peakQueueSize, queueSize);

    if (!this.eventMetrics.has(eventType)) {
      this.eventMetrics.set(eventType, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metrics = this.eventMetrics.get(eventType)!;
    metrics.count++;
    metrics.totalTime += processingTime;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, processingTime);
    metrics.minTime = Math.min(metrics.minTime, processingTime);
  }

  recordMessageProcessing(messageType: string, processingTime: number, queueSize: number): void {
    this.totalMessagesProcessed++;
    this.peakQueueSize = Math.max(this.peakQueueSize, queueSize);

    if (!this.messageMetrics.has(messageType)) {
      this.messageMetrics.set(messageType, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metrics = this.messageMetrics.get(messageType)!;
    metrics.count++;
    metrics.totalTime += processingTime;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, processingTime);
    metrics.minTime = Math.min(metrics.minTime, processingTime);
  }

  getMetrics(): PerformanceMetrics {
    const eventTimes = Array.from(this.eventMetrics.values()).map(m => m.avgTime);
    const messageTimes = Array.from(this.messageMetrics.values()).map(m => m.avgTime);

    return {
      avgEventProcessingTime: eventTimes.length > 0 
        ? eventTimes.reduce((a, b) => a + b, 0) / eventTimes.length 
        : 0,
      avgMessageProcessingTime: messageTimes.length > 0
        ? messageTimes.reduce((a, b) => a + b, 0) / messageTimes.length
        : 0,
      totalEventsProcessed: this.totalEventsProcessed,
      totalMessagesProcessed: this.totalMessagesProcessed,
      peakQueueSize: this.peakQueueSize,
      bottlenecksDetected: this.detectBottlenecks().length
    };
  }

  detectBottlenecks(): BottleneckReport[] {
    const bottlenecks: BottleneckReport[] = [];

    // Check event bottlenecks
    for (const [eventType, metrics] of this.eventMetrics.entries()) {
      if (metrics.avgTime > this.bottleneckThreshold) {
        bottlenecks.push({
          type: 'event',
          eventType,
          avgProcessingTime: metrics.avgTime,
          occurrences: metrics.count,
          severity: this.calculateSeverity(metrics.avgTime)
        });
      }
    }

    // Check message bottlenecks
    for (const [messageType, metrics] of this.messageMetrics.entries()) {
      if (metrics.avgTime > this.bottleneckThreshold) {
        bottlenecks.push({
          type: 'message',
          eventType: messageType,
          avgProcessingTime: metrics.avgTime,
          occurrences: metrics.count,
          severity: this.calculateSeverity(metrics.avgTime)
        });
      }
    }

    return bottlenecks;
  }

  private calculateSeverity(avgTime: number): 'low' | 'medium' | 'high' {
    if (avgTime > this.bottleneckThreshold * 3) return 'high';
    if (avgTime > this.bottleneckThreshold * 2) return 'medium';
    return 'low';
  }

  reset(): void {
    this.eventMetrics.clear();
    this.messageMetrics.clear();
    this.totalEventsProcessed = 0;
    this.totalMessagesProcessed = 0;
    this.peakQueueSize = 0;
  }
}

interface MetricData {
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
}

// Singleton instance for global use
export const globalEventSystem = new AgentEventSystem();