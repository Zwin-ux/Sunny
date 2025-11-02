import { Answer, Badge, BadgeType, World, WorldType, GameProgress } from '@/types/demo';

/**
 * All available badges
 */
export const ALL_BADGES: Badge[] = [
  {
    id: 'first_correct',
    name: 'First Steps',
    description: 'Got your first answer correct!',
    icon: '⭐',
    earned: false,
  },
  {
    id: 'streak_3',
    name: 'On Fire',
    description: '3 correct answers in a row',
    icon: '🔥',
    earned: false,
  },
  {
    id: 'streak_5',
    name: 'Unstoppable',
    description: '5 correct answers in a row',
    icon: '🚀',
    earned: false,
  },
  {
    id: 'perfect_mission',
    name: 'Perfect Score',
    description: 'Completed a mission with 100% accuracy',
    icon: '💯',
    earned: false,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answered 5 questions in under 5 seconds each',
    icon: '⚡',
    earned: false,
  },
  {
    id: 'persistent',
    name: 'Never Give Up',
    description: 'Completed a mission despite struggles',
    icon: '💪',
    earned: false,
  },
  {
    id: 'math_master',
    name: 'Math Master',
    description: 'Scored 80%+ on a hard mission',
    icon: '🎓',
    earned: false,
  },
  {
    id: 'world_explorer',
    name: 'World Explorer',
    description: 'Unlocked all worlds',
    icon: '🌍',
    earned: false,
  },
];

/**
 * All available worlds
 */
export const ALL_WORLDS: World[] = [
  {
    id: 'math_galaxy',
    name: 'Math Galaxy',
    description: 'Explore the cosmos of numbers',
    icon: '🌌',
    requiredXP: 0,
    unlocked: true,
    color: 'from-purple-500 to-blue-500',
  },
  {
    id: 'robot_city',
    name: 'Robot City',
    description: 'Build and program robots',
    icon: '🤖',
    requiredXP: 100,
    unlocked: false,
    color: 'from-gray-500 to-blue-500',
  },
  {
    id: 'space_quest',
    name: 'Space Quest',
    description: 'Journey through the stars',
    icon: '🚀',
    requiredXP: 250,
    unlocked: false,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'ocean_deep',
    name: 'Ocean Deep',
    description: 'Dive into underwater adventures',
    icon: '🌊',
    requiredXP: 500,
    unlocked: false,
    color: 'from-blue-500 to-cyan-500',
  },
];

/**
 * Calculate XP earned from answers
 */
export function calculateXP(answers: Answer[]): number {
  let xp = 0;
  
  answers.forEach((answer, index) => {
    if (answer.correct) {
      // Base XP for correct answer
      xp += 10;
      
      // Bonus for difficulty
      switch (answer.difficulty) {
        case 'beginner': xp += 0; break;
        case 'easy': xp += 5; break;
        case 'medium': xp += 10; break;
        case 'hard': xp += 20; break;
      }
      
      // Speed bonus (under 10 seconds)
      if (answer.timeSpent < 10000) {
        xp += 5;
      }
      
      // Streak bonus
      if (index > 0 && answers[index - 1].correct) {
        xp += 3;
      }
    }
  });
  
  return xp;
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  // Level up every 100 XP
  return Math.floor(xp / 100) + 1;
}

/**
 * Check which badges should be earned
 */
