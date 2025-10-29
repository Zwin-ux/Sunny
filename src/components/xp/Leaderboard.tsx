'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTopEntries,
  addLeaderboardEntry,
  getUserRank,
  qualifiesForLeaderboard,
  type LeaderboardEntry,
} from '@/lib/leaderboard';
import { useXP } from '@/contexts/XPContext';

interface LeaderboardProps {
  onClose?: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const { xp, level } = useXP();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedEntryId, setSubmittedEntryId] = useState<string | null>(null);

  const EMOJI_OPTIONS = ['🌟', '🚀', '🎯', '🏆', '⚡', '💡', '🧠', '🔬', '🎨', '🤖', '✨', '🔥'];

  useEffect(() => {
    loadLeaderboard();

    // Check if user has already submitted
    const submitted = localStorage.getItem('leaderboard_submitted');
    if (submitted) {
      setHasSubmitted(true);
      setSubmittedEntryId(submitted);
    }
  }, []);

  const loadLeaderboard = () => {
    const top = getTopEntries(15);
    setEntries(top);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      return;
    }

    const entry = addLeaderboardEntry(playerName, xp, level, selectedEmoji);
    localStorage.setItem('leaderboard_submitted', entry.id);

    setHasSubmitted(true);
    setSubmittedEntryId(entry.id);
    setShowSubmitForm(false);
    loadLeaderboard();
  };

  const userRank = getUserRank(xp);
  const qualifies = qualifiesForLeaderboard(xp);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-black rounded-2xl p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-600" />
            <div>
              <h2 className="text-3xl font-black text-gray-900">Top Learners</h2>
              <p className="text-gray-700 font-medium">The highest XP achievers!</p>
            </div>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-2 border-black"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* User's Stats */}
        <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Your Score</p>
              <p className="text-2xl font-black text-gray-900">{xp.toLocaleString()} XP</p>
              <p className="text-sm text-gray-600">Level {level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-semibold">Your Rank</p>
              <p className="text-3xl font-black text-blue-600">#{userRank}</p>
              {qualifies && !hasSubmitted && (
                <Button
                  onClick={() => setShowSubmitForm(true)}
                  size="sm"
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Submit Score
                </Button>
              )}
              {hasSubmitted && (
                <p className="text-sm text-green-600 font-bold mt-2">✓ Score Submitted!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Form */}
      <AnimatePresence>
        {showSubmitForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-100 border-4 border-black rounded-2xl p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h3 className="text-2xl font-black text-gray-900 mb-4">Submit Your Score</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full px-4 py-3 text-lg font-bold border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Choose Your Emoji
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`p-3 text-2xl border-2 border-black rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-yellow-300 scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Submit to Leaderboard
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  variant="outline"
                  className="border-2 border-black"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard List */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 border-b-4 border-black">
          <h3 className="text-2xl font-black text-white">Top 15 Rankings</h3>
        </div>

        <div className="divide-y-2 divide-gray-200">
          {entries.map((entry, index) => {
            const isUserEntry = entry.id === submittedEntryId;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isUserEntry ? 'bg-yellow-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-16">
                    {index === 0 && (
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {index === 1 && (
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Medal className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {index === 2 && (
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Medal className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {index > 2 && (
                      <div className="text-2xl font-black text-gray-400 text-center">
                        #{index + 1}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{entry.emoji}</span>
                      <span className="text-lg font-black text-gray-900 truncate">
                        {entry.name}
                      </span>
                      {isUserEntry && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-yellow-300 text-gray-900 border border-black rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Level {entry.level}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-600">
                      {entry.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 font-semibold">XP</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t-4 border-black text-center">
          <p className="text-sm text-gray-600 font-medium">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Keep learning to climb the ranks!
          </p>
        </div>
      </div>
    </div>
  );
}
