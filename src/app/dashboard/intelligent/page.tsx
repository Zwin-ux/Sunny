'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Zap, 
  Award,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { generateLearningPath } from '@/lib/personalized-learning/LearningPathGenerator';
import { generateSmartHomework } from '@/lib/homework/SmartHomeworkGenerator';
import { analyzeBrainState } from '@/lib/demo-brain-analysis';

// Mock user ID - in production, get from auth
const USER_ID = 'user-123';

export default function IntelligentDashboard() {
  const [learningPath, setLearningPath] = useState<any>(null);
  const [homework, setHomework] = useState<any>(null);
  const [brainAnalysis, setBrainAnalysis] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    
    try {
      // 1. Generate personalized learning path
      const path = await generateLearningPath(USER_ID);
      setLearningPath(path);

      // 2. Get brain analysis from recent activity
      // Real student scenario: Sarah, 8 years old, learning multiplication
      const sarahsRecentActivity = [
        { 
          correct: true, 
          timeSpent: 4200, 
          topic: 'multiplication-tables', 
          difficulty: 'easy', 
          selectedIndex: 2, 
          questionId: 'mult-3x4' 
        },
        { 
          correct: true, 
          timeSpent: 3100, 
          topic: 'multiplication-tables', 
          difficulty: 'easy', 
          selectedIndex: 1, 
          questionId: 'mult-5x2' 
        },
        { 
          correct: false, 
          timeSpent: 12500, 
          topic: 'word-problems', 
          difficulty: 'medium', 
          selectedIndex: 0, 
          questionId: 'wp-cookies' 
        },
        { 
          correct: true, 
          timeSpent: 5800, 
          topic: 'multiplication-tables', 
          difficulty: 'medium', 
          selectedIndex: 3, 
          questionId: 'mult-6x3' 
        },
        { 
          correct: true, 
          timeSpent: 3500, 
          topic: 'skip-counting', 
          difficulty: 'easy', 
          selectedIndex: 2, 
          questionId: 'skip-5' 
        },
      ];
      
      const analysis = analyzeBrainState(sarahsRecentActivity);
      setBrainAnalysis(analysis);
      setRecentActivity(sarahsRecentActivity);

      // 3. Generate smart homework
      const hw = await generateSmartHomework({
        userId: USER_ID,
        topicsToReinforce: path.needsWork.slice(0, 2),
        questionCount: 10,
        includeReview: true,
        targetTime: 15
      });
      setHomework(hw);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Brain className="w-16 h-16 text-purple-600" />
          </motion.div>
          <p className="text-lg text-gray-700">Loading your intelligent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Learning Journey
            </h1>
            <p className="text-gray-600 mt-2">
              Powered by AI • Personalized for you • Updated in real-time
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Refresh Insights
          </Button>
        </motion.div>

        {/* Brain Analysis Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Brain Analysis</h2>
            <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
              Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance Pattern */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-semibold">Performance</h3>
              </div>
              <p className="text-3xl font-bold capitalize mb-2">
                {brainAnalysis?.performancePattern}
              </p>
              <p className="text-sm opacity-90">
                {brainAnalysis?.adaptationReason}
              </p>
            </div>

            {/* Confidence Level */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold">Confidence</h3>
              </div>
              <p className="text-3xl font-bold mb-2">
                {brainAnalysis?.confidenceLevel}%
              </p>
              <Progress 
                value={brainAnalysis?.confidenceLevel} 
                className="h-2 bg-white/20"
              />
            </div>

            {/* Learning Style */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" />
                <h3 className="font-semibold">Learning Style</h3>
              </div>
              <p className="text-3xl font-bold capitalize mb-2">
                {brainAnalysis?.learningStyle}
              </p>
              <p className="text-sm opacity-90">
                {brainAnalysis?.nextAction}
              </p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brainAnalysis?.insights.map((insight: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-2 bg-white/10 p-3 rounded-lg"
                >
                  <span className="text-yellow-300">•</span>
                  <span className="text-sm">{insight}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personalized Learning Path */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Learning Path</h2>
                  <p className="text-sm text-gray-600">
                    Pace: <span className="font-semibold capitalize">{learningPath?.pace}</span>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Full Path
              </Button>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Strengths
                </h3>
                <div className="space-y-1">
                  {learningPath?.strengths.slice(0, 3).map((strength: string, i: number) => (
                    <div key={i} className="text-sm text-green-700 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Growth Areas
                </h3>
                <div className="space-y-1">
                  {learningPath?.needsWork.slice(0, 3).map((area: string, i: number) => (
                    <div key={i} className="text-sm text-orange-700 flex items-center gap-2">
                      <span className="text-orange-500">→</span>
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Topics */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Next Up</h3>
              <div className="space-y-3">
                {learningPath?.recommendedTopics.slice(0, 3).map((topic: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        topic.priority === 'high' ? 'bg-red-500' :
                        topic.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{topic.topic}</h4>
                        <p className="text-sm text-gray-600">{topic.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700 capitalize">
                          {topic.difficulty}
                        </div>
                        <div className="text-xs text-gray-500">
                          ~{topic.estimatedTime} min
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Milestones
              </h3>
              <div className="space-y-2">
                {learningPath?.milestones.slice(0, 2).map((milestone: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{milestone.achievement}</div>
                      <div className="text-sm text-gray-600">
                        Unlocks: {milestone.unlocks.join(', ')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(milestone.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Smart Homework */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Smart Homework</h2>
                <p className="text-sm text-gray-600">Personalized for you</p>
              </div>
            </div>

            {homework && (
              <div className="space-y-4">
                {/* Homework Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {homework.questions.length}
                    </div>
                    <div className="text-xs text-gray-600">Questions</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {homework.estimatedTime}m
                    </div>
                    <div className="text-xs text-gray-600">Est. Time</div>
                  </div>
                </div>

                {/* Topic Breakdown */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Topics Covered</h3>
                  <div className="space-y-2">
                    {Object.entries(homework.topics).map(([topic, count]: [string, any]) => (
                      <div key={topic} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{topic}</span>
                        <span className="text-sm font-semibold text-gray-900">{count} questions</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty Curve */}
                <div className="p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    Difficulty Curve
                  </div>
                  <div className="text-xs text-gray-600">
                    {homework.difficulty}
                  </div>
                </div>

                {/* Review Questions */}
                {homework.reviewQuestions > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">
                        {homework.reviewQuestions} review questions
                      </span>
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      Spaced repetition for better retention
                    </div>
                  </div>
                )}

                {/* Start Button */}
                <Button className="w-full" size="lg">
                  Start Homework
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Last 5 questions analyzed</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentActivity.map((answer, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  answer.correct 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    answer.correct ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {answer.correct ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">
                      {answer.topic}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {answer.difficulty} difficulty
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-700">
                      {(answer.timeSpent / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-gray-500">
                      {answer.timeSpent < 5000 ? 'Quick' : answer.timeSpent > 15000 ? 'Thoughtful' : 'Steady'}
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
