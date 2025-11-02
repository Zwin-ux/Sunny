'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award, Zap } from 'lucide-react';
import { useXP } from '@/contexts/XPContext';

interface XPDisplayProps {
  variant?: 'full' | 'compact' | 'minimal';
  showProgress?: boolean;
  showLevel?: boolean;
  showStreak?: boolean;
}

export function XPDisplay({ 
  variant = 'full', 
  showProgress = true,
  showLevel = true,
  showStreak = true 
}: XPDisplayProps) {
  const { xp, level, streak, getXPForNextLevel, getProgress } = useXP();
  
  const xpNeeded = getXPForNextLevel();
  const progress = getProgress();

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 rounded-full border-2 border-black">
        <Sparkles className="w-4 h-4 text-yellow-600" />
        <span className="font-bold text-sm text-gray-900">{xp} XP</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="font-bold text-gray-900">{xp} XP</span>
          </div>
        </div>
        {showLevel && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-gray-900">Lvl {level}</span>
            </div>
          </div>
        )}
        {showStreak && (
          <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="font-bold text-gray-900">{streak} day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900">Level {level}</h3>
          <p className="text-sm text-gray-600">Keep learning to level up!</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-3 rounded-xl border-2 border-black">
          <Zap className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      {/* XP Progress */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              {Math.floor((xp % xpNeeded) || 0)} / {xpNeeded} XP
            </span>
            <span className="text-sm font-semibold text-purple-600">
              {Math.floor(progress)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden"
            >
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-4 border-2 border-black">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-gray-600">Total XP</span>
          </div>
          <p className="text-2xl font-black text-blue-600">{xp}</p>
        </div>

        {showStreak && (
          <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-4 border-2 border-black">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-semibold text-gray-600">Streak</span>
            </div>
            <p className="text-2xl font-black text-orange-600">{streak} 🔥</p>
          </div>
        )}
      </div>

      {/* Next Level Info */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-xs text-purple-800">
          <strong>{xpNeeded - (xp % xpNeeded)} XP</strong> until Level {level + 1}!
        </p>
      </div>
    </motion.div>
  );
}
