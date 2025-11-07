'use client';

/**
 * Stage Creator - Main Page
 *
 * Shows library of user-created stages and "Create New" CTA
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Wrench, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StageLibrary } from '@/components/creator/StageLibrary';

export default function CreatorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Back button */}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Stage Creator</h1>
                <p className="text-lg text-gray-600">Design custom emotional learning experiences</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/dashboard/creator/new')}
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Stage
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Stages Created</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Times Played</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0%</p>
                <p className="text-sm text-gray-600">Avg Completion</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stage Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StageLibrary />
        </motion.div>

        {/* Getting Started Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-8 bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="font-bold text-gray-900 mb-2">1. Choose a Theme</h3>
                <p className="text-sm text-gray-600">
                  Select an emotional focus like anxiety, confidence, or focus
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-900 mb-2">2. Design Activities</h3>
                <p className="text-sm text-gray-600">
                  Create sorting games, matching, collection, or building tasks
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-bold text-gray-900 mb-2">3. Publish & Share</h3>
                <p className="text-sm text-gray-600">
                  Preview your stage, test it, and share with students
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                onClick={() => router.push('/dashboard/creator/new')}
                size="lg"
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
              >
                Create Your First Stage
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
