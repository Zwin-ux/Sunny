'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Activity, Brain, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { Answer } from '@/types/demo';

interface LearningTaskManagerProps {
  answers: Answer[];
  sessionTime: number; // in seconds
  focusLevel: number;
}

export function LearningTaskManager({ answers, sessionTime, focusLevel }: LearningTaskManagerProps) {
  const correctAnswers = answers.filter(a => a.correct).length;
  const accuracy = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;
  const avgTimePerQuestion = answers.length > 0 
    ? answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length / 1000 
    : 0;

  // Calculate "memory usage" based on question difficulty
  const workingMemory = Math.min(100, answers.length * 10 + (accuracy * 0.3));
  const longTermRecall = Math.min(100, correctAnswers * 15);

  // Generate recommendations
  const recommendations = [];
  if (sessionTime > 600) {
    recommendations.push('Take a 2-min break soon');
  }
  if (accuracy < 60) {
    recommendations.push('Review basics tomorrow');
  }
  if (focusLevel < 70) {
    recommendations.push('Try a different topic');
  }
  if (correctAnswers >= 5) {
    recommendations.push('Ready for harder challenges!');
  }

  const metrics = [
    {
      label: 'Active Session',
      value: `${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}`,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      label: 'Focus Level',
      value: `${focusLevel}%`,
      progress: focusLevel,
      icon: Target,
      color: 'text-purple-600',
    },
    {
      label: 'Questions',
      value: `${answers.length} answered`,
      icon: Activity,
      color: 'text-green-600',
    },
    {
      label: 'Accuracy',
      value: `${Math.round(accuracy)}%`,
      progress: accuracy,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-green-400" />
        <div>
          <h2 className="text-xl font-bold">Learning Performance Monitor</h2>
          <p className="text-sm text-gray-400">Real-time analytics</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/10 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-sm text-gray-300">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold mb-2">{metric.value}</div>
              {metric.progress !== undefined && (
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${
                      metric.progress > 80 ? 'from-green-400 to-emerald-400' :
                      metric.progress > 60 ? 'from-blue-400 to-cyan-400' :
                      'from-orange-400 to-red-400'
                    }`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Memory Usage */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-pink-400" />
          <span className="text-sm font-semibold">Memory Usage</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Working Memory</span>
              <span className="text-gray-400">{Math.round(workingMemory)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${workingMemory}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Long-term Recall</span>
              <span className="text-gray-400">{Math.round(longTermRecall)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${longTermRecall}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Avg Time/Question</span>
            <div className="text-lg font-semibold">{avgTimePerQuestion.toFixed(1)}s</div>
          </div>
          <div>
            <span className="text-gray-400">Learning Speed</span>
            <div className="text-lg font-semibold flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              {avgTimePerQuestion < 10 ? 'Fast' : avgTimePerQuestion < 20 ? 'Medium' : 'Thoughtful'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2 text-gray-300">Recommendations</div>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {rec}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
