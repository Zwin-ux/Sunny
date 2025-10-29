'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Trophy } from 'lucide-react';

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CardProgress {
  id: string;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewed: Date | null;
  confidence: 'dont_know' | 'hard' | 'good' | 'easy';
}

const MATH_CARDS: FlashCard[] = [
  { id: 'm1', front: '7 × 8 = ?', back: '56', category: 'Math', difficulty: 'easy' },
  { id: 'm2', front: '12 × 12 = ?', back: '144', category: 'Math', difficulty: 'medium' },
  { id: 'm3', front: 'What is 25% of 80?', back: '20', category: 'Math', difficulty: 'hard' },
  { id: 'm4', front: '15 + 28 = ?', back: '43', category: 'Math', difficulty: 'easy' },
  { id: 'm5', front: 'What is the area of a rectangle 5 × 3?', back: '15', category: 'Math', difficulty: 'medium' },
];

const SCIENCE_CARDS: FlashCard[] = [
  { id: 's1', front: 'What planet is closest to the Sun?', back: 'Mercury', category: 'Science', difficulty: 'easy' },
  { id: 's2', front: 'What gas do plants absorb from the air?', back: 'Carbon Dioxide (CO2)', category: 'Science', difficulty: 'medium' },
  { id: 's3', front: 'How many bones are in the human body?', back: '206', category: 'Science', difficulty: 'hard' },
  { id: 's4', front: 'What is H2O?', back: 'Water', category: 'Science', difficulty: 'easy' },
  { id: 's5', front: 'What is the speed of light?', back: '299,792,458 m/s', category: 'Science', difficulty: 'hard' },
];

const VOCAB_CARDS: FlashCard[] = [
  { id: 'v1', front: 'What does "benevolent" mean?', back: 'Kind and generous', category: 'Vocabulary', difficulty: 'medium' },
  { id: 'v2', front: 'What is a synonym for "happy"?', back: 'Joyful, cheerful, content', category: 'Vocabulary', difficulty: 'easy' },
  { id: 'v3', front: 'What does "ubiquitous" mean?', back: 'Present everywhere', category: 'Vocabulary', difficulty: 'hard' },
  { id: 'v4', front: 'What is an antonym for "difficult"?', back: 'Easy', category: 'Vocabulary', difficulty: 'easy' },
  { id: 'v5', front: 'What does "eloquent" mean?', back: 'Fluent and persuasive in speaking', category: 'Vocabulary', difficulty: 'medium' },
];

export default function FlipCardQuiz() {
  const [category, setCategory] = useState<'math' | 'science' | 'vocab'>('math');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [showResults, setShowResults] = useState(false);

  const cards = category === 'math' ? MATH_CARDS : category === 'science' ? SCIENCE_CARDS : VOCAB_CARDS;
  const currentCard = cards[currentIndex];

  const handleConfidence = (confidence: 'dont_know' | 'hard' | 'good' | 'easy') => {
    const cardId = currentCard.id;
    const existing = progress[cardId] || {
      id: cardId,
      timesReviewed: 0,
      timesCorrect: 0,
      lastReviewed: null,
      confidence: 'dont_know',
    };

    const isCorrect = confidence !== 'dont_know';

    setProgress({
      ...progress,
      [cardId]: {
        ...existing,
        timesReviewed: existing.timesReviewed + 1,
        timesCorrect: existing.timesCorrect + (isCorrect ? 1 : 0),
        lastReviewed: new Date(),
        confidence,
      },
    });

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResults(false);
  };

  const changeCategory = (newCategory: 'math' | 'science' | 'vocab') => {
    setCategory(newCategory);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResults(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  // Calculate stats
  const completedCards = Object.values(progress).filter(p => p.timesReviewed > 0).length;
  const accuracy = completedCards > 0
    ? Math.round((Object.values(progress).reduce((sum, p) => sum + p.timesCorrect, 0) / completedCards) * 100)
    : 0;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black mb-4">Quiz Complete!</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <div className="text-3xl font-black">{completedCards}/{cards.length}</div>
              <div className="text-sm text-gray-600">Cards Reviewed</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
              <div className="text-3xl font-black">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={resetQuiz} size="lg" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Review Again
            </Button>
            <Button onClick={() => setShowResults(false)} variant="outline" size="lg" className="w-full">
              Continue from where I left off
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black">🃏 Flip Card Quiz</h1>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-2xl font-black">{currentIndex + 1}/{cards.length}</div>
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex gap-2">
            <Button
              onClick={() => changeCategory('math')}
              variant={category === 'math' ? 'default' : 'outline'}
              size="sm"
            >
              🔢 Math
            </Button>
            <Button
              onClick={() => changeCategory('science')}
              variant={category === 'science' ? 'default' : 'outline'}
              size="sm"
            >
              🔬 Science
            </Button>
            <Button
              onClick={() => changeCategory('vocab')}
              variant={category === 'vocab' ? 'default' : 'outline'}
              size="sm"
            >
              📚 Vocabulary
            </Button>
          </div>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000 mb-6">
          <motion.div
            className="relative w-full h-[400px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center text-white">
                <div className="text-sm font-bold mb-4 opacity-80">QUESTION</div>
                <div className="text-3xl font-black text-center mb-8">{currentCard.front}</div>
                <div className="text-sm opacity-80">Click to reveal answer</div>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center text-white">
                <div className="text-sm font-bold mb-4 opacity-80">ANSWER</div>
                <div className="text-4xl font-black text-center">{currentCard.back}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation and Confidence Buttons */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {!isFlipped ? (
            <div className="text-center text-gray-600">
              Click the card to see the answer, then rate your confidence!
            </div>
          ) : (
            <>
              <h3 className="font-bold text-center mb-4">How well did you know this?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Button
                  onClick={() => handleConfidence('dont_know')}
                  variant="outline"
                  className="h-auto py-4 flex-col bg-red-50 hover:bg-red-100 border-red-300"
                >
                  <div className="text-2xl mb-1">😰</div>
                  <div className="text-sm font-bold">Didn't Know</div>
                </Button>
                <Button
                  onClick={() => handleConfidence('hard')}
                  variant="outline"
                  className="h-auto py-4 flex-col bg-orange-50 hover:bg-orange-100 border-orange-300"
                >
                  <div className="text-2xl mb-1">😅</div>
                  <div className="text-sm font-bold">Hard</div>
                </Button>
                <Button
                  onClick={() => handleConfidence('good')}
                  variant="outline"
                  className="h-auto py-4 flex-col bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  <div className="text-2xl mb-1">🙂</div>
                  <div className="text-sm font-bold">Good</div>
                </Button>
                <Button
                  onClick={() => handleConfidence('easy')}
                  variant="outline"
                  className="h-auto py-4 flex-col bg-green-50 hover:bg-green-100 border-green-300"
                >
                  <div className="text-2xl mb-1">😎</div>
                  <div className="text-sm font-bold">Easy</div>
                </Button>
              </div>
            </>
          )}

          {/* Card Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="text-sm text-gray-600">
              {completedCards} reviewed · {accuracy}% accuracy
            </div>

            <Button
              onClick={goToNext}
              disabled={currentIndex === cards.length - 1}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
