/**
 * Real Achievement System
 * Engaging, personality-driven achievements that motivate students
 */

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xp: number;
  category: 'mastery' | 'progress' | 'streak' | 'special' | 'topic';
}

/**
 * Real, engaging achievements - not generic placeholders!
 */
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // MASTERY ACHIEVEMENTS
  mathWizard: {
    id: 'math_wizard',
    title: '🧙‍♂️ Math Wizard',
    description: 'Perfect score! You\'ve mastered this topic!',
    icon: '🧙‍♂️',
    rarity: 'epic',
    xp: 100,
    category: 'mastery'
  },

  lightningLearner: {
    id: 'lightning_learner',
    title: '⚡ Lightning Learner',
    description: 'Answered all questions in record time!',
    icon: '⚡',
    rarity: 'rare',
    xp: 75,
    category: 'mastery'
  },

  soloSolver: {
    id: 'solo_solver',
    title: '🎯 Solo Solver',
    description: 'Solved everything without hints - independent thinker!',
    icon: '🎯',
    rarity: 'rare',
    xp: 75,
    category: 'mastery'
  },

  perfectStreak: {
    id: 'flawless_victory',
    title: '💎 Flawless Victory',
    description: 'Perfect score with no mistakes - absolute mastery!',
    icon: '💎',
    rarity: 'legendary',
    xp: 150,
    category: 'mastery'
  },

  // PROGRESS ACHIEVEMENTS
  levelClimber: {
    id: 'level_climber',
    title: '🚀 Level Climber',
    description: 'Difficulty increased! You\'re ready for bigger challenges!',
    icon: '🚀',
    rarity: 'common',
    xp: 50,
    category: 'progress'
  },

  neverGiveUp: {
    id: 'never_give_up',
    title: '💪 Never Give Up',
    description: 'Kept trying even when it was hard - that\'s real learning!',
    icon: '💪',
    rarity: 'uncommon',
    xp: 60,
    category: 'progress'
  },

  quickImprover: {
    id: 'fast_learner',
    title: '📈 Fast Learner',
    description: 'Improved from 50% to 100% - amazing progress!',
    icon: '📈',
    rarity: 'uncommon',
    xp: 60,
    category: 'progress'
  },

  // STREAK ACHIEVEMENTS
  onFire: {
    id: 'on_fire',
    title: '🔥 On Fire!',
    description: '5 correct in a row - you\'re unstoppable!',
    icon: '🔥',
    rarity: 'rare',
    xp: 75,
    category: 'streak'
  },

  hotStreak: {
    id: 'hot_streak',
    title: '🌟 Hot Streak',
    description: '3 correct in a row - momentum building!',
    icon: '🌟',
    rarity: 'uncommon',
    xp: 50,
    category: 'streak'
  },

  comebackKid: {
    id: 'comeback_kid',
    title: '✨ Comeback Kid',
    description: 'Turned it around after a tough start!',
    icon: '✨',
    rarity: 'uncommon',
    xp: 60,
    category: 'streak'
  },

  unstoppable: {
    id: 'unstoppable_force',
    title: '⭐ Unstoppable Force',
    description: '10 correct in a row - legendary performance!',
    icon: '⭐',
    rarity: 'legendary',
    xp: 200,
    category: 'streak'
  },

  // TOPIC MASTERY ACHIEVEMENTS
  additionAce: {
    id: 'addition_ace',
    title: '➕ Addition Ace',
    description: 'Mastered addition - ready for multiplication!',
    icon: '➕',
    rarity: 'uncommon',
    xp: 60,
    category: 'topic'
  },

  multiplicationMaster: {
    id: 'multiplication_master',
    title: '✖️ Multiplication Master',
    description: 'Times tables conquered - division awaits!',
    icon: '✖️',
    rarity: 'rare',
    xp: 75,
    category: 'topic'
  },

  fractionFanatic: {
    id: 'fraction_fanatic',
    title: '🍕 Fraction Fanatic',
    description: 'Fractions make sense now - decimals next!',
    icon: '🍕',
    rarity: 'rare',
    xp: 75,
    category: 'topic'
  },

  wordWizard: {
    id: 'word_wizard',
    title: '📖 Word Wizard',
    description: 'Conquered word problems - critical thinking unlocked!',
    icon: '📖',
    rarity: 'epic',
    xp: 100,
    category: 'topic'
  },

  geometryGenius: {
    id: 'geometry_genius',
    title: '📐 Geometry Genius',
    description: 'Shapes, angles, and areas - all mastered!',
    icon: '📐',
    rarity: 'rare',
    xp: 75,
    category: 'topic'
  },

  algebraAce: {
    id: 'algebra_ace',
    title: '🔢 Algebra Ace',
    description: 'Variables and equations - no problem!',
    icon: '🔢',
    rarity: 'epic',
    xp: 100,
    category: 'topic'
  },

  // SPECIAL ACHIEVEMENTS
  morningStar: {
    id: 'morning_star',
    title: '🌅 Morning Star',
    description: 'Practiced before 9 AM - dedication!',
    icon: '🌅',
    rarity: 'rare',
    xp: 75,
    category: 'special'
  },

  nightScholar: {
    id: 'night_scholar',
    title: '🦉 Night Scholar',
    description: 'Learning after dark - impressive focus!',
    icon: '🦉',
    rarity: 'rare',
    xp: 75,
    category: 'special'
  },

  weekendChampion: {
    id: 'weekend_champion',
    title: '🏆 Weekend Champion',
    description: 'Practiced on the weekend - true dedication!',
    icon: '🏆',
    rarity: 'uncommon',
    xp: 60,
    category: 'special'
  },

  earlyBird: {
    id: 'early_bird',
    title: '🐦 Early Bird',
    description: 'First practice of the day - gets the worm!',
    icon: '🐦',
    rarity: 'common',
    xp: 40,
    category: 'special'
  },

  speedDemon: {
    id: 'speed_demon',
    title: '💨 Speed Demon',
    description: 'Fastest time ever - lightning quick!',
    icon: '💨',
    rarity: 'rare',
    xp: 75,
    category: 'special'
  },

  deepThinker: {
    id: 'deep_thinker',
    title: '🤔 Deep Thinker',
    description: 'Took time to understand - quality over speed!',
    icon: '🤔',
    rarity: 'uncommon',
    xp: 50,
    category: 'special'
  },

  helpfulHints: {
    id: 'smart_helper',
    title: '💡 Smart Helper',
    description: 'Used hints wisely - knowing when to ask is smart!',
    icon: '💡',
    rarity: 'common',
    xp: 40,
    category: 'special'
  },

  centurion: {
    id: 'centurion',
    title: '💯 Centurion',
    description: '100 questions answered - dedication pays off!',
    icon: '💯',
    rarity: 'epic',
    xp: 100,
    category: 'special'
  },

  marathoner: {
    id: 'marathoner',
    title: '🏃 Marathoner',
    description: '1000 questions answered - unstoppable learner!',
    icon: '🏃',
    rarity: 'legendary',
    xp: 250,
    category: 'special'
  }
};

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return Object.values(ACHIEVEMENTS).find(a => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter(a => a.rarity === rarity);
}

/**
 * Calculate total XP from achievements
 */
export function calculateTotalXP(achievementIds: string[]): number {
  return achievementIds.reduce((total, id) => {
    const achievement = getAchievement(id);
    return total + (achievement?.xp || 0);
  }, 0);
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: AchievementRarity): string {
  const colors = {
    common: 'gray',
    uncommon: 'green',
    rare: 'blue',
    epic: 'purple',
    legendary: 'orange'
  };
  return colors[rarity];
}

/**
 * Get rarity display name
 */
export function getRarityName(rarity: AchievementRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}
