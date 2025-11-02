'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameEngine } from '@/lib/games/game-engine';
import { gameGenerator } from '@/lib/games/game-generator';
import {
  GameConfig,
  GameState,
  GameQuestion,
  GameResult,
  GamePerformance,
  GameFeedback,
  DifficultyLevel
} from '@/types/game';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, Heart, Brain } from 'lucide-react';

interface GameContainerProps {
  studentId: string;
  topic: string;
  initialDifficulty?: DifficultyLevel;
  onComplete?: (performance: GamePerformance) => void;
  onAdapt?: (newDifficulty: DifficultyLevel, reason: string) => void;
}

export function GameContainer({
  studentId,
  topic,
  initialDifficulty = 'easy',
  onComplete,
  onAdapt
}: GameContainerProps) {
  const [session, setSession] = useState(() => 
    gameEngine.startSession(studentId, initialDifficulty)
  );
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<GameFeedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    setIsLoading(true);
    try {
      // Generate game using AI
      const game = await gameGenerator.generateGame({
        studentId,
        topic,
        difficulty: session.currentDifficulty,
        learningObjectives: [`Learn about ${topic}`, 'Practice problem-solving', 'Build confidence']
      });

      setGameConfig(game.config);
      setQuestions(game.questions);
      
      // Initialize game state
      const state = gameEngine.initializeGame(session.sessionId, game.config);
      setGameState(state);
      
      // Set first question
      setCurrentQuestion(game.questions[0]);
      setQuestionStartTime(Date.now());
      
    } catch (error) {
      console.error('Error initializing game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (feedback) return; // Already answered
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion || !gameState || !gameConfig) return;

    const timeSpent = (Date.now() - questionStartTime) / 1000; // seconds
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Record result
    const result: GameResult = {
      questionId: currentQuestion.id,
      studentAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent,
      hintsUsed: showHint ? hintIndex + 1 : 0,
      attempts: attempts + 1
    };

    gameEngine.recordResult(session.sessionId, gameState.gameId, result);

    // Get updated game state
    const updatedState = session.games.find(g => g.gameId === gameState.gameId);
    if (updatedState) {
      setGameState(updatedState);
    }

    // Generate feedback
    const latestPerformance = session.performance[session.performance.length - 1];
    const gameFeedback = latestPerformance
      ? gameEngine.generateFeedback(result, latestPerformance)
      : {
          type: isCorrect ? 'celebration' : 'correction',
          message: isCorrect ? '🎉 Correct!' : 'Not quite, try again!',
          tone: 'enthusiastic',
          includeExplanation: !isCorrect
        } as GameFeedback;

    setFeedback(gameFeedback);

    // Check if game is complete
    if (updatedState?.isComplete) {
      setTimeout(() => {
        handleGameComplete();
      }, 3000);
    } else {
      // Move to next question after delay
      setTimeout(() => {
        nextQuestion();
      }, 2500);
    }
  };

  const nextQuestion = () => {
    if (!gameState || !questions) return;

    const nextIndex = gameState.currentQuestion;
    if (nextIndex < questions.length) {
      setCurrentQuestion(questions[nextIndex]);
      setSelectedAnswer(null);
      setFeedback(null);
      setShowHint(false);
      setHintIndex(0);
      setAttempts(0);
      setQuestionStartTime(Date.now());
    }
  };

  const handleGameComplete = () => {
    const latestPerformance = session.performance[session.performance.length - 1];
    if (latestPerformance) {
      onComplete?.(latestPerformance);

      // Auto-award XP for game session
      if (typeof window !== 'undefined') {
        // Base XP: 40 for completing the game (CHALLENGE_COMPLETED)
        let totalXP = 40;

        // Bonus XP: 10 per correct answer
        totalXP += latestPerformance.questionsCorrect * 10;

        // Time bonus: 1 XP per minute (capped at 60 per session)
        const minutesPlayed = Math.min(60, Math.floor(latestPerformance.duration / 60));
        totalXP += minutesPlayed;

        window.dispatchEvent(new CustomEvent('sunny:xp', {
          detail: {
            amount: totalXP,
            reason: `Completed ${topic} game! ${latestPerformance.questionsCorrect}/${latestPerformance.questionsAttempted} correct`
          }
        }));
      }

      // Check if difficulty was adjusted
      const lastAdjustment = session.difficultyAdjustments[session.difficultyAdjustments.length - 1];
      if (lastAdjustment) {
        onAdapt?.(lastAdjustment.to, lastAdjustment.reason);
      }
    }
  };

  const handleShowHint = () => {
    if (!currentQuestion || !gameConfig) return;
    if (hintIndex < currentQuestion.hints.length && hintIndex < gameConfig.hintsAvailable) {
      setShowHint(true);
      setHintIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Brain className="w-full h-full text-purple-500" />
          </motion.div>
          <p className="text-lg font-medium text-gray-700">
            Creating your personalized game...
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !gameState || !gameConfig) {
    return <div>Error loading game</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-700">
              Question {gameState.currentQuestion + 1} of {gameState.totalQuestions}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-700">
                {gameState.correctAnswers}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-700">
                Streak: {gameState.currentStreak}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(gameState.currentQuestion / gameState.totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options?.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!feedback}
                whileHover={{ scale: feedback ? 1 : 1.02 }}
                whileTap={{ scale: feedback ? 1 : 0.98 }}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                  selectedAnswer === option
                    ? feedback
                      ? option === currentQuestion.correctAnswer
                        ? 'bg-green-100 border-2 border-green-500 text-green-800'
                        : 'bg-red-100 border-2 border-red-500 text-red-800'
                      : 'bg-purple-100 border-2 border-purple-500 text-purple-800'
                    : 'bg-gray-50 border-2 border-gray-200 hover:border-purple-300 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </span>
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl mb-4 ${
                  feedback.type === 'celebration' || feedback.type === 'encouragement'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <p className="font-medium text-gray-800 mb-2">{feedback.message}</p>
                {feedback.includeExplanation && (
                  <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          <AnimatePresence>
            {showHint && hintIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl mb-4 bg-yellow-50 border border-yellow-200"
              >
                <p className="text-sm font-medium text-yellow-800">
                  💡 Hint: {currentQuestion.hints[hintIndex - 1]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!feedback && (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="flex-1"
                  size="lg"
                >
                  Submit Answer
                </Button>
                {hintIndex < currentQuestion.hints.length && 
                 hintIndex < gameConfig.hintsAvailable && (
                  <Button
                    onClick={handleShowHint}
                    variant="outline"
                    size="lg"
                  >
                    💡 Hint ({gameConfig.hintsAvailable - hintIndex} left)
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Encouragement Messages */}
      {gameState.currentStreak >= 3 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-4"
        >
          <p className="text-lg font-bold text-purple-600">
            🔥 {gameState.currentStreak} in a row! You're on fire!
          </p>
        </motion.div>
      )}
    </div>
  );
}
