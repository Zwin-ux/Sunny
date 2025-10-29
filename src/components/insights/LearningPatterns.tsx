'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  Zap,
  Heart,
  ThumbsUp,
  AlertCircle,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';

interface Pattern {
  id: string;
  type: 'strength' | 'opportunity' | 'insight' | 'warning';
  icon: React.ReactNode;
  title: string;
  description: string;
  recommendation?: string;
  color: string;
  bgColor: string;
}

interface LearningPatternsProps {
  studentName?: string;
}

export function LearningPatterns({ studentName = 'Your Child' }: LearningPatternsProps) {
  // Mock data - TODO: Replace with real AI-generated insights
  const patterns: Pattern[] = [
    {
      id: '1',
      type: 'strength',
      icon: <ThumbsUp className="w-6 h-6" />,
      title: 'Visual Learner',
      description: `${studentName} excels when concepts are presented with diagrams and images. Shows 25% higher accuracy on visual problems.`,
      recommendation: 'Continue using visual aids and interactive labs for new concepts.',
      color: 'text-green-600',
      bgColor: 'from-green-100 to-teal-100',
    },
    {
      id: '2',
      type: 'insight',
      icon: <Clock className="w-6 h-6" />,
      title: 'Peak Performance Time',
      description: 'Best learning happens between 9-11 AM on weekends. Accuracy increases by 18% during this window.',
      recommendation: 'Schedule challenging topics during Saturday/Sunday mornings.',
      color: 'text-blue-600',
      bgColor: 'from-blue-100 to-cyan-100',
    },
    {
      id: '3',
      type: 'strength',
      icon: <Zap className="w-6 h-6" />,
      title: 'Quick Pattern Recognition',
      description: 'Identifies patterns 30% faster than grade-level average. Strong logical reasoning skills.',
      recommendation: 'Challenge with advanced pattern puzzles and logic games.',
      color: 'text-purple-600',
      bgColor: 'from-purple-100 to-pink-100',
    },
    {
      id: '4',
      type: 'opportunity',
      icon: <Target className="w-6 h-6" />,
      title: 'Word Problem Hesitation',
      description: 'Takes 40% longer on word problems vs. numeric problems. May need reading comprehension support.',
      recommendation: 'Break word problems into smaller steps. Practice reading strategies.',
      color: 'text-orange-600',
      bgColor: 'from-orange-100 to-yellow-100',
    },
    {
      id: '5',
      type: 'insight',
      icon: <Heart className="w-6 h-6" />,
      title: 'Motivation Style',
      description: 'Responds best to achievement-based rewards. Completion badges increase engagement by 35%.',
      recommendation: 'Set clear goals with milestone rewards.',
      color: 'text-pink-600',
      bgColor: 'from-pink-100 to-rose-100',
    },
    {
      id: '6',
      type: 'warning',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Attention Span Pattern',
      description: 'Focus drops significantly after 15 minutes. Accuracy decreases by 22% in longer sessions.',
      recommendation: 'Use 10-12 minute learning blocks with short breaks.',
      color: 'text-red-600',
      bgColor: 'from-red-100 to-orange-100',
    },
  ];

  const learningStyle = {
    primary: 'Visual-Kinesthetic',
    secondary: 'Logical-Mathematical',
    processingSpeed: 'Above Average',
    workingMemory: 'Strong',
    attentionSpan: '12-15 minutes',
    preferredTime: 'Morning (9-11 AM)',
  };

  const emotionalPatterns = [
    {
      emotion: 'Confident',
      topics: ['Addition', 'Patterns', 'Reading'],
      percentage: 85,
      color: 'bg-green-500',
    },
    {
      emotion: 'Curious',
      topics: ['Science', 'Robots', 'Space'],
      percentage: 78,
      color: 'bg-blue-500',
    },
    {
      emotion: 'Challenged',
      topics: ['Fractions', 'Word Problems'],
      percentage: 45,
      color: 'bg-orange-500',
    },
    {
      emotion: 'Frustrated',
      topics: ['Division', 'Long Reading'],
      percentage: 30,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Learning Style Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-600" />
          <h3 className="text-2xl font-black text-gray-900">Learning Style Profile</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Primary Style</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.primary}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Secondary Style</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.secondary}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Processing Speed</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.processingSpeed}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Working Memory</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.workingMemory}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Attention Span</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.attentionSpan}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-black">
            <p className="text-xs font-semibold text-gray-600">Best Time</p>
            <p className="text-lg font-black text-purple-600">{learningStyle.preferredTime}</p>
          </div>
        </div>
      </motion.div>

      {/* Detected Patterns */}
      <div>
        <h3 className="text-2xl font-black text-gray-900 mb-4">Detected Learning Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${pattern.bgColor} rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`${pattern.color}`}>{pattern.icon}</div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-gray-900">{pattern.title}</h4>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      pattern.type === 'strength'
                        ? 'bg-green-200 text-green-800'
                        : pattern.type === 'opportunity'
                        ? 'bg-orange-200 text-orange-800'
                        : pattern.type === 'warning'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {pattern.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>
              {pattern.recommendation && (
                <div className="bg-white/60 rounded-lg p-3 border border-black/20">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💡 Recommendation</p>
                  <p className="text-sm text-gray-800">{pattern.recommendation}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Emotional Engagement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-pink-600" />
          <h3 className="text-2xl font-black text-gray-900">Emotional Engagement by Topic</h3>
        </div>
        <div className="space-y-4">
          {emotionalPatterns.map((pattern, index) => (
            <motion.div
              key={pattern.emotion}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900">{pattern.emotion}</p>
                  <p className="text-xs text-gray-600">{pattern.topics.join(', ')}</p>
                </div>
                <span className="text-sm font-bold text-gray-700">{pattern.percentage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-black">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pattern.percentage}%` }}
                  transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                  className={`h-full ${pattern.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sunny's Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">☀️</div>
          <div>
            <h4 className="text-xl font-black text-gray-900 mb-2">Sunny's Analysis</h4>
            <p className="text-gray-700 mb-4">
              Based on {studentName}'s learning patterns over the past 2 weeks, here's what I've
              noticed:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strong visual processing:</strong> {studentName} learns best when I show
                  pictures and diagrams. I'll use more visual examples!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Morning momentum:</strong> Weekend mornings are golden learning time.
                  Let's tackle harder topics then!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Short & sweet sessions:</strong> I'll keep lessons under 15 minutes with
                  fun breaks to maintain focus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Word problem strategy:</strong> I'm breaking down word problems into
                  smaller steps to build confidence.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Brain({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
