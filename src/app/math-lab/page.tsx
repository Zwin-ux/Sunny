'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Award, ArrowLeft, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type MathTopic = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions' | 'geometry';
type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard';

interface MathProblem {
  id: string;
  topic: MathTopic;
  difficulty: DifficultyLevel;
  question: string;
  answer: string;
  hint?: string;
  visual?: string; // Emoji or visual representation
}

interface TopicCard {
  id: MathTopic;
  title: string;
  description: string;
  emoji: string;
  color: string;
  unlocked: boolean;
  xpRequired: number;
}

const MATH_TOPICS: TopicCard[] = [
  {
    id: 'addition',
    title: 'Addition',
    description: 'Learn to add numbers together',
    emoji: '➕',
    color: 'from-green-100 to-teal-100',
    unlocked: true,
    xpRequired: 0,
  },
  {
    id: 'subtraction',
    title: 'Subtraction',
    description: 'Master taking numbers away',
    emoji: '➖',
    color: 'from-blue-100 to-cyan-100',
    unlocked: true,
    xpRequired: 0,
  },
  {
    id: 'multiplication',
    title: 'Multiplication',
    description: 'Multiply numbers quickly',
    emoji: '✖️',
    color: 'from-purple-100 to-pink-100',
    unlocked: true,
    xpRequired: 50,
  },
  {
    id: 'division',
    title: 'Division',
    description: 'Divide and conquer',
    emoji: '➗',
    color: 'from-orange-100 to-red-100',
    unlocked: true,
    xpRequired: 100,
  },
  {
    id: 'fractions',
    title: 'Fractions',
    description: 'Work with parts of wholes',
    emoji: '🍕',
    color: 'from-yellow-100 to-orange-100',
    unlocked: false,
    xpRequired: 150,
  },
  {
    id: 'geometry',
    title: 'Geometry',
    description: 'Explore shapes and space',
    emoji: '📐',
    color: 'from-indigo-100 to-purple-100',
    unlocked: false,
    xpRequired: 200,
  },
];

function generateProblem(topic: MathTopic, difficulty: DifficultyLevel): MathProblem {
  const range = difficulty === 'beginner' ? 10 : difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
  
  switch (topic) {
    case 'addition': {
      const a = Math.floor(Math.random() * range) + 1;
      const b = Math.floor(Math.random() * range) + 1;
      return {
        id: `add-${Date.now()}`,
        topic,
        difficulty,
        question: `What is ${a} + ${b}?`,
        answer: String(a + b),
        hint: `Try counting up from ${a}`,
        visual: `${'🟢'.repeat(Math.min(a, 5))} + ${'🔵'.repeat(Math.min(b, 5))}`,
      };
    }
    case 'subtraction': {
      const a = Math.floor(Math.random() * range) + 10;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      return {
        id: `sub-${Date.now()}`,
        topic,
        difficulty,
        question: `What is ${a} - ${b}?`,
        answer: String(a - b),
        hint: `Start at ${a} and count backwards ${b} times`,
        visual: `${'🟢'.repeat(Math.min(a, 10))} ➡️ Remove ${b}`,
      };
    }
    case 'multiplication': {
      const a = Math.floor(Math.random() * 12) + 1;
      const b = Math.floor(Math.random() * 12) + 1;
      return {
        id: `mul-${Date.now()}`,
        topic,
        difficulty,
        question: `What is ${a} × ${b}?`,
        answer: String(a * b),
        hint: `Think of ${a} groups of ${b}`,
        visual: `${a} groups of ${b} = ?`,
      };
    }
    case 'division': {
      const b = Math.floor(Math.random() * 12) + 1;
      const answer = Math.floor(Math.random() * 12) + 1;
      const a = b * answer;
      return {
        id: `div-${Date.now()}`,
        topic,
        difficulty,
        question: `What is ${a} ÷ ${b}?`,
        answer: String(answer),
        hint: `How many groups of ${b} fit into ${a}?`,
        visual: `${a} items ➗ ${b} groups`,
      };
    }
    case 'fractions': {
      const numerator = Math.floor(Math.random() * 8) + 1;
      const denominator = Math.floor(Math.random() * 8) + 2;
      return {
        id: `frac-${Date.now()}`,
        topic,
        difficulty,
        question: `What is ${numerator}/${denominator} of 12?`,
        answer: String(Math.floor((numerator / denominator) * 12)),
        hint: `Divide 12 by ${denominator}, then multiply by ${numerator}`,
        visual: `🍕 Cut into ${denominator} slices, take ${numerator}`,
      };
    }
    case 'geometry': {
      const side = Math.floor(Math.random() * 10) + 1;
      return {
        id: `geo-${Date.now()}`,
        topic,
        difficulty,
        question: `What is the perimeter of a square with side length ${side}?`,
        answer: String(side * 4),
        hint: `Add all 4 sides: ${side} + ${side} + ${side} + ${side}`,
        visual: `🟦 Square with sides of ${side}`,
      };
    }
  }
}

function MathLabContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problemsCompleted, setProblemsCompleted] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const startPractice = (topic: MathTopic) => {
    setSelectedTopic(topic);
    setCurrentProblem(generateProblem(topic, difficulty));
    setUserAnswer('');
    setShowHint(false);
    setFeedback(null);
  };

  const checkAnswer = () => {
    if (!currentProblem) return;

    const isCorrect = userAnswer.trim() === currentProblem.answer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setScore(score + 10);
      setStreak(streak + 1);
      setProblemsCompleted(problemsCompleted + 1);
      
      setTimeout(() => {
        nextProblem();
      }, 1500);
    } else {
      setStreak(0);
    }
  };

  const nextProblem = () => {
    if (!selectedTopic) return;
    setCurrentProblem(generateProblem(selectedTopic, difficulty));
    setUserAnswer('');
    setShowHint(false);
    setFeedback(null);
  };

  const backToTopics = () => {
    setSelectedTopic(null);
    setCurrentProblem(null);
    setUserAnswer('');
    setFeedback(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Image src="/sun.png" alt="Loading" width={100} height={100} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-black text-gray-900">Math Lab 🧮</h1>
              <p className="text-sm text-gray-600">Practice makes perfect!</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border-2 border-black">
              <p className="text-sm font-bold text-gray-700">Score: {score}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-xl border-2 border-black">
              <p className="text-sm font-bold text-gray-700">Streak: {streak} 🔥</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-2 border-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!selectedTopic ? (
          <>
            {/* Topic Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-4xl font-black text-gray-900 mb-2">Choose Your Topic</h2>
              <p className="text-xl text-gray-600">What would you like to practice today?</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MATH_TOPICS.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={topic.unlocked ? { scale: 1.05, y: -5 } : {}}
                  className={`bg-gradient-to-br ${topic.color} rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                    topic.unlocked ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => topic.unlocked && startPractice(topic.id)}
                >
                  {!topic.unlocked && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full border border-black">
                      {topic.xpRequired} XP
                    </div>
                  )}
                  <div className="text-6xl mb-4">{topic.emoji}</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-700 mb-4">{topic.description}</p>
                  {topic.unlocked ? (
                    <Button className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Start Practice →
                    </Button>
                  ) : (
                    <div className="text-center text-sm font-bold text-gray-600">
                      🔒 Locked
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Practice Mode */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="outline"
                onClick={backToTopics}
                className="mb-4 border-2 border-black"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Topics
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2">
                    {MATH_TOPICS.find(t => t.id === selectedTopic)?.emoji}{' '}
                    {MATH_TOPICS.find(t => t.id === selectedTopic)?.title}
                  </h2>
                  <p className="text-xl text-gray-600">Problem #{problemsCompleted + 1}</p>
                </div>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as DifficultyLevel);
                    nextProblem();
                  }}
                  className="px-4 py-2 border-2 border-black rounded-lg font-bold"
                >
                  <option value="beginner">Beginner</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </motion.div>

            {currentProblem && (
              <motion.div
                key={currentProblem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white rounded-2xl p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  {/* Visual Representation */}
                  {currentProblem.visual && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-black">
                      <p className="text-center text-2xl">{currentProblem.visual}</p>
                    </div>
                  )}

                  {/* Question */}
                  <h3 className="text-4xl font-black text-gray-900 mb-8 text-center">
                    {currentProblem.question}
                  </h3>

                  {/* Answer Input */}
                  <div className="mb-6">
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                      placeholder="Your answer..."
                      disabled={feedback !== null}
                      className="w-full text-3xl font-bold text-center px-6 py-4 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
                    />
                  </div>

                  {/* Feedback */}
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-6 rounded-xl border-2 border-black mb-6 ${
                        feedback === 'correct'
                          ? 'bg-gradient-to-r from-green-100 to-teal-100'
                          : 'bg-gradient-to-r from-red-100 to-orange-100'
                      }`}
                    >
                      <p className="text-2xl font-black text-center">
                        {feedback === 'correct' ? '🎉 Correct!' : '❌ Not quite!'}
                      </p>
                      {feedback === 'incorrect' && (
                        <p className="text-center text-gray-700 mt-2">
                          The answer is {currentProblem.answer}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4">
                    {!feedback ? (
                      <>
                        <Button
                          onClick={checkAnswer}
                          disabled={!userAnswer}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg py-6"
                        >
                          Check Answer
                        </Button>
                        <Button
                          onClick={() => setShowHint(!showHint)}
                          variant="outline"
                          className="border-2 border-black"
                        >
                          💡 Hint
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={nextProblem}
                        className="flex-1 bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg py-6"
                      >
                        Next Problem →
                      </Button>
                    )}
                  </div>

                  {/* Hint */}
                  {showHint && currentProblem.hint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-yellow-100 rounded-xl border border-yellow-300"
                    >
                      <p className="text-sm font-semibold text-gray-700">
                        💡 Hint: {currentProblem.hint}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Progress Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 border-2 border-black text-center">
                    <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-black text-blue-600">{problemsCompleted}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border-2 border-black text-center">
                    <Award className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                    <p className="text-2xl font-black text-yellow-600">{score}</p>
                    <p className="text-xs text-gray-600">Points</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border-2 border-black text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-black text-orange-600">{streak}</p>
                    <p className="text-xs text-gray-600">Streak</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function MathLabPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <MathLabContent />
    </Suspense>
  );
}
