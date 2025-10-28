'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types/user';

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
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/sun.png" alt="Sunny" width={40} height={40} />
            <h1 className="text-2xl font-bold text-gray-900">Sunny Learning</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.name || 'Student'}</span>
            <Link
              href="/demo"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Streak</p>
                <p className="text-4xl font-bold text-orange-500 mt-1">{streak}</p>
                <p className="text-gray-500 text-sm mt-1">days in a row</p>
              </div>
              <Image src="/star.png" alt="Streak" width={60} height={60} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Missions Completed</p>
                <p className="text-4xl font-bold text-blue-500 mt-1">{missionsCompleted}</p>
                <p className="text-gray-500 text-sm mt-1">total missions</p>
              </div>
              <Image src="/rainbow.png" alt="Missions" width={60} height={60} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Learning Topics</p>
                <p className="text-4xl font-bold text-green-500 mt-1">{user?.learningInterests.length || 0}</p>
                <p className="text-gray-500 text-sm mt-1">subjects</p>
              </div>
              <Image src="/bulb.png" alt="Topics" width={60} height={60} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/chat"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg hover:shadow-md transition-shadow border-2 border-yellow-200"
                >
                  <Image src="/sun.png" alt="Chat" width={50} height={50} />
                  <span className="mt-3 font-semibold text-gray-900">Chat with Sunny</span>
                  <span className="text-sm text-gray-600">Ask questions</span>
                </Link>

                <Link
                  href="/missions"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg hover:shadow-md transition-shadow border-2 border-blue-200"
                >
                  <Image src="/robot.png" alt="Missions" width={50} height={50} />
                  <span className="mt-3 font-semibold text-gray-900">Start Mission</span>
                  <span className="text-sm text-gray-600">Practice skills</span>
                </Link>

                <Link
                  href="/progress"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg hover:shadow-md transition-shadow border-2 border-green-200"
                >
                  <Image src="/rainbow.png" alt="Progress" width={50} height={50} />
                  <span className="mt-3 font-semibold text-gray-900">View Progress</span>
                  <span className="text-sm text-gray-600">See your growth</span>
                </Link>

                <Link
                  href="/demo"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-100 to-red-100 rounded-lg hover:shadow-md transition-shadow border-2 border-pink-200"
                >
                  <Image src="/star.png" alt="Demo" width={50} height={50} />
                  <span className="mt-3 font-semibold text-gray-900">Try Demo</span>
                  <span className="text-sm text-gray-600">Experience Sunny</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Image src="/thumbsup.png" alt="Success" width={30} height={30} />
                  <div>
                    <p className="font-medium text-gray-900">Completed Math Mission</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Image src="/star.png" alt="Achievement" width={30} height={30} />
                  <div>
                    <p className="font-medium text-gray-900">Earned 3-Day Streak</p>
                    <p className="text-sm text-gray-500">Today</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Image src="/bulb.png" alt="Learning" width={30} height={30} />
                  <div>
                    <p className="font-medium text-gray-900">Started Science Topic</p>
                    <p className="text-sm text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Topics */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">My Topics</h2>
              <div className="space-y-2">
                {user?.learningInterests && user.learningInterests.length > 0 ? (
                  user.learningInterests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-2xl">📚</span>
                      <span className="font-medium text-gray-900">{interest}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No topics yet. Start learning!</p>
                )}
              </div>
            </div>

            {/* Motivational Card */}
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl shadow-sm p-6 border-2 border-yellow-200">
              <div className="text-center">
                <Image src="/sun.png" alt="Sunny" width={80} height={80} className="mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Keep Going!</h3>
                <p className="text-sm text-gray-700">
                  You're doing great! Complete one more mission today to keep your streak alive.
                </p>
                <Link
                  href="/missions"
                  className="mt-4 inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Start Mission →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
