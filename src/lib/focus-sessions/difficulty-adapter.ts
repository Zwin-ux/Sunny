// Difficulty Adapter - Adjusts difficulty based on student performance
// Implements tier transitions with reasoning

import { DifficultyLevel } from '@/types/chat';
import { DifficultyAdjustment, LoopPerformance, DEFAULT_SESSION_CONFIG } from '@/types/focus-session';
import { logger } from '@/lib/logger';

export class DifficultyAdapter {
  private config = DEFAULT_SESSION_CONFIG;

  /**
   * Determine if difficulty should be adjusted based on performance
   */
  shouldAdjustDifficulty(performance: LoopPerformance, currentDifficulty: DifficultyLevel): {
    shouldAdjust: boolean;
    newDifficulty?: DifficultyLevel;
    reason?: string;
    triggerMetric?: 'accuracy' | 'frustration' | 'speed' | 'engagement';
    triggerValue?: number;
  } {
    // Check frustration first - highest priority
    if (performance.frustrationLevel >= this.config.frustrationThreshold) {
      const newDifficulty = this.decreaseDifficulty(currentDifficulty);
      if (newDifficulty !== currentDifficulty) {
        return {
          shouldAdjust: true,
          newDifficulty,
          reason: 'High frustration detected - simplifying content to build confidence',
          triggerMetric: 'frustration',
          triggerValue: performance.frustrationLevel,
        };
      }
    }

    // Check accuracy thresholds
    if (performance.accuracy >= this.config.difficultyUpThreshold) {
      const newDifficulty = this.increaseDifficulty(currentDifficulty);
      if (newDifficulty !== currentDifficulty) {
        return {
          shouldAdjust: true,
          newDifficulty,
          reason: 'Excellent performance - introducing more challenging content',
          triggerMetric: 'accuracy',
          triggerValue: performance.accuracy,
        };
      }
    }

    if (performance.accuracy <= this.config.difficultyDownThreshold) {
      const newDifficulty = this.decreaseDifficulty(currentDifficulty);
      if (newDifficulty !== currentDifficulty) {
        return {
          shouldAdjust: true,
          newDifficulty,
          reason: 'Struggling with current level - providing more foundational support',
          triggerMetric: 'accuracy',
          triggerValue: performance.accuracy,
        };
      }
    }

    // Check engagement - might suggest modality switch instead
    if (performance.engagementLevel < 0.4) {
      return {
        shouldAdjust: false,
        reason: 'Low engagement - consider switching activity type rather than difficulty',
        triggerMetric: 'engagement',
        triggerValue: performance.engagementLevel,
      };
    }

    return { shouldAdjust: false };
  }

  /**
   * Create a difficulty adjustment record
   */
  createAdjustment(
    fromDifficulty: DifficultyLevel,
    toDifficulty: DifficultyLevel,
    reason: string,
    triggerMetric: 'accuracy' | 'frustration' | 'speed' | 'engagement',
    triggerValue: number
  ): DifficultyAdjustment {
    return {
      timestamp: Date.now(),
      fromDifficulty,
      toDifficulty,
      reason,
      triggerMetric,
      triggerValue,
    };
  }

