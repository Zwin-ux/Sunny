'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SunnyVoice } from '@/components/voice/SunnyVoice';
import { getRandomQuestion, determineInitialLevel } from '@/lib/demo-questions';
import { Question, DifficultyLevel } from '@/types/demo';

interface DemoQuickCheckProps {
  onComplete: (level: DifficultyLevel) => void;
}

export function DemoQuickCheck({ onComplete }: DemoQuickCheckProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions] = useState<Question[]>([
    getRandomQuestion('beginner'),
    getRandomQuestion('easy'),
    getRandomQuestion('easy'),
  ]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / 3) * 100;

  const handleAnswer = (index: number) => {
    if (showFeedback) return;

    setSelectedAnswer(index);
    const isCorrect = index === question.correctIndex;
    setShowFeedback(true);

    // Wait for feedback, then move to next question
    setTimeout(() => {
      const newAnswers = [...answers, isCorrect];
      setAnswers(newAnswers);

      if (currentQuestion < 2) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Complete - determine level
        const correctCount = newAnswers.filter(a => a).length;
        const level = determineInitialLevel(correctCount, 3);
        onComplete(level);
      }
    }, 1500);
  };

  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">☀️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quick Check
          </h2>
          <p className="text-gray-600">
            Question {currentQuestion + 1} of 3
          </p>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-8" />

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">
              {question.text}
            </h3>
            <SunnyVoice text={question.voiceText || question.text} />
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {question.answers.map((answer, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback}
                variant={
                  showFeedback
                    ? index === question.correctIndex
                      ? 'default'
                      : index === selectedAnswer
                      ? 'destructive'
                      : 'outline'
                    : 'outline'
                }
                className={`h-20 text-xl font-semibold ${
                  showFeedback && index === question.correctIndex
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : showFeedback && index === selectedAnswer
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'hover:bg-yellow-100'
                }`}
              >
                {answer}
              </Button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`text-center p-4 rounded-lg ${
              isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}
          >
            <p className="text-lg font-semibold">
              {isCorrect ? '✅ Great job!' : '💪 Let\'s try another!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
