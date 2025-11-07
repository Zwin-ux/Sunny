'use client';

/**
 * StageLibrary Component
 *
 * Displays grid of user-created stages with quick actions
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Copy, Trash2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CustomStageDefinition } from '@/types/creator';
import { listStages, deleteStage } from '@/lib/creator/stage-storage';

export function StageLibrary() {
  const router = useRouter();
  const [stages, setStages] = useState<CustomStageDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = () => {
    setIsLoading(true);
    const userStages = listStages();
    setStages(userStages);
    setIsLoading(false);
  };

  const handleEdit = (stageId: string) => {
    router.push(`/dashboard/creator/${stageId}`);
  };

  const handlePreview = (stageId: string) => {
    router.push(`/dashboard/creator/${stageId}/preview`);
  };

  const handleDuplicate = (stageId: string) => {
    // TODO: Implement duplicate
    console.log('Duplicate stage:', stageId);
  };

  const handleDelete = (stageId: string) => {
    if (confirm('Are you sure you want to delete this stage?')) {
      deleteStage(stageId);
      loadStages();
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      anxiety: '🌤️',
      'self-worth': '🏰',
      focus: '🌲',
      grief: '🌉',
      empathy: '🏘️',
      anger: '🔥',
      resilience: '💪',
    };
    return emojiMap[emotion] || '🎯';
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading your stages...</p>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No stages yet</h3>
        <p className="text-gray-600 mb-6">Create your first custom learning stage to get started!</p>
        <Button
          onClick={() => router.push('/dashboard/creator/new')}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          Create Your First Stage
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Stages</h2>
        <p className="text-sm text-gray-600">{stages.length} stage{stages.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
              {/* Header with emotion icon */}
              <div
                className="h-32 flex items-center justify-center text-6xl"
                style={{ backgroundColor: stage.visual?.backgroundColor || '#87CEEB' }}
              >
                {getEmotionEmoji(stage.emotionalFocus)}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{stage.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{stage.description}</p>
                  </div>
                  {stage.creator.isDraft && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Draft
                    </span>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full capitalize">
                    {stage.emotionalFocus}
                  </span>
                  <span className="px-2 py-1 bg-fuchsia-100 text-fuchsia-800 text-xs rounded-full">
                    {stage.estimatedDuration} min
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                    {stage.difficulty}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    <span>{stage.creator.timesPlayed || 0} plays</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>✓</span>
                    <span>{stage.creator.avgCompletionRate || 0}% complete</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleEdit(stage.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handlePreview(stage.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>

                {/* More actions */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    onClick={() => handleDuplicate(stage.id)}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    onClick={() => handleDelete(stage.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
