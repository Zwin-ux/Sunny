'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, Calendar, Brain, Star, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/ui/TabNavigation';
import { getCurrentUser } from '@/lib/auth';
import { getSkillsByUser, getRecentSessions } from '@/lib/db';

interface Skill {
  id: string;
  domain: string;
  category: string;
  display_name: string;
  mastery: number;
  confidence: string;
  last_seen: string;
  total_attempts: number;
  correct_attempts: number;
}

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  mission_type: string;
  sunny_goal: string;
  questions_attempted: number;
  questions_correct: number;
  duration_seconds: number;
  status: string;
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadProgressData(currentUser.id || currentUser.name);
  }, [router]);

  const loadProgressData = async (userId: string) => {
    setLoading(true);
    try {
      const [skillsData, sessionsData] = await Promise.all([
        getSkillsByUser(userId),
        getRecentSessions(userId, 10)
      ]);
      setSkills(skillsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">☀️</div>
            <p className="text-xl text-gray-600">Loading your progress...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Calculate stats
  const averageMastery = skills.length > 0
    ? Math.round(skills.reduce((sum, skill) => sum + skill.mastery, 0) / skills.length)
    : 0;

  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  const totalQuestionsAttempted = sessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0);
  const totalQuestionsCorrect = sessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0);
  const overallAccuracy = totalQuestionsAttempted > 0
    ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100)
    : 0;

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 70) return 'bg-green-500';
    if (mastery >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryEmoji = (mastery: number) => {
    if (mastery >= 80) return '🌟';
    if (mastery >= 60) return '✨';
    if (mastery >= 40) return '⭐';
    if (mastery >= 20) return '💫';
    return '🔹';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black mb-2">Your Learning Progress</h1>
          <p className="text-gray-600">Track your skills, sessions, and growth over time</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Mastery</p>
                <p className="text-3xl font-black">{averageMastery}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-3xl font-black">{overallAccuracy}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-3xl font-black">{completedSessions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skills</p>
                <p className="text-3xl font-black">{skills.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills Mastery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Skills Mastery</h2>
              <Award className="w-6 h-6 text-yellow-600" />
            </div>

            {skills.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No skills yet! Start a mission to begin tracking your progress.
              </p>
            ) : (
              <div className="space-y-4">
                {skills.slice(0, 8).map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getMasteryEmoji(skill.mastery)}</span>
                        <span className="font-semibold">{skill.display_name}</span>
                      </div>
                      <span className="text-sm font-bold">{skill.mastery}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.mastery}%` }}
                        transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                        className={`h-full ${getMasteryColor(skill.mastery)}`}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span>{skill.correct_attempts}/{skill.total_attempts} correct</span>
                      <span>•</span>
                      <span className="capitalize">{skill.confidence} confidence</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>

            {sessions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No sessions yet! Start learning to see your activity here.
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm">{session.sunny_goal || session.mission_type}</h3>
                        <p className="text-xs text-gray-600">{formatDate(session.started_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{session.questions_correct}/{session.questions_attempted}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(session.duration_seconds)}</span>
                      </div>
                      {session.questions_attempted > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>
                            {Math.round((session.questions_correct / session.questions_attempted) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Call to Action */}
        {skills.length === 0 && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-black text-center"
          >
            <h3 className="text-2xl font-bold mb-2">Ready to start your learning journey?</h3>
            <p className="text-gray-600 mb-6">
              Start a mission or play a game to begin tracking your progress!
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/missions')} size="lg">
                <Target className="w-5 h-5 mr-2" />
                Start Mission
              </Button>
              <Button onClick={() => router.push('/games')} variant="outline" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Play Games
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
