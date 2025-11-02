'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface PatternItem {
  id: string;
  value: string;
  emoji: string;
  color: string;
}

interface Pattern {
  sequence: PatternItem[];
  answer: PatternItem;
  rule: string;
}

const SHAPE_ITEMS: PatternItem[] = [
  { id: 'circle', value: 'circle', emoji: '🔵', color: 'bg-blue-500' },
  { id: 'square', value: 'square', emoji: '🟦', color: 'bg-blue-600' },
  { id: 'triangle', value: 'triangle', emoji: '🔺', color: 'bg-red-500' },
  { id: 'star', value: 'star', emoji: '⭐', color: 'bg-yellow-400' },
  { id: 'heart', value: 'heart', emoji: '❤️', color: 'bg-pink-500' },
  { id: 'diamond', value: 'diamond', emoji: '💎', color: 'bg-purple-500' },
];

function SortableItem({ item }: { item: PatternItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-20 h-20 ${item.color} rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl`}
      >
        {item.emoji}
      </motion.div>
    </div>
  );
}

export default function PatternBuilder() {
  const [mode, setMode] = useState<'recognize' | 'create' | 'solve'>('recognize');
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const [userAnswer, setUserAnswer] = useState<PatternItem | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [draggedItems, setDraggedItems] = useState<PatternItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate patterns based on mode
  const generatePattern = useCallback((): Pattern => {
    const patternLength = mode === 'recognize' ? 3 : mode === 'create' ? 5 : 7;
    const patterns = [
      // Repeating patterns
      () => {
        const basePattern = [SHAPE_ITEMS[0], SHAPE_ITEMS[1]];
        const sequence = [];
        for (let i = 0; i < patternLength; i++) {
          sequence.push(basePattern[i % basePattern.length]);
        }
        return {
          sequence,
          answer: basePattern[patternLength % basePattern.length],
          rule: 'Repeating pattern: Circle, Square, Circle, Square...',
        };
      },
      // Growing pattern
      () => {
        const sequence = SHAPE_ITEMS.slice(0, patternLength);
        return {
          sequence,
          answer: SHAPE_ITEMS[patternLength],
          rule: 'Growing pattern: Each shape is different',
        };
      },
      // AB AB AB pattern
      () => {
        const a = SHAPE_ITEMS[0];
        const b = SHAPE_ITEMS[2];
        const sequence = [];
        for (let i = 0; i < patternLength; i++) {
          sequence.push(i % 2 === 0 ? a : b);
        }
        return {
          sequence,
          answer: patternLength % 2 === 0 ? a : b,
          rule: 'AB pattern repeating',
        };
      },
    ];

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    return selectedPattern();
  }, [mode]);

  const startNewRound = useCallback(() => {
    const pattern = generatePattern();
    setCurrentPattern(pattern);
    setUserAnswer(null);
    setIsCorrect(null);
    setDraggedItems([...SHAPE_ITEMS]);
  }, [generatePattern]);

  // Initialize
  useState(() => {
    startNewRound();
  });

  const checkAnswer = () => {
    if (!currentPattern || !userAnswer) return;

    const correct = userAnswer.id === currentPattern.answer.id;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 10);
      setTimeout(() => {
        setRound(round + 1);
        startNewRound();
      }, 2000);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDraggedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const selectAnswer = (item: PatternItem) => {
    setUserAnswer(item);
    setIsCorrect(null);
  };

  if (!currentPattern) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black mb-2">🎨 Pattern Builder</h1>
              <p className="text-gray-600">Find the missing piece in the pattern!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Round {round}</div>
              <div className="text-3xl font-black">{score} pts</div>
            </div>
          </div>
        </div>

        {/* Pattern Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6"
        >
          <h2 className="text-xl font-bold mb-6 text-center">Complete the Pattern:</h2>

          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            {currentPattern.sequence.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-20 h-20 ${item.color} rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl`}
              >
                {item.emoji}
              </motion.div>
            ))}

            {/* Question mark for missing piece */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: currentPattern.sequence.length * 0.1 }}
              className="w-20 h-20 bg-gray-200 rounded-2xl border-2 border-black border-dashed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl"
            >
              {userAnswer ? userAnswer.emoji : '❓'}
            </motion.div>
          </div>

          {/* Hint */}
          {isCorrect === false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 text-center"
            >
              <p className="text-sm text-gray-700">
                <strong>Hint:</strong> {currentPattern.rule}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Answer Choices */}
        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <h3 className="text-lg font-bold mb-4 text-center">Choose the next shape:</h3>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {SHAPE_ITEMS.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => selectAnswer(item)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-20 h-20 ${item.color} rounded-2xl border-2 ${
                  userAnswer?.id === item.id ? 'border-yellow-400 border-4' : 'border-black'
                } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl transition-all cursor-pointer`}
              >
                {item.emoji}
              </motion.button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer || isCorrect !== null}
              size="lg"
              className="min-w-[200px]"
            >
              {isCorrect === null ? 'Check Answer' : isCorrect ? '✓ Correct!' : '✗ Try Again'}
            </Button>
          </div>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-6 rounded-2xl border-2 ${
                isCorrect
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center`}
            >
              <div className="text-6xl mb-2">{isCorrect ? '🎉' : '🤔'}</div>
              <h3 className="text-2xl font-bold mb-2">
                {isCorrect ? 'Amazing!' : 'Not quite!'}
              </h3>
              <p className="text-gray-700">
                {isCorrect
                  ? 'You found the pattern! Moving to the next round...'
                  : 'Look at the pattern again. What comes next?'}
              </p>
              {!isCorrect && (
                <Button
                  onClick={() => setIsCorrect(null)}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
