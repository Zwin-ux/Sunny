'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/types/demo';
import { Award } from 'lucide-react';

interface BadgeDisplayProps {
  badges: Badge[];
  newlyEarned?: Badge[];
}

export function BadgeDisplay({ badges, newlyEarned = [] }: BadgeDisplayProps) {
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="space-y-4">
      {/* Newly Earned Badge Popup */}
      <AnimatePresence>
        {newlyEarned.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <Card className="p-8 bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400 shadow-2xl">
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-8xl mb-4"
                >
                  {badge.icon}
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Badge Earned!
                </h3>
                <p className="text-xl font-semibold text-yellow-700 mb-1">
                  {badge.name}
                </p>
                <p className="text-gray-600">{badge.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Badge Collection */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Badges ({earnedBadges.length}/{badges.length})
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {/* Earned Badges */}
          {earnedBadges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative group cursor-pointer"
            >
              <div className="aspect-square bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl border-2 border-yellow-400 flex items-center justify-center shadow-md">
                <span className="text-4xl">{badge.icon}</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-gray-300 text-xs">{badge.description}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Locked Badges */}
          {lockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="relative group cursor-help"
            >
              <div className="aspect-square bg-gray-100 rounded-xl border-2 border-gray-300 flex items-center justify-center opacity-40">
                <span className="text-4xl grayscale">{badge.icon}</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                  <p className="font-semibold text-gray-400">{badge.name}</p>
                  <p className="text-gray-500 text-xs">{badge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
