/**
 * Intervention Agent - Detects frustration/disengagement and provides timely support
 * Autonomously identifies when students need help and adjusts teaching approach
 * 
 * Implements Requirements:
 * - 4.1: Detect frustration and engagement drops
 * - 4.2: Automatic difficulty adjustment triggers
 * - 4.3: Automatic hint and guidance provision
 * - 4.4: Gamification element injection for engagement recovery
 * - 4.5: Motivational intervention timing optimization
 */

import { BaseAgent } from './base-agent';
import { 
  LearningState, 
  AgentMessage, 
  AgentResponse,
  EngagementData,
  Priority,
  Recommendation
} from './types';

/**
 * Emotional state detected from interaction patterns
 */
interface EmotionalStateDetection {
  primary: 'engaged' | 'frustrated' | 'confused' | 'bored' | 'excited' | 'anxious' | 'tired';
  secondary?: string[];
  confidence: number; // 0-1
  indicators: string[];
  timestamp: number;
}

/**
 * Engagement drop detection result
 */
interface EngagementDropDetection {
  detected: boolean;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  dropRate: number; // Rate of engagement decline
  currentLevel: number; // Current engagement level 0-1
  previousLevel: number; // Previous engagement level 0-1
  duration: number; // How long engagement has been dropping (ms)
  triggers: string[]; // What caused the drop
  timestamp: number;
}

/**
 * Difficulty adjustment recommendation
 */
interface DifficultyAdjustment {
  currentDifficulty: string;
  recommendedDifficulty: string;
  reason: string;
  confidence: number;
  adjustmentType: 'increase' | 'decrease' | 'maintain';
  magnitude: number; // 0-1 how much to adjust
}

/**
 * Scaffolding support level
 */
interface ScaffoldingSupport {
  level: 'minimal' | 'moderate' | 'substantial' | 'maximum';
  hints: string[];
  guidance: string[];
  examples: string[];
  visualAids: boolean;
  stepByStep: boolean;
  progressiveReveal: boolean;
}

/**
 * Gamification injection recommendation
 */
interface GamificationInjection {
  elements: Array<'points' | 'badges' | 'challenges' | 'leaderboard' | 'streaks' | 'rewards'>;
  intensity: 'light' | 'moderate' | 'heavy';
  timing: 'immediate' | 'after_activity' | 'next_session';
  customization: Record<string, any>;
}

/**
 * Intervention trigger with enhanced detection
 */
interface InterventionTrigger {
  type: 'frustration' | 'disengagement' | 'confusion' | 'fatigue' | 'success' | 'anxiety' | 'boredom';
  severity: number; // 0-1
  indicators: string[];
  detectedAt: number;
  emotionalState?: EmotionalStateDetection;
  engagementDrop?: EngagementDropDetection;
  confidence: number;
}

/**
 * Intervention action with enhanced support
 */
interface InterventionAction {
  type: string;
  priority: Priority;
  action: string;
  message?: string;
  adjustments?: Record<string, any>;
  scaffolding?: ScaffoldingSupport;
  gamification?: GamificationInjection;
  difficultyAdjustment?: DifficultyAdjustment;
  timing: 'immediate' | 'after_current' | 'next_activity' | 'scheduled';
  effectiveness?: number; // Predicted effectiveness 0-1
}

export class InterventionAgent extends BaseAgent {
  // Thresholds for intervention triggers
  private readonly FRUSTRATION_THRESHOLD = 0.6;
  private readonly DISENGAGEMENT_THRESHOLD = 0.4;
  private readonly ENGAGEMENT_DROP_THRESHOLD = 0.3; // 30% drop triggers warning
  private readonly CRITICAL_ENGAGEMENT_LEVEL = 0.2; // Below 20% is critical
  
  // Timing optimization
  private readonly INTERVENTION_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  private readonly EARLY_WARNING_WINDOW = 2 * 60 * 1000; // 2 minutes for early detection
  private readonly OPTIMAL_INTERVENTION_DELAY = 30 * 1000; // 30 seconds optimal delay
  
  // Tracking
  private lastInterventions: Map<string, number> = new Map();
  private engagementHistory: Map<string, Array<{ level: number; timestamp: number }>> = new Map();
  private emotionalStateHistory: Map<string, EmotionalStateDetection[]> = new Map();
  private interventionEffectiveness: Map<string, number[]> = new Map();

  constructor() {
    super('intervention');
  }

  async initialize(): Promise<void> {
    console.log('Intervention Agent initialized with enhanced detection systems');
    this.setupEventHandlers();
  }

