'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SunnyVoice } from '@/components/voice/SunnyVoice';
import { LearningFeedback } from '@/components/demo/LearningFeedback';
import { EmotionMeter } from '@/components/demo/EmotionMeter';
import { BrainModeVisualization } from '@/components/demo/BrainModeVisualization';
import { ProgressiveHints } from '@/components/quiz/ProgressiveHints';
import { getRandomQuestion, getNextDifficulty } from '@/lib/demo-questions';
import { 
  trackTopicPreferences, 
  detectEmotionalState, 
  calculateFocusLevel,
  generateAdaptiveMessage 
} from '@/lib/demo-insights';
import { Question, DifficultyLevel, Answer } from '@/types/demo';
import { useQuiz } from '@/hooks/useQuiz';
import { Target, Lightbulb, Sparkles } from 'lucide-react';

interface DemoMissionProps {
  initialLevel: DifficultyLevel;
  onComplete: (answers: Answer[]) => void;
}

export function DemoMission({ initialLevel, onComplete }: DemoMissionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialLevel);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [streak, setStreak] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [sunnyMessage, setSunnyMessage] = useState('Let\'s do this! 🎯');
  const [startTime, setStartTime] = useState(Date.now());
  const [showBrainMode, setShowBrainMode] = useState(true);

  const totalQuestions = 7;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const score = answers.filter(a => a.correct).length;

  // Initialize first question
  useEffect(() => {
    setQuestions([getRandomQuestion(initialLevel)]);
  }, [initialLevel]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (index: number) => {
    if (showFeedback || !currentQuestion) return;

    setSelectedAnswer(index);
    const isCorrect = index === currentQuestion.correctIndex;
    const timeSpent = Date.now() - startTime;

    // Record answer
    const answer: Answer = {
      questionId: currentQuestion.id,
      selectedIndex: index,
      correct: isCorrect,
      timeSpent,
      difficulty: currentQuestion.difficulty,
      topic: currentQuestion.topic,
    };

    setShowFeedback(true);

    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setConsecutiveWrong(0);

      // Level up after 2 correct in a row
      if (newStreak >= 2) {
        const newDifficulty = getNextDifficulty(difficulty, true);
        if (newDifficulty !== difficulty) {
          setDifficulty(newDifficulty);
          setSunnyMessage('You\'re on fire! Let\'s level up! 🔥');
        } else {
          setSunnyMessage('Awesome! You\'re really getting this! 🎉');
        }
        setStreak(0);
      } else {
        setSunnyMessage('Great job! Keep going! ⭐');
      }
    } else {
      const newConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(newConsecutiveWrong);
      setStreak(0);

      // Level down after 2 wrong in a row
      if (newConsecutiveWrong >= 2) {
        const newDifficulty = getNextDifficulty(difficulty, false);
        if (newDifficulty !== difficulty) {
          setDifficulty(newDifficulty);
          setSunnyMessage('Let\'s try something different! 💪');
        } else {
          setSunnyMessage('That\'s okay! Learning takes practice! 😊');
        }
        setConsecutiveWrong(0);
      } else {
        setSunnyMessage('No worries! Let\'s keep trying! 🌟');
      }
    }

    // Wait for feedback, then move to next
    setTimeout(() => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (currentQuestionIndex < totalQuestions - 1) {
        // Get next question at current difficulty
        const usedIds = questions.map(q => q.id);
        const nextQuestion = getRandomQuestion(difficulty, usedIds);
        setQuestions([...questions, nextQuestion]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setStartTime(Date.now());
      } else {
        // Complete mission
        onComplete(newAnswers);
      }
    }, 1500);
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
  
  // Calculate learning metrics
  const topicPreferences = trackTopicPreferences(answers);
  const emotionalState = detectEmotionalState(answers);
  const focusLevel = calculateFocusLevel(answers);
  const adaptiveMessage = generateAdaptiveMessage(answers, topicPreferences);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">☀️</div>
          <p className="text-sm text-gray-500 mb-2">
            Sunny is learning about you...
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>•</span>
            <span>Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)} ✅</span>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-6" />
        
        {/* Brain Mode Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowBrainMode(!showBrainMode)}
            className="text-sm px-4 py-2 rounded-lg border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors font-semibold text-purple-700"
          >
            {showBrainMode ? '🧠 Hide' : '🧠 Show'} Brain Mode
          </button>
        </div>
        
        {/* Brain Mode Visualization - Show after 1 question */}
        {answers.length >= 1 && showBrainMode && (
          <div className="mb-6">
            <BrainModeVisualization
              answers={answers}
              currentDifficulty={difficulty}
              streak={streak}
              consecutiveWrong={consecutiveWrong}
              showThinking={true}
            />
          </div>
        )}
        
        {/* Intelligent Quiz System Callouts - Show after 1 question */}
        {answers.length >= 1 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" />
                <div className="text-sm font-semibold">Adaptive</div>
              </div>
              <div className="text-xs opacity-90">
                Difficulty: {difficulty}
              </div>
              <div className="text-xs opacity-75 mt-1">
                {consecutiveWrong >= 1 ? 'Adjusting down...' : streak >= 1 ? 'Leveling up!' : 'Monitoring...'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5" />
                <div className="text-sm font-semibold">Smart Hints</div>
              </div>
              <div className="text-xs opacity-90">
                Progressive support
              </div>
              <div className="text-xs opacity-75 mt-1">
                {currentQuestion?.hint ? 'Available below' : 'Ready when needed'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <div className="text-sm font-semibold">AI Analysis</div>
              </div>
              <div className="text-xs opacity-90">
                Real-time tracking
              </div>
              <div className="text-xs opacity-75 mt-1">
                {answers.length} questions analyzed
              </div>
            </div>
          </div>
        )}
        
        {/* Emotion Meter - Show after 1 question */}
        {answers.length >= 1 && (
          <div className="mb-6">
            <EmotionMeter
              emotion={emotionalState}
              autoDetected={true}
              showMessage={true}
            />
          </div>
        )}
        
        {/* Learning Feedback - Show after 2 questions */}
        {answers.length >= 2 && (
          <div className="mb-6">
            <LearningFeedback
              topicPreferences={topicPreferences}
              emotionalState={emotionalState}
              focusLevel={focusLevel}
              adaptiveMessage={adaptiveMessage}
            />
          </div>
        )}

        {/* Sunny's Message */}
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 mb-1">
                Sunny says:
              </p>
              <p className="text-gray-800">{sunnyMessage}</p>
            </div>
            <SunnyVoice text={sunnyMessage} />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">
              {currentQuestion.text}
            </h3>
            <SunnyVoice text={currentQuestion.voiceText || currentQuestion.text} />
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.answers.map((answer, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback}
                variant="outline"
                className={`h-20 text-xl font-semibold transition-all ${
                  showFeedback && index === currentQuestion.correctIndex
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                    : showFeedback && index === selectedAnswer
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-600'
                    : 'hover:bg-yellow-100 hover:border-yellow-400'
                }`}
              >
                {answer}
              </Button>
            ))}
          </div>

          {/* Hint (optional) */}
          {currentQuestion.hint && !showFeedback && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                💡 Hint: {currentQuestion.hint}
              </p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`text-center p-4 rounded-lg animate-in fade-in ${
              isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}
          >
            <p className="text-lg font-semibold">
              {isCorrect ? '✅ Correct! Amazing work!' : '💪 Not quite, but you\'re learning!'}
            </p>
          </div>
        )}

        {/* Streak Indicator */}
        {streak > 0 && !showFeedback && (
          <div className="text-center mt-4">
            <span className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full font-semibold">
              🔥 {streak} in a row!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
