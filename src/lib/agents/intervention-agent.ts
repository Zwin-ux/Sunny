/**
 * Intervention Agent - Detects frustration/disengagement and provides timely support
 * Autonomously identifies when students need help and adjusts teaching approach
 */

import { BaseAgent } from './base-agent';
import { LearningState } from './types';

interface InterventionTrigger {
  type: 'frustration' | 'disengagement' | 'confusion' | 'fatigue' | 'success';
  severity: number; // 0-1
  indicators: string[];
  detectedAt: number;
}

interface InterventionAction {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action: string;
  message?: string;
  adjustments?: Record<string, any>;
}

export class InterventionAgent extends BaseAgent {
  private readonly FRUSTRATION_THRESHOLD = 0.6;
  private readonly DISENGAGEMENT_THRESHOLD = 0.4;
  private readonly INTERVENTION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private lastInterventions: Map<string, number> = new Map();

  constructor() {
    super('intervention');
  }

  async initialize(): Promise<void> {
    console.log('Intervention Agent initialized');
  }

  async processMessage(message: any): Promise<any> {
    const { studentId, learningState, recentInteractions } = message;

    // Detect intervention triggers
    const triggers = this.detectTriggers(learningState, recentInteractions);

    // Determine if intervention is needed
    const needsIntervention = triggers.some(t =>
      t.severity >= this.FRUSTRATION_THRESHOLD ||
      t.type === 'disengagement' && t.severity >= this.DISENGAGEMENT_THRESHOLD
    );

    // Check cooldown
    const canIntervene = this.canIntervene(studentId);

    let interventions: InterventionAction[] = [];

    if (needsIntervention && canIntervene) {
      // Generate interventions
      interventions = this.generateInterventions(triggers, learningState);

      // Record intervention
      this.lastInterventions.set(studentId, Date.now());
    }

    return {
      messageId: message.id,
      success: true,
      data: {
        triggers,
        interventions,
        shouldIntervene: needsIntervention && canIntervene
      },
      recommendations: interventions.map(i => i.action)
    };
  }

  async shutdown(): Promise<void> {
    console.log('Intervention Agent shutting down');
  }

  /**
   * Detect intervention triggers from learning state and interactions
   */
  private detectTriggers(
    learningState: LearningState,
    recentInteractions: any[]
  ): InterventionTrigger[] {
    const triggers: InterventionTrigger[] = [];

    // Check for frustration
    const frustration = this.detectFrustration(recentInteractions, learningState);
    if (frustration) triggers.push(frustration);

    // Check for disengagement
    const disengagement = this.detectDisengagement(learningState);
    if (disengagement) triggers.push(disengagement);

    // Check for confusion
    const confusion = this.detectConfusion(recentInteractions);
    if (confusion) triggers.push(confusion);

    // Check for fatigue
    const fatigue = this.detectFatigue(learningState);
    if (fatigue) triggers.push(fatigue);

    // Check for success (positive intervention)
    const success = this.detectSuccess(recentInteractions, learningState);
    if (success) triggers.push(success);

    return triggers;
  }

  /**
   * Detect frustration indicators
   */
  private detectFrustration(
    interactions: any[],
    learningState: LearningState
  ): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Multiple incorrect attempts
    const recentFailures = interactions.filter(i => !i.correct).length;
    if (recentFailures >= 3) {
      indicators.push('multiple_incorrect_attempts');
      severity += 0.3;
    }

    // Declining performance
    const performanceTrend = this.calculatePerformanceTrend(interactions);
    if (performanceTrend < -0.2) {
      indicators.push('declining_performance');
      severity += 0.25;
    }

    // Increased response times
    const avgResponseTime = interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / interactions.length;
    if (avgResponseTime > 45000) {
      indicators.push('long_response_times');
      severity += 0.2;
    }

    // Negative sentiment in responses
    const hasNegativeSentiment = interactions.some(i =>
      i.content?.toLowerCase().match(/(frustrated|angry|hate|stupid|give up|too hard)/i)
    );
    if (hasNegativeSentiment) {
      indicators.push('negative_sentiment');
      severity += 0.35;
    }

