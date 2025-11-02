'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, ChevronDown, ChevronUp } from 'lucide-react';

export type Emotion = 'happy' | 'focused' | 'confused' | 'excited' | 'tired' | 'confident';

export const EMOTIONS: { id: Emotion; emoji: string; label: string; color: string }[] = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-100 to-orange-100' },
  { id: 'focused', emoji: '🎯', label: 'Focused', color: 'from-blue-100 to-cyan-100' },
  { id: 'confused', emoji: '🤔', label: 'Confused', color: 'from-purple-100 to-pink-100' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'from-green-100 to-teal-100' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-gray-100 to-slate-100' },
  { id: 'confident', emoji: '💪', label: 'Confident', color: 'from-orange-100 to-red-100' },
];

interface EmotionSelectorProps {
  selectedEmotion: Emotion | null;
  onEmotionChange: (emotion: Emotion) => void;
  collapsed?: boolean;
}

export function EmotionSelector({
  selectedEmotion,
  onEmotionChange,
  collapsed = false,
}: EmotionSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  const selectedEmotionData = selectedEmotion
    ? EMOTIONS.find((e) => e.id === selectedEmotion)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {selectedEmotionData ? (
              <>
                <span className="text-2xl">{selectedEmotionData.emoji}</span>
                <span className="font-bold text-gray-900">
                  Feeling {selectedEmotionData.label}
                </span>
              </>
            ) : (
              <>
                <Smile className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-gray-900">How are you feeling?</span>
              </>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Expandable Emotion Grid */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-3 md:grid-cols-6 gap-2 border-t-2 border-gray-200 pt-4">
                {EMOTIONS.map((emotion) => (
                  <motion.button
                    key={emotion.id}
                    onClick={() => {
                      onEmotionChange(emotion.id);
                      if (collapsed) setIsExpanded(false); // Auto-collapse after selection
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl border-2 border-black transition-all ${
                      selectedEmotion === emotion.id
                        ? `bg-gradient-to-br ${emotion.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{emotion.emoji}</div>
                    <div className="text-xs font-semibold text-gray-700">{emotion.label}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
