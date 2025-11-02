/**
 * Leaderboard system for Sunny Learning OS
 * Manages high scores and rankings in demo mode
 */

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  timestamp: number;
  emoji?: string;
}

const STORAGE_KEY = 'sunny_leaderboard';
const MAX_ENTRIES = 50;

// Demo seed data for initial leaderboard
const SEED_ENTRIES: Omit<LeaderboardEntry, 'id' | 'timestamp'>[] = [
  { name: 'Alex the Explorer', xp: 8540, level: 12, emoji: '🚀' },
  { name: 'Maya Math Master', xp: 7230, level: 11, emoji: '🎯' },
  { name: 'Jamie Genius', xp: 6890, level: 10, emoji: '🌟' },
  { name: 'Casey Curious', xp: 6120, level: 10, emoji: '🔬' },
  { name: 'Sam Smarty', xp: 5670, level: 9, emoji: '📚' },
  { name: 'Riley Robot', xp: 4980, level: 9, emoji: '🤖' },
  { name: 'Jordan Wizard', xp: 4450, level: 8, emoji: '⚡' },
  { name: 'Taylor Talent', xp: 4120, level: 8, emoji: '💡' },
  { name: 'Morgan Mind', xp: 3680, level: 7, emoji: '🧠' },
  { name: 'Charlie Champ', xp: 3340, level: 7, emoji: '🏆' },
  { name: 'Dakota Dream', xp: 2980, level: 6, emoji: '✨' },
  { name: 'Avery Ace', xp: 2560, level: 6, emoji: '⭐' },
  { name: 'Quinn Quest', xp: 2230, level: 5, emoji: '🗺️' },
  { name: 'Peyton Pro', xp: 1890, level: 5, emoji: '💪' },
  { name: 'Skyler Star', xp: 1450, level: 4, emoji: '🌠' },
];

/**
 * Initialize leaderboard with seed data if empty
 */
function initializeLeaderboard(): LeaderboardEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    }
  }

  // Create seed entries with IDs and timestamps
  const now = Date.now();
  const seedEntries: LeaderboardEntry[] = SEED_ENTRIES.map((entry, index) => ({
    ...entry,
    id: `seed-${index}`,
    timestamp: now - (index * 3600000), // Stagger timestamps by 1 hour
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
  return seedEntries;
}

/**
 * Get all leaderboard entries, sorted by XP (highest first)
 */
export function getLeaderboard(): LeaderboardEntry[] {
  const entries = initializeLeaderboard();
  return entries.sort((a, b) => b.xp - a.xp);
}

/**
 * Get top N entries from leaderboard
 */
export function getTopEntries(limit: number = 10): LeaderboardEntry[] {
  return getLeaderboard().slice(0, limit);
}

/**
 * Add a new entry to the leaderboard
 */
export function addLeaderboardEntry(
  name: string,
  xp: number,
  level: number,
  emoji?: string
): LeaderboardEntry {
  const entries = getLeaderboard();

  const newEntry: LeaderboardEntry = {
    id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim() || 'Anonymous',
    xp,
    level,
    emoji: emoji || '🌟',
    timestamp: Date.now(),
  };

  entries.push(newEntry);

  // Keep only top MAX_ENTRIES
  const sorted = entries.sort((a, b) => b.xp - a.xp).slice(0, MAX_ENTRIES);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));

  return newEntry;
}

/**
 * Get user's rank on the leaderboard
 */
export function getUserRank(xp: number): number {
  const entries = getLeaderboard();
  const rank = entries.findIndex(entry => xp > entry.xp);

  if (rank === -1) {
    return entries.length + 1; // User would be last
  }

  return rank + 1;
}

/**
 * Check if user's XP qualifies for the leaderboard
 */
export function qualifiesForLeaderboard(xp: number): boolean {
  const entries = getLeaderboard();

  if (entries.length < MAX_ENTRIES) {
    return true; // Always qualify if board isn't full
  }

  const lowestEntry = entries[entries.length - 1];
  return xp > lowestEntry.xp;
}

/**
 * Get entries around a specific XP value (for context)
 */
export function getEntriesNear(xp: number, range: number = 2): {
  above: LeaderboardEntry[];
  below: LeaderboardEntry[];
  userRank: number;
} {
  const entries = getLeaderboard();
  const rank = getUserRank(xp);

  const startIndex = Math.max(0, rank - range - 1);
  const endIndex = Math.min(entries.length, rank + range);

  return {
    above: entries.slice(startIndex, rank - 1),
    below: entries.slice(rank, endIndex),
    userRank: rank,
  };
}

/**
 * Clear all leaderboard data (reset)
 */
export function resetLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY);
}