  protected setupEventHandlers(): void {
    // Listen for engagement changes
    this.registerEventHandler('engagement:changed', {
      eventType: 'engagement:changed',
      handler: async (event) => {
        await this.handleEngagementChange(event.data);
      },
      priority: 'high'
    });

    // Listen for emotional state changes
    this.registerEventHandler('emotional_state:detected', {
      eventType: 'emotional_state:detected',
      handler: async (event) => {
        await this.handleEmotionalStateChange(event.data);
      },
      priority: 'high'
    });

    // Listen for performance events
    this.registerEventHandler('performance:declining', {
      eventType: 'performance:declining',
      handler: async (event) => {
        await this.handlePerformanceDecline(event.data);
      },
      priority: 'urgent'
    });
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    try {
      switch (message.payload.action) {
        case 'detect_intervention_needs':
          return await this.detectInterventionNeeds(message);
        
        case 'monitor_emotional_state':
          return await this.monitorEmotionalState(message);
        
        case 'detect_engagement_drop':
          return await this.detectEngagementDrop(message);
        
        case 'recommend_difficulty_adjustment':
          return await this.recommendDifficultyAdjustment(message);
        
        case 'provide_scaffolding':
          return await this.provideScaffolding(message);
        
        case 'inject_gamification':
          return await this.injectGamification(message);
        
        case 'optimize_intervention_timing':
          return await this.optimizeInterventionTiming(message);
        
        case 'suggest_break':
          return await this.suggestBreak(message);
        
        case 'track_intervention_effectiveness':
          return await this.trackInterventionEffectiveness(message);
        
        default:
          // Legacy support
          return await this.detectInterventionNeeds(message);
      }
    } catch (error) {
      return {
        messageId: message.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('Intervention Agent shutting down');
    this.engagementHistory.clear();
    this.emotionalStateHistory.clear();
    this.lastInterventions.clear();
    this.interventionEffectiveness.clear();
  }

  /**
   * Main intervention detection method
   * Requirement 4.1, 4.2, 4.5: Detect frustration, engagement drops, and optimize timing
   */
  private async detectInterventionNeeds(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, recentInteractions } = message.payload;

    // Detect intervention triggers
    const triggers = this.detectTriggers(learningState, recentInteractions);

    // Detect engagement drops
    const engagementDrop = this.detectEngagementDropInternal(learningState, studentId);
    
    // Monitor emotional state
    const emotionalState = this.detectEmotionalState(recentInteractions, learningState);

    // Determine if intervention is needed
    const needsIntervention = this.shouldIntervene(triggers, engagementDrop, emotionalState);

    // Optimize intervention timing
    const optimalTiming = this.calculateOptimalInterventionTiming(
      triggers,
      engagementDrop,
      emotionalState,
      studentId
    );

    // Check cooldown
    const canIntervene = this.canIntervene(studentId);

    let interventions: InterventionAction[] = [];
    let recommendations: Recommendation[] = [];

    if (needsIntervention && canIntervene) {
      // Generate interventions
      interventions = this.generateInterventions(triggers, learningState, emotionalState, engagementDrop);

      // Convert to recommendations
      recommendations = interventions.map(i => this.createRecommendation(
        'intervention',
        i.message || i.action,
        i,
        i.effectiveness || 0.7,
        i.priority,
        `Intervention triggered by: ${triggers.map(t => t.type).join(', ')}`
      ));

      // Record intervention
      this.lastInterventions.set(studentId, Date.now());

      // Emit intervention event
      this.emitEvent('intervention:triggered', {
        studentId,
        triggers,
        interventions,
        timing: optimalTiming
      }, 'high');
    } else if (needsIntervention && !canIntervene) {
      // Queue for later
      this.emitEvent('intervention:queued', {
        studentId,
        triggers,
        nextAvailable: this.lastInterventions.get(studentId)! + this.INTERVENTION_COOLDOWN
      }, 'medium');
    }

    // Store emotional state history
    if (emotionalState) {
      const history = this.emotionalStateHistory.get(studentId) || [];
      history.push(emotionalState);
      this.emotionalStateHistory.set(studentId, history.slice(-20));
    }

    return {
      messageId: message.id,
      success: true,
      data: {
        triggers,
        emotionalState,
        engagementDrop,
        interventions,
        shouldIntervene: needsIntervention && canIntervene,
        optimalTiming,
        canIntervene
      },
      recommendations
    };
  }

  /**
   * Monitor emotional state from interaction patterns
   * Requirement 4.1: Real-time emotional state monitoring
   */
  private async monitorEmotionalState(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, recentInteractions, learningState } = message.payload;

    const emotionalState = this.detectEmotionalState(recentInteractions, learningState);

    // Store in history
    if (emotionalState) {
      const history = this.emotionalStateHistory.get(studentId) || [];
      history.push(emotionalState);
      this.emotionalStateHistory.set(studentId, history.slice(-50));

      // Emit event if negative emotion detected
      if (['frustrated', 'anxious', 'bored', 'confused'].includes(emotionalState.primary)) {
        this.emitEvent('emotional_state:negative', {
          studentId,
          state: emotionalState
        }, emotionalState.confidence > 0.7 ? 'high' : 'medium');
      }
    }

    return {
      messageId: message.id,
      success: true,
      data: { emotionalState }
    };
  }

  /**
   * Detect engagement drops with early warning
   * Requirement 4.1: Engagement drop detection and early warning systems
   */
  private async detectEngagementDrop(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState } = message.payload;

    const engagementDrop = this.detectEngagementDropInternal(learningState, studentId);

    // Emit early warning if engagement is dropping
    if (engagementDrop.detected && engagementDrop.severity !== 'minor') {
      this.emitEvent('engagement:dropping', {
        studentId,
        drop: engagementDrop
      }, engagementDrop.severity === 'critical' ? 'urgent' : 'high');
    }

