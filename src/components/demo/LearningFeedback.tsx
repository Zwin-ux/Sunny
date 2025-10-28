'use client';

import { motion } from 'framer-motion';
import { Brain, Heart, Target, TrendingUp } from 'lucide-react';
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

      {/* Learning Insights Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Topic Preferences */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Topics</span>
          </div>
          <div className="space-y-2">
            {topTopics.length > 0 ? (
              topTopics.map(([topic, score]) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{topic}</span>
                    <span className="text-gray-500">{Math.round(score)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-purple-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">Learning...</p>
            )}
          </div>
        </Card>

        {/* Emotional State */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-semibold text-gray-700">Mood</span>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">{emotion.emoji}</div>
            <div className={`text-sm font-semibold ${emotion.color}`}>
              {emotion.label}
            </div>
          </div>
        </Card>

        {/* Focus Level */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Focus</span>
          </div>
          <div className="space-y-2">
            <div className="relative h-16">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Background arc */}
                <path
                  d="M 10 45 A 40 40 0 0 1 90 45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Progress arc */}
                <motion.path
                  d="M 10 45 A 40 40 0 0 1 90 45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="126"
                  initial={{ strokeDashoffset: 126 }}
                  animate={{ strokeDashoffset: 126 - (126 * focusLevel / 100) }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{focusLevel}%</span>
              </div>
            </div>
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
