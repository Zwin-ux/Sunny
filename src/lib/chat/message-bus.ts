/**
 * Message Bus - Central event system for chat events
 *
 * Provides type-safe pub/sub system for all chat-related events.
 * Replaces scattered window.dispatchEvent calls with unified interface.
 */

export type ChatEventType =
  | 'message:sent'
  | 'message:received'
  | 'message:typing'
  | 'xp:earned'
  | 'agent:action'
  | 'agent:recommendation'
  | 'focus:session:suggested'
  | 'game:suggested'
  | 'quiz:started'
  | 'quiz:completed'
  | 'emotion:changed'
  | 'voice:started'
  | 'voice:stopped'
  | 'error:occurred';

export interface ChatEvent<T = any> {
  type: ChatEventType;
  timestamp: number;
  data: T;
}

// Event data interfaces
export interface MessageSentEvent {
  messageId: string;
  content: string;
  emotion?: string;
}

export interface MessageReceivedEvent {
  messageId: string;
  content: string;
  source: 'ai' | 'system';
}

export interface XPEarnedEvent {
  amount: number;
  reason: string;
  newTotal?: number;
}

export interface AgentActionEvent {
  agentType: string;
  action: string;
  reason: string;
  data?: any;
}

export interface FocusSessionSuggestedEvent {
  topic: string;
  duration: number;
  reason: string;
}

export interface ErrorOccurredEvent {
  error: Error | string;
  context: string;
  severity: 'low' | 'medium' | 'high';
}

type EventCallback<T = any> = (event: ChatEvent<T>) => void;

class MessageBus {
  private listeners: Map<ChatEventType, Set<EventCallback>> = new Map();
  private eventHistory: ChatEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to a chat event
   */
  on<T = any>(eventType: ChatEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const callbacks = this.listeners.get(eventType)!;
    callbacks.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback as EventCallback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to event once (auto-unsubscribe after first call)
   */
  once<T = any>(eventType: ChatEventType, callback: EventCallback<T>): void {
    const unsubscribe = this.on(eventType, (event) => {
      callback(event);
      unsubscribe();
    });
  }

  /**
   * Emit a chat event
   */
  emit<T = any>(eventType: ChatEventType, data: T): void {
    const event: ChatEvent<T> = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event callback for ${eventType}:`, error);
        }
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 [MessageBus] ${eventType}`, data);
    }
  }

  /**
   * Get event history
   */
  getHistory(eventType?: ChatEventType, limit?: number): ChatEvent[] {
    let history = eventType
      ? this.eventHistory.filter((e) => e.type === eventType)
      : this.eventHistory;

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all active listeners count
   */
  getListenerCount(eventType?: ChatEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    let total = 0;
    this.listeners.forEach((callbacks) => {
      total += callbacks.size;
    });
    return total;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: ChatEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton instance
export const chatMessageBus = new MessageBus();

// Convenience functions
export const onChatEvent = chatMessageBus.on.bind(chatMessageBus);
export const emitChatEvent = chatMessageBus.emit.bind(chatMessageBus);
export const onceChatEvent = chatMessageBus.once.bind(chatMessageBus);

// Typed event emitters
export const emitMessageSent = (data: MessageSentEvent) =>
  chatMessageBus.emit('message:sent', data);

export const emitMessageReceived = (data: MessageReceivedEvent) =>
  chatMessageBus.emit('message:received', data);

export const emitXPEarned = (data: XPEarnedEvent) =>
  chatMessageBus.emit('xp:earned', data);

export const emitAgentAction = (data: AgentActionEvent) =>
  chatMessageBus.emit('agent:action', data);

export const emitFocusSessionSuggested = (data: FocusSessionSuggestedEvent) =>
  chatMessageBus.emit('focus:session:suggested', data);

export const emitError = (data: ErrorOccurredEvent) =>
  chatMessageBus.emit('error:occurred', data);

// Hook for React components
import { useEffect } from 'react';

export function useChatEvent<T = any>(
  eventType: ChatEventType,
  callback: (data: T) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const unsubscribe = chatMessageBus.on<T>(eventType, (event) => {
      callback(event.data);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...dependencies]);
}

export default chatMessageBus;
