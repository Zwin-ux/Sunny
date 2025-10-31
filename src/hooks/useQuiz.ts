/**
 * useQuiz Hook
 * React hook for managing quiz sessions with the intelligent learning system
 */

import { useState, useCallback } from 'react';
import { QuizSession, AdaptiveQuestion, AnswerEvaluation } from '@/types/quiz';

interface UseQuizReturn {
  // State
  session: QuizSession | null;
  currentQuestion: AdaptiveQuestion | null;
  currentQuestionIndex: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  createQuiz: (topic: string, questionCount?: number) => Promise<void>;
  submitAnswer: (answer: any, timeSpent: number, hintsUsed?: number, confidence?: 'low' | 'medium' | 'high') => Promise<any>;
  getHint: (attemptNumber: number, confidence?: 'low' | 'medium' | 'high') => Promise<any>;
  getSummary: () => Promise<any>;
  reset: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQuiz = useCallback(async (topic: string, questionCount: number = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, questionCount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quiz');
      }

      const data = await response.json();
      setSession(data.session);
      setCurrentQuestionIndex(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (
    answer: any,
    timeSpent: number,
    hintsUsed: number = 0,
    confidence?: 'low' | 'medium' | 'high'
  ) => {
    if (!session) {
      setError('No active quiz session');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: currentQuestionIndex,
          answer,
          timeSpent,
          hintsUsed,
          confidence
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const data = await response.json();
      
      // Move to next question if not complete
      if (!data.sessionComplete && data.nextQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error submitting answer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, currentQuestionIndex]);

  const getHint = useCallback(async (
    attemptNumber: number,
    confidence?: 'low' | 'medium' | 'high'
  ) => {
    if (!session) {
      setError('No active quiz session');
      return null;
    }

    try {
      const response = await fetch('/api/quiz/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: currentQuestionIndex,
          attemptNumber,
          confidence
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get hint');
      }

      const data = await response.json();
      return data.hint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting hint:', err);
      return null;
    }
  }, [session, currentQuestionIndex]);

  const getSummary = useCallback(async () => {
    if (!session) {
      setError('No active quiz session');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quiz/summary/${session.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get summary');
      }

      const data = await response.json();
      return data.summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error getting summary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const reset = useCallback(() => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setError(null);
  }, []);

  const currentQuestion = session?.questions[currentQuestionIndex] || null;

  return {
    session,
    currentQuestion,
    currentQuestionIndex,
    loading,
    error,
    createQuiz,
    submitAnswer,
    getHint,
    getSummary,
    reset
  };
}
