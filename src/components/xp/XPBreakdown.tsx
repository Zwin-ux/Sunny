'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Award } from 'lucide-react';
import { useXP } from '@/contexts/XPContext';

export function XPBreakdown() {
  const { getXPHistory, getXPBreakdown, xp } = useXP();

  const recentHistory = getXPHistory(10);
  const breakdown = getXPBreakdown();

  // Calculate total for percentage
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Sort breakdown by value (highest first)
  const sortedBreakdown = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 sources

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* XP Sources Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-2xl font-black text-gray-900">XP Sources</h3>
            <p className="text-sm text-gray-700 font-medium">Where your XP comes from</p>
          </div>
        </div>

        {sortedBreakdown.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 font-medium">No XP earned yet!</p>
            <p className="text-sm text-gray-500">Start learning to see your progress here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBreakdown.map(([source, amount], index) => {
              const percentage = total > 0 ? (amount / total) * 100 : 0;

              return (
                <motion.div
                  key={source}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">{source}</span>
                    <span className="text-lg font-black text-blue-600">
                      {amount} XP
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-200 border border-black rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>

                  <div className="mt-1 text-xs text-gray-600 font-semibold text-right">
                    {percentage.toFixed(1)}% of total
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Total */}
        <div className="mt-6 pt-4 border-t-2 border-black">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-gray-900">Total XP Earned</span>
            <span className="text-2xl font-black text-purple-600">{xp}</span>
          </div>
        </div>
      </motion.div>

      {/* Recent XP History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-100 to-teal-100 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-2xl font-black text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-700 font-medium">Last 10 XP gains</p>
          </div>
        </div>

        {recentHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 font-medium">No activity yet!</p>
            <p className="text-sm text-gray-500">Complete activities to earn XP</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentHistory.map((entry, index) => {
              const date = new Date(entry.timestamp);
              const timeAgo = getTimeAgo(entry.timestamp);

              return (
                <motion.div
                  key={entry.timestamp + index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {entry.reason}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">{timeAgo}</p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-500 text-white text-sm font-black border border-black rounded">
                        +{entry.amount}
                      </span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
