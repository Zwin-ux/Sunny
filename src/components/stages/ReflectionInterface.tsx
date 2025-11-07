'use client';

/**
 * ReflectionInterface Component
 *
 * Interactive reflection dialogue with AI follow-ups
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReflectionQuestion } from '@/types/env-server';
import { generateSunnyResponse } from '@/lib/sunny-ai';

interface ReflectionInterfaceProps {
  questions: ReflectionQuestion[];
  onComplete?: (responses: Array<{ question: string; response: string; aiFollowUp?: string }>) => void;
}

export function ReflectionInterface({
  questions,
  onComplete,
}: ReflectionInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [responses, setResponses] = useState<
    Array<{ question: string; response: string; aiFollowUp?: string }>
  >([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setIsGeneratingFollowUp(true);

    // Generate AI follow-up (use demo mode compatible)
    let followUp = '';
    try {
      // Use a simple follow-up from the predefined list
      if (currentQuestion.followUps && currentQuestion.followUps.length > 0) {
        followUp =
          currentQuestion.followUps[
            Math.floor(Math.random() * currentQuestion.followUps.length)
          ] || '';
      } else {
        // Fallback generic follow-up
        followUp = "That's wonderful! Thank you for sharing that with me.";
      }
      setAiFollowUp(followUp);
    } catch (error) {
      console.error('Error generating follow-up:', error);
      followUp = 'Thank you for sharing! That helps me understand.';
      setAiFollowUp(followUp);
    }

    setIsGeneratingFollowUp(false);

    // Store response
    const newResponse = {
      question: currentQuestion.question,
      response: response.trim(),
      aiFollowUp: followUp,
    };
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Wait a moment to show the follow-up
    setTimeout(() => {
      if (isLastQuestion) {
        onComplete?.(updatedResponses);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setResponse('');
        setAiFollowUp('');
      }
    }, 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Sunny avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex justify-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-5xl shadow-2xl">
          ☀️
        </div>
      </motion.div>

      {/* Question */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-3xl shadow-lg"
      >
        <p className="text-xl font-medium text-gray-800 leading-relaxed">
          {currentQuestion.question}
        </p>
      </motion.div>

      {/* Response input */}
      {!aiFollowUp && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your thoughts here..."
            className="w-full h-32 p-4 rounded-2xl border-2 border-gray-300 focus:border-yellow-400 focus:outline-none resize-none text-lg"
            disabled={isGeneratingFollowUp}
          />

          <button
            onClick={handleSubmit}
            disabled={!response.trim() || isGeneratingFollowUp}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingFollowUp ? 'Thinking...' : 'Share My Thoughts'}
          </button>
        </motion.div>
      )}

      {/* AI follow-up */}
      {aiFollowUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-3xl shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">🌟</div>
            <p className="text-lg text-gray-800 leading-relaxed flex-1">
              {aiFollowUp}
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress */}
      <div className="flex justify-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${
                i < currentQuestionIndex
                  ? 'bg-green-500'
                  : i === currentQuestionIndex
                  ? 'bg-yellow-500 w-8'
                  : 'bg-gray-300'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
