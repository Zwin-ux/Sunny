import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types/lesson';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface QuizProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
  onNext?: () => void;
  showFeedback?: boolean;
  selectedAnswer?: string | string[] | null;
  isLastQuestion?: boolean;
}

const Quiz: React.FC<QuizProps> = ({
  question,
  onAnswer,
  onNext,
  showFeedback = false,
  selectedAnswer: externalSelectedAnswer,
  isLastQuestion = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(
    externalSelectedAnswer || null
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isCorrect = selectedAnswer 
    ? Array.isArray(selectedAnswer) 
      ? selectedAnswer.every(ans => (question.correctAnswer as string[]).includes(ans))
      : selectedAnswer === question.correctAnswer
    : false;

  // Update internal state if external selectedAnswer changes
  useEffect(() => {
    if (externalSelectedAnswer !== undefined) {
      setSelectedAnswer(externalSelectedAnswer);
      setHasSubmitted(true);
    }
  }, [externalSelectedAnswer]);

  const handleOptionSelect = (option: string) => {
    if (hasSubmitted) return;

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      setSelectedAnswer(option);
    } else if (question.type === 'short-answer') {
      // For short answer, we'll handle submission separately
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    setHasSubmitted(true);
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    if (onNext) onNext();
  };

  const renderOptions = () => {
    if (question.type === 'multiple-choice' && question.options) {
      return question.options.map((option, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOptionSelect(option)}
          className={`w-full p-4 mb-3 text-left rounded-lg transition-colors ${
            hasSubmitted
              ? option === question.correctAnswer
                ? 'bg-green-100 border-2 border-green-500'
                : selectedAnswer === option
                ? 'bg-red-100 border-2 border-red-500'
                : 'bg-gray-100 border border-gray-200 opacity-70'
              : selectedAnswer === option
              ? 'bg-blue-100 border-2 border-blue-500'
              : 'bg-white border border-gray-200 hover:border-blue-300'
          }`}
          disabled={hasSubmitted}
        >
          <div className="flex items-center">
            {hasSubmitted && (
              <span className="mr-3">
                {option === question.correctAnswer ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : selectedAnswer === option ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : null}
              </span>
            )}
            <span>{option}</span>
          </div>
        </motion.button>
      ));
    } else if (question.type === 'true-false') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['True', 'False'].map((option) => (
            <motion.button
              key={option}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect(option)}
              className={`p-4 rounded-lg transition-colors ${
                hasSubmitted
                  ? option === question.correctAnswer
                    ? 'bg-green-100 border-2 border-green-500'
                    : selectedAnswer === option
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-100 border border-gray-200 opacity-70'
                  : selectedAnswer === option
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-white border border-gray-200 hover:border-blue-300'
              }`}
              disabled={hasSubmitted}
            >
              <div className="flex items-center justify-center">
                {hasSubmitted && (
                  <span className="mr-2">
                    {option === question.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : selectedAnswer === option ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : null}
                  </span>
                )}
                <span className="font-medium">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      );
    } else if (question.type === 'short-answer') {
      return (
        <div className="space-y-4">
          <input
            type="text"
            value={selectedAnswer as string || ''}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your answer here..."
            disabled={hasSubmitted}
          />
          {!hasSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{question.question}</h3>
        
        <div className="space-y-3">
          {renderOptions()}
        </div>

        {hasSubmitted && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                {isCorrect ? 'Correct! ' : 'Not quite. '}
                {question.explanation}
              </p>
              
              {onNext && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isLastQuestion ? 'Finish' : 'Next'} 
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Quiz;
