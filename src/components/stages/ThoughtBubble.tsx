'use client';

/**
 * ThoughtBubble Component
 *
 * Draggable thought bubble for the Cloud Garden sorting activity
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TaskItem } from '@/types/env-server';

interface ThoughtBubbleProps {
  item: TaskItem;
  onDragStart?: (item: TaskItem) => void;
  onDragEnd?: (item: TaskItem, targetId: string | null) => void;
  isDragging?: boolean;
  isPlaced?: boolean;
}

export function ThoughtBubble({
  item,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isPlaced = false,
}: ThoughtBubbleProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isWorry = item.type === 'worry';
  const bubbleColor = isWorry ? 'bg-gray-300/80' : 'bg-blue-200/80';
  const borderColor = isWorry ? 'border-gray-400' : 'border-blue-400';

  return (
    <motion.div
      drag={!isPlaced}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => onDragStart?.(item)}
      onDragEnd={(event, info) => {
        // Check if dropped on a target
        const element = document.elementFromPoint(
          info.point.x,
          info.point.y
        );
        const target = element?.closest('[data-drop-target]');
        const targetId = target?.getAttribute('data-drop-target') || null;
        onDragEnd?.(item, targetId);
      }}
      className={`
        relative cursor-grab active:cursor-grabbing
        ${isPlaced ? 'opacity-50 pointer-events-none' : ''}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={
        !isPlaced
          ? {
              y: [0, -10, 0],
              rotate: [-2, 2, -2],
              transition: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {}
      }
    >
      {/* Thought bubble */}
      <div
        className={`
          relative px-6 py-4 rounded-3xl
          ${bubbleColor} backdrop-blur-sm
          border-2 ${borderColor}
          shadow-lg
          min-w-[200px] max-w-[280px]
        `}
      >
        <p className="text-sm font-medium text-gray-800 text-center leading-relaxed">
          {item.content}
        </p>

        {/* Bubble tail */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div className={`w-4 h-4 ${bubbleColor} ${borderColor} border-2 rounded-full`} />
          <div
            className={`w-2 h-2 ${bubbleColor} ${borderColor} border-2 rounded-full absolute top-4 left-2`}
          />
        </div>
      </div>

      {/* Floating animation */}
      {!isPlaced && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}
