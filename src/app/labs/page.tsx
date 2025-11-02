'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Brain, Code, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatternBuilder } from '@/components/labs/PatternBuilder';
import { RobotBuilder } from '@/components/labs/RobotBuilder';
import { FlipCardQuiz } from '@/components/labs/FlipCardQuiz';

type LabType = 'pattern' | 'robot' | 'flashcard' | null;

interface Lab {
  id: LabType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  difficulty: string;
  xpRequired: number;
}

const LABS: Lab[] = [
  {
    id: 'pattern',
    title: 'Pattern Builder',
    description: 'Master pattern recognition with drag-and-drop shapes',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-purple-100 to-pink-100',
    gradient: 'from-purple-500 to-pink-500',
    difficulty: 'Beginner',
    xpRequired: 0,
  },
  {
    id: 'robot',
    title: 'Robot Builder',
    description: 'Build and program your own robot with visual coding',
    icon: <Code className="w-8 h-8" />,
    color: 'from-blue-100 to-cyan-100',
    gradient: 'from-blue-500 to-cyan-500',
    difficulty: 'Intermediate',
    xpRequired: 50,
  },
  {
    id: 'flashcard',
    title: 'Flip Card Quiz',
    description: 'Learn with interactive flashcards and spaced repetition',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'from-green-100 to-teal-100',
    gradient: 'from-green-500 to-teal-500',
    difficulty: 'All Levels',
    xpRequired: 100,
  },
];

export default function LabsPage() {
  const [activeLab, setActiveLab] = useState<LabType>(null);
  const [userXP] = useState(150); // TODO: Get from user profile

  const handleLabComplete = (score: number) => {
    console.log('Lab completed with score:', score);
    setActiveLab(null);
    // TODO: Update user XP and stats
  };

  if (activeLab === 'pattern') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white p-6">
        <Button
          variant="outline"
          onClick={() => setActiveLab(null)}
          className="mb-4 border-2 border-black"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Labs
        </Button>
        <PatternBuilder onComplete={handleLabComplete} />
      </div>
    );
  }

  if (activeLab === 'robot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-6">
        <Button
          variant="outline"
          onClick={() => setActiveLab(null)}
          className="mb-4 border-2 border-black"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Labs
        </Button>
        <RobotBuilder onComplete={handleLabComplete} />
      </div>
    );
  }

  if (activeLab === 'flashcard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white p-6">
        <Button
          variant="outline"
          onClick={() => setActiveLab(null)}
          className="mb-4 border-2 border-black"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Labs
        </Button>
        <FlipCardQuiz onComplete={handleLabComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-black text-gray-900">Interactive Labs</h1>
              <p className="text-sm text-gray-600">Hands-on learning experiences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-black text-gray-900 mb-2">
            Welcome to the Learning Lab! 🔬
          </h2>
          <p className="text-xl text-gray-600">
            Choose an interactive lab to start learning by doing
          </p>
        </motion.div>

        {/* XP Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Your Total XP</p>
              <p className="text-4xl font-black text-orange-600">{userXP}</p>
            </div>
            <Sparkles className="w-16 h-16 text-yellow-500" />
          </div>
          <div className="mt-4 bg-white/50 rounded-full h-3 overflow-hidden border border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((userXP / 200) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {userXP < 200 ? `${200 - userXP} XP until next reward!` : 'Max level reached! 🎉'}
          </p>
        </motion.div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LABS.map((lab, index) => {
            const isLocked = userXP < lab.xpRequired;

            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={!isLocked ? { y: -8, scale: 1.02 } : {}}
                className={`relative bg-gradient-to-br ${lab.color} rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !isLocked && setActiveLab(lab.id)}
              >
                {/* Lock Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl backdrop-blur-sm z-10">
                    <div className="text-center">
                      <p className="text-6xl mb-2">🔒</p>
                      <p className="text-sm font-bold text-gray-900">
                        Requires {lab.xpRequired} XP
                      </p>
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${lab.gradient} text-white mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                  {lab.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black text-gray-900 mb-2">{lab.title}</h3>
                <p className="text-gray-700 mb-4">{lab.description}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 bg-white/80 rounded-full border border-black">
                    {lab.difficulty}
                  </span>
                  {!isLocked && (
                    <Button
                      size="sm"
                      className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Start Lab →
                    </Button>
                  )}
                </div>

                {/* Hover Effect */}
                {!isLocked && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-2xl font-black text-gray-900 mb-4">Your Lab Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-black">
              <p className="text-sm font-semibold text-gray-700">Pattern Builder</p>
              <p className="text-3xl font-black text-purple-600">0</p>
              <p className="text-xs text-gray-600">rounds completed</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-black">
              <p className="text-sm font-semibold text-gray-700">Robot Builder</p>
              <p className="text-3xl font-black text-blue-600">0</p>
              <p className="text-xs text-gray-600">robots programmed</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border border-black">
              <p className="text-sm font-semibold text-gray-700">Flip Card Quiz</p>
              <p className="text-3xl font-black text-green-600">0</p>
              <p className="text-xs text-gray-600">cards mastered</p>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Learning Tips</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Start with Pattern Builder to warm up your brain!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Robot Builder teaches programming concepts through play</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Use Flip Cards for quick review sessions before tests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Complete labs to earn XP and unlock new features!</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
