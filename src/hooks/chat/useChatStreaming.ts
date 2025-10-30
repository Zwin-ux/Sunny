/**
 * useChatStreaming - Streaming AI responses
 *
 * Handles:
 * - Streaming responses from OpenAI
 * - Character-by-character display
 * - Stop generation
 * - Partial message updates
 */

import { useState, useCallback, useRef } from 'react';

export interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
}

interface UseChatStreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullMessage: string) => void;
  onError?: (error: Error) => void;
}

export function useChatStreaming(options: UseChatStreamingOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<StreamingMessage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stream a response from OpenAI
   */
  const streamResponse = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      emotion?: string,
      userId?: string
    ): Promise<string> => {
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      const messageId = `stream-${Date.now()}`;
      let fullContent = '';

      setCurrentMessage({
        id: messageId,
        content: '',
        isComplete: false,
      });

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            emotion,
            userId,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';

                if (content) {
                  fullContent += content;

                  setCurrentMessage({
                    id: messageId,
                    content: fullContent,
                    isComplete: false,
                  });

                  options.onChunk?.(content);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        // Mark as complete
        setCurrentMessage({
          id: messageId,
          content: fullContent,
          isComplete: true,
        });

        options.onComplete?.(fullContent);

        return fullContent;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.log('Streaming aborted by user');
          } else {
            console.error('Streaming error:', error);
            options.onError?.(error);
          }
        }
        throw error;
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [options.onChunk, options.onComplete, options.onError]
  );

  /**
   * Stop the current streaming
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setCurrentMessage((prev) =>
        prev ? { ...prev, isComplete: true } : null
      );
    }
  }, []);

  /**
   * Clear current message
   */
  const clearMessage = useCallback(() => {
    setCurrentMessage(null);
  }, []);

  return {
    // State
    isStreaming,
    currentMessage,

    // Operations
    streamResponse,
    stopStreaming,
    clearMessage,
  };
}
