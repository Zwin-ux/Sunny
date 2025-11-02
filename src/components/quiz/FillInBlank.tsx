'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FillInBlankContent, AnswerEvaluation } from '@/types/quiz';
import { motion, AnimatePresence } from 'framer-motion';

interface FillInBlankProps {
  content: FillInBlankContent;
  onAnswer: (answer: string[], evaluation: AnswerEvaluation) => void;
  showFeedback?: boolean;
}

export function FillInBlank({ content, onAnswer, showFeedback = false }: FillInBlankProps) {
  const [answers, setAnswers] = useState<string[]>(
    content.blanks.map(() => '')
  );
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);

  // Split text by blanks (represented by ___)
  const parts = content.text.split('___');

  const handleSubmit = () => {
    const result = evaluateAnswers(answers, content);
    setEvaluation(result);
    setSubmitted(true);
    onAnswer(answers, result);
  };

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && index < content.blanks.length - 1) {
      // Move to next input
      const nextInput = document.getElementById(`blank-${index + 1}`);
      nextInput?.focus();
    } else if (e.key === 'Enter' && index === content.blanks.length - 1) {
      // Submit on last input
      handleSubmit();
    }
  };

  const allFilled = answers.every(answer => answer.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Question Text with Blanks */}
      <div className="text-lg leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            <span className="text-gray-900">{part}</span>
            {i < content.blanks.length && (
              <span className="inline-block mx-1">
                <input
                  id={`blank-${i}`}
                  type="text"
                  value={answers[i]}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  disabled={submitted}
                  className={`
                    border-b-2 px-2 py-1 text-center min-w-[120px] max-w-[200px]
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all
                    ${submitted 
                      ? isAnswerCorrect(answers[i], content.blanks[i])
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-300 hover:border-blue-400'
                    }
                  `}
                  placeholder="..."
                  autoComplete="off"
                />
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!allFilled}
            size="lg"
            className="min-w-[200px]"
          >
            Check Answer
          </Button>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {submitted && evaluation && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              p-6 rounded-lg border-2
              ${evaluation.correct 
                ? 'bg-green-50 border-green-300' 
                : 'bg-orange-50 border-orange-300'
              }
            `}
          >
            <div className="space-y-4">
              {/* Result */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {evaluation.correct ? '✅' : '💪'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {evaluation.correct ? 'Perfect!' : 'Not quite!'}
                  </h3>
                  <p className="text-sm text-gray-700">{evaluation.feedback}</p>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-white p-4 rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Explanation:</p>
                <p className="text-gray-800">{evaluation.explanation}</p>
              </div>

              {/* Show correct answers if wrong */}
              {!evaluation.correct && (
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Correct answers:</p>
                  <div className="space-y-1">
                    {content.blanks.map((blank, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">Blank {i + 1}:</span>{' '}
                        <span className="text-green-600">
                          {blank.correctAnswers.join(' or ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Encouragement */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {evaluation.encouragement}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Evaluate student answers against correct answers
 */
function evaluateAnswers(
  studentAnswers: string[],
  content: FillInBlankContent
): AnswerEvaluation {
  const results = studentAnswers.map((answer, i) => 
    isAnswerCorrect(answer, content.blanks[i])
  );
  
  const allCorrect = results.every(r => r);
  const correctCount = results.filter(r => r).length;
  const totalBlanks = content.blanks.length;
  
  // Partial credit
  const partialCredit = correctCount / totalBlanks;
  
  // Generate feedback
  let feedback = '';
  let explanation = '';
  let encouragement = '';
  
  if (allCorrect) {
    feedback = 'All blanks filled correctly!';
    explanation = 'You demonstrated a solid understanding of this concept.';
    encouragement = 'Excellent work! Ready for the next challenge? 🌟';
  } else if (partialCredit >= 0.5) {
    feedback = `You got ${correctCount} out of ${totalBlanks} correct!`;
    explanation = 'You\'re on the right track! Review the correct answers above.';
    encouragement = 'Good effort! Let\'s keep practicing! 💪';
  } else {
    feedback = 'Let\'s review this together.';
    explanation = 'This concept needs more practice. Check the correct answers and try to understand why.';
    encouragement = 'Don\'t worry! Learning takes time. You\'re making progress! 🌱';
  }
  
  return {
    correct: allCorrect,
    partialCredit: allCorrect ? 1 : partialCredit,
    feedback,
    explanation,
    nextSteps: allCorrect 
      ? ['Move to next question', 'Try a harder challenge']
      : ['Review the concept', 'Try a similar question', 'Ask for help'],
    encouragement
  };
}

/**
 * Check if student answer matches any correct answer
 */
function isAnswerCorrect(
  studentAnswer: string,
  blank: FillInBlankContent['blanks'][0]
): boolean {
  const normalized = blank.caseSensitive 
    ? studentAnswer.trim()
    : studentAnswer.trim().toLowerCase();
  
  return blank.correctAnswers.some(correct => {
    const normalizedCorrect = blank.caseSensitive
      ? correct.trim()
      : correct.trim().toLowerCase();
    
    return normalized === normalizedCorrect;
  });
}
