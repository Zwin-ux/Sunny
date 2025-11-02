'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Brain, Trophy, Users, Zap, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Sunny adapts to each child\'s learning style and pace automatically',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: BookOpen,
    title: 'Interactive Lessons',
    description: 'Engaging activities, quizzes, and games that make learning fun',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Trophy,
    title: 'Achievement System',
    description: 'Earn points, badges, and unlock new content as you learn',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: Users,
    title: 'Parent Dashboard',
    description: 'Track progress and see detailed learning analytics',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Zap,
    title: 'Real-Time Adaptation',
    description: 'Sunny detects struggles and adjusts difficulty instantly',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    icon: Star,
    title: 'Personalized Path',
    description: 'Custom learning journey based on interests and goals',
    color: 'bg-indigo-100 text-indigo-600'
  }
];

const testimonials = [
  {
    quote: "My daughter loves learning with Sunny! She's gone from hating math to asking to do it every day.",
    author: "Sarah M.",
    role: "Parent of 8-year-old",
    avatar: "👩"
  },
  {
    quote: "Sunny makes complex topics accessible. The AI really understands how kids think and learn.",
    author: "Mr. Johnson",
    role: "Elementary Teacher",
    avatar: "👨‍🏫"
  },
  {
    quote: "I can see exactly where my son is struggling and where he excels. The insights are incredible!",
    author: "David L.",
    role: "Parent of 6-year-old",
    avatar: "👨"
  }
];

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleTryDemo = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-20 left-10 text-6xl opacity-20"
          >
            ⭐
          </motion.div>
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-40 right-20 text-5xl opacity-20"
          >
            🚀
          </motion.div>
          <motion.div
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-20 left-1/4 text-4xl opacity-20"
          >
            🎨
          </motion.div>
          <motion.div
            animate={{
              y: [0, 15, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-40 right-1/4 text-5xl opacity-20"
          >
            📚
          </motion.div>
        </div>

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
                <span className="font-bold text-sm">AI-Powered Learning for Kids</span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
                Meet{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500">
                  Sunny
                </span>
                <br />
                Your Child's AI Tutor
              </h1>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                An autonomous AI teacher that adapts to your child's unique learning style,
                creating personalized lessons and making education fun and engaging.
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

              <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-300 border-2 border-white flex items-center justify-center">👧</div>
                    <div className="w-8 h-8 rounded-full bg-green-300 border-2 border-white flex items-center justify-center">👦</div>
                    <div className="w-8 h-8 rounded-full bg-purple-300 border-2 border-white flex items-center justify-center">👶</div>
                  </div>
                  <span className="font-semibold">10,000+ kids learning</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">4.9/5 rating</span>
                </div>
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
                  <div className="text-9xl">☀️</div>

                  {/* Floating elements around Sunny */}
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-10 left-10 text-4xl"
                  >
                    📖
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 10, 0], rotate: [0, -360] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-10 right-10 text-4xl"
                  >
                    ✏️
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                    className="absolute bottom-10 left-10 text-4xl"
                  >
                    🎯
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                    className="absolute bottom-10 right-10 text-4xl"
                  >
                    🏆
                  </motion.div>
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
            <h2 className="text-4xl lg:text-5xl font-black mb-4">Why Kids Love Sunny</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powered by advanced AI that learns how your child learns best
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

      {/* How It Works Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4">How Sunny Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start your child's learning adventure
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up & Onboard", description: "Create an account and tell us about your child's interests and learning style", emoji: "👋" },
              { step: "2", title: "Sunny Learns", description: "Our AI observes and adapts to your child's unique way of learning", emoji: "🧠" },
              { step: "3", title: "Watch Them Grow", description: "Track progress as Sunny creates personalized lessons automatically", emoji: "🌱" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-6xl mb-4 text-center">{item.emoji}</div>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center font-black text-2xl border-2 border-black">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center">{item.title}</h3>
                  <p className="text-gray-600 text-center">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300">
                    <ArrowRight className="w-full h-full" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-black mb-4">What Parents Say</h2>
            <p className="text-xl text-gray-600">Real feedback from families using Sunny</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center text-2xl border-2 border-black">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
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
            <h2 className="text-4xl lg:text-5xl font-black mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8 text-gray-800">
              Join thousands of kids already learning with Sunny
            </p>
            <Button
              onClick={handleGetStarted}
              className="bg-white hover:bg-gray-100 text-gray-900 px-10 py-7 text-xl font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
            >
              Get Started Free
              <Sparkles className="ml-2 w-6 h-6" />
            </Button>
            <p className="mt-4 text-sm text-gray-700">No credit card required • Free for 30 days</p>
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
