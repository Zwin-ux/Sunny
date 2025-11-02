'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Lightbulb } from 'lucide-react';
import { Flashcard, FlashcardResult, FlashcardSet } from '@/types/focus-session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FlashcardPlayerProps {
  flashcardSet: FlashcardSet;
  onComplete: (results: FlashcardResult[]) => void;
  onCardResult?: (result: FlashcardResult) => void;
}

export function FlashcardPlayer({ flashcardSet, onComplete, onCardResult }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [streak, setStreak] = useState(0);

  const currentCard = flashcardSet.cards[currentIndex];
  const progress = ((currentIndex + 1) / flashcardSet.cards.length) * 100;
  const correctCount = results.filter((r) => r.recalled).length;

  useEffect(() => {
    setCardStartTime(Date.now());
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (confidence: 'hard' | 'good' | 'easy', recalled: boolean) => {
    const timeSpent = (Date.now() - cardStartTime) / 1000;

    const result: FlashcardResult = {
      cardId: currentCard.id,
      recalled,
      confidence,
      timeSpent,
      timestamp: Date.now(),
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (recalled) {
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    // Notify parent
    onCardResult?.(result);

    // Move to next or complete
    if (currentIndex < flashcardSet.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      setTimeout(() => onComplete(newResults), 500);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcardSet.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header - Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Card {currentIndex + 1} of {flashcardSet.cards.length}
            </span>
            {streak > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                🔥 {streak} streak!
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-600">{correctCount}</span>
            <X className="h-4 w-4 text-red-600 ml-2" />
            <span className="text-sm font-semibold text-red-600">{results.length - correctCount}</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-96 transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <Card
            className={`absolute w-full h-full backface-hidden border-4 ${
              isFlipped ? 'hidden' : 'block'
            } ${
              currentCard.difficulty === 'hard' || currentCard.difficulty === 'advanced'
                ? 'border-red-300 bg-red-50'
                : currentCard.difficulty === 'medium'
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-green-300 bg-green-50'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              {currentCard.imageUrl && (
                <div className="text-6xl mb-4">{currentCard.imageUrl}</div>
              )}

              <h3 className="text-2xl font-bold mb-4 text-gray-800">{currentCard.front}</h3>

              <div className="flex items-center gap-2 text-sm text-gray-600 mt-auto">
                <RotateCcw className="h-4 w-4" />
                <span>Click to flip</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {currentCard.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Back */}
          <Card
            className={`absolute w-full h-full backface-hidden border-4 border-blue-300 bg-blue-50 ${
              isFlipped ? 'block' : 'hidden'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Lightbulb className="h-5 w-5" />
                <span className="text-sm font-semibold">Answer</span>
              </div>

              <p className="text-xl text-gray-800 leading-relaxed">{currentCard.back}</p>

              <div className="mt-8 pt-4 border-t border-gray-200 w-full">
                <p className="text-sm text-gray-600 mb-4">How well did you know this?</p>

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 max-w-[120px] border-red-300 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('hard', false);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Didn't Know
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 max-w-[120px] border-yellow-300 hover:bg-yellow-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('hard', true);
                    }}
                  >
                    Hard
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 max-w-[120px] border-blue-300 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('good', true);
                    }}
                  >
                    Good
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 max-w-[120px] border-green-300 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResponse('easy', true);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Easy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="text-sm text-gray-600">
          {results.length > 0 && (
            <span>
              {Math.round((correctCount / results.length) * 100)}% correct so far
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === flashcardSet.cards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">💡 Tip:</p>
              <p>
                Try to recall the answer before flipping. Be honest about how well you knew it - this helps you learn better!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
