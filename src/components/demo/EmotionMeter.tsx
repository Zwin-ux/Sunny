'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Smile, Zap, Brain, TrendingUp } from 'lucide-react';

type EmotionalState = 'excited' | 'focused' | 'struggling' | 'confident';

interface EmotionMeterProps {
  emotion: EmotionalState;
  autoDetected?: boolean;
  showMessage?: boolean;
}

const emotionConfig = {
  excited: {
    emoji: '🤩',
    label: 'Excited',
    color: 'from-yellow-400 to-orange-400',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    message: "You're crushing it! Keep that energy!",
    icon: Zap,
  },
  focused: {
    emoji: '🎯',
    label: 'Focused',
    color: 'from-blue-400 to-indigo-400',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    message: "Great concentration! You're in the zone!",
    icon: Brain,
  },
  struggling: {
    emoji: '🤔',
    label: 'Thinking Hard',
    color: 'from-orange-400 to-red-400',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    message: "Taking your time - that's smart learning!",
    icon: Brain,
  },
  confident: {
    emoji: '💪',
    label: 'Confident',
    color: 'from-green-400 to-emerald-400',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    message: "You've got this! Strong performance!",
    icon: TrendingUp,
  },
};

export function EmotionMeter({ emotion, autoDetected = true, showMessage = true }: EmotionMeterProps) {
  const config = emotionConfig[emotion];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`p-4 ${config.bgColor} border-2 ${config.borderColor}`}>
        <div className="flex items-center gap-4">
          {/* Animated Emoji */}
          <motion.div
            key={emotion}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center border-4 border-white shadow-lg`}>
              <motion.span
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl"
              >
                {config.emoji}
              </motion.span>
            </div>
            
            {/* Pulse Ring */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} -z-10`}
            />
          </motion.div>

          {/* Emotion Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-5 h-5 ${config.textColor}`} />
              <h3 className={`text-xl font-bold ${config.textColor}`}>
                {config.label}
              </h3>
            </div>
            
            {showMessage && (
              <p className="text-gray-700 text-sm">
                {config.message}
              </p>
            )}
            
            {autoDetected && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-500 mt-1 flex items-center gap-1"
              >
                <Smile className="w-3 h-3" />
                Auto-detected from your answers
              </motion.p>
            )}
          </div>

          {/* Emotion Level Bars */}
          <div className="flex flex-col gap-1">
            {['excited', 'focused', 'struggling', 'confident'].map((e) => (
              <div key={e} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16 text-right capitalize">
                  {e === 'struggling' ? 'thinking' : e}
                </span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: e === emotion ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                    className={`h-full bg-gradient-to-r ${emotionConfig[e as EmotionalState].color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Adjustment Indicator */}
        {emotion === 'excited' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-yellow-300"
          >
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">Sunny is increasing difficulty!</span>
            </p>
          </motion.div>
        )}
        
        {emotion === 'struggling' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-orange-300"
          >
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="font-semibold">Sunny is adjusting to help you!</span>
            </p>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
