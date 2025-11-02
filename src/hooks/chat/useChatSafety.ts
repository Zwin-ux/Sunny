/**
 * useChatSafety - Safety validation for chat
 *
 * Handles:
 * - Input validation (profanity, PII, threats)
 * - Output validation (AI response safety)
 * - Prompt injection detection
 * - Safety incident logging
 */

import { useCallback } from 'react';
import {
  validateUserInput,
  validateAIResponse,
  detectPromptInjection,
  logSafetyIncident,
  getBlockedInputMessage,
  addEmojisIfNeeded,
} from '@/lib/safety/input-validator';
import { emitError } from '@/lib/chat/message-bus';

export interface ValidationResult {
  safe: boolean;
  sanitized: string;
  flags: string[];
  replacement?: string;
}

export function useChatSafety(studentName?: string) {
  /**
   * Validate user input before processing
   */
  const validateInput = useCallback(
    async (message: string): Promise<ValidationResult> => {
      console.log('🛡️ Validating user input for safety...');

      try {
        // Check basic validation
        const inputValidation = await validateUserInput(message);

        // Check for prompt injection
        const hasPromptInjection = detectPromptInjection(message);

        if (hasPromptInjection) {
          console.warn('⚠️ Prompt injection detected:', message);
          inputValidation.safe = false;
          inputValidation.flags.push('prompt_injection');
        }

        // Log safety incidents
        if (!inputValidation.safe) {
          console.warn('⚠️ Unsafe input detected:', inputValidation.flags);

          await logSafetyIncident(
            studentName || 'unknown',
            message,
            inputValidation.flags
          );

          emitError({
            error: 'Unsafe input detected',
            context: 'user_message_validation',
            severity: 'medium',
          });
        }

        return {
          safe: inputValidation.safe,
          sanitized: inputValidation.sanitized,
          flags: inputValidation.flags,
          replacement: inputValidation.safe
            ? undefined
            : getBlockedInputMessage(inputValidation.flags),
        };
      } catch (error) {
        console.error('Error in input validation:', error);

        emitError({
          error: error instanceof Error ? error : String(error),
          context: 'input_validation',
          severity: 'high',
        });

        // Fail closed - reject on error
        return {
          safe: false,
          sanitized: message,
          flags: ['validation_error'],
          replacement: "I'm having trouble processing that message. Can you try rephrasing?",
        };
      }
    },
    [studentName]
  );

  /**
   * Validate AI output before displaying
   */
  const validateOutput = useCallback(
    async (response: string): Promise<ValidationResult> => {
      console.log('🛡️ Validating AI response for safety...');

      try {
        const outputValidation = await validateAIResponse(response);

        if (!outputValidation.safe) {
          console.warn('⚠️ Unsafe AI output detected');

          emitError({
            error: 'Unsafe AI output',
            context: 'ai_response_validation',
            severity: 'high',
          });

          return {
            safe: false,
            sanitized: response,
            flags: ['unsafe_output'],
            replacement:
              outputValidation.replacement ||
              "I apologize, but I need to rephrase that response. Let me try again!",
          };
        }

        // Add emojis if needed for engagement
        const enhancedResponse = addEmojisIfNeeded(outputValidation.content);

        return {
          safe: true,
          sanitized: enhancedResponse,
          flags: [],
        };
      } catch (error) {
        console.error('Error in output validation:', error);

        emitError({
          error: error instanceof Error ? error : String(error),
          context: 'output_validation',
          severity: 'high',
        });

        // Fail closed - use safe fallback
        return {
          safe: false,
          sanitized: response,
          flags: ['validation_error'],
          replacement: "I'm here to help! What would you like to learn about?",
        };
      }
    },
    []
  );

  /**
   * Check if message is a command/slash command
   */
  const isCommand = useCallback((message: string): boolean => {
    return message.trim().startsWith('/');
  }, []);

  /**
   * Sanitize and validate message combo
   */
  const processUserMessage = useCallback(
    async (
      message: string
    ): Promise<{ approved: boolean; content: string; error?: string }> => {
      // Commands bypass some safety checks
      if (isCommand(message)) {
        return { approved: true, content: message };
      }

      const validation = await validateInput(message);

      if (!validation.safe) {
        return {
          approved: false,
          content: validation.replacement || "I couldn't process that message.",
          error: validation.flags.join(', '),
        };
      }

      return {
        approved: true,
        content: validation.sanitized,
      };
    },
    [validateInput, isCommand]
  );

  /**
   * Process AI response with validation
   */
  const processAIResponse = useCallback(
    async (
      response: string
    ): Promise<{ approved: boolean; content: string; error?: string }> => {
      const validation = await validateOutput(response);

      if (!validation.safe) {
        return {
          approved: false,
          content:
            validation.replacement || "I'm here to help! What would you like to learn?",
          error: validation.flags.join(', '),
        };
      }

      return {
        approved: true,
        content: validation.sanitized,
      };
    },
    [validateOutput]
  );

  return {
    // Validation functions
    validateInput,
    validateOutput,
    isCommand,

    // Combined processing
    processUserMessage,
    processAIResponse,
  };
}
