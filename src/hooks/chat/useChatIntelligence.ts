/**
 * useChatIntelligence - Learning intelligence integration
 *
 * Handles:
 * - Message analysis (topic, sentiment, engagement)
 * - Conversation context tracking
 * - Adaptive XP calculation
 * - Smart learning actions
 * - Break detection
 */

import { useRef, useCallback, useEffect } from 'react';
import {
  analyzeMessage,
  analyzeConversation,
  calculateAdaptiveXP,
  shouldSuggestBreak,
  generateEncouragement,
  type ConversationContext,
  type MessageAnalysis,
  type LearningAction,
} from '@/lib/learning-intelligence';
import {
  emitXPEarned,
  emitFocusSessionSuggested,
  emitAgentAction,
} from '@/lib/chat/message-bus';

interface UseChatIntelligenceOptions {
  onBreakSuggested?: () => void;
  onFocusSessionSuggested?: (topic: string, duration: number) => void;
  onGameSuggested?: (topic: string) => void;
  onEncouragementNeeded?: (message: string) => void;
}

export function useChatIntelligence(options: UseChatIntelligenceOptions = {}) {
  const conversationContextRef = useRef<ConversationContext>({
    recentMessages: [],
    topicsDiscussed: new Map(),
    questionsAsked: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    sessionDuration: 0,
  });

  const sessionStartTimeRef = useRef<number>(Date.now());

  // Update session duration every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const durationMinutes = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 60000
      );
      conversationContextRef.current.sessionDuration = durationMinutes;

      // Check if student needs a break
      if (shouldSuggestBreak(conversationContextRef.current)) {
        options.onBreakSuggested?.();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [options.onBreakSuggested]);

  /**
   * Analyze a user message
   */
  const analyze = useCallback(
    (message: string): MessageAnalysis => {
      const analysis = analyzeMessage(message, conversationContextRef.current);

      console.log('🧠 Message Analysis:', {
        topic: analysis.topic,
        sentiment: analysis.sentiment,
        engagement: analysis.engagement,
        actions: analysis.suggestedActions.length,
      });

      // Track message in context
      conversationContextRef.current.recentMessages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Keep only last 20 messages
      if (conversationContextRef.current.recentMessages.length > 20) {
        conversationContextRef.current.recentMessages =
          conversationContextRef.current.recentMessages.slice(-20);
      }

      // Track topics
      if (analysis.topic) {
        const currentCount =
          conversationContextRef.current.topicsDiscussed.get(analysis.topic) || 0;
        conversationContextRef.current.topicsDiscussed.set(
          analysis.topic,
          currentCount + 1
        );
      }

      return analysis;
    },
    []
  );

  /**
   * Process suggested actions from analysis
   */
  const processSuggestedActions = useCallback(
    (actions: LearningAction[]) => {
      for (const action of actions) {
        console.log(`🎯 Processing action: ${action.type} (${action.priority})`);

        emitAgentAction({
          agentType: 'learning_intelligence',
          action: action.type,
          reason: action.reason,
          data: action.data,
        });

        // Handle high-priority actions
        if (action.priority === 'high') {
          switch (action.type) {
            case 'focus_session':
              if (action.data?.topic) {
                emitFocusSessionSuggested({
                  topic: action.data.topic,
                  duration: action.data.suggestedDuration || 1200,
                  reason: action.reason,
                });
                options.onFocusSessionSuggested?.(
                  action.data.topic,
                  action.data.suggestedDuration || 1200
                );
              }
              break;

            case 'encouragement':
              const encouragementMsg = generateEncouragement(
                conversationContextRef.current
              );
              options.onEncouragementNeeded?.(encouragementMsg);
              break;

            case 'game_suggestion':
              if (action.data?.topic) {
                options.onGameSuggested?.(action.data.topic);
              }
              break;
          }
        }
      }
    },
    [
      options.onFocusSessionSuggested,
      options.onEncouragementNeeded,
      options.onGameSuggested,
    ]
  );

  /**
   * Calculate and award adaptive XP
   */
  const awardXP = useCallback((baseXP: number, analysis: MessageAnalysis) => {
    const adaptiveXP = calculateAdaptiveXP(
      baseXP,
      analysis,
      conversationContextRef.current
    );

    console.log(`💰 Awarding ${adaptiveXP.xp} XP: ${adaptiveXP.reason}`);

    emitXPEarned({
      amount: adaptiveXP.xp,
      reason: adaptiveXP.reason,
    });

    return adaptiveXP;
  }, []);

  /**
   * Track quiz performance
   */
  const trackQuizAnswer = useCallback((isCorrect: boolean) => {
    conversationContextRef.current.questionsAsked++;
    if (isCorrect) {
      conversationContextRef.current.correctAnswers++;
    } else {
      conversationContextRef.current.incorrectAnswers++;
    }

    const successRate =
      conversationContextRef.current.questionsAsked > 0
        ? conversationContextRef.current.correctAnswers /
          conversationContextRef.current.questionsAsked
        : 0;

    console.log(
      `📊 Quiz Stats: ${conversationContextRef.current.correctAnswers}/${conversationContextRef.current.questionsAsked} (${Math.round(successRate * 100)}%)`
    );

    return {
      successRate,
      totalQuestions: conversationContextRef.current.questionsAsked,
      correctAnswers: conversationContextRef.current.correctAnswers,
      incorrectAnswers: conversationContextRef.current.incorrectAnswers,
    };
  }, []);

  /**
   * Get conversation insights
   */
  const getInsights = useCallback(() => {
    return analyzeConversation(conversationContextRef.current);
  }, []);

  /**
   * Reset session
   */
  const resetSession = useCallback(() => {
    conversationContextRef.current = {
      recentMessages: [],
      topicsDiscussed: new Map(),
      questionsAsked: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      sessionDuration: 0,
    };
    sessionStartTimeRef.current = Date.now();
  }, []);

  /**
   * Get current context
   */
  const getContext = useCallback(() => {
    return conversationContextRef.current;
  }, []);

  return {
    // Analysis
    analyze,
    getInsights,

    // Actions
    processSuggestedActions,
    awardXP,
    trackQuizAnswer,

    // Context
    getContext,
    resetSession,

    // Computed stats
    get sessionDuration() {
      return Math.floor((Date.now() - sessionStartTimeRef.current) / 60000);
    },
    get successRate() {
      return conversationContextRef.current.questionsAsked > 0
        ? conversationContextRef.current.correctAnswers /
            conversationContextRef.current.questionsAsked
        : 0;
    },
  };
}
