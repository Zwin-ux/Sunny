'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Hint } from '@/types/quiz';
import { Lightbulb, Eye, EyeOff } from 'lucide-react';

interface ProgressiveHintsProps {
  hints: Hint[];
  onHintUsed?: (hintIndex: number) => void;
  disabled?: boolean;
}

export function ProgressiveHints({ hints, onHintUsed, disabled = false }: ProgressiveHintsProps) {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  const revealNextHint = () => {
    if (revealedHints.length < hints.length) {
      const nextIndex = revealedHints.length;
      setRevealedHints([...revealedHints, nextIndex]);
      onHintUsed?.(nextIndex);
    }
  };

  const toggleShowAll = () => {
    if (!showAll) {
      // Reveal all hints
      setRevealedHints(hints.map((_, i) => i));
      hints.forEach((_, i) => onHintUsed?.(i));
    }
    setShowAll(!showAll);
  };

  const hasMoreHints = revealedHints.length < hints.length;

  return (
    <div className="space-y-4">
      {/* Hint Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-semibold text-gray-700">
            Need help? ({revealedHints.length}/{hints.length} hints used)
          </span>
        </div>
        
        <div className="flex gap-2">
          {hasMoreHints && (
            <Button
              onClick={revealNextHint}
              disabled={disabled}
              variant="outline"
              size="sm"
              className="border-yellow-300 hover:bg-yellow-50"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Show Hint {revealedHints.length + 1}
            </Button>
          )}
          
          {hints.length > 1 && (
            <Button
              onClick={toggleShowAll}
              disabled={disabled}
              variant="ghost"
              size="sm"
            >
              {showAll ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide All
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show All
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Revealed Hints */}
      <AnimatePresence mode="popLayout">
        {revealedHints.map((hintIndex) => {
          const hint = hints[hintIndex];
          return (
            <motion.div
              key={hint.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`
                p-4 rounded-lg border-2
                ${hint.type === 'nudge' ? 'bg-blue-50 border-blue-300' :
                  hint.type === 'guidance' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-orange-50 border-orange-300'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${hint.type === 'nudge' ? 'bg-blue-200 text-blue-700' :
                    hint.type === 'guidance' ? 'bg-yellow-200 text-yellow-700' :
                    'bg-orange-200 text-orange-700'}
                `}>
                  {hint.level}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {hint.type === 'nudge' ? '💭 Gentle Nudge' :
                       hint.type === 'guidance' ? '🎯 Guidance' :
                       '🔑 Key Concept'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{hint.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Encouragement */}
      {revealedHints.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-gray-600 italic"
        >
          {revealedHints.length === 1 && "Great! Using hints is smart learning! 🌟"}
          {revealedHints.length === 2 && "You're getting closer! Keep thinking! 💡"}
          {revealedHints.length >= 3 && "You've got this! Take your time! 💪"}
        </motion.div>
      )}

      {/* No More Hints Message */}
      {!hasMoreHints && revealedHints.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <p className="text-sm text-gray-700">
            You've seen all the hints! Try your best answer now. 🎯
          </p>
        </motion.div>
      )}
    </div>
  );
}