    return {
      messageId: message.id,
      success: true,
      data: { engagementDrop }
    };
  }

  /**
   * Recommend difficulty adjustments
   * Requirement 4.2: Automatic difficulty adjustment triggers
   */
  private async recommendDifficultyAdjustment(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, recentPerformance } = message.payload;

    const adjustment = this.calculateDifficultyAdjustment(
      learningState,
      recentPerformance
    );

    const recommendation = this.createRecommendation(
      'strategy',
      `Adjust difficulty to ${adjustment.recommendedDifficulty}`,
      adjustment,
      adjustment.confidence,
      adjustment.adjustmentType === 'decrease' ? 'high' : 'medium',
      adjustment.reason
    );

    // Emit difficulty adjustment event
    if (adjustment.adjustmentType !== 'maintain') {
      this.emitEvent('difficulty:adjustment_needed', {
        studentId,
        adjustment
      }, 'high');
    }

    return {
      messageId: message.id,
      success: true,
      data: { adjustment },
      recommendations: [recommendation]
    };
  }

  /**
   * Provide scaffolding support
   * Requirement 4.3: Automatic hint and guidance provision
   */
  private async provideScaffolding(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, currentActivity, strugglingConcepts } = message.payload;

    const scaffolding = this.generateScaffolding(
      learningState,
      currentActivity,
      strugglingConcepts
    );

    const recommendation = this.createRecommendation(
      'intervention',
      'Provide scaffolding support',
      scaffolding,
      0.85,
      'high',
      `Student needs ${scaffolding.level} support for current activity`
    );

    // Emit scaffolding event
    this.emitEvent('scaffolding:provided', {
      studentId,
      scaffolding,
      activity: currentActivity
    }, 'medium');

    return {
      messageId: message.id,
      success: true,
      data: { scaffolding },
      recommendations: [recommendation]
    };
  }

  /**
   * Inject gamification elements
   * Requirement 4.4: Gamification element injection for engagement recovery
   */
  private async injectGamification(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, engagementLevel } = message.payload;

    const gamification = this.generateGamificationInjection(
      learningState,
      engagementLevel
    );

    const recommendation = this.createRecommendation(
      'intervention',
      'Inject gamification elements',
      gamification,
      0.75,
      'medium',
      `Boost engagement with ${gamification.intensity} gamification`
    );

    // Emit gamification event
    this.emitEvent('gamification:injected', {
      studentId,
      gamification
    }, 'medium');

    return {
      messageId: message.id,
      success: true,
      data: { gamification },
      recommendations: [recommendation]
    };
  }

  /**
   * Optimize intervention timing
   * Requirement 4.5: Motivational intervention timing optimization
   */
  private async optimizeInterventionTiming(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, triggers, emotionalState } = message.payload;

    const optimalTiming = this.calculateOptimalInterventionTiming(
      triggers,
      null,
      emotionalState,
      studentId
    );

    return {
      messageId: message.id,
      success: true,
      data: { optimalTiming }
    };
  }

  /**
   * Suggest break or activity change
   * Requirement 4.5: Break and activity change recommendations
   */
  private async suggestBreak(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, reason } = message.payload;

    const breakRecommendation = this.generateBreakRecommendation(
      learningState,
      reason
    );

    const recommendation = this.createRecommendation(
      'intervention',
      breakRecommendation.message,
      breakRecommendation,
      0.9,
      breakRecommendation.priority,
      breakRecommendation.reason
    );

    return {
      messageId: message.id,
      success: true,
      data: { breakRecommendation },
      recommendations: [recommendation]
    };
  }

  /**
   * Track intervention effectiveness
   */
  private async trackInterventionEffectiveness(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, interventionId, outcome, engagementBefore, engagementAfter } = message.payload;

    const effectiveness = engagementAfter - engagementBefore;
    
    const history = this.interventionEffectiveness.get(studentId) || [];
    history.push(effectiveness);
    this.interventionEffectiveness.set(studentId, history.slice(-30));

    const avgEffectiveness = history.reduce((sum, e) => sum + e, 0) / history.length;

    return {
      messageId: message.id,
      success: true,
      data: {
        effectiveness,
        avgEffectiveness,
        trend: effectiveness > avgEffectiveness ? 'improving' : 'declining'
      }
    };
  }

  // Event handlers

  private async handleEngagementChange(data: any): Promise<void> {
    const { studentId, engagement } = data;
    
    // Track engagement history
    const history = this.engagementHistory.get(studentId) || [];
    history.push({
      level: engagement.currentLevel,
      timestamp: Date.now()
    });
    this.engagementHistory.set(studentId, history.slice(-100));
  }

  private async handleEmotionalStateChange(data: any): Promise<void> {
    const { studentId, emotionalState } = data;
    
    // Store emotional state
    const history = this.emotionalStateHistory.get(studentId) || [];
    history.push(emotionalState);
    this.emotionalStateHistory.set(studentId, history.slice(-50));
  }

  private async handlePerformanceDecline(data: any): Promise<void> {
    const { studentId } = data;
    
    // Trigger immediate intervention check
    this.emitEvent('trigger:intervention_check', {
      studentId,
      reason: 'performance_decline',
      priority: 'urgent'
    }, 'urgent');
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

    // Check for anxiety
    const anxiety = this.detectAnxiety(recentInteractions, learningState);
    if (anxiety) triggers.push(anxiety);

    // Check for boredom
    const boredom = this.detectBoredom(recentInteractions, learningState);
    if (boredom) triggers.push(boredom);

    // Check for success (positive intervention)
    const success = this.detectSuccess(recentInteractions, learningState);
    if (success) triggers.push(success);

    return triggers;
  }

  /**
   * Detect emotional state from interaction patterns
   * Requirement 4.1: Real-time emotional state monitoring
   */
  private detectEmotionalState(
    interactions: any[],
    learningState: LearningState
  ): EmotionalStateDetection | null {
    if (!interactions || interactions.length === 0) return null;

    const indicators: string[] = [];
    const emotionScores: Record<string, number> = {
      engaged: 0,
      frustrated: 0,
      confused: 0,
      bored: 0,
      excited: 0,
      anxious: 0,
      tired: 0
    };

    // Analyze sentiment patterns
    const sentimentPatterns = this.analyzeSentimentPatterns(interactions);
    Object.keys(sentimentPatterns).forEach(emotion => {
      emotionScores[emotion] += sentimentPatterns[emotion];
    });

    // Analyze response patterns
    const responsePatterns = this.analyzeResponsePatterns(interactions);
    if (responsePatterns.quick && responsePatterns.accurate) {
      emotionScores.engaged += 0.3;
      emotionScores.excited += 0.2;
      indicators.push('quick_accurate_responses');
    } else if (responsePatterns.slow && responsePatterns.inaccurate) {
      emotionScores.frustrated += 0.3;
      emotionScores.confused += 0.2;
      indicators.push('slow_inaccurate_responses');
    }

    // Analyze engagement metrics
    const engagement = learningState.engagementMetrics;
    if (engagement.currentLevel > 0.7) {
      emotionScores.engaged += 0.3;
      indicators.push('high_engagement');
    } else if (engagement.currentLevel < 0.3) {
      emotionScores.bored += 0.3;
      emotionScores.tired += 0.2;
      indicators.push('low_engagement');
    }

    if (engagement.frustrationLevel > 0.6) {
      emotionScores.frustrated += 0.4;
      indicators.push('high_frustration_metric');
    }

    // Find primary emotion
    const primary = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a)[0][0] as EmotionalStateDetection['primary'];

    // Find secondary emotions
    const secondary = Object.entries(emotionScores)
      .filter(([emotion, score]) => emotion !== primary && score > 0.3)
      .map(([emotion]) => emotion);

    const confidence = Math.min(1, emotionScores[primary] / 1.5);

    if (confidence < 0.3) return null;

    return {
      primary,
      secondary: secondary.length > 0 ? secondary : undefined,
      confidence,
      indicators,
      timestamp: Date.now()
    };
  }

  /**
   * Detect engagement drops with severity levels
   * Requirement 4.1: Engagement drop detection and early warning systems
   */
  private detectEngagementDropInternal(
    learningState: LearningState,
    studentId: string
  ): EngagementDropDetection {
    const history = this.engagementHistory.get(studentId) || [];
    const currentLevel = learningState.engagementMetrics.currentLevel;

    // Need at least 2 data points
    if (history.length < 2) {
      return {
        detected: false,
        severity: 'minor',
        dropRate: 0,
        currentLevel,
        previousLevel: currentLevel,
        duration: 0,
        triggers: [],
        timestamp: Date.now()
      };
    }

    // Calculate previous level (average of last 5 points)
    const recentHistory = history.slice(-5);
    const previousLevel = recentHistory.reduce((sum, h) => sum + h.level, 0) / recentHistory.length;

    // Calculate drop rate
    const dropRate = previousLevel - currentLevel;
    const dropPercentage = previousLevel > 0 ? dropRate / previousLevel : 0;

    // Determine if drop is significant
    const detected = dropRate > this.ENGAGEMENT_DROP_THRESHOLD;

    // Determine severity
    let severity: EngagementDropDetection['severity'] = 'minor';
    if (currentLevel < this.CRITICAL_ENGAGEMENT_LEVEL) {
      severity = 'critical';
    } else if (dropPercentage > 0.5) {
      severity = 'severe';
    } else if (dropPercentage > 0.3) {
      severity = 'moderate';
    }

    // Calculate duration of drop
    let duration = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].level < previousLevel * 0.8) {
        duration = Date.now() - history[i].timestamp;
      } else {
        break;
      }
    }

    // Identify triggers
    const triggers: string[] = [];
    if (dropRate > 0.4) triggers.push('rapid_engagement_loss');
    if (currentLevel < 0.3) triggers.push('critically_low_engagement');
    if (duration > this.EARLY_WARNING_WINDOW) triggers.push('sustained_low_engagement');
    if (learningState.engagementMetrics.frustrationLevel > 0.6) triggers.push('high_frustration');

    return {
      detected,
      severity,
      dropRate,
      currentLevel,
      previousLevel,
      duration,
      triggers,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate difficulty adjustment
   * Requirement 4.2: Automatic difficulty adjustment triggers
   */
  private calculateDifficultyAdjustment(
    learningState: LearningState,
    recentPerformance: any
  ): DifficultyAdjustment {
    const currentDifficulty = learningState.currentDifficulty || 'medium';
    const accuracyRate = recentPerformance?.accuracyRate || 0.5;
    const frustrationLevel = learningState.engagementMetrics.frustrationLevel;
    const engagementLevel = learningState.engagementMetrics.currentLevel;

    let adjustmentType: DifficultyAdjustment['adjustmentType'] = 'maintain';
    let recommendedDifficulty = currentDifficulty;
    let reason = '';
    let confidence = 0.5;
    let magnitude = 0;

    // Too difficult - reduce difficulty
    if (accuracyRate < 0.4 || frustrationLevel > 0.7) {
      adjustmentType = 'decrease';
      magnitude = frustrationLevel > 0.8 ? 0.8 : 0.5;
      recommendedDifficulty = this.decreaseDifficulty(currentDifficulty, magnitude);
      reason = `Low accuracy (${(accuracyRate * 100).toFixed(0)}%) and high frustration indicate content is too difficult`;
      confidence = 0.85;
    }
    // Too easy - increase difficulty
    else if (accuracyRate > 0.85 && engagementLevel < 0.5) {
      adjustmentType = 'increase';
      magnitude = 0.5;
      recommendedDifficulty = this.increaseDifficulty(currentDifficulty);
      reason = `High accuracy (${(accuracyRate * 100).toFixed(0)}%) with low engagement suggests content is too easy`;
      confidence = 0.75;
    }
    // Optimal range
    else if (accuracyRate >= 0.6 && accuracyRate <= 0.8) {
      adjustmentType = 'maintain';
      recommendedDifficulty = currentDifficulty;
      reason = `Current difficulty is optimal (accuracy: ${(accuracyRate * 100).toFixed(0)}%)`;
      confidence = 0.9;
    }

    return {
      currentDifficulty,
      recommendedDifficulty,
      reason,
      confidence,
      adjustmentType,
      magnitude
    };
  }

  /**
   * Generate scaffolding support
   * Requirement 4.3: Automatic hint and guidance provision, progressive support escalation
   */
  private generateScaffolding(
    learningState: LearningState,
    currentActivity: any,
    strugglingConcepts: string[]
  ): ScaffoldingSupport {
    const frustrationLevel = learningState.engagementMetrics.frustrationLevel;
    const comprehensionLevel = 1 - frustrationLevel; // Inverse relationship

    // Determine scaffolding level
    let level: ScaffoldingSupport['level'] = 'minimal';
    if (frustrationLevel > 0.7 || comprehensionLevel < 0.3) {
      level = 'maximum';
    } else if (frustrationLevel > 0.5 || comprehensionLevel < 0.5) {
      level = 'substantial';
    } else if (frustrationLevel > 0.3 || comprehensionLevel < 0.7) {
      level = 'moderate';
    }

    // Generate hints based on level
    const hints: string[] = [];
    const guidance: string[] = [];
    const examples: string[] = [];

    if (level === 'maximum') {
      hints.push('Let me break this down into smaller steps for you');
      hints.push('Here\'s a hint: focus on the first part of the problem');
      hints.push('Remember, we learned about this concept earlier');
      guidance.push('Step 1: Start by identifying the key information');
      guidance.push('Step 2: Think about what we need to find');
      guidance.push('Step 3: Apply the concept we just learned');
      examples.push('Here\'s a similar example we can work through together');
    } else if (level === 'substantial') {
      hints.push('Think about what we learned in the previous lesson');
      hints.push('What patterns do you notice?');
      guidance.push('Try breaking the problem into smaller parts');
      guidance.push('Focus on one step at a time');
      examples.push('Here\'s a related example that might help');
    } else if (level === 'moderate') {
      hints.push('You\'re on the right track! Keep going');
      hints.push('Think about the key concept here');
      guidance.push('Consider the approach we used before');
    } else {
      hints.push('You\'ve got this! Trust your understanding');
    }

    return {
      level,
      hints,
      guidance,
      examples,
      visualAids: level === 'maximum' || level === 'substantial',
      stepByStep: level === 'maximum',
      progressiveReveal: level !== 'minimal'
    };
  }

  /**
   * Generate gamification injection
   * Requirement 4.4: Gamification element injection for engagement recovery
   */
  private generateGamificationInjection(
    learningState: LearningState,
    engagementLevel: number
  ): GamificationInjection {
    const elements: GamificationInjection['elements'] = [];
    let intensity: GamificationInjection['intensity'] = 'moderate';
    let timing: GamificationInjection['timing'] = 'immediate';

    // Determine intensity based on engagement level
    if (engagementLevel < 0.3) {
      intensity = 'heavy';
      timing = 'immediate';
    } else if (engagementLevel < 0.5) {
      intensity = 'moderate';
      timing = 'immediate';
    } else {
      intensity = 'light';
      timing = 'after_activity';
    }

    // Select appropriate elements
    if (intensity === 'heavy') {
      elements.push('points', 'badges', 'challenges', 'streaks', 'rewards');
    } else if (intensity === 'moderate') {
      elements.push('points', 'challenges', 'streaks');
    } else {
      elements.push('points', 'badges');
    }

    const customization: Record<string, any> = {
      pointMultiplier: intensity === 'heavy' ? 2 : 1,
      showProgress: true,
      celebrateWins: true,
      competitiveMode: false, // Can be customized based on student profile
      visualEffects: intensity !== 'light'
    };

    return {
      elements,
      intensity,
      timing,
      customization
    };
  }

  /**
   * Detect frustration indicators
   * Requirement 4.1: Detect frustration from interaction patterns
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
    const avgResponseTime = interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / (interactions.length || 1);
    if (avgResponseTime > 45000) {
      indicators.push('long_response_times');
      severity += 0.2;
    }

    // Negative sentiment in responses
    const hasNegativeSentiment = interactions.some(i =>
      i.content?.toLowerCase().match(/(frustrated|angry|hate|stupid|give up|too hard|can't do|impossible)/i)
    );
    if (hasNegativeSentiment) {
      indicators.push('negative_sentiment');
      severity += 0.35;
    }

    // Repeated requests for help
    const helpRequests = interactions.filter(i =>
      i.content?.toLowerCase().match(/(help|don't understand|confused|explain|show me)/i)
    ).length;
    if (helpRequests >= 2) {
      indicators.push('repeated_help_requests');
      severity += 0.2;
    }

    // Check frustration metric
    if (learningState.engagementMetrics.frustrationLevel > 0.6) {
      indicators.push('high_frustration_metric');
      severity += 0.3;
    }

    if (indicators.length === 0) return null;

    const confidence = Math.min(1, indicators.length * 0.25);

    return {
      type: 'frustration',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
    };
  }

  /**
   * Detect disengagement
   * Requirement 4.1: Engagement drop detection
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

    // Low engagement level
    if (engagement.currentLevel < this.DISENGAGEMENT_THRESHOLD) {
      indicators.push('low_engagement_level');
      severity += 0.35;
    }

    if (indicators.length === 0) return null;

    const confidence = Math.min(1, indicators.length * 0.2);

    return {
      type: 'disengagement',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
    };
  }

  /**
   * Detect anxiety
   */
  private detectAnxiety(
    interactions: any[],
    learningState: LearningState
  ): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Anxious language patterns
    const anxiousLanguage = interactions.filter(i =>
      i.content?.toLowerCase().match(/(worried|nervous|scared|afraid|anxious|stress)/i)
    ).length;

    if (anxiousLanguage >= 2) {
      indicators.push('anxious_language');
      severity += 0.4;
    }

    // Excessive checking/validation seeking
    const validationSeeking = interactions.filter(i =>
      i.content?.toLowerCase().match(/(is this right|am i correct|did i do it right|is this okay)/i)
    ).length;

    if (validationSeeking >= 3) {
      indicators.push('validation_seeking');
      severity += 0.3;
    }

    // Rapid response times (rushing)
    const avgResponseTime = interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / (interactions.length || 1);
    if (avgResponseTime < 5000 && interactions.length > 3) {
      indicators.push('rushing_responses');
      severity += 0.2;
    }

    if (indicators.length === 0) return null;

    const confidence = Math.min(1, indicators.length * 0.3);

    return {
      type: 'anxiety',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
    };
  }

  /**
   * Detect boredom
   */
  private detectBoredom(
    interactions: any[],
    learningState: LearningState
  ): InterventionTrigger | null {
    const indicators: string[] = [];
    let severity = 0;

    // Minimal effort responses
    const shortResponses = interactions.filter(i =>
      i.content && i.content.length < 10
    ).length;

    if (shortResponses >= 4) {
      indicators.push('minimal_effort_responses');
      severity += 0.3;
    }

    // High accuracy with low engagement
    const highAccuracy = interactions.filter(i => i.correct).length / (interactions.length || 1) > 0.8;
    const lowEngagement = learningState.engagementMetrics.currentLevel < 0.4;

    if (highAccuracy && lowEngagement) {
      indicators.push('high_accuracy_low_engagement');
      severity += 0.4;
    }

    // Repetitive patterns
    const uniqueResponses = new Set(interactions.map(i => i.content)).size;
    if (uniqueResponses < interactions.length * 0.5) {
      indicators.push('repetitive_responses');
      severity += 0.25;
    }

    // Bored language
    const boredLanguage = interactions.some(i =>
      i.content?.toLowerCase().match(/(boring|bored|tired|sleepy|whatever|don't care)/i)
    );

    if (boredLanguage) {
      indicators.push('bored_language');
      severity += 0.35;
    }

    if (indicators.length === 0) return null;

    const confidence = Math.min(1, indicators.length * 0.25);

    return {
      type: 'boredom',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
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

    const confidence = Math.min(1, indicators.length * 0.3);

    return {
      type: 'confusion',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
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

    const confidence = Math.min(1, indicators.length * 0.35);

    return {
      type: 'fatigue',
      severity: Math.min(1, severity),
      indicators,
      detectedAt: Date.now(),
      confidence
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

    const confidence = Math.min(1, indicators.length * 0.4);

    return {
      type: 'success',
      severity,
      indicators,
      detectedAt: Date.now(),
      confidence
    };
  }

  /**
   * Determine if intervention should occur
   */
  private shouldIntervene(
    triggers: InterventionTrigger[],
    engagementDrop: EngagementDropDetection | null,
    emotionalState: EmotionalStateDetection | null
  ): boolean {
    // High severity triggers
    const highSeverityTrigger = triggers.some(t => t.severity >= this.FRUSTRATION_THRESHOLD);
    if (highSeverityTrigger) return true;

    // Critical engagement drop
    if (engagementDrop?.severity === 'critical') return true;

    // Negative emotional state with high confidence
    if (emotionalState && 
        ['frustrated', 'anxious', 'confused'].includes(emotionalState.primary) &&
        emotionalState.confidence > 0.7) {
      return true;
    }

    // Multiple moderate triggers
    const moderateTriggers = triggers.filter(t => t.severity >= 0.4);
    if (moderateTriggers.length >= 2) return true;

    return false;
  }

  /**
   * Calculate optimal intervention timing
   * Requirement 4.5: Motivational intervention timing optimization
   */
  private calculateOptimalInterventionTiming(
    triggers: InterventionTrigger[],
    engagementDrop: EngagementDropDetection | null,
    emotionalState: EmotionalStateDetection | null,
    studentId: string
  ): { timing: 'immediate' | 'delayed' | 'scheduled'; delay: number; reason: string } {
    // Urgent situations require immediate intervention
    const urgentTrigger = triggers.some(t => t.severity > 0.8);
    if (urgentTrigger || engagementDrop?.severity === 'critical') {
      return {
        timing: 'immediate',
        delay: 0,
        reason: 'Critical situation requires immediate intervention'
      };
    }

    // Frustration benefits from slight delay to avoid overwhelming
    if (emotionalState?.primary === 'frustrated' && emotionalState.confidence > 0.7) {
      return {
        timing: 'delayed',
        delay: this.OPTIMAL_INTERVENTION_DELAY,
        reason: 'Brief delay allows student to attempt self-regulation'
      };
    }

    // Success moments should be celebrated immediately
    if (triggers.some(t => t.type === 'success')) {
      return {
        timing: 'immediate',
        delay: 0,
        reason: 'Immediate positive reinforcement maximizes impact'
      };
    }

    // Moderate situations can wait for natural break
    return {
      timing: 'scheduled',
      delay: 60000, // 1 minute
      reason: 'Wait for natural transition point'
    };
  }

  /**
   * Generate break recommendation
   */
  private generateBreakRecommendation(
    learningState: LearningState,
    reason: string
  ): any {
    const sessionDuration = (Date.now() - (learningState.sessionStartTime || Date.now())) / (1000 * 60);
    const fatigue = learningState.engagementMetrics.attentionSpan < 0.3;

    let priority: Priority = 'medium';
    let message = '';
    let breakDuration = 5; // minutes

    if (fatigue || sessionDuration > 60) {
      priority = 'urgent';
      message = "You've been working really hard! Let's take a well-deserved break. 🌻";
      breakDuration = 10;
    } else if (sessionDuration > 45) {
      priority = 'high';
      message = "Great work so far! How about a quick break to recharge? ⚡";
      breakDuration = 5;
    } else {
      priority = 'medium';
      message = "Let's take a short break and come back refreshed! 🌈";
      breakDuration = 3;
    }

    return {
      priority,
      message,
      reason,
      breakDuration,
      suggestions: [
        'Stretch and move around',
        'Get a drink of water',
        'Look away from the screen',
        'Take some deep breaths'
      ]
    };
  }

  /**
   * Generate appropriate interventions
   */
  private generateInterventions(
    triggers: InterventionTrigger[],
    learningState: LearningState,
    emotionalState: EmotionalStateDetection | null,
    engagementDrop: EngagementDropDetection | null
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
        case 'anxiety':
          interventions.push(...this.handleAnxiety(trigger, learningState));
          break;
        case 'boredom':
          interventions.push(...this.handleBoredom(trigger, learningState));
          break;
        case 'success':
          interventions.push(...this.handleSuccess(trigger, learningState));
          break;
      }
    }

    // Add engagement-specific interventions
    if (engagementDrop && engagementDrop.detected) {
      interventions.push(...this.handleEngagementDrop(engagementDrop, learningState));
    }

    // Sort by priority and predicted effectiveness
    return interventions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by effectiveness
      return (b.effectiveness || 0.5) - (a.effectiveness || 0.5);
    });
  }

  /**
   * Handle frustration
   * Requirements 4.1, 4.2, 4.3: Detect frustration, adjust difficulty, provide scaffolding
   */
  private handleFrustration(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    if (trigger.severity > 0.7) {
      // Severe frustration - immediate intervention with maximum support
      const scaffolding = this.generateScaffolding(learningState, null, []);
      const difficultyAdjustment = this.calculateDifficultyAdjustment(learningState, { accuracyRate: 0.3 });

      actions.push({
        type: 'encouragement',
        priority: 'urgent',
        action: 'provide_encouragement',
        message: "I can see this is challenging! Let's take a step back and try a different approach. You're doing great, and I'm here to help! 💪",
        timing: 'immediate',
        effectiveness: 0.85
      });

      actions.push({
        type: 'difficulty_adjustment',
        priority: 'high',
        action: 'reduce_difficulty',
        difficultyAdjustment,
        scaffolding,
        adjustments: {
          difficulty: difficultyAdjustment.recommendedDifficulty,
          providedHints: true,
          scaffolding: 'maximum'
        },
        timing: 'immediate',
        effectiveness: 0.9
      });

      actions.push({
        type: 'break_suggestion',
        priority: 'high',
        action: 'suggest_break',
        message: "How about we take a quick break? When you're ready, we can try something fun and easier! 🌈",
        timing: 'immediate',
        effectiveness: 0.75
      });
    } else {
      // Moderate frustration - provide hints and scaffolding
      const scaffolding = this.generateScaffolding(learningState, null, []);

      actions.push({
        type: 'hint',
        priority: 'medium',
        action: 'provide_hint',
        message: "Here's a helpful hint to guide you! Remember, learning takes time, and you're making progress! ✨",
        scaffolding,
        timing: 'after_current',
        effectiveness: 0.7
      });

      actions.push({
        type: 'alternative_explanation',
        priority: 'medium',
        action: 'reteach_concept',
        adjustments: {
          useAlternativeMethod: true,
          includeVisualAids: true
        },
        timing: 'after_current',
        effectiveness: 0.75
      });
    }

    return actions;
  }

  /**
   * Handle disengagement
   * Requirements 4.1, 4.4: Detect disengagement, inject gamification
   */
  private handleDisengagement(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];
    const gamification = this.generateGamificationInjection(learningState, learningState.engagementMetrics.currentLevel);

    actions.push({
      type: 'engagement_boost',
      priority: 'high',
      action: 'switch_activity_type',
      message: "Let's try something different and more exciting! 🎉",
      gamification,
      adjustments: {
        activityType: 'game',
        gamification: true
      },
      timing: 'immediate',
      effectiveness: 0.8
    });

    actions.push({
      type: 'interest_connection',
      priority: 'medium',
      action: 'connect_to_interests',
      adjustments: {
        useStudentInterests: true,
        personalizeContent: true
      },
      timing: 'next_activity',
      effectiveness: 0.75
    });

    actions.push({
      type: 'motivational',
      priority: 'medium',
      action: 'show_progress',
      message: "Look how far you've come! You've earned [X] points and unlocked [Y] badges! 🌟",
      gamification,
      timing: 'immediate',
      effectiveness: 0.7
    });

    return actions;
  }

  /**
   * Handle engagement drop
   * Requirement 4.1, 4.4: Respond to engagement drops with gamification
   */
  private handleEngagementDrop(
    engagementDrop: EngagementDropDetection,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];
    const gamification = this.generateGamificationInjection(learningState, engagementDrop.currentLevel);

    if (engagementDrop.severity === 'critical') {
      actions.push({
        type: 'emergency_engagement',
        priority: 'urgent',
        action: 'emergency_engagement_recovery',
        message: "Let's switch things up with something really fun! 🚀",
        gamification,
        adjustments: {
          activityType: 'game',
          difficulty: 'easy',
          gamificationIntensity: 'heavy'
        },
        timing: 'immediate',
        effectiveness: 0.85
      });
    } else if (engagementDrop.severity === 'severe') {
      actions.push({
        type: 'engagement_recovery',
        priority: 'high',
        action: 'boost_engagement',
        message: "Time for something more interactive! 🎮",
        gamification,
        timing: 'immediate',
        effectiveness: 0.75
      });
    }

    return actions;
  }

  /**
   * Handle anxiety
   */
  private handleAnxiety(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];
    const scaffolding = this.generateScaffolding(learningState, null, []);

    actions.push({
      type: 'reassurance',
      priority: 'high',
      action: 'provide_reassurance',
      message: "You're doing wonderfully! There's no rush - take your time and trust yourself. 🌟",
      scaffolding,
      timing: 'immediate',
      effectiveness: 0.8
    });

    actions.push({
      type: 'reduce_pressure',
      priority: 'high',
      action: 'reduce_pressure',
      adjustments: {
        removeTimers: true,
        emphasizeProcess: true,
        celebrateEffort: true
      },
      timing: 'immediate',
      effectiveness: 0.75
    });

    return actions;
  }

  /**
   * Handle boredom
   */
  private handleBoredom(
    trigger: InterventionTrigger,
    learningState: LearningState
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];
    const difficultyAdjustment = this.calculateDifficultyAdjustment(learningState, { accuracyRate: 0.85 });

    actions.push({
      type: 'challenge',
      priority: 'high',
      action: 'increase_challenge',
      message: "You're ready for something more exciting! Let's level up! 🚀",
      difficultyAdjustment,
      adjustments: {
        difficulty: difficultyAdjustment.recommendedDifficulty,
        addVariety: true,
        increaseComplexity: true
      },
      timing: 'next_activity',
      effectiveness: 0.8
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
      message: "It seems like this might be unclear. Let me explain it in a different way! 💡",
      timing: 'immediate',
      effectiveness: 0.8
    });

    actions.push({
      type: 'example',
      priority: 'high',
      action: 'provide_concrete_examples',
      adjustments: {
        includeRealWorldExamples: true,
        useAnalogies: true
      },
      timing: 'immediate',
      effectiveness: 0.85
    });

    actions.push({
      type: 'check_understanding',
      priority: 'medium',
      action: 'ask_comprehension_questions',
      timing: 'after_current',
      effectiveness: 0.7
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
      message: "You've been working hard! Let's take a well-deserved break. Come back when you're ready! 🌻",
      timing: 'immediate',
      effectiveness: 0.95
    });

    actions.push({
      type: 'session_summary',
      priority: 'high',
      action: 'summarize_achievements',
      message: "Here's everything you accomplished today! You should be proud! 🎯",
      timing: 'immediate',
      effectiveness: 0.8
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
      message: "Wow! You're on fire! That's amazing work! 🎉✨🌟",
      timing: 'immediate',
      effectiveness: 0.9
    });

    if (trigger.severity > 0.8) {
      actions.push({
        type: 'challenge',
        priority: 'medium',
        action: 'offer_harder_challenge',
        message: "You're ready for something more challenging! Want to try? 🚀",
        timing: 'next_activity',
        effectiveness: 0.75
      });
    }

    actions.push({
      type: 'reward',
      priority: 'medium',
      action: 'award_bonus_points',
      adjustments: {
        bonusPoints: 50,
        specialBadge: true
      },
      timing: 'immediate',
      effectiveness: 0.85
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

    const recentScore = recent.filter(i => i.correct).length / (recent.length || 1);
    const earlierScore = earlier.length > 0
      ? earlier.filter(i => i.correct).length / earlier.length
      : recentScore;

    return recentScore - earlierScore;
  }

  /**
   * Analyze sentiment patterns in interactions
   */
  private analyzeSentimentPatterns(interactions: any[]): Record<string, number> {
    const patterns: Record<string, number> = {
      engaged: 0,
      frustrated: 0,
      confused: 0,
      bored: 0,
      excited: 0,
      anxious: 0,
      tired: 0
    };

    for (const interaction of interactions) {
      const content = interaction.content?.toLowerCase() || '';

      // Frustrated
      if (content.match(/(frustrated|angry|hate|stupid|give up|too hard|can't do)/i)) {
        patterns.frustrated += 0.3;
      }

      // Confused
      if (content.match(/(confused|don't understand|unclear|what|huh)/i)) {
        patterns.confused += 0.3;
      }

      // Bored
      if (content.match(/(boring|bored|tired|sleepy|whatever)/i)) {
        patterns.bored += 0.3;
      }

      // Excited
      if (content.match(/(cool|awesome|amazing|love|fun|exciting|yes!|wow)/i)) {
        patterns.excited += 0.3;
        patterns.engaged += 0.2;
      }

      // Anxious
      if (content.match(/(worried|nervous|scared|anxious|stress)/i)) {
        patterns.anxious += 0.3;
      }

      // Engaged
      if (content.length > 50 && interaction.correct) {
        patterns.engaged += 0.2;
      }
    }

    return patterns;
  }

  /**
   * Analyze response patterns
   */
  private analyzeResponsePatterns(interactions: any[]): {
    quick: boolean;
    slow: boolean;
    accurate: boolean;
    inaccurate: boolean;
  } {
    if (interactions.length === 0) {
      return { quick: false, slow: false, accurate: false, inaccurate: false };
    }

    const avgResponseTime = interactions.reduce((sum, i) => sum + (i.responseTime || 0), 0) / interactions.length;
    const accuracyRate = interactions.filter(i => i.correct).length / interactions.length;

    return {
      quick: avgResponseTime < 10000,
      slow: avgResponseTime > 30000,
      accurate: accuracyRate > 0.7,
      inaccurate: accuracyRate < 0.4
    };
  }

  /**
   * Decrease difficulty level
   */
  private decreaseDifficulty(current: string, magnitude: number): any {
    const levels = ['easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(current);
    
    if (currentIndex <= 0) return 'easy';
    
    const steps = magnitude > 0.7 ? 2 : 1;
    const newIndex = Math.max(0, currentIndex - steps);
    
    return levels[newIndex];
  }

  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: string): any {
    const levels = ['easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(current);
    
    if (currentIndex >= levels.length - 1) return 'expert';
    
    return levels[currentIndex + 1];
  }
}

// Export singleton instance
export const interventionAgent = new InterventionAgent();