    // Repeated requests for help
    const helpRequests = interactions.filter(i =>
      i.content?.toLowerCase().match(/(help|don't understand|confused|explain)/i)
    ).length;
    if (helpRequests >= 2) {
      indicators.push('repeated_help_requests');
      severity += 0.2;
    }

    if (indicators.length === 0) return null;

    return {
      type: 'frustration',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now()
    };
  }

  /**
   * Detect disengagement
   */
  private detectDisengagement(learningState: LearningState): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    const engagement = learningState.engagementMetrics;

    // Low interaction rate
    if ((engagement.interactionRate || 0) < 0.3) {
      indicators.push('low_interaction_rate');
      severity += 0.3;
    }

    // Short responses
    if ((engagement.responseQuality || 0) < 0.4) {
      indicators.push('low_response_quality');
      severity += 0.25;
    }

    // Long gaps between activities
    const timeSinceLastActivity = Date.now() - (learningState.lastActivityTimestamp || Date.now());
    if (timeSinceLastActivity > 10 * 60 * 1000) { // 10 minutes
      indicators.push('long_inactivity');
      severity += 0.4;
    }

    // Declining session duration
    if ((engagement.focusLevel || 0) < 0.3) {
      indicators.push('low_focus');
      severity += 0.3;
    }

    if (indicators.length === 0) return null;

    return {
      type: 'disengagement',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now()
    };
  }

  /**
   * Detect confusion
   */
  private detectConfusion(interactions: any[]): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Uncertainty markers in responses
    const uncertaintyCount = interactions.filter(i =>
      i.content?.toLowerCase().match(/(maybe|i think|not sure|guess|confused|don't know)/i)
    ).length;

    if (uncertaintyCount >= 2) {
      indicators.push('uncertainty_language');
      severity += 0.3;
    }

    // Off-topic responses
    const offTopicCount = interactions.filter(i => i.relevance && i.relevance < 0.5).length;
    if (offTopicCount >= 2) {
      indicators.push('off_topic_responses');
      severity += 0.25;
    }

    // Question asking (seeking clarification)
    const questionCount = interactions.filter(i =>
      i.content?.includes('?') || i.content?.toLowerCase().startsWith('what') ||
      i.content?.toLowerCase().startsWith('how') || i.content?.toLowerCase().startsWith('why')
    ).length;

    if (questionCount >= 3) {
      indicators.push('seeking_clarification');
      severity += 0.2;
    }

    if (indicators.length === 0) return null;

    return {
      type: 'confusion',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now()
    };
  }

  /**
   * Detect fatigue
   */
  private detectFatigue(learningState: LearningState): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Long session duration
    const sessionDuration = (Date.now() - (learningState.sessionStartTime || Date.now())) / (1000 * 60); // minutes
    if (sessionDuration > 45) {
      indicators.push('long_session');
      severity += 0.3;
    }

    // Declining attention
    if (learningState.engagementMetrics.attentionSpan < 0.4) {
      indicators.push('declining_attention');
      severity += 0.4;
    }

    // Slower response times over session
    if ((learningState.engagementMetrics.responseQuality || 0) < 0.3) {
      indicators.push('declining_quality');
      severity += 0.3;
    }

    if (indicators.length === 0) return null;

    return {
      type: 'fatigue',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now()
    };
  }

  /**
   * Detect success moments (for positive reinforcement)
   */
  private detectSuccess(
    interactions: any[],
    learningState: LearningState
  ): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Streak of correct answers
    const recentCorrect = interactions.slice(-5).filter(i => i.correct).length;
    if (recentCorrect >= 4) {
      indicators.push('success_streak');
      severity = 0.8;
    }

    // Improved performance
    const performanceTrend = this.calculatePerformanceTrend(interactions);
    if (performanceTrend > 0.3) {
      indicators.push('improving_performance');
      severity = Math.max(severity, 0.7);
    }

    // Achievement unlocked
    if (learningState.recentAchievements && learningState.recentAchievements.length > 0) {
      indicators.push('achievement_unlocked');
      severity = Math.max(severity, 0.9);
    }

    if (indicators.length === 0) return null;

