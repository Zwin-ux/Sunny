'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types/user';
import { LearningAppsLauncher } from '@/components/demo/LearningAppsLauncher';
import { motion } from 'framer-motion';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

// For MVP, we'll use a hardcoded user ID. In a real app, this would come from auth.
const MOCK_USER_ID = 'user-123';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/user?id=${MOCK_USER_ID}`);
        if (res.ok) {
          const userData: UserProfile = await res.json();
          setUser(userData);
          // Mock data for demo
          setStreak(3);
          setMissionsCompleted(12);
        } else if (res.status === 404) {
          const newUser: UserProfile = {
            id: MOCK_USER_ID,
            name: 'Alex',
            email: 'student@example.com',
            passwordHash: '',
            progress: {},
            chatHistory: [],
            learningInterests: ['Math', 'Science'],
            quizProgress: {},
          };
          await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
          });
          setUser(newUser);
          setStreak(3);
          setMissionsCompleted(12);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-yellow-50 to-white">
        <Image src="/sun.png" alt="Loading" width={100} height={100} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-black px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/sun.png" alt="Sunny" width={50} height={50} />
            <div>
              <h1 className="text-2xl font-black text-gray-900">Sunny Learning OS</h1>
              <p className="text-sm text-gray-600">Your Personal Learning Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold">{user?.name || 'Student'}</span>
            <Button variant="outline" size="sm" className="border-2 border-black">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="border-2 border-black" onClick={() => window.location.href = '/'}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
            Welcome back, {user?.name || 'Friend'}! 👋
          </h2>
          <p className="text-xl text-gray-600">
            Ready to continue your learning journey?
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Current Streak</p>
                <p className="text-5xl font-black text-orange-600 mt-1">{streak}</p>
                <p className="text-gray-600 text-sm mt-1 font-medium">days in a row 🔥</p>
              </div>
              <Image src="/star.png" alt="Streak" width={70} height={70} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Total XP</p>
                <p className="text-5xl font-black text-blue-600 mt-1">{missionsCompleted * 50}</p>
                <p className="text-gray-600 text-sm mt-1 font-medium">experience points</p>
              </div>
              <Image src="/rainbow.png" alt="XP" width={70} height={70} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Missions</p>
                <p className="text-5xl font-black text-green-600 mt-1">{missionsCompleted}</p>
                <p className="text-gray-600 text-sm mt-1 font-medium">completed</p>
              </div>
              <Image src="/robot.png" alt="Missions" width={70} height={70} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-semibold">Topics</p>
                <p className="text-5xl font-black text-yellow-600 mt-1">{user?.learningInterests.length || 3}</p>
                <p className="text-gray-600 text-sm mt-1 font-medium">subjects</p>
              </div>
              <Image src="/bulb.png" alt="Topics" width={70} height={70} />
            </div>
          </motion.div>
        </div>

        {/* Learning Apps Launcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <LearningAppsLauncher
            currentXP={missionsCompleted * 50}
            onAppClick={(appId) => {
              if (appId === 'math-lab') window.location.href = '/chat';
              else if (appId === 'demo') window.location.href = '/demo';
              else console.log('App clicked:', appId);
            }}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-4">Quick Start</h2>
            <div className="space-y-3">
              <Link
                href="/chat"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl hover:shadow-md transition-all border-2 border-yellow-300 hover:scale-105"
              >
                <Image src="/sun.png" alt="Chat" width={50} height={50} />
                <div>
                  <p className="font-bold text-gray-900">Chat with Sunny</p>
                  <p className="text-sm text-gray-600">Ask anything, get instant help</p>
                </div>
              </Link>

              <Link
                href="/demo"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl hover:shadow-md transition-all border-2 border-pink-300 hover:scale-105"
              >
                <Image src="/star.png" alt="Demo" width={50} height={50} />
                <div>
                  <p className="font-bold text-gray-900">Try Demo</p>
                  <p className="text-sm text-gray-600">See adaptive learning in action</p>
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                <Image src="/thumbsup.png" alt="Success" width={40} height={40} />
                <div>
                  <p className="font-bold text-gray-900">Completed Demo</p>
                  <p className="text-sm text-gray-600">Just now</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <Image src="/star.png" alt="Achievement" width={40} height={40} />
                <div>
                  <p className="font-bold text-gray-900">{streak}-Day Streak!</p>
                  <p className="text-sm text-gray-600">Keep it going</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <Image src="/bulb.png" alt="Learning" width={40} height={40} />
                <div>
                  <p className="font-bold text-gray-900">Earned {missionsCompleted * 50} XP</p>
                  <p className="text-sm text-gray-600">From {missionsCompleted} missions</p>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border-2 border-yellow-300">
              <div className="flex items-center gap-3">
                <Image src="/sun.png" alt="Sunny" width={50} height={50} />
                <div>
                  <p className="font-bold text-gray-900 mb-1">Sunny says:</p>
                  <p className="text-sm text-gray-700">
                    "Great job exploring! Ready to unlock more learning apps?"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