export function checkBadges(answers: Answer[], currentBadges: Badge[]): Badge[] {
  const newBadges = [...currentBadges];
  const earnedIds = new Set(currentBadges.filter(b => b.earned).map(b => b.id));
  
  // First correct
  if (!earnedIds.has('first_correct') && answers.some(a => a.correct)) {
    const badge = newBadges.find(b => b.id === 'first_correct');
    if (badge) {
      badge.earned = true;
      badge.earnedAt = Date.now();
    }
  }
  
  // Streak 3
  if (!earnedIds.has('streak_3')) {
    let streak = 0;
    for (const answer of answers) {
      if (answer.correct) {
        streak++;
        if (streak >= 3) {
          const badge = newBadges.find(b => b.id === 'streak_3');
          if (badge) {
            badge.earned = true;
            badge.earnedAt = Date.now();
          }
          break;
        }
      } else {
        streak = 0;
      }
    }
  }
  
  // Streak 5
  if (!earnedIds.has('streak_5')) {
    let streak = 0;
    for (const answer of answers) {
      if (answer.correct) {
        streak++;
        if (streak >= 5) {
          const badge = newBadges.find(b => b.id === 'streak_5');
          if (badge) {
            badge.earned = true;
            badge.earnedAt = Date.now();
          }
          break;
        }
      } else {
        streak = 0;
      }
    }
  }
  
  // Perfect mission
  if (!earnedIds.has('perfect_mission')) {
    const allCorrect = answers.length > 0 && answers.every(a => a.correct);
    if (allCorrect) {
      const badge = newBadges.find(b => b.id === 'perfect_mission');
      if (badge) {
        badge.earned = true;
        badge.earnedAt = Date.now();
      }
    }
  }
  
  // Speed demon
  if (!earnedIds.has('speed_demon')) {
    const fastAnswers = answers.filter(a => a.correct && a.timeSpent < 5000);
    if (fastAnswers.length >= 5) {
      const badge = newBadges.find(b => b.id === 'speed_demon');
      if (badge) {
        badge.earned = true;
        badge.earnedAt = Date.now();
      }
    }
  }
  
  // Persistent
  if (!earnedIds.has('persistent')) {
    const wrongCount = answers.filter(a => !a.correct).length;
    const completed = answers.length >= 7;
    if (completed && wrongCount >= 3) {
      const badge = newBadges.find(b => b.id === 'persistent');
      if (badge) {
        badge.earned = true;
        badge.earnedAt = Date.now();
      }
    }
  }
  
  // Math master
  if (!earnedIds.has('math_master')) {
    const hardAnswers = answers.filter(a => a.difficulty === 'hard');
    const hardCorrect = hardAnswers.filter(a => a.correct).length;
    const accuracy = hardAnswers.length > 0 ? hardCorrect / hardAnswers.length : 0;
    if (hardAnswers.length >= 3 && accuracy >= 0.8) {
      const badge = newBadges.find(b => b.id === 'math_master');
      if (badge) {
        badge.earned = true;
        badge.earnedAt = Date.now();
      }
    }
  }
  
  return newBadges;
}

/**
 * Check which worlds should be unlocked
 */
export function checkWorldUnlocks(xp: number, currentWorlds: World[]): World[] {
  return currentWorlds.map(world => ({
    ...world,
    unlocked: xp >= world.requiredXP,
  }));
}

/**
 * Get next world to unlock
 */
export function getNextWorld(xp: number, worlds: World[]): World | null {
  const locked = worlds.filter(w => !w.unlocked).sort((a, b) => a.requiredXP - b.requiredXP);
  return locked[0] || null;
}

/**
 * Calculate progress to next world (0-100)
 */
export function getWorldProgress(xp: number, worlds: World[]): number {
  const nextWorld = getNextWorld(xp, worlds);
  if (!nextWorld) return 100; // All unlocked
  
  const previousWorld = worlds
    .filter(w => w.requiredXP < nextWorld.requiredXP)
    .sort((a, b) => b.requiredXP - a.requiredXP)[0];
  
  const startXP = previousWorld?.requiredXP || 0;
  const endXP = nextWorld.requiredXP;
  const currentXP = xp - startXP;
  const totalXP = endXP - startXP;
  
  return Math.min(100, Math.round((currentXP / totalXP) * 100));
}

/**
 * Initialize game progress
 */
export function initializeGameProgress(): GameProgress {
  return {
    xp: 0,
    level: 1,
    badges: ALL_BADGES.map(b => ({ ...b })),
    unlockedWorlds: ['math_galaxy'],
    currentWorld: 'math_galaxy',
  };
}

/**
 * Update game progress after completing mission
 */
export function updateGameProgress(
  currentProgress: GameProgress,
  answers: Answer[]
): GameProgress {
  const earnedXP = calculateXP(answers);
  const newXP = currentProgress.xp + earnedXP;
  const newLevel = calculateLevel(newXP);
  
  const updatedBadges = checkBadges(answers, currentProgress.badges);
  const updatedWorlds = checkWorldUnlocks(newXP, ALL_WORLDS);
  const unlockedWorldIds = updatedWorlds.filter(w => w.unlocked).map(w => w.id);
  
  // Check for world explorer badge
  if (unlockedWorldIds.length === ALL_WORLDS.length) {
    const explorerBadge = updatedBadges.find(b => b.id === 'world_explorer');
    if (explorerBadge && !explorerBadge.earned) {
      explorerBadge.earned = true;
      explorerBadge.earnedAt = Date.now();
    }
  }
  
  return {
    xp: newXP,
    level: newLevel,
    badges: updatedBadges,
    unlockedWorlds: unlockedWorldIds,
    currentWorld: currentProgress.currentWorld,
  };
}
