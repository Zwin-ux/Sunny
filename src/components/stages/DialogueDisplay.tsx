'use client';

/**
 * DialogueDisplay Component
 *
 * Displays dialogue from Sunny or NPCs with typewriter effect
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { DialogueContent } from '@/types/env-server';

interface DialogueDisplayProps {
  dialogue: DialogueContent[];
  onComplete?: () => void;
  autoAdvance?: boolean;
}

export function DialogueDisplay({
  dialogue,
  onComplete,
  autoAdvance = true,
}: DialogueDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const current = dialogue[currentIndex];
  const isLastDialogue = currentIndex === dialogue.length - 1;

  // Typewriter effect
  useEffect(() => {
    if (!current) return;

    setIsTyping(true);
    setDisplayedText('');

    const text = current.text;
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);

        // Auto-advance after pause
        if (autoAdvance) {
          const pauseTime = current.pauseAfter || 2000;
          setTimeout(() => {
            if (isLastDialogue) {
              onComplete?.();
            } else {
              setCurrentIndex((prev) => prev + 1);
            }
          }, pauseTime);
        }
      }
    }, 30); // Typing speed

    return () => clearInterval(interval);
  }, [currentIndex, current, autoAdvance, isLastDialogue, onComplete]);

  if (!current) return null;

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'sunny':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400';
      case 'npc':
        return 'bg-gradient-to-r from-purple-400 to-pink-400';
      default:
        return 'bg-gradient-to-r from-blue-400 to-cyan-400';
    }
  };

  const getEmotionEmoji = (emotion?: string) => {
    switch (emotion) {
      case 'happy':
        return '😊';
      case 'encouraging':
        return '🌟';
      case 'thoughtful':
        return '🤔';
      case 'excited':
        return '🎉';
      default:
        return '💭';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="relative">
        {/* Speaker indicator */}
        <div className="flex items-center gap-3 mb-3">
          {current.speaker === 'sunny' && (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-2xl shadow-lg">
              ☀️
            </div>
          )}
          {current.speakerName && (
            <span className="text-lg font-bold text-gray-800">
              {current.speakerName}
            </span>
          )}
        </div>

        {/* Dialogue box */}
        <div
          className={`
            relative p-6 rounded-3xl
            ${getSpeakerColor(current.speaker)}
            shadow-xl backdrop-blur-sm
          `}
        >
          <div className="bg-white/95 rounded-2xl p-5">
            <p className="text-lg leading-relaxed text-gray-800">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block ml-1"
                >
                  ▌
                </motion.span>
              )}
            </p>
          </div>

          {/* Emotion emoji */}
          {current.emotion && (
            <div className="absolute -right-3 -top-3 text-4xl">
              {getEmotionEmoji(current.emotion)}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {dialogue.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {dialogue.map((_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${i === currentIndex ? 'bg-yellow-500 w-6' : 'bg-gray-300'}
                `}
              />
            ))}
          </div>
        )}

        {/* Continue button (if not auto-advancing) */}
        {!autoAdvance && !isTyping && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              if (isLastDialogue) {
                onComplete?.();
              } else {
                setCurrentIndex((prev) => prev + 1);
              }
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLastDialogue ? 'Continue' : 'Next'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
