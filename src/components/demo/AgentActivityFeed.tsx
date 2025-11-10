/**
 * AgentActivityFeed Component
 * 
 * Real-time feed showing AI agent activity for demo purposes.
 * Makes the multi-agent system visible and impressive.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  timestamp: number;
  status: 'processing' | 'complete' | 'error';
  icon: React.ReactNode;
  color: string;
}

interface AgentActivityFeedProps {
  maxItems?: number;
  autoScroll?: boolean;
  className?: string;
}

export function AgentActivityFeed({
  maxItems = 5,
  autoScroll = true,
  className = '',
}: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);

  useEffect(() => {
    // Listen for agent events
    const handleAgentEvent = (event: CustomEvent) => {
      const { type, source, data } = event.detail;

      const agentIcons: Record<string, { icon: React.ReactNode; color: string }> = {
        assessment: { icon: <Brain className="w-4 h-4" />, color: 'blue' },
        contentGeneration: { icon: <Zap className="w-4 h-4" />, color: 'purple' },
        pathPlanning: { icon: <Target className="w-4 h-4" />, color: 'green' },
        intervention: { icon: <AlertCircle className="w-4 h-4" />, color: 'orange' },
        communication: { icon: <MessageSquare className="w-4 h-4" />, color: 'pink' },
      };

      const agentInfo = agentIcons[source] || { icon: <CheckCircle className="w-4 h-4" />, color: 'gray' };

      const activity: AgentActivity = {
        id: `${Date.now()}-${Math.random()}`,
        agent: source,
        action: getActionDescription(type, data),
        timestamp: Date.now(),
        status: 'processing',
        icon: agentInfo.icon,
        color: agentInfo.color,
      };

      setActivities(prev => [activity, ...prev].slice(0, maxItems));

      // Mark as complete after a short delay
      setTimeout(() => {
        setActivities(prev =>
          prev.map(a => (a.id === activity.id ? { ...a, status: 'complete' } : a))
        );
      }, 1000);
    };

    // @ts-ignore
    window.addEventListener('agent:activity', handleAgentEvent);

    // Simulate some initial activity for demo
    simulateDemoActivity();

    return () => {
      // @ts-ignore
      window.removeEventListener('agent:activity', handleAgentEvent);
    };
  }, [maxItems]);

  const simulateDemoActivity = () => {
    const demoActivities = [
      { agent: 'assessment', action: 'Analyzing student response patterns', delay: 0 },
      { agent: 'pathPlanning', action: 'Optimizing learning path', delay: 500 },
      { agent: 'contentGeneration', action: 'Generating personalized lesson', delay: 1000 },
    ];

    demoActivities.forEach(({ agent, action, delay }) => {
      setTimeout(() => {
        const event = new CustomEvent('agent:activity', {
          detail: { type: 'demo', source: agent, data: { action } },
        });
        window.dispatchEvent(event);
      }, delay);
    });
  };

  const getActionDescription = (type: string, data: any): string => {
    if (data?.action) return data.action;

    const descriptions: Record<string, string> = {
      'student:message': 'Processing student input',
      'assessment:complete': 'Updated knowledge assessment',
      'content:generated': 'Created new learning content',
      'path:updated': 'Adjusted learning path',
      'intervention:triggered': 'Providing learning support',
      'communication:adapted': 'Optimized communication style',
    };

    return descriptions[type] || 'Processing...';
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 border-blue-300 text-blue-700',
      purple: 'bg-purple-100 border-purple-300 text-purple-700',
      green: 'bg-green-100 border-green-300 text-green-700',
      orange: 'bg-orange-100 border-orange-300 text-orange-700',
      pink: 'bg-pink-100 border-pink-300 text-pink-700',
      gray: 'bg-gray-100 border-gray-300 text-gray-700',
    };
    return colors[color] || colors.gray;
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl border-2 border-black shadow-md p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900">AI Agent Activity</h3>
          <p className="text-xs text-gray-600">Real-time coordination</p>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 p-2 rounded-lg border ${getColorClasses(activity.color)}`}
            >
              <div className="flex-shrink-0">
                {activity.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold capitalize truncate">
                  {activity.agent.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs truncate">{activity.action}</p>
              </div>

              <div className="flex-shrink-0">
                {activity.status === 'processing' ? (
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                ) : activity.status === 'complete' ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-600" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {activities.length} agent{activities.length !== 1 ? 's' : ''} active
        </p>
      </div>
    </div>
  );
}

// Helper function to trigger agent activity from anywhere in the app
export function triggerAgentActivity(agent: string, action: string) {
  const event = new CustomEvent('agent:activity', {
    detail: {
      type: 'custom',
      source: agent,
      data: { action },
    },
  });
  window.dispatchEvent(event);
}
