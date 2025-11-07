'use client';

/**
 * RewardScreen Component
 *
 * Celebratory screen showing rewards and achievements
 */

import { motion } from 'framer-motion';
import type { LessonReward } from '@/types/env-server';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface RewardScreenProps {
  rewards: LessonReward[];
  score: number;
  accuracy: number;
  timeElapsed: number;
  onContinue?: () => void;
}

export function RewardScreen({
  rewards,
  score,
  accuracy,
  timeElapsed,
  onContinue,
}: RewardScreenProps) {
  useEffect(() => {
    // Launch confetti
    const duration = 5000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#90EE90'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
      {/* Main content */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-center space-y-8 max-w-3xl"
      >
        {/* Celebration */}
        <div className="space-y-4">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-9xl"
          >
            🎉
          </motion.div>

          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
            You Did It!
          </h1>

          <p className="text-2xl text-gray-700">
            Amazing work! You completed the lesson!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
          >
            <div className="text-5xl mb-2">⭐</div>
            <div className="text-4xl font-bold text-yellow-600">{score}</div>
            <div className="text-sm text-gray-600 mt-1">Points</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
          >
            <div className="text-5xl mb-2">🎯</div>
            <div className="text-4xl font-bold text-green-600">
              {Math.round(accuracy * 100)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Accuracy</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
          >
            <div className="text-5xl mb-2">⏱️</div>
            <div className="text-4xl font-bold text-blue-600">
              {formatTime(timeElapsed)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Time</div>
          </motion.div>
        </div>

        {/* Rewards */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">
            Your Rewards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg flex items-center gap-4"
              >
                <div className="text-6xl">{reward.icon}</div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    {reward.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {reward.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onContinue}
          className="px-12 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-2xl rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
        >
          Continue Your Journey
        </motion.button>
      </motion.div>

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
          }}
          animate={{
            y: -100,
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        >
          {['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}
