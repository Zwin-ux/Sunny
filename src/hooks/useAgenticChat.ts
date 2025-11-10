/**
 * useAgenticChat Hook
 * 
 * Integrates the Agentic Learning Engine with the existing chat interface.
 * Provides seamless access to orchestration layer, student profiling, and agent-generated content.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { globalAgentManager } from '@/lib/agents/agent-manager';
import { StudentProfile } from '@/types/chat';
import { LearningState, AgentEvent } from '@/lib/agents/types';

export interface AgenticChatState {
  isAgentSystemReady: boolean;
  learningState: LearningState | null;
  agentActions: string[];
  systemHealth: any;
  error: string | null;
}

export interface AgenticChatHook extends AgenticChatState {
  sendAgenticMessage: (message: string, profile: StudentProfile) => Promise<{ response: string; actions: string[] }>;
  generatePersonalizedContent: (topic: string, contentType: 'quiz' | 'lesson' | 'activity') => Promise<any>;
  updateProgress: (activity: string, performance: any) => Promise<void>;
  refreshLearningState: () => void;
  subscribeToAgentEvents: (callback: (event: AgentEvent) => void) => () => void;
}

export function useAgenticChat(studentId: string): AgenticChatHook {
  const [state, setState] = useState<AgenticChatState>({
    isAgentSystemReady: false,
    learningState: null,
    agentActions: [],
    systemHealth: null,
    error: null,
  });

  const initializationAttempted = useRef(false);

  // Initialize agent system
  useEffect(() => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    const initializeAgents = async () => {
      try {
        await globalAgentManager.initialize();
        
        setState(prev => ({
          ...prev,
          isAgentSystemReady: true,
          systemHealth: globalAgentManager.getSystemHealth(),
          error: null,
        }));

        // Load learning state if exists
        const learningState = globalAgentManager.getLearningState(studentId);
        if (learningState) {
          setState(prev => ({ ...prev, learningState }));
        }
      } catch (error) {
        console.error('Failed to initialize agent system:', error);
        setState(prev => ({
          ...prev,
          isAgentSystemReady: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    initializeAgents();
  }, [studentId]);

  // Send message through agentic system
  const sendAgenticMessage = useCallback(async (
    message: string,
    profile: StudentProfile
  ): Promise<{ response: string; actions: string[] }> => {
    try {
      const result = await globalAgentManager.processStudentMessage(
        studentId,
        message,
        profile
      );

      // Update local state with new actions
      setState(prev => ({
        ...prev,
        agentActions: [...prev.agentActions, ...result.actions],
        learningState: globalAgentManager.getLearningState(studentId) || prev.learningState,
      }));

      return result;
    } catch (error) {
      console.error('Error in agentic message processing:', error);
      throw error;
    }
  }, [studentId]);

  // Generate personalized content
  const generatePersonalizedContent = useCallback(async (
    topic: string,
    contentType: 'quiz' | 'lesson' | 'activity'
  ): Promise<any> => {
    try {
      return await globalAgentManager.generatePersonalizedContent(
        studentId,
        topic,
        contentType
      );
    } catch (error) {
      console.error('Error generating personalized content:', error);
      throw error;
    }
  }, [studentId]);

  // Update student progress
  const updateProgress = useCallback(async (
    activity: string,
    performance: any
  ): Promise<void> => {
    try {
      await globalAgentManager.updateStudentProgress(studentId, activity, performance);
      
      // Refresh learning state
      const updatedState = globalAgentManager.getLearningState(studentId);
      if (updatedState) {
        setState(prev => ({ ...prev, learningState: updatedState }));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [studentId]);

  // Refresh learning state
  const refreshLearningState = useCallback(() => {
    const learningState = globalAgentManager.getLearningState(studentId);
    setState(prev => ({ ...prev, learningState }));
  }, [studentId]);

  // Subscribe to agent events
  const subscribeToAgentEvents = useCallback((
    callback: (event: AgentEvent) => void
  ): (() => void) => {
    globalAgentManager.onLearningEvent(callback);
    
    // Return unsubscribe function
    return () => {
      // Event system cleanup handled by agent manager
    };
  }, []);

  return {
    ...state,
    sendAgenticMessage,
    generatePersonalizedContent,
    updateProgress,
    refreshLearningState,
    subscribeToAgentEvents,
  };
}
