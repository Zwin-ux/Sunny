'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Brain, Trophy, Users, Zap, Star, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getCurrentUser, logout } from '@/lib/auth';

const features = [
  {
    icon: Brain,
    title: 'Adapts as they learn',
    description: 'Sunny gently adjusts each question so practice feels encouraging, not overwhelming.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: BookOpen,
    title: 'Hands-on activities',
    description: 'Short stories, word problems, and mini-games built for curious minds.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Users,
    title: 'Family view',
    description: 'Follow progress at a glance and celebrate wins together.',
    color: 'bg-purple-100 text-purple-600',
  },
];

// Testimonials removed - will add real feedback after launch

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleTryDemo = () => {
    router.push('/demo');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">☀️</div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show welcome screen
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
        {/* Header with logout */}
        <header className="px-6 py-4 flex justify-between items-center border-b-2 border-black bg-white/50">
          <div className="flex items-center gap-2">
            <span className="text-3xl">☀️</span>
            <span className="font-black text-xl">Sunny AI</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Welcome Screen */}
        <div className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="text-8xl mb-6">👋</div>
            <h1 className="text-5xl lg:text-6xl font-black mb-4">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500">{user.childName || user.name || 'Friend'}</span>!
            </h1>
            <p className="text-xl text-gray-600 mb-2">We saved your spot—ready for a new challenge?</p>
            {user.currentStreak && user.currentStreak > 0 && (
              <div className="inline-flex items-center gap-2 bg-orange-200 px-4 py-2 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                <span className="text-2xl">🔥</span>
                <span className="font-bold">{user.currentStreak} day streak!</span>
              </div>
            )}
          </motion.div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => router.push('/dashboard')}
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">Go to Dashboard</h3>
              <p className="text-gray-600">Check today's missions and celebrate wins.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => router.push('/demo')}
            >
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-xl font-bold mb-2">Try Demo</h3>
              <p className="text-gray-600">Explore a guided practice set.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              onClick={() => router.push('/chat')}
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold mb-2">Start Chat</h3>
              <p className="text-gray-600">Jump into a conversation with Sunny.</p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={() => router.push('/dashboard')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-12 py-7 text-xl font-bold rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </motion.div>

          {/* Learning Stats */}
          {user.learningInterests && user.learningInterests.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 p-6 bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-bold text-lg mb-3">Your Interests:</h3>
              <div className="flex flex-wrap gap-2">
                {user.learningInterests.map((interest: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-300">
                    {interest}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Not logged in - show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-yellow-200 px-4 py-2 rounded-full mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm">Learning Platform for Kids</span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
                Meet{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500">
                  Sunny
                </span>
                <br />
                Learning Made Simple
              </h1>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Practice math and reading with playful, adaptive activities designed with educators and families.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={handleTryDemo}
                  className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-6 text-lg font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                >
                  Try Demo
                </Button>
              </div>

            </motion.div>

            {/* Right side - Animated Sunny character */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative z-10"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [-2, 2, -2]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-yellow-200 to-orange-200 rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                  <Image src="/sun.png" alt="Sunny" width={300} height={300} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with teacher feedback so every activity has a purpose.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 border-black`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 p-12 rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4">Try Sunny</h2>
            <p className="text-xl mb-8 text-gray-800">
              Start learning today
            </p>
            <Button
              onClick={handleGetStarted}
              className="bg-white hover:bg-gray-100 text-gray-900 px-10 py-7 text-xl font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
            >
              Get Started Free
              <Sparkles className="ml-2 w-6 h-6" />
            </Button>
            <p className="mt-4 text-sm text-gray-700">Try the demo - no signup required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-4xl mb-4">☀️</div>
          <h3 className="text-2xl font-bold mb-2">Sunny AI for Kids</h3>
          <p className="text-gray-400 mb-6">Making learning fun, one child at a time</p>
          <div className="text-sm text-gray-500">
            © 2025 Sunny AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
