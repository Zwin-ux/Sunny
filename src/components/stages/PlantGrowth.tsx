'use client';

/**
 * PlantGrowth Component
 *
 * Interactive plant that grows when clicked, representing self-care activities
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskItem } from '@/types/env-server';

interface PlantGrowthProps {
  plant: TaskItem;
  onWatered?: (plantId: string) => void;
}

export function PlantGrowth({ plant, onWatered }: PlantGrowthProps) {
  const [growthStage, setGrowthStage] = useState(0);
  const [showWater, setShowWater] = useState(false);

  const maxGrowth = plant.metadata?.growthStages || 3;
  const isFullyGrown = growthStage >= maxGrowth;
  const icon = plant.metadata?.icon || '🌱';

  const handleClick = () => {
    if (isFullyGrown) return;

    // Show water animation
    setShowWater(true);
    setTimeout(() => setShowWater(false), 1000);

    // Grow plant
    setTimeout(() => {
      setGrowthStage((prev) => Math.min(prev + 1, maxGrowth));
      if (growthStage + 1 === maxGrowth) {
        onWatered?.(plant.id);
      }
    }, 500);
  };

  const plantScale = 0.5 + (growthStage / maxGrowth) * 0.5; // 0.5 to 1.0
  const opacity = 0.4 + (growthStage / maxGrowth) * 0.6; // 0.4 to 1.0

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Plant container */}
      <motion.button
        onClick={handleClick}
        disabled={isFullyGrown}
        className={`
          relative flex flex-col items-center justify-center
          w-32 h-32 rounded-2xl
          bg-gradient-to-b from-green-100 to-green-200
          border-2 border-green-300
          shadow-lg
          transition-all duration-300
          ${
            isFullyGrown
              ? 'cursor-default'
              : 'cursor-pointer hover:shadow-xl hover:scale-105'
          }
        `}
        whileHover={!isFullyGrown ? { scale: 1.05 } : {}}
        whileTap={!isFullyGrown ? { scale: 0.95 } : {}}
      >
        {/* Plant icon */}
        <motion.div
          className="text-6xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: plantScale,
            opacity: opacity,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {icon}
        </motion.div>

        {/* Growth indicator dots */}
        <div className="absolute bottom-2 flex gap-1">
          {Array.from({ length: maxGrowth }).map((_, i) => (
            <div
              key={i}
              className={`
                w-2 h-2 rounded-full
                ${i < growthStage ? 'bg-green-600' : 'bg-green-300'}
              `}
            />
          ))}
        </div>

        {/* Water droplets animation */}
        <AnimatePresence>
          {showWater && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{
                    x: 0,
                    y: -20,
                    opacity: 1,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 40,
                    y: 40,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                  }}
                >
                  💧
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Sparkle effect when fully grown */}
        {isFullyGrown && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{
              boxShadow: [
                '0 0 0px rgba(74, 222, 128, 0)',
                '0 0 20px rgba(74, 222, 128, 0.6)',
                '0 0 0px rgba(74, 222, 128, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </motion.button>

      {/* Label */}
      <p className="text-sm font-medium text-gray-700 text-center max-w-[140px] leading-tight">
        {plant.content}
      </p>

      {/* Status */}
      {isFullyGrown ? (
        <span className="text-xs font-semibold text-green-600">✓ Grown!</span>
      ) : (
        <span className="text-xs text-gray-500">Click to water</span>
      )}
    </div>
  );
}
