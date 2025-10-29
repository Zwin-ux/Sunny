'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, Clock, TrendingUp, Zap, Brain, Book, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/ui/TabNavigation';
import { getCurrentUser } from '@/lib/auth';

interface Mission {
  id: string;
  skill: {
    id: string;
    domain: string;
    category: string;
    display_name: string;
    mastery: number;
    confidence: string;
  };
  sunny_goal: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_format: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    expected_reasoning: string;
    hints?: string[];
  }>;
  estimated_duration_minutes: number;
}

export default function MissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const startMission = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/mission/next?userId=${user.id || user.name}`);

      if (!response.ok) {
        console.error('Failed to fetch mission');
        return;
      }

      const data = await response.json();
      setCurrentMission(data.mission);
      setCurrentQuestionIndex(0);
      setFeedback(null);
    } catch (error) {
      console.error('Error starting mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentMission || !studentAnswer.trim()) return;

    setIsGrading(true);
    const currentQuestion = currentMission.questions[currentQuestionIndex];

    try {
      const response = await fetch('/api/mission/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentMission.id,
          userId: user.id || user.name,
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          studentAnswer,
          timeToAnswerSeconds: 30, // TODO: Track actual time
        }),
      });

      const gradeData = await response.json();
      setFeedback(gradeData);
      setStudentAnswer('');
    } catch (error) {
      console.error('Error grading answer:', error);
    } finally {
      setIsGrading(false);
    }
  };

  const nextQuestion = () => {
    if (!currentMission) return;

    if (currentQuestionIndex < currentMission.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFeedback(null);
      setStudentAnswer('');
    } else {
      // Mission complete!
      setCurrentMission(null);
      setCurrentQuestionIndex(0);
      setFeedback(null);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">☀️</div>
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Mission Active View
  if (currentMission) {
    const currentQuestion = currentMission.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentMission.questions.length) * 100;

    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Mission Header */}
          <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-blue-600 uppercase">
                    {currentMission.difficulty_level} Mission
                  </span>
                </div>
                <h1 className="text-2xl font-black">{currentMission.sunny_goal}</h1>
                <p className="text-gray-600 mt-1">{currentMission.skill.display_name}</p>
              </div>
              <Button
                onClick={() => {
                  setCurrentMission(null);
                  setCurrentQuestionIndex(0);
                }}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Question {currentQuestionIndex + 1} of {currentMission.questions.length}
            </p>
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6"
          >
            <h2 className="text-xl font-bold mb-6">{currentQuestion.text}</h2>

            {!feedback ? (
              <>
                <textarea
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Type your answer here... Explain your thinking!"
                  className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none mb-4"
                />
                <Button
                  onClick={submitAnswer}
                  disabled={isGrading || !studentAnswer.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGrading ? 'Sunny is thinking...' : 'Submit Answer'}
                </Button>
              </>
            ) : (
              <div>
                {/* Feedback Display */}
                <div className={`p-6 rounded-lg mb-6 ${
                  feedback.correctness === 'correct'
                    ? 'bg-green-50 border-2 border-green-500'
                    : feedback.correctness === 'partial'
                    ? 'bg-yellow-50 border-2 border-yellow-500'
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {feedback.correctness === 'correct' ? '✅' :
                       feedback.correctness === 'partial' ? '🤔' : '❌'}
                    </span>
                    <h3 className="text-lg font-bold">
                      {feedback.correctness === 'correct' ? 'Correct!' :
                       feedback.correctness === 'partial' ? 'Partially Correct' :
                       'Not Quite'}
                    </h3>
                  </div>
                  <p className="text-gray-700">{feedback.ai_feedback}</p>

                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      <span>Reasoning: {feedback.reasoning_quality}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Mastery: {feedback.new_mastery}%</span>
                    </div>
                  </div>
                </div>

                <Button onClick={nextQuestion} className="w-full" size="lg">
                  {currentQuestionIndex < currentMission.questions.length - 1
                    ? 'Next Question'
                    : 'Complete Mission'}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Hints (if available and no feedback yet) */}
          {!feedback && currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-300">
              <h3 className="font-bold mb-2">💡 Hints</h3>
              <ul className="space-y-1">
                {currentQuestion.hints.map((hint, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // Mission Selection View
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-5xl font-black mb-4">Learning Missions</h1>
          <p className="text-xl text-gray-600">
            Sunny picks the perfect skill for you to work on next
          </p>
        </motion.div>

        {/* Start Mission Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-10 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Ready for your next challenge?</h2>
          <p className="text-gray-600 mb-6">
            Sunny analyzes your skills and picks what you need to practice most.
            Each mission is personalized to your level.
          </p>

          <Button
            onClick={startMission}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2">⏳</div>
                Sunny is preparing your mission...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Start New Mission
              </>
            )}
          </Button>
        </motion.div>

        {/* How Missions Work */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-2xl font-bold mb-6">How Missions Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold">Adaptive</h3>
              </div>
              <p className="text-sm text-gray-600">
                Sunny picks skills based on what you need most, using spaced repetition
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold">Explains Reasoning</h3>
              </div>
              <p className="text-sm text-gray-600">
                Show your thinking! Sunny grades how you reason, not just your answer
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="font-bold">Short & Focused</h3>
              </div>
              <p className="text-sm text-gray-600">
                5-7 questions per mission. Usually takes 10-15 minutes
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
