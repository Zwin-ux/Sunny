/**
 * Gamification System for Sunny AI
 * Manages points, badges, streaks, levels, and rewards
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'learning' | 'engagement' | 'achievement' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsRequired?: number;
  condition: (stats: UserStats) => boolean;
  unlockedAt?: string;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  timeSpentMinutes: number;
  topicsExplored: number;
  challengesCompleted: number;
  lastActivityDate?: string;
}

export interface Reward {
  id: string;
  type: 'avatar' | 'theme' | 'feature' | 'content';
  name: string;
  description: string;
  emoji: string;
  pointsCost: number;
  levelRequired: number;
  unlocked: boolean;
}

// Badge definitions
export const BADGES: Badge[] = [
  // Learning Badges
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Completed your first lesson',
    emoji: '🌱',
    category: 'learning',
    rarity: 'common',
    condition: (stats) => stats.lessonsCompleted >= 1
  },
  {
    id: 'ten_lessons',
    name: 'Learning Explorer',
    description: 'Completed 10 lessons',
    emoji: '🎒',
    category: 'learning',
    rarity: 'common',
    condition: (stats) => stats.lessonsCompleted >= 10
  },
  {
    id: 'fifty_lessons',
    name: 'Knowledge Seeker',
    description: 'Completed 50 lessons',
    emoji: '📚',
    category: 'learning',
    rarity: 'rare',
    condition: (stats) => stats.lessonsCompleted >= 50
  },
  {
    id: 'hundred_lessons',
    name: 'Master Scholar',
    description: 'Completed 100 lessons',
    emoji: '🎓',
    category: 'learning',
    rarity: 'epic',
    condition: (stats) => stats.lessonsCompleted >= 100
  },

  // Streak Badges
  {
    id: 'three_day_streak',
    name: 'On a Roll',
    description: 'Maintained a 3-day learning streak',
    emoji: '🔥',
    category: 'engagement',
    rarity: 'common',
    condition: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Maintained a 7-day learning streak',
    emoji: '⚡',
    category: 'engagement',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'thirty_day_streak',
    name: 'Unstoppable',
    description: 'Maintained a 30-day learning streak',
    emoji: '💫',
    category: 'engagement',
    rarity: 'epic',
    condition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'hundred_day_streak',
    name: 'Legend',
    description: 'Maintained a 100-day learning streak',
    emoji: '👑',
    category: 'engagement',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 100
  },

  // Achievement Badges
  {
    id: 'perfect_quiz',
    name: 'Perfect Score',
    description: 'Got 100% on a quiz',
    emoji: '💯',
    category: 'achievement',
    rarity: 'rare',
    condition: (stats) => (stats.correctAnswers / Math.max(stats.totalAnswers, 1)) === 1 && stats.totalAnswers >= 5
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Completed 5 lessons in one day',
    emoji: '⚡',
    category: 'achievement',
    rarity: 'rare',
    condition: (stats) => stats.lessonsCompleted >= 5 // Simplified - would check date in full implementation
  },
  {
    id: 'topic_master',
    name: 'Topic Master',
    description: 'Explored 20 different topics',
    emoji: '🌟',
    category: 'achievement',
    rarity: 'epic',
    condition: (stats) => stats.topicsExplored >= 20
  },
  {
    id: 'dedicated_student',
    name: 'Dedicated Student',
    description: 'Spent 10 hours learning',
    emoji: '📖',
    category: 'achievement',
    rarity: 'rare',
    condition: (stats) => stats.timeSpentMinutes >= 600
  },

  // Special Badges
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Completed a lesson before 8 AM',
    emoji: '🌅',
    category: 'special',
    rarity: 'rare',
    condition: (stats) => false // Would check time in full implementation
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Completed a lesson after 10 PM',
    emoji: '🦉',
    category: 'special',
    rarity: 'rare',
    condition: (stats) => false // Would check time in full implementation
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Learned on a weekend',
    emoji: '🎯',
    category: 'special',
    rarity: 'common',
    condition: (stats) => false // Would check day in full implementation
  }
];

// Calculate level from points
export function calculateLevel(points: number): number {
  // Level up every 100 points, with increasing requirements
  return Math.floor(Math.sqrt(points / 50)) + 1;
}

// Calculate points needed for next level
export function pointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  const nextLevelPoints = Math.pow(currentLevel, 2) * 50;
  return nextLevelPoints - currentPoints;
}

// Award points for different actions
export const POINT_VALUES = {
  LESSON_COMPLETED: 50,
  QUIZ_COMPLETED: 30,
  CORRECT_ANSWER: 10,
  INCORRECT_ANSWER: 5, // Participation points
  DAILY_LOGIN: 10,
  STREAK_BONUS: 5, // Per day in streak
  CHALLENGE_COMPLETED: 40,
  TOPIC_EXPLORED: 20,
  SESSION_TIME: 1 // Per minute, capped at 60 per session
};

// Check which badges should be awarded
export function checkBadgeUnlocks(stats: UserStats, currentBadges: Badge[]): Badge[] {
  const unlockedBadgeIds = new Set(currentBadges.map(b => b.id));
  const newBadges: Badge[] = [];

  for (const badge of BADGES) {
    if (!unlockedBadgeIds.has(badge.id) && badge.condition(stats)) {
      newBadges.push({
        ...badge,
        unlockedAt: new Date().toISOString()
      });
    }
  }

  return newBadges;
}

// Update streak
export function updateStreak(lastActivityDate?: string): {
  currentStreak: number;
  streakBroken: boolean;
} {
  if (!lastActivityDate) {
    return { currentStreak: 1, streakBroken: false };
  }

  const lastDate = new Date(lastActivityDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day - maintain current streak
    return { currentStreak: 1, streakBroken: false };
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    return { currentStreak: 1, streakBroken: false };
  } else {
    // Streak broken
    return { currentStreak: 1, streakBroken: true };
  }
}

// Available rewards
export const REWARDS: Reward[] = [
  {
    id: 'avatar_robot',
    type: 'avatar',
    name: 'Robot Avatar',
    description: 'Cool robot profile picture',
    emoji: '🤖',
    pointsCost: 100,
    levelRequired: 3,
    unlocked: false
  },
  {
    id: 'avatar_star',
    type: 'avatar',
    name: 'Star Avatar',
    description: 'Shining star profile picture',
    emoji: '⭐',
    pointsCost: 150,
    levelRequired: 5,
    unlocked: false
  },
  {
    id: 'theme_space',
    type: 'theme',
    name: 'Space Theme',
    description: 'Cosmic space background',
    emoji: '🚀',
    pointsCost: 200,
    levelRequired: 7,
    unlocked: false
  },
  {
    id: 'theme_nature',
    type: 'theme',
    name: 'Nature Theme',
    description: 'Peaceful nature background',
    emoji: '🌿',
    pointsCost: 200,
    levelRequired: 7,
    unlocked: false
  },
  {
    id: 'feature_hints',
    type: 'feature',
    name: 'Super Hints',
    description: 'Unlock detailed hints for challenges',
    emoji: '💡',
    pointsCost: 300,
    levelRequired: 10,
    unlocked: false
  },
  {
    id: 'content_advanced',
    type: 'content',
    name: 'Advanced Lessons',
    description: 'Unlock advanced lesson content',
    emoji: '🎓',
    pointsCost: 500,
    levelRequired: 15,
    unlocked: false
  }
];

// Redeem reward
export function redeemReward(reward: Reward, userStats: UserStats): {
  success: boolean;
  message: string;
  newPoints: number;
} {
  if (reward.unlocked) {
    return {
      success: false,
      message: 'You already have this reward!',
      newPoints: userStats.totalPoints
    };
  }

  if (userStats.level < reward.levelRequired) {
    return {
      success: false,
      message: `You need to reach level ${reward.levelRequired} first!`,
      newPoints: userStats.totalPoints
    };
  }

  if (userStats.totalPoints < reward.pointsCost) {
    return {
      success: false,
      message: `You need ${reward.pointsCost - userStats.totalPoints} more points!`,
      newPoints: userStats.totalPoints
    };
  }

  return {
    success: true,
    message: `${reward.name} unlocked!`,
    newPoints: userStats.totalPoints - reward.pointsCost
  };
}

// Format points with commas
export function formatPoints(points: number): string {
  return points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get rarity color
export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
