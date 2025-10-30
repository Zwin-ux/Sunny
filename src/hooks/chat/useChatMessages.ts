/**
 * useChatMessages - Message state and persistence
 *
 * Handles:
 * - Message state management
 * - Chat history loading/saving
 * - Message operations (add, delete, edit)
 * - Auto-save to database
 */

import { useState, useCallback, useEffect } from 'react';
import { loadChatMessages, saveChatMessage } from '@/lib/chat-persistence';
import { emitMessageSent, emitMessageReceived } from '@/lib/chat/message-bus';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
  metadata?: any;
}

interface UseChatMessagesOptions {
  userId?: string;
  autoLoad?: boolean;
  maxMessages?: number;
}

export function useChatMessages(options: UseChatMessagesOptions = {}) {
  const { userId, autoLoad = true, maxMessages = 50 } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chat history on mount
  useEffect(() => {
    if (autoLoad) {
      loadHistory();
    }
  }, [autoLoad]);

  /**
   * Load chat history from database
   */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await loadChatMessages(maxMessages);

      if (history.length > 0) {
        const restored = history.map((m: any, idx: number) => ({
          id: m.id || `db-${idx}`,
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content as string,
          timestamp: new Date(m.created_at || Date.now()),
          metadata: m.metadata,
        }));
        setMessages(restored);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [maxMessages]);

  /**
   * Add a message to the chat
   */
  const addMessage = useCallback(
    async (message: Omit<Message, 'id' | 'timestamp'>) => {
      const newMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // Optimistic update
      setMessages((prev) => [...prev, newMessage]);

      // Emit event
      if (message.role === 'user') {
        emitMessageSent({
          messageId: newMessage.id,
          content: newMessage.content,
          emotion: newMessage.emotion,
        });
      } else {
        emitMessageReceived({
          messageId: newMessage.id,
          content: newMessage.content,
          source: 'ai',
        });
      }

      // Persist to database
      try {
        await saveChatMessage(
          message.role,
          message.content,
          'chat',
          message.metadata
        );
      } catch (err) {
        console.error('Failed to save message:', err);
        // Don't revert optimistic update - message is still useful locally
      }

      return newMessage;
    },
    []
  );

  /**
   * Add user message
   */
  const addUserMessage = useCallback(
    (content: string, emotion?: string, metadata?: any) => {
      return addMessage({
        role: 'user',
        content,
        emotion,
        metadata,
      });
    },
    [addMessage]
  );

  /**
   * Add assistant message
   */
  const addAssistantMessage = useCallback(
    (content: string, metadata?: any) => {
      return addMessage({
        role: 'assistant',
        content,
        metadata,
      });
    },
    [addMessage]
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  /**
   * Edit a message
   */
  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m))
    );
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Get last N messages
   */
  const getRecentMessages = useCallback(
    (count: number) => {
      return messages.slice(-count);
    },
    [messages]
  );

  /**
   * Get messages by role
   */
  const getMessagesByRole = useCallback(
    (role: 'user' | 'assistant') => {
      return messages.filter((m) => m.role === role);
    },
    [messages]
  );

  /**
   * Get conversation context (last N messages formatted for API)
   */
  const getConversationContext = useCallback(
    (count: number = 10) => {
      return messages.slice(-count).map((m) => ({
        role: m.role,
        content: m.content,
      }));
    },
    [messages]
  );

  return {
    // State
    messages,
    isLoading,
    error,

    // Operations
    addMessage,
    addUserMessage,
    addAssistantMessage,
    deleteMessage,
    editMessage,
    clearMessages,
    loadHistory,

    // Queries
    getRecentMessages,
    getMessagesByRole,
    getConversationContext,

    // Computed
    messageCount: messages.length,
    userMessageCount: messages.filter((m) => m.role === 'user').length,
    assistantMessageCount: messages.filter((m) => m.role === 'assistant').length,
  };
}
