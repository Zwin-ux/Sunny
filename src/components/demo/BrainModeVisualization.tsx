'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, TrendingUp, AlertCircle, CheckCircle, Target, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Answer } from '@/types/demo';
import { analyzeBrainState, predictDifficultyChange } from '@/lib/demo-brain-analysis';

interface BrainModeVisualizationProps {
  answers: Answer[];
  currentDifficulty: string;
  streak: number;
  consecutiveWrong: number;
  showThinking?: boolean;
}

interface BrainThought {
  id: string;
  type: 'analysis' | 'decision' | 'adaptation' | 'insight';
  message: string;
  timestamp: number;
  icon: any;
  color: string;
}

export function BrainModeVisualization({
  answers,
  currentDifficulty,
  streak,
  consecutiveWrong,
  showThinking = true
}: BrainModeVisualizationProps) {
  const [thoughts, setThoughts] = useState<BrainThought[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (answers.length === 0) return;

    const lastAnswer = answers[answers.length - 1];
    generateBrainThoughts(lastAnswer);
  }, [answers.length]);

  const generateBrainThoughts = (lastAnswer: Answer) => {
    setIsProcessing(true);
    const newThoughts: BrainThought[] = [];

    // Analysis thought
    setTimeout(() => {
      newThoughts.push({
        id: `analysis-${Date.now()}`,
        type: 'analysis',
        message: `Analyzing answer: ${lastAnswer.correct ? 'Correct' : 'Incorrect'} in ${(lastAnswer.timeSpent / 1000).toFixed(1)}s`,
        timestamp: Date.now(),
        icon: Brain,
        color: 'text-purple-600'
      });
      setThoughts(prev => [...prev, ...newThoughts].slice(-5));
    }, 300);

    // Pattern detection
    setTimeout(() => {
      if (streak >= 2) {
        newThoughts.push({
          id: `pattern-${Date.now()}`,
          type: 'insight',
          message: `Pattern detected: ${streak} correct in a row! Student is mastering this level.`,
          timestamp: Date.now(),
          icon: TrendingUp,
          color: 'text-green-600'
        });
      } else if (consecutiveWrong >= 2) {
        newThoughts.push({
          id: `struggle-${Date.now()}`,
          type: 'insight',
          message: `Struggle detected: ${consecutiveWrong} wrong in a row. Adjusting difficulty.`,
          timestamp: Date.now(),
          icon: AlertCircle,
          color: 'text-orange-600'
        });
      }
      setThoughts(prev => [...prev, ...newThoughts].slice(-5));
    }, 600);

    // Decision making
    setTimeout(() => {
      if (lastAnswer.correct && streak >= 2) {
        newThoughts.push({
          id: `decision-${Date.now()}`,
          type: 'decision',
          message: `Decision: Increasing difficulty to challenge student.`,
          timestamp: Date.now(),
          icon: Zap,
          color: 'text-blue-600'
        });
      } else if (!lastAnswer.correct && consecutiveWrong >= 2) {
        newThoughts.push({
          id: `decision-${Date.now()}`,
          type: 'decision',
          message: `Decision: Reducing difficulty to rebuild confidence.`,
          timestamp: Date.now(),
          icon: Zap,
          color: 'text-blue-600'
        });
      } else {
        newThoughts.push({
          id: `decision-${Date.now()}`,
          type: 'decision',
          message: `Decision: Maintaining current difficulty level.`,
          timestamp: Date.now(),
          icon: CheckCircle,
          color: 'text-gray-600'
        });
      }
      setThoughts(prev => [...prev, ...newThoughts].slice(-5));
      setIsProcessing(false);
    }, 900);
  };

  const recentAnswers = answers.slice(-5);
  const accuracy = recentAnswers.length > 0 
    ? (recentAnswers.filter(a => a.correct).length / recentAnswers.length) * 100 
    : 0;

  const avgTime = recentAnswers.length > 0
    ? recentAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / recentAnswers.length / 1000
    : 0;

  if (!showThinking) return null;

  return (
    <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Brain className={`w-6 h-6 text-purple-600 ${isProcessing ? 'animate-pulse' : ''}`} />
          {isProcessing && (
            <motion.div
              className="absolute -inset-1 bg-purple-400 rounded-full opacity-30"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Sunny's Brain Mode</h3>
          <p className="text-xs text-gray-600">Real-time adaptive learning intelligence</p>
        </div>
      </div>

      {/* Brain Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Accuracy</div>
          <div className="text-2xl font-bold text-purple-600">{accuracy.toFixed(0)}%</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Avg Time</div>
          <div className="text-2xl font-bold text-blue-600">{avgTime.toFixed(1)}s</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Level</div>
          <div className="text-2xl font-bold text-green-600 capitalize">{currentDifficulty}</div>
        </div>
      </div>

      {/* Thought Stream */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Target className="w-4 h-4" />
          <span>Thinking Process</span>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 min-h-[120px] max-h-[200px] overflow-y-auto font-mono text-xs">
          <AnimatePresence mode="popLayout">
            {thoughts.length === 0 ? (
              <div className="text-gray-500 italic">Waiting for student input...</div>
            ) : (
              thoughts.map((thought) => (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="mb-2 flex items-start gap-2"
                >
                  <thought.icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${thought.color}`} />
                  <span className="text-gray-300">
                    <span className="text-gray-500">[{new Date(thought.timestamp).toLocaleTimeString()}]</span>{' '}
                    {thought.message}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Adaptation Indicator */}
      {answers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-xs text-gray-600 bg-purple-100 rounded-lg p-2"
        >
          <Zap className="w-4 h-4 text-purple-600" />
          <span>
            {streak >= 2 ? '🔥 Adapting up - Student is excelling!' : 
             consecutiveWrong >= 2 ? '💪 Adapting down - Building confidence!' :
             '✨ Monitoring performance - Learning in progress'}
          </span>
        </motion.div>
      )}

      {/* Advanced Brain Insights */}
      {answers.length >= 2 && (() => {
        const analysis = analyzeBrainState(answers);
        const prediction = predictDifficultyChange(currentDifficulty, analysis);
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            {/* Analysis Summary */}
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-semibold text-gray-700">Brain Analysis</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Pattern:</span>
                  <span className="ml-1 font-semibold capitalize">{analysis.performancePattern}</span>
                </div>
                <div>
                  <span className="text-gray-600">Style:</span>
                  <span className="ml-1 font-semibold capitalize">{analysis.learningStyle}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Confidence:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.confidenceLevel}%` }}
                        className={`h-full ${
                          analysis.confidenceLevel >= 70 ? 'bg-green-500' :
                          analysis.confidenceLevel >= 40 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                      />
                    </div>
                    <span className="font-semibold">{analysis.confidenceLevel}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-semibold text-blue-900 mb-2">Key Insights:</div>
                <ul className="space-y-1">
                  {analysis.insights.map((insight, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-xs text-blue-800 flex items-start gap-2"
                    >
                      <span className="text-blue-600">•</span>
                      <span>{insight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Action */}
            <div className={`rounded-lg p-3 border-2 ${
              prediction === 'increase' ? 'bg-green-50 border-green-300' :
              prediction === 'decrease' ? 'bg-orange-50 border-orange-300' :
              'bg-gray-50 border-gray-300'
            }`}>
              <div className="text-xs font-semibold mb-1">
                {prediction === 'increase' ? '⬆️ Next: Increase Difficulty' :
                 prediction === 'decrease' ? '⬇️ Next: Decrease Difficulty' :
                 '➡️ Next: Maintain Level'}
              </div>
              <div className="text-xs text-gray-700">{analysis.nextAction}</div>
            </div>
          </motion.div>
        );
      })()}
    </Card>
  );
}
