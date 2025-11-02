'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Calculator, 
  Beaker, 
  BookOpen, 
  Palette, 
  Music, 
  Globe, 
  Code, 
  Theater,
  Lock,
  Sparkles
} from 'lucide-react';

interface LearningApp {
  id: string;
  name: string;
  icon: any;
  color: string;
  unlocked: boolean;
  requiredXP?: number;
  description: string;
}

interface LearningAppsLauncherProps {
  currentXP: number;
  onAppClick?: (appId: string) => void;
}

const LEARNING_APPS: LearningApp[] = [
  {
    id: 'math-lab',
    name: 'Math Lab',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    unlocked: true,
    description: 'Practice math with adaptive problems',
  },
  {
    id: 'science-lab',
    name: 'Science Lab',
    icon: Beaker,
    color: 'from-green-500 to-emerald-500',
    unlocked: false,
    requiredXP: 100,
    description: 'Explore experiments and discoveries',
  },
  {
    id: 'reading-room',
    name: 'Reading Room',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    unlocked: false,
    requiredXP: 200,
    description: 'Build reading comprehension skills',
  },
  {
    id: 'art-studio',
    name: 'Art Studio',
    icon: Palette,
    color: 'from-orange-500 to-red-500',
    unlocked: false,
    requiredXP: 150,
    description: 'Create and learn through art',
  },
  {
    id: 'music-room',
    name: 'Music Room',
    icon: Music,
    color: 'from-indigo-500 to-purple-500',
    unlocked: false,
    requiredXP: 250,
    description: 'Learn rhythm, melody, and theory',
  },
  {
    id: 'world-explorer',
    name: 'World Explorer',
    icon: Globe,
    color: 'from-teal-500 to-blue-500',
    unlocked: false,
    requiredXP: 300,
    description: 'Discover geography and cultures',
  },
  {
    id: 'code-academy',
    name: 'Code Academy',
    icon: Code,
    color: 'from-gray-700 to-gray-900',
    unlocked: false,
    requiredXP: 400,
    description: 'Learn programming fundamentals',
  },
  {
    id: 'story-theater',
    name: 'Story Theater',
    icon: Theater,
    color: 'from-pink-500 to-rose-500',
    unlocked: false,
    requiredXP: 350,
    description: 'Write and perform creative stories',
  },
];

export function LearningAppsLauncher({ currentXP, onAppClick }: LearningAppsLauncherProps) {
  const handleAppClick = (app: LearningApp) => {
    console.log('LearningAppsLauncher: handleAppClick called', { appId: app.id, unlocked: app.unlocked });
    if (app.unlocked) {
      console.log('LearningAppsLauncher: App is unlocked, calling onAppClick');
      onAppClick?.(app.id);
    } else {
      console.log('LearningAppsLauncher: App is locked, not calling onAppClick');
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sunny Learning OS</h2>
          <p className="text-sm text-gray-600">Choose your learning adventure</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full border-2 border-yellow-300">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span className="font-bold text-yellow-700">{currentXP} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEARNING_APPS.map((app, index) => {
          const Icon = app.icon;
          const isLocked = !app.unlocked && (app.requiredXP || 0) > currentXP;
          const canUnlock = !app.unlocked && (app.requiredXP || 0) <= currentXP;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleAppClick(app)}
                disabled={isLocked}
                className={`
                  w-full aspect-square rounded-2xl p-4 flex flex-col items-center justify-center
                  transition-all duration-200 relative overflow-hidden
                  ${app.unlocked 
                    ? `bg-gradient-to-br ${app.color} text-white hover:scale-105 hover:shadow-xl cursor-pointer` 
                    : isLocked
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-br ${app.color} text-white hover:scale-105 hover:shadow-xl cursor-pointer animate-pulse`
                  }
                `}
              >
                {/* Unlock animation */}
                {canUnlock && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0 bg-white/20"
                  />
                )}

                {/* Icon */}
                <div className="relative mb-2">
                  <Icon className={`w-12 h-12 ${isLocked ? 'opacity-40' : ''}`} />
                  {isLocked && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-1">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className={`text-sm font-semibold text-center ${isLocked ? 'opacity-40' : ''}`}>
                  {app.name}
                </span>

                {/* XP Required */}
                {isLocked && app.requiredXP && (
                  <span className="text-xs mt-1 opacity-60">
                    {app.requiredXP - currentXP} XP needed
                  </span>
                )}

                {/* New badge */}
                {canUnlock && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    NEW!
                  </div>
                )}
              </button>

              {/* Description tooltip */}
              <p className="text-xs text-gray-600 text-center mt-2 px-2">
                {app.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Coming Soon */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 text-center">
          <span className="font-semibold">More apps coming soon!</span> Keep earning XP to unlock new learning experiences.
        </p>
      </div>
    </Card>
  );
}
