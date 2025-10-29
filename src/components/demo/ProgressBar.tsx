'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ProgressBarProps {
  xp: number;
  level: number;
  nextLevelXP: number;
  showLevelUp?: boolean;
}

export function ProgressBar({ xp, level, nextLevelXP, showLevelUp }: ProgressBarProps) {
  const currentLevelXP = (level - 1) * 100;
  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progress = Math.min(100, (xpInLevel / xpNeeded) * 100);

  return (
    <div className="relative">
      <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center border-2 border-yellow-600 font-bold text-white">
              {level}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Level {level}</p>
              <p className="text-xs text-gray-500">
                {xpInLevel} / {xpNeeded} XP
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600">{xp}</p>
            <p className="text-xs text-gray-500">Total XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 relative"
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
          
          {/* Shine effect */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
          />
        </div>

        <p className="text-xs text-center text-gray-600 mt-2">
          {xpNeeded - xpInLevel} XP to Level {level + 1}
        </p>
      </Card>

      {/* Level Up Animation */}
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full border-4 border-white shadow-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-bold">Level Up!</span>
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