    return {
      type: 'success',
      severity,
      indicators,
      detectedAt: Date.now()
    };
  }

  /**
   * Generate appropriate interventions
   */
  private generateInterventions(
    triggers: InterventionTrigger[],
    learningState: LearningState
  ): InterventionAction[] {
    const interventions: InterventionAction[] = [];

    for (const trigger of triggers) {
      switch (trigger.type) {
        case 'frustration':
          interventions.push(...this.handleFrustration(trigger, learningState));
          break;
        case 'disengagement':
          interventions.push(...this.handleDisengagement(trigger, learningState));
          break;
        case 'confusion':
          interventions.push(...this.handleConfusion(trigger, learningState));
          break;
        case 'fatigue':
          interventions.push(...this.handleFatigue(trigger, learningState));
          break;
        case 'success':
          interventions.push(...this.handleSuccess(trigger, learningState));
          break;
      }
    }

    // Sort by priority
    return interventions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Handle frustration
   */
  private handleFrustration(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    if (trigger.severity > 0.7) {
      // Severe frustration - immediate intervention
      actions.push({
        type: 'encouragement',
        priority: 'urgent',
        action: 'provide_encouragement',
        message: "I can see this is challenging! Let's take a step back and try a different approach. You're doing great, and I'm here to help! 💪"
      });

      actions.push({
        type: 'difficulty_adjustment',
        priority: 'high',
        action: 'reduce_difficulty',
        adjustments: {
          difficulty: 'easy',
          providedHints: true,
          scaffolding: 'maximum'
        }
      });

      actions.push({
        type: 'break_suggestion',
        priority: 'high',
        action: 'suggest_break',
        message: "How about we take a quick break? When you're ready, we can try something fun and easier! 🌈"
      });
    } else {
      // Moderate frustration
      actions.push({
        type: 'hint',
        priority: 'medium',
        action: 'provide_hint',
        message: "Here's a helpful hint to guide you! Remember, learning takes time, and you're making progress! ✨"
      });

      actions.push({
        type: 'alternative_explanation',
        priority: 'medium',
        action: 'reteach_concept',
        adjustments: {
          useAlternativeMethod: true,
          includeVisualAids: true
        }
      });
    }

    return actions;
  }

  /**
   * Handle disengagement
   */
  private handleDisengagement(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    actions.push({
      type: 'engagement_boost',
      priority: 'high',
      action: 'switch_activity_type',
      message: "Let's try something different and more exciting! 🎉",
      adjustments: {
        activityType: 'game',
        gamification: true
      }
    });

    actions.push({
      type: 'interest_connection',
      priority: 'medium',
      action: 'connect_to_interests',
      adjustments: {
        useStudentInterests: true,
        personalizeContent: true
      }
    });

    actions.push({
      type: 'motivational',
      priority: 'medium',
      action: 'show_progress',
      message: "Look how far you've come! You've earned [X] points and unlocked [Y] badges! 🌟"
    });

    return actions;
  }

  /**
   * Handle confusion
   */
  private handleConfusion(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    actions.push({
      type: 'clarification',
      priority: 'high',
      action: 'provide_clarification',
      message: "It seems like this might be unclear. Let me explain it in a different way! 💡"
    });

    actions.push({
      type: 'example',
      priority: 'high',
      action: 'provide_concrete_examples',
      adjustments: {
        includeRealWorldExamples: true,
        useAnalogies: true
      }
    });

    actions.push({
      type: 'check_understanding',
      priority: 'medium',
      action: 'ask_comprehension_questions'
    });

    return actions;
  }

  /**
   * Handle fatigue
   */
  private handleFatigue(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    actions.push({
      type: 'break_time',
      priority: 'urgent',
      action: 'mandate_break',
      message: "You've been working hard! Let's take a well-deserved break. Come back when you're ready! 🌻"
    });

    actions.push({
      type: 'session_summary',
      priority: 'high',
      action: 'summarize_achievements',
      message: "Here's everything you accomplished today! You should be proud! 🎯"
    });

    return actions;
  }

  /**
   * Handle success (positive reinforcement)
   */
  private handleSuccess(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    actions.push({
      type: 'celebration',
      priority: 'high',
      action: 'celebrate_success',
      message: "Wow! You're on fire! That's amazing work! 🎉✨🌟"
    });

    if (trigger.severity > 0.8) {
      actions.push({
        type: 'challenge',
        priority: 'medium',
        action: 'offer_harder_challenge',
        message: "You're ready for something more challenging! Want to try? 🚀"
      });
    }

    actions.push({
      type: 'reward',
      priority: 'medium',
      action: 'award_bonus_points',
      adjustments: {
        bonusPoints: 50,
        specialBadge: true
      }
    });

    return actions;
  }

  /**
   * Check if intervention can be performed (cooldown check)
   */
  private canIntervene(studentId: string): boolean {
    const lastIntervention = this.lastInterventions.get(studentId);
    if (!lastIntervention) return true;

    return Date.now() - lastIntervention > this.INTERVENTION_COOLDOWN;
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(interactions: any[]): number {
    if (interactions.length < 5) return 0;

    const recent = interactions.slice(-5);
    const earlier = interactions.slice(-10, -5);

    const recentScore = recent.filter(i => i.correct).length / recent.length;
    const earlierScore = earlier.length > 0
      ? earlier.filter(i => i.correct).length / earlier.length
      : recentScore;

    return recentScore - earlierScore;
  }
}

// Export singleton instance
export const interventionAgent = new InterventionAgent();
