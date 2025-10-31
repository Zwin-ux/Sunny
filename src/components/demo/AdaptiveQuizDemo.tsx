'use client';

import { useState, useEffect } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { FillInBlank } from '@/components/quiz/FillInBlank';
import { ProgressiveHints } from '@/components/quiz/ProgressiveHints';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Brain, Target, Lightbulb, TrendingUp, Award } from 'lucide-react';

export function AdaptiveQuizDemo() {
  const {
    session,
    currentQuestion,
    currentQuestionIndex,
    loading,
    error,
    createQuiz,
    submitAnswer,
    getHint,
    getSummary
  } = useQuiz();

  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showBrainMode, setShowBrainMode] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  // Start quiz on mount
  useEffect(() => {
    createQuiz('addition', 3); // 3 questions for demo
  }, [createQuiz]);

  // Track time when question appears
  useEffect(() => {
    if (currentQuestion) {
      setStartTime(Date.now());
      setHintsUsed(0);
      setEvaluation(null);
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Show brain mode after first answer
  useEffect(() => {
    if (currentQuestionIndex > 0) {
      setShowBrainMode(true);
    }
  }, [currentQuestionIndex]);

  const handleAnswer = async (answer: any, questionEvaluation: any) => {
    const timeSpent = Date.now() - startTime;
    
    // Submit to intelligent learning system
    const result = await submitAnswer(answer, timeSpent, hintsUsed);
    
    if (result) {
      setEvaluation(result.evaluation);
      
      // Show summary if quiz complete
      if (result.sessionComplete) {
        const summaryData = await getSummary();
        setSummary(summaryData);
      }
    }
  };

  const handleHintRequest = async () => {
    const hint = await getHint(hintsUsed + 1, 'low');
    if (hint) {
      setHintsUsed(prev => prev + 1);
    }
    return hint;
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Brain className="w-16 h-16 text-blue-500" />
          </motion.div>
          <p className="text-lg font-medium text-gray-700">
            🧠 Sunny is preparing your adaptive quiz...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4 bg-white p-8 rounded-xl shadow-lg">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={() => createQuiz('addition', 3)}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show summary screen
  if (summary) {
    return <DemoSummaryScreen summary={summary} />;
  }

  if (!currentQuestion) return null;

  const progress = ((currentQuestionIndex + 1) / (session?.totalQuestions || 3)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Adaptive Learning Demo
            </h1>
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-lg text-gray-600">
            Watch Sunny adapt to your learning style in real-time!
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-md p-4"
        >
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">
              Question {currentQuestionIndex + 1} of {session?.totalQuestions}
            </span>
            <span className="font-medium">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="space-y-6">
                {/* Question Type Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold shadow-md">
                    {currentQuestion.type.replace('-', ' ').toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                </div>

                {/* Render Question */}
                {currentQuestion.type === 'fill-in-blank' && (
                  <FillInBlank
                    content={currentQuestion.content as any}
                    onAnswer={handleAnswer}
                    showFeedback={true}
                  />
                )}

                {/* Progressive Hints */}
                {!evaluation && (
                  <ProgressiveHints
                    hints={currentQuestion.scaffolding.hints}
                    onHintUsed={handleHintRequest}
                  />
                )}

                {/* Evaluation Feedback */}
                <AnimatePresence>
                  {evaluation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <div className={`p-6 rounded-xl border-2 ${
                        evaluation.correct 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                          : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">
                            {evaluation.correct ? '✅' : '💪'}
                          </span>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">
                              {evaluation.feedback}
                            </h3>
                            <p className="text-sm text-gray-700 mt-1">
                              {evaluation.explanation}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-center font-medium text-gray-700 mt-4 text-lg">
                          {evaluation.encouragement}
                        </p>
                      </div>

                      {/* Next Button */}
                      <Button
                        onClick={() => {
                          setEvaluation(null);
                        }}
                        className="w-full h-12 text-lg font-semibold"
                        size="lg"
                      >
                        {currentQuestionIndex < (session?.totalQuestions || 3) - 1
                          ? 'Next Question →'
                          : 'See Results 🎉'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Demo Callouts */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg"
              >
                <Target className="w-8 h-8 mb-2" />
                <div className="text-sm font-semibold">Adaptive</div>
                <div className="text-xs opacity-90">Difficulty adjusts</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg"
              >
                <Lightbulb className="w-8 h-8 mb-2" />
                <div className="text-sm font-semibold">Smart Hints</div>
                <div className="text-xs opacity-90">{hintsUsed} used</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg"
              >
                <Brain className="w-8 h-8 mb-2" />
                <div className="text-sm font-semibold">AI Analysis</div>
                <div className="text-xs opacity-90">Real-time</div>
              </motion.div>
            </div>
          </div>

          {/* Brain Mode Sidebar */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {showBrainMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-600" />
                        <h3 className="font-bold text-lg text-gray-900">Brain Mode</h3>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold"
                      >
                        LIVE
                      </motion.span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <p className="font-semibold text-blue-900">Adaptive Difficulty</p>
                        </div>
                        <p className="text-blue-700 text-xs">
                          Targeting 75% success rate (ZPD)
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-green-900">Scaffolding Active</p>
                        </div>
                        <p className="text-green-700 text-xs">
                          {hintsUsed} hints used • Progressive support
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <p className="font-semibold text-purple-900">Learning Analysis</p>
                        </div>
                        <p className="text-purple-700 text-xs">
                          Bloom's: {currentQuestion.bloomsLevel}
                        </p>
                      </motion.div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center italic">
                        This is what makes Sunny intelligent! 🚀
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Screen Component
function DemoSummaryScreen({ summary }: { summary: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-8xl"
          >
            🎉
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Amazing Work!
          </h1>
          <p className="text-2xl text-gray-600">
            Here's what Sunny learned about you
          </p>
        </motion.div>

        {/* Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Your Performance</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {Math.round(summary.performance.accuracy * 100)}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-4xl font-bold text-purple-600 mb-1">
                {summary.performance.correctAnswers}/{summary.performance.totalQuestions}
              </div>
              <div className="text-sm text-gray-600 font-medium">Correct</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {Math.round(summary.performance.averageTimePerQuestion)}s
              </div>
              <div className="text-sm text-gray-600 font-medium">Avg Time</div>
            </div>
          </div>

          <Progress 
            value={summary.performance.scorePercentage} 
            className="h-4"
          />
          <p className="text-center text-sm text-gray-600 mt-2">
            Score: {Math.round(summary.performance.scorePercentage)}%
          </p>
        </motion.div>

        {/* Brain Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Brain Analysis</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="font-semibold text-blue-900 mb-2 text-lg">
                🎯 Learning Style: {summary.brainAnalysis.learningStyle}
              </div>
              <div className="text-sm text-blue-700">
                Performance Pattern: {summary.brainAnalysis.performancePattern}
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-gray-900 text-lg">💡 Key Insights:</div>
              {summary.brainAnalysis.insights.map((insight: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-purple-500 text-xl">•</span>
                  <span className="text-gray-700">{insight}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        {summary.achievements && summary.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-yellow-600" />
              <h2 className="text-3xl font-bold text-gray-900">Achievements Unlocked</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {summary.achievements.map((achievement: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl text-center hover:scale-105 transition-transform"
                >
                  <div className="text-5xl mb-3">{achievement.icon}</div>
                  <div className="font-bold text-gray-900 mb-1">{achievement.title}</div>
                  <div className="text-xs text-gray-600">
                    {achievement.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-10 rounded-2xl shadow-2xl"
        >
          <Sparkles className="w-12 h-12 mx-auto" />
          <p className="text-2xl font-bold">
            This is just a taste of what Sunny can do!
          </p>
          <p className="text-lg opacity-90">
            Experience personalized learning that adapts to every child
          </p>
          <Button 
            size="lg" 
            className="px-10 py-6 text-lg font-bold bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
          >
            Join the Waitlist →
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
