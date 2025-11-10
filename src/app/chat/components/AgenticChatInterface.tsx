/**
 * AgenticChatInterface Component
 * 
 * Enhanced chat interface that integrates with the Agentic Learning Engine.
 * Provides seamless agent-powered interactions and real-time learning insights.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { useAgenticChat } from '@/hooks/useAgenticChat';
import { LearningProgressVisualization } from '@/components/agent/LearningProgressVisualization';
import { AgentGeneratedContent, AgentContent } from '@/components/agent/AgentGeneratedContent';
import { StudentProfile } from '@/types/chat';
import { AgentEvent } from '@/lib/agents/types';

interface AgenticChatInterfaceProps {
  studentId: string;
  studentProfile: StudentProfile;
  onAgentResponse?: (response: string, actions: string[]) => void;
  showProgress?: boolean;
  className?: string;
}

export function AgenticChatInterface({
  studentId,
  studentProfile,
  onAgentResponse,
  showProgress = true,
  className = '',
}: AgenticChatInterfaceProps) {
  const {
    isAgentSystemReady,
    learningState,
    agentActions,
    systemHealth,
    error,
    sendAgenticMessage,
    generatePersonalizedContent,
    updateProgress,
    refreshLearningState,
    subscribeToAgentEvents,
  } = useAgenticChat(studentId);

  const [agentContent, setAgentContent] = useState<AgentContent[]>([]);
  const [recentEvents, setRecentEvents] = useState<AgentEvent[]>([]);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Subscribe to agent events
  useEffect(() => {
    const unsubscribe = subscribeToAgentEvents((event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 10));
      
      // Handle specific event types
      if (event.type === 'content:generated') {
        const content: AgentContent = {
          id: event.id,
          type: event.data.contentType || 'lesson',
          title: event.data.title || 'New Content',
          description: event.data.description,
          content: event.data.content,
          metadata: event.data.metadata,
        };
        setAgentContent(prev => [...prev, content]);
      }
    });

    return unsubscribe;
  }, [subscribeToAgentEvents]);

  // Process message through agent system
  const handleAgenticMessage = async (message: string): Promise<string> => {
    try {
      const result = await sendAgenticMessage(message, studentProfile);
      onAgentResponse?.(result.response, result.actions);
      return result.response;
    } catch (error) {
      console.error('Error processing agentic message:', error);
      throw error;
    }
  };

  // Handle content completion
  const handleContentComplete = async (contentId: string, result: any) => {
    try {
      await updateProgress(`content-${contentId}`, result);
      
      // Remove completed content after a delay
      setTimeout(() => {
        setAgentContent(prev => prev.filter(c => c.id !== contentId));
      }, 2000);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Handle content dismissal
  const handleContentDismiss = (contentId: string) => {
    setAgentContent(prev => prev.filter(c => c.id !== contentId));
  };

  if (error) {
    return (
      <div className={`bg-red-50 rounded-xl border-2 border-red-300 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-bold text-red-900">Agent System Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* System Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAgentSystemReady ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-xs font-semibold text-gray-600">
            {isAgentSystemReady ? 'AI Agents Active' : 'Initializing...'}
          </span>
          {isAgentSystemReady && (
            <button
              onClick={() => setShowSystemStatus(!showSystemStatus)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {showSystemStatus ? 'Hide' : 'Show'} Details
            </button>
          )}
        </div>
        
        {agentActions.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-bold text-blue-700">
              {agentActions.length} agent actions
            </span>
          </div>
        )}
      </motion.div>

      {/* System Status Details */}
      <AnimatePresence>
        {showSystemStatus && systemHealth && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg border border-gray-300 p-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-bold text-gray-700">Active Agents</p>
                <p className="text-gray-600">{systemHealth.activeAgents || 0}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">Events Processed</p>
                <p className="text-gray-600">{systemHealth.eventsProcessed || 0}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">Learning Sessions</p>
                <p className="text-gray-600">{systemHealth.activeSessions || 0}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">System Status</p>
                <p className="text-green-600 font-semibold">{systemHealth.status || 'Healthy'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learning Progress Visualization */}
      {showProgress && isAgentSystemReady && (
        <LearningProgressVisualization
          learningState={learningState}
          compact={true}
        />
      )}

      {/* Agent-Generated Content */}
      <AnimatePresence>
        {agentContent.map((content) => (
          <motion.div
            key={content.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <AgentGeneratedContent
              content={content}
              onComplete={(result) => handleContentComplete(content.id, result)}
              onDismiss={() => handleContentDismiss(content.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Recent Agent Activity (Debug/Development) */}
      {process.env.NODE_ENV === 'development' && recentEvents.length > 0 && (
        <details className="bg-gray-50 rounded-lg border border-gray-300 p-3">
          <summary className="text-xs font-bold text-gray-700 cursor-pointer">
            Recent Agent Activity ({recentEvents.length})
          </summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {recentEvents.map((event, index) => (
              <div key={index} className="text-xs text-gray-600 font-mono">
                <span className="text-blue-600">{event.type}</span> from{' '}
                <span className="text-purple-600">{event.source}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// Export the message handler for use in existing chat interface
export function useAgenticMessageHandler(
  studentId: string,
  studentProfile: StudentProfile
) {
  const { sendAgenticMessage, isAgentSystemReady } = useAgenticChat(studentId);

  const handleMessage = async (message: string): Promise<string> => {
    if (!isAgentSystemReady) {
      throw new Error('Agent system not ready');
    }

    const result = await sendAgenticMessage(message, studentProfile);
    return result.response;
  };

  return {
    handleMessage,
    isReady: isAgentSystemReady,
  };
}