  /**
   * Increase difficulty by one tier
   */
  increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const tiers: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'intermediate', 'hard', 'advanced'];
    const currentIndex = tiers.indexOf(current);

    if (currentIndex === -1) {
      logger.warn(`Unknown difficulty level: ${current}`);
      return current;
    }

    if (currentIndex >= tiers.length - 1) {
      logger.info('Already at maximum difficulty');
      return current;
    }

    return tiers[currentIndex + 1];
  }

  /**
   * Decrease difficulty by one tier
   */
  decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const tiers: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'intermediate', 'hard', 'advanced'];
    const currentIndex = tiers.indexOf(current);

    if (currentIndex === -1) {
      logger.warn(`Unknown difficulty level: ${current}`);
      return current;
    }

    if (currentIndex <= 0) {
      logger.info('Already at minimum difficulty');
      return current;
    }

    return tiers[currentIndex - 1];
  }

  /**
   * Calculate optimal difficulty based on performance history
   */
  calculateOptimalDifficulty(performances: LoopPerformance[]): DifficultyLevel {
    if (performances.length === 0) {
      return 'easy'; // default
    }

    // Calculate average accuracy over recent loops (last 3)
    const recentPerformances = performances.slice(-3);
    const avgAccuracy =
      recentPerformances.reduce((sum, p) => sum + p.accuracy, 0) / recentPerformances.length;

    // Calculate average frustration
    const avgFrustration =
      recentPerformances.reduce((sum, p) => sum + p.frustrationLevel, 0) /
      recentPerformances.length;

    // Determine difficulty based on sweet spot
    // Target: 70-80% accuracy with low frustration
    if (avgAccuracy >= 0.85 && avgFrustration < 0.3) {
      return 'advanced'; // ready for challenge
    } else if (avgAccuracy >= 0.75 && avgFrustration < 0.4) {
      return 'medium'; // good learning zone
    } else if (avgAccuracy >= 0.6 && avgFrustration < 0.5) {
      return 'easy'; // building confidence
    } else {
      return 'beginner'; // need more support
    }
  }

  /**
   * Get difficulty parameters for artifact generation
   */
  getDifficultyParameters(difficulty: DifficultyLevel): {
    targetAccuracy: number;
    hintsAvailable: number;
    timePerItem: number; // seconds
    complexityLevel: number; // 1-5
    scaffoldingLevel: number; // 0-1 (higher = more support)
  } {
    switch (difficulty) {
      case 'beginner':
        return {
          targetAccuracy: 0.85,
          hintsAvailable: 3,
          timePerItem: 40,
          complexityLevel: 1,
          scaffoldingLevel: 1.0,
        };

      case 'easy':
        return {
          targetAccuracy: 0.8,
          hintsAvailable: 3,
          timePerItem: 30,
          complexityLevel: 2,
          scaffoldingLevel: 0.8,
        };

      case 'medium':
        return {
          targetAccuracy: 0.7,
          hintsAvailable: 2,
          timePerItem: 20,
          complexityLevel: 3,
          scaffoldingLevel: 0.5,
        };

      case 'hard':
        return {
          targetAccuracy: 0.65,
          hintsAvailable: 1,
          timePerItem: 15,
          complexityLevel: 4,
          scaffoldingLevel: 0.3,
        };

      case 'intermediate':
        return {
          targetAccuracy: 0.65,
          hintsAvailable: 1,
          timePerItem: 12,
          complexityLevel: 3,
          scaffoldingLevel: 0.3,
        };

      case 'advanced':
        return {
          targetAccuracy: 0.55,
          hintsAvailable: 0,
          timePerItem: 10,
          complexityLevel: 5,
          scaffoldingLevel: 0,
        };

      default:
        return this.getDifficultyParameters('easy');
    }
  }

  /**
   * Determine teaching strategy based on performance and difficulty
   */
  determineTeachingStrategy(
    performance: LoopPerformance,
    currentDifficulty: DifficultyLevel
  ): 'reinforce' | 'advance' | 'remediate' | 'diversify' {
    // High frustration → diversify (change approach)
    if (performance.frustrationLevel >= 0.6) {
      return 'diversify';
    }

    // Very low accuracy → remediate (review fundamentals)
    if (performance.accuracy < 0.5) {
      return 'remediate';
    }

    // High accuracy + low frustration → advance (introduce new concepts)
    if (performance.accuracy >= 0.85 && performance.frustrationLevel < 0.3) {
      return 'advance';
    }

    // Moderate performance → reinforce (practice current level)
    return 'reinforce';
  }

  /**
   * Calculate frustration level from performance indicators
   */
  calculateFrustrationLevel(performance: {
    accuracy: number;
    consecutiveFailures?: number;
    hintsUsed: number;
    averageTimePerItem: number;
    engagementLevel: number;
  }): number {
    let frustration = 0;

    // Low accuracy increases frustration
    if (performance.accuracy < 0.5) {
      frustration += 0.3;
    } else if (performance.accuracy < 0.7) {
      frustration += 0.1;
    }

    // Consecutive failures
    if (performance.consecutiveFailures) {
      frustration += Math.min(0.4, performance.consecutiveFailures * 0.1);
    }

    // Excessive hint usage
    if (performance.hintsUsed > 2) {
      frustration += 0.2;
    }

    // Very long response times (>30s per item suggests struggle)
    if (performance.averageTimePerItem > 30) {
      frustration += 0.15;
    }

    // Declining engagement
    if (performance.engagementLevel < 0.4) {
      frustration += 0.15;
    }

    return Math.min(1, frustration);
  }

  /**
   * Generate adaptive feedback based on performance
   */
  generateAdaptiveFeedback(
    performance: LoopPerformance,
    adjustment?: DifficultyAdjustment
  ): string {
    if (adjustment) {
      if (adjustment.toDifficulty > adjustment.fromDifficulty) {
        return `🌟 You're doing amazing! I'm making things a bit more challenging to help you grow even more!`;
      } else {
        return `Let's take a step back and make sure we really understand the basics. There's no rush - we'll build up your confidence! 💪`;
      }
    }

    // General feedback based on performance
    if (performance.accuracy >= 0.9) {
      return `Incredible work! You got ${Math.round(performance.accuracy * 100)}% correct! 🎉`;
    } else if (performance.accuracy >= 0.75) {
      return `Great job! You're really getting the hang of this! Keep it up! ⭐`;
    } else if (performance.accuracy >= 0.6) {
      return `Good effort! You're making progress. Let's keep practicing together! 😊`;
    } else if (performance.frustrationLevel > 0.6) {
      return `I can see you're working really hard. Let's try a different approach that might be more fun! 🎨`;
    } else {
      return `Learning takes time, and you're doing great! Let's work through this together! 🌈`;
    }
  }

  /**
   * Suggest whether to switch artifact modality
   */
  suggestModalitySwitch(
    currentModality: 'flashcards' | 'quiz' | 'micro_game',
    performance: LoopPerformance
  ): {
    shouldSwitch: boolean;
    suggestedModality?: 'flashcards' | 'quiz' | 'micro_game';
    reason?: string;
  } {
    // High frustration → switch to easier modality
    if (performance.frustrationLevel >= 0.7) {
      if (currentModality !== 'flashcards') {
        return {
          shouldSwitch: true,
          suggestedModality: 'flashcards',
          reason: 'Switching to flashcards for a gentler, self-paced approach',
        };
      }
    }

    // Low engagement → try something different
    if (performance.engagementLevel < 0.4) {
      const modalityOrder: Array<'flashcards' | 'quiz' | 'micro_game'> = [
        'micro_game',
        'quiz',
        'flashcards',
      ];
      const currentIndex = modalityOrder.indexOf(currentModality);
      const nextModality = modalityOrder[(currentIndex + 1) % modalityOrder.length];

      return {
        shouldSwitch: true,
        suggestedModality: nextModality,
        reason: 'Trying a different activity type to boost engagement',
      };
    }

    // High performance → can try more challenging modality
    if (performance.accuracy >= 0.85 && performance.frustrationLevel < 0.3) {
      if (currentModality === 'flashcards') {
        return {
          shouldSwitch: true,
          suggestedModality: 'quiz',
          reason: 'Ready for more active recall with quizzes',
        };
      }
    }

    return { shouldSwitch: false };
  }
}

// Singleton instance
export const difficultyAdapter = new DifficultyAdapter();
