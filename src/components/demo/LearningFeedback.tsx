'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LearningFeedbackProps {
  topicPreferences: { [topic: string]: number };
  emotionalState: 'excited' | 'focused' | 'struggling' | 'confident';
  focusLevel: number; // 0-100
  adaptiveMessage?: string;
}

export function LearningFeedback({
  topicPreferences,
  emotionalState,
  focusLevel,
  adaptiveMessage
}: LearningFeedbackProps) {
  
  // Get top 3 topics
  const topTopics = Object.entries(topicPreferences)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const emotionConfig = {
    excited: { color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '🤩', label: 'Excited' },
    focused: { color: 'text-blue-600', bg: 'bg-blue-100', emoji: '🎯', label: 'Focused' },
    struggling: { color: 'text-orange-600', bg: 'bg-orange-100', emoji: '🤔', label: 'Thinking' },
    confident: { color: 'text-green-600', bg: 'bg-green-100', emoji: '💪', label: 'Confident' }
  };

  const emotion = emotionConfig[emotionalState];

  return (
    <div className="space-y-4">
      {/* Adaptive Message */}
      {adaptiveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">{emotion.emoji}</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">Sunny noticed:</p>
              <p className="text-gray-700">{adaptiveMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Learning Insights - Topics Only */}
      <div className="max-w-md mx-auto">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="text-base font-semibold text-gray-700">Topic Performance</span>
          </div>
          <div className="space-y-3">
            {topTopics.length > 0 ? (
              topTopics.map(([topic, score]) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium capitalize">{topic}</span>
                    <span className="text-gray-600">{Math.round(score)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Analyzing performance...</p>
            )}
          </div>
        </Card>
      </div>

      {/* Learning Trend Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 text-sm text-gray-600"
      >
        <TrendingUp className="w-4 h-4 text-green-600" />
        <span>Sunny is learning your style...</span>
      </motion.div>
    </div>
  );
}
