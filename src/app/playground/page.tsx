'use client';

/**
 * Playground Page
 *
 * Entry point for environmental learning stages
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudGardenStage } from '@/components/stages/CloudGardenStage';
import { cloudGardenStage } from '@/lib/env-server';
import type { StageDefinition } from '@/types/env-server';

// Available stages (for demo mode)
const AVAILABLE_STAGES: StageDefinition[] = [
  cloudGardenStage,
  // Future stages will be added here:
  // confidenceTowerStage,
  // focusForestStage,
  // echoBridgeStage,
  // kindnessVillageStage,
];

export default function PlaygroundPage() {
  const [selectedStage, setSelectedStage] = useState<StageDefinition | null>(
    null
  );
  const [playerId] = useState(() => `player_${Date.now()}`);

  const handleStageComplete = () => {
    setSelectedStage(null);
  };

  // If a stage is selected, render it
  if (selectedStage) {
    if (selectedStage.theme === 'cloud-garden') {
      return (
        <CloudGardenStage playerId={playerId} onComplete={handleStageComplete} />
      );
    }
    // Future stages will be handled here
    return null;
  }

  // Stage selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            Sunny's Learning Playground
          </h1>
          <p className="text-2xl text-white/90">
            Choose a world to explore and grow!
          </p>
        </motion.div>

        {/* Stage cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {AVAILABLE_STAGES.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              onSelect={() => setSelectedStage(stage)}
            />
          ))}

          {/* Coming soon cards */}
          <ComingSoonCard
            title="Confidence Tower"
            emoji="🏰"
            description="Climb higher by completing challenges!"
            index={1}
          />
          <ComingSoonCard
            title="Focus Forest"
            emoji="🌲"
            description="Collect gems and practice focus!"
            index={2}
          />
          <ComingSoonCard
            title="Echo Bridge"
            emoji="🌉"
            description="Build bridges with happy memories!"
            index={3}
          />
          <ComingSoonCard
            title="Kindness Village"
            emoji="🏘️"
            description="Share kindness and help the community!"
            index={4}
          />
        </div>

        {/* Demo mode indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-white/70 text-sm"
        >
          <p>🎮 Demo Mode - All stages work without API configuration</p>
        </motion.div>
      </div>
    </div>
  );
}

interface StageCardProps {
  stage: StageDefinition;
  index: number;
  onSelect: () => void;
}

function StageCard({ stage, index, onSelect }: StageCardProps) {
  const getEmoji = (theme: string) => {
    switch (theme) {
      case 'cloud-garden':
        return '☁️';
      case 'confidence-tower':
        return '🏰';
      case 'focus-forest':
        return '🌲';
      case 'echo-bridge':
        return '🌉';
      case 'kindness-village':
        return '🏘️';
      default:
        return '🎮';
    }
  };

  const getGradient = (focus: string) => {
    switch (focus) {
      case 'anxiety':
        return 'from-blue-400 to-cyan-400';
      case 'self-worth':
        return 'from-purple-400 to-pink-400';
      case 'focus':
        return 'from-green-400 to-emerald-400';
      case 'grief':
        return 'from-indigo-400 to-blue-400';
      case 'empathy':
        return 'from-yellow-400 to-orange-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <div
        className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden h-full p-8 flex flex-col`}
      >
        {/* Gradient header */}
        <div
          className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${getGradient(
            stage.emotionalFocus
          )}`}
        />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Emoji */}
          <div className="text-8xl mb-4 text-center">
            {getEmoji(stage.theme)}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">
            {stage.name}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6 flex-1">
            {stage.description}
          </p>

          {/* Meta info */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span className="capitalize">{stage.emotionalFocus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⏱️</span>
              <span>{stage.estimatedDuration} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👶</span>
              <span>
                Ages {stage.recommendedAge[0]}-{stage.recommendedAge[1]}
              </span>
            </div>
          </div>

          {/* Play button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`mt-6 w-full py-4 bg-gradient-to-r ${getGradient(
              stage.emotionalFocus
            )} text-white font-bold text-xl rounded-2xl shadow-lg`}
          >
            Start Adventure
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

interface ComingSoonCardProps {
  title: string;
  emoji: string;
  description: string;
  index: number;
}

function ComingSoonCard({
  title,
  emoji,
  description,
  index,
}: ComingSoonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index + 1) * 0.1 }}
      className="relative"
    >
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden h-full p-8 flex flex-col items-center justify-center opacity-70">
        <div className="text-8xl mb-4">{emoji}</div>
        <h2 className="text-3xl font-bold text-gray-700 mb-3 text-center">
          {title}
        </h2>
        <p className="text-gray-600 text-center mb-6">{description}</p>
        <div className="px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full">
          Coming Soon
        </div>
      </div>
    </motion.div>
  );
}
