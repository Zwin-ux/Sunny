'use client';

/**
 * SortingTarget Component
 *
 * Drop zone for sorting activities in environmental stages
 */

import { motion } from 'framer-motion';
import type { TaskTarget } from '@/types/env-server';

interface SortingTargetProps {
  target: TaskTarget;
  itemCount: number;
  isHighlighted?: boolean;
  onDrop?: (targetId: string) => void;
}

export function SortingTarget({
  target,
  itemCount,
  isHighlighted = false,
}: SortingTargetProps) {
  const iconSize = 'text-6xl';
  const color = target.visual?.color || '#4CAF50';

  return (
    <motion.div
      data-drop-target={target.id}
      className={`
        relative flex flex-col items-center justify-center
        p-8 rounded-3xl border-4 border-dashed
        min-w-[220px] min-h-[220px]
        transition-all duration-300
        ${isHighlighted ? 'scale-105 shadow-2xl' : 'shadow-lg'}
      `}
      style={{
        borderColor: color,
        backgroundColor: `${color}15`, // 15% opacity
      }}
      animate={
        isHighlighted
          ? {
              scale: [1, 1.05, 1],
              transition: { duration: 0.5, repeat: Infinity },
            }
          : {}
      }
    >
      {/* Icon */}
      <div className={iconSize}>{target.visual?.icon}</div>

      {/* Label */}
      <h3
        className="mt-4 text-xl font-bold text-center"
        style={{ color }}
      >
        {target.label}
      </h3>

      {/* Item count badge */}
      {itemCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {itemCount}
        </motion.div>
      )}

      {/* Pulse effect when highlighted */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-3xl border-4"
          style={{ borderColor: color }}
          animate={{
            opacity: [0, 0.5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}
