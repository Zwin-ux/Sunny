'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronDown, ChevronUp, Lightbulb, Cpu, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReasoningStep {
  step: number;
  action: string;
  reasoning: string;
  data?: Record<string, any>;
}

interface ExplainHowModeProps {
  enabled: boolean;
  onToggle: () => void;
  reasoningSteps: ReasoningStep[];
  currentQuestion?: {
    text: string;
    difficulty: string;
    topic: string;
  };
}

export function ExplainHowMode({
  enabled,
  onToggle,
  reasoningSteps,
  currentQuestion,
}: ExplainHowModeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative"
      >
        <Button
          onClick={onToggle}
          className={`rounded-full w-14 h-14 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black ${
            enabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {enabled ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
        </Button>

        {/* Tooltip */}
        {!enabled && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap">
            Show Sunny's Thinking
          </div>
        )}
      </motion.div>

      {/* Reasoning Panel */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-t-xl border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-gray-900">Sunny's Thinking</h3>
                </div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                See how I make decisions in real-time
              </p>
            </div>

            {/* Content */}
            <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-0' : 'max-h-96'}`}>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Current Question Info */}
                {currentQuestion && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-bold text-blue-900">Current Question</p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{currentQuestion.text}</p>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full font-semibold">
                        {currentQuestion.topic}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full font-semibold">
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reasoning Steps */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs font-bold text-gray-700">Decision Process</p>
                  </div>

                  {reasoningSteps.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No reasoning steps yet. Answer a question to see how I think!
                    </div>
                  ) : (
                    reasoningSteps.map((step) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: step.step * 0.1 }}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">{step.action}</p>
                            <p className="text-xs text-gray-600">{step.reasoning}</p>
                            {step.data && (
                              <div className="mt-2 bg-white rounded p-2 border border-gray-200">
                                <pre className="text-xs text-gray-700 font-mono overflow-x-auto">
                                  {JSON.stringify(step.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Educational Note */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-900">
                    <strong>💡 Why show this?</strong> We believe AI should be transparent! This
                    panel shows you exactly how Sunny makes decisions, so you can understand and
                    trust the learning process.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Example reasoning steps generator for demo purposes
export function generateReasoningSteps(
  userAnswer: string,
  correctAnswer: string,
  difficulty: string,
  topic: string
): ReasoningStep[] {
  const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  const steps: ReasoningStep[] = [
    {
      step: 1,
      action: 'Received Answer',
      reasoning: `User submitted answer: "${userAnswer}"`,
      data: { userAnswer, correctAnswer },
    },
    {
      step: 2,
      action: 'Checking Correctness',
      reasoning: isCorrect
        ? 'Answer matches the correct answer!'
        : 'Answer does not match. Analyzing the mistake...',
      data: { isCorrect, match: userAnswer === correctAnswer },
    },
  ];

  if (isCorrect) {
    steps.push({
      step: 3,
      action: 'Adjusting Difficulty',
      reasoning: `User got it right! Increasing difficulty from "${difficulty}" to help them grow.`,
      data: { currentDifficulty: difficulty, nextDifficulty: getNextDifficulty(difficulty) },
    });
    steps.push({
      step: 4,
      action: 'Selecting Next Question',
      reasoning: `Looking for a harder ${topic} question to challenge the user appropriately.`,
      data: { topic, targetDifficulty: getNextDifficulty(difficulty) },
    });
  } else {
    steps.push({
      step: 3,
      action: 'Analyzing Mistake',
      reasoning: 'Identifying the type of error to provide targeted help.',
      data: { errorType: 'calculation', needsReview: true },
    });
    steps.push({
      step: 4,
      action: 'Adjusting Approach',
      reasoning: `Keeping difficulty at "${difficulty}" and will provide more explanation.`,
      data: { currentDifficulty: difficulty, provideHint: true },
    });
  }

  steps.push({
    step: 5,
    action: 'Updating Mastery',
    reasoning: `Recording this attempt to track ${topic} mastery over time.`,
    data: { topic, correct: isCorrect, masteryChange: isCorrect ? '+5' : '-2' },
  });

  return steps;
}

function getNextDifficulty(current: string): string {
  const levels = ['beginner', 'easy', 'medium', 'hard'];
  const currentIndex = levels.indexOf(current.toLowerCase());
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
}
