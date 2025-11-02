'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { World } from '@/types/demo';
import { Lock, Check } from 'lucide-react';

interface WorldUnlockProps {
  worlds: World[];
  currentXP: number;
}

export function WorldUnlock({ worlds, currentXP }: WorldUnlockProps) {
  const nextWorld = worlds.find(w => !w.unlocked);
  const unlockedCount = worlds.filter(w => w.unlocked).length;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Worlds ({unlockedCount}/{worlds.length})
      </h3>

      <div className="space-y-3">
        {worlds.map((world, index) => {
          const progress = world.unlocked 
            ? 100 
            : Math.min(100, (currentXP / world.requiredXP) * 100);
          
          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className={`
                  p-4 rounded-xl border-2 transition-all
                  ${world.unlocked 
                    ? `bg-gradient-to-r ${world.color} border-transparent text-white shadow-lg` 
                    : 'bg-gray-50 border-gray-300 text-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      text-4xl
                      ${!world.unlocked && 'opacity-40 grayscale'}
                    `}>
                      {world.icon}
                    </div>
                    <div>
                      <h4 className={`font-bold ${world.unlocked ? 'text-white' : 'text-gray-900'}`}>
                        {world.name}
                      </h4>
                      <p className={`text-sm ${world.unlocked ? 'text-white/80' : 'text-gray-500'}`}>
                        {world.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {world.unlocked ? (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <Lock className="w-4 h-4" />
                          <span>{world.requiredXP} XP</span>
                        </div>
                        <p className="text-xs opacity-70">
                          {world.requiredXP - currentXP} more
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar for Next World */}
                {!world.unlocked && world.id === nextWorld?.id && (
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {Math.round(progress)}% to unlock
                    </p>
                  </div>
                )}
              </div>

              {/* Unlock Animation */}
              {world.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                >
                  <span className="text-lg">✨</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Next Unlock Info */}
      {nextWorld && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Next unlock:</span> {nextWorld.name} at {nextWorld.requiredXP} XP
          </p>
        </div>
      )}
    </Card>
  );
}
