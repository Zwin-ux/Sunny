/**
 * Real-Time Tutoring Mode
 * Provides instant intervention, emotional support, and adaptive help during learning
 */

import { AdaptiveQuestion, StudentPerformanceState } from '@/types/quiz';
import { ScaffoldingSystem } from '@/lib/quiz/ScaffoldingSystem';

export interface TutoringConfig {
  userId: string;
  interventionThreshold?: number; // Number of wrong attempts before intervention
  emotionalSupportEnabled?: boolean;
  celebrationEnabled?: boolean;
  autoTopicSwitch?: boolean;
}

export interface TutoringSession {
  userId: string;
  currentQuestion: AdaptiveQuestion | null;
  attempts: number;
  interventionsUsed: number;
  emotionalState: 'frustrated' | 'neutral' | 'confident' | 'excited';
  lastIntervention?: Date;
}

export type InterventionType = 
  | 'hint' 
  | 'worked-example' 
  | 'break-suggestion' 
  | 'topic-switch' 
  | 'encouragement';

export interface Intervention {
  type: InterventionType;
  message: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class RealTimeTutor {
  private scaffoldingSystem: ScaffoldingSystem;
  private sessions: Map<string, TutoringSession>;

  constructor() {
    this.scaffoldingSystem = new ScaffoldingSystem();
    this.sessions = new Map();
  }

  /**
   * Start tutoring session
   */
  startSession(config: TutoringConfig): TutoringSession {
    const session: TutoringSession = {
      userId: config.userId,
      currentQuestion: null,
      attempts: 0,
      interventionsUsed: 0,
      emotionalState: 'neutral'
    };

    this.sessions.set(config.userId, session);
    return session;
  }

  /**
   * Handle student struggle (wrong answer)
   */
  async onStruggle(
    userId: string,
    question: AdaptiveQuestion,
    attempts: number,
    studentState: StudentPerformanceState
  ): Promise<Intervention | null> {
    const session = this.sessions.get(userId);
    if (!session) return null;

    session.attempts = attempts;
    session.currentQuestion = question;

    // Determine intervention based on attempts
    if (attempts === 1) {
      // First wrong - gentle encouragement
      return {
        type: 'encouragement',
        message: 'Not quite! Take your time and try again. You\'ve got this! 💪',
        priority: 'low'
      };
    }

    if (attempts === 2) {
      // Second wrong - provide hint
      const hint = this.scaffoldingSystem.getNextHint(
        question,
        studentState,
        attempts
      );

      session.interventionsUsed++;

      return {
        type: 'hint',
        message: hint?.text || 'Think about what the question is really asking...',
        priority: 'medium'
      };
    }

    if (attempts >= 3) {
      // Third wrong - show worked example
      const workedExample = question.scaffolding.workedExample;

      session.interventionsUsed++;
      session.emotionalState = 'frustrated';

      if (workedExample) {
        return {
          type: 'worked-example',
          message: 'Let me show you how to solve this step by step!',
          priority: 'high'
        };
      }

      // If no worked example, suggest break
      return {
        type: 'break-suggestion',
        message: 'You\'re working hard! How about a quick break? 🌟',
        priority: 'high'
      };
    }

    return null;
  }

  /**
   * Handle student mastery (correct answer)
   */
  async onMastery(
    userId: string,
    topic: string,
    streak: number,
    studentState: StudentPerformanceState
  ): Promise<Intervention | null> {
    const session = this.sessions.get(userId);
    if (!session) return null;

    session.attempts = 0;
    session.emotionalState = streak >= 3 ? 'excited' : 'confident';

    // Level up after streak
    if (streak >= 3) {
      return {
        type: 'encouragement',
        message: `🎉 Amazing! ${streak} in a row! You're mastering ${topic}!`,
        priority: 'high'
      };
    }

    // Regular encouragement
    if (streak >= 2) {
      return {
        type: 'encouragement',
        message: `Great job! You're on a roll! ⭐`,
        priority: 'medium'
      };
    }

    // First correct
    return {
      type: 'encouragement',
      message: 'Correct! Nice work! 👍',
      priority: 'low'
    };
  }

  /**
   * Handle emotional frustration
   */
  async onFrustration(
    userId: string,
    emotionLevel: number, // 0-1 scale
    consecutiveWrong: number
  ): Promise<Intervention | null> {
    const session = this.sessions.get(userId);
    if (!session) return null;

    session.emotionalState = 'frustrated';

    // High frustration - suggest break
    if (emotionLevel > 0.7 || consecutiveWrong >= 3) {
      return {
        type: 'break-suggestion',
        message: 'You\'re doing great, but let\'s take a quick breather! 🌈 Come back in 5 minutes?',
        priority: 'urgent'
      };
    }

    // Medium frustration - switch topic
    if (emotionLevel > 0.5 || consecutiveWrong >= 2) {
      return {
        type: 'topic-switch',
        message: 'Let\'s try something different for a bit! We can come back to this later. 🔄',
        priority: 'high'
      };
    }

    // Low frustration - encouragement
    return {
      type: 'encouragement',
      message: 'Learning takes time! You\'re making progress even when it feels hard. 💪',
      priority: 'medium'
    };
  }

  /**
   * Detect if student needs intervention
   */
  needsIntervention(
    userId: string,
    question: AdaptiveQuestion,
    timeSpent: number, // milliseconds
    hintsUsed: number
  ): boolean {
    const session = this.sessions.get(userId);
    if (!session) return false;

    // Check time spent (stuck if > 2x average)
    const avgTime = 30000; // 30 seconds average
    if (timeSpent > avgTime * 2) return true;

    // Check attempts
    if (session.attempts >= 2) return true;

    // Check if already used all hints
    if (hintsUsed >= question.scaffolding.hints.length) return true;

    return false;
  }

  /**
   * Get celebration message
   */
  getCelebration(achievement: string): string {
    const celebrations = {
      'perfect_score': '🏆 Perfect score! You\'re a superstar!',
      'level_up': '🚀 Level up! You\'re ready for bigger challenges!',
      'streak_5': '🔥 5 in a row! You\'re on fire!',
      'fast_learner': '⚡ Lightning fast! Great thinking!',
      'no_hints': '🧠 Solved it all by yourself! Independent thinker!',
      'comeback': '💪 Great comeback! Never give up!'
    };

    return celebrations[achievement as keyof typeof celebrations] || '🎉 Awesome work!';
  }

  /**
   * Get encouragement based on situation
   */
  getEncouragement(
    situation: 'struggling' | 'improving' | 'mastering' | 'frustrated'
  ): string {
    const messages = {
      struggling: [
        'Every expert was once a beginner! Keep going! 💪',
        'Mistakes help us learn! You\'re doing great! 🌟',
        'Take your time - understanding is more important than speed! ⏰'
      ],
      improving: [
        'I can see you getting better! Keep it up! 📈',
        'You\'re making real progress! 🎯',
        'That\'s the way! You\'re figuring it out! 💡'
      ],
      mastering: [
        'You\'ve got this down! Ready for more? 🚀',
        'Excellent work! You really understand this! ⭐',
        'You make this look easy! Great job! 🎉'
      ],
      frustrated: [
        'It\'s okay to find this challenging! You\'re learning! 🌈',
        'Let\'s take it one step at a time. You can do this! 🐢',
        'Sometimes the best learning happens when things are hard! 💪'
      ]
    };

    const options = messages[situation];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Should suggest break
   */
  shouldSuggestBreak(
    userId: string,
    sessionDuration: number, // minutes
    consecutiveWrong: number,
    emotionLevel: number
  ): boolean {
    // Long session (> 30 min)
    if (sessionDuration > 30) return true;

    // High frustration
    if (emotionLevel > 0.7) return true;

    // Many consecutive wrong
    if (consecutiveWrong >= 4) return true;

    return false;
  }

  /**
   * Should switch topic
   */
  shouldSwitchTopic(
    userId: string,
    topicAttempts: number,
    topicAccuracy: number
  ): boolean {
    // Too many attempts on same topic
    if (topicAttempts > 5 && topicAccuracy < 0.4) return true;

    return false;
  }

  /**
   * Get session summary
   */
  getSessionSummary(userId: string): string {
    const session = this.sessions.get(userId);
    if (!session) return 'No active session';

    const interventions = session.interventionsUsed;
    const state = session.emotionalState;

    if (state === 'excited') {
      return `Amazing session! You're ${interventions === 0 ? 'crushing it' : 'making great progress'}! 🎉`;
    }

    if (state === 'confident') {
      return `Great work today! ${interventions > 0 ? 'The hints helped you succeed!' : 'You did it on your own!'} ⭐`;
    }

    if (state === 'frustrated') {
      return `You worked hard today! Remember, learning takes time. You're building important skills! 💪`;
    }

    return 'Good session! Keep up the great work! 👍';
  }

  /**
   * End session
   */
  endSession(userId: string): void {
    this.sessions.delete(userId);
  }
}

// Export singleton
export const realTimeTutor = new RealTimeTutor();

/**
 * Convenience functions
 */
export async function handleStruggle(
  userId: string,
  question: AdaptiveQuestion,
  attempts: number,
  studentState: StudentPerformanceState
): Promise<Intervention | null> {
  return realTimeTutor.onStruggle(userId, question, attempts, studentState);
}

export async function handleMastery(
  userId: string,
  topic: string,
  streak: number,
  studentState: StudentPerformanceState
): Promise<Intervention | null> {
  return realTimeTutor.onMastery(userId, topic, streak, studentState);
}

export async function handleFrustration(
  userId: string,
  emotionLevel: number,
  consecutiveWrong: number
): Promise<Intervention | null> {
  return realTimeTutor.onFrustration(userId, emotionLevel, consecutiveWrong);
}
