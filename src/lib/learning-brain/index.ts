/**
 * Learning Brain - The Intelligence Layer
 * 
 * This is the "brain" of Sunny AI. It:
 * 1. Detects when students are struggling
 * 2. Generates targeted interventions
 * 3. Predicts future difficulties
 * 4. Learns from patterns
 * 5. Self-corrects strategies
 * 
 * Think of this as the "consciousness" that watches everything
 * and makes intelligent decisions.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { getAIService } from '@/lib/ai-service';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface StudentState {
  userId: string;
  currentSkills: SkillState[];
  recentSessions: SessionData[];
  behavioralPatterns: BehavioralPattern[];
  learningVelocity: LearningVelocity;
  interventionsNeeded: Intervention[];
}

interface SkillState {
  id: string;
  domain: string;
  mastery: number;
  trend: 'improving' | 'declining' | 'stable' | 'stuck';
  velocity: number; // mastery points per week
  lastPracticed: Date;
  strugglingIndicators: string[];
}

interface BehavioralPattern {
  pattern: string;
  confidence: number;
  firstSeen: Date;
  occurrences: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface LearningVelocity {
  overall: number; // mastery points per week across all skills
  byCategory: Record<string, number>;
  trend: 'accelerating' | 'decelerating' | 'stable';
  predictedBurnout: boolean;
}

interface Intervention {
  type: 'remedial_quiz' | 'concept_reteach' | 'prerequisite_check' | 'break_recommended' | 'difficulty_adjustment';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  skillId: string;
  reason: string;
  suggestedAction: string;
  estimatedImpact: number; // 0-100
}

interface SessionData {
  id: string;
  skillId: string;
  masteryDelta: number;
  questionsAttempted: number;
  questionsCorrect: number;
  averageReasoningQuality: number;
  attentionQuality: string;
  timestamp: Date;
}

// ============================================================================
// Learning Brain Class
// ============================================================================

export class LearningBrain {
  private supabase: any;
  private aiService: any;

  constructor() {
    this.supabase = getAdminClient();
    this.aiService = getAIService();
  }

  /**
   * MAIN BRAIN FUNCTION
   * Analyzes student state and determines what to do next
   */
  async analyzeStudent(userId: string): Promise<StudentState> {
    logger.info('Brain analyzing student', { userId });

    // Gather all data
    const skills = await this.getSkillStates(userId);
    const sessions = await this.getRecentSessions(userId, 14); // Last 2 weeks
    const patterns = await this.detectBehavioralPatterns(userId, sessions);
    const velocity = await this.calculateLearningVelocity(userId, sessions);
    const interventions = await this.determineInterventions(skills, sessions, patterns, velocity);

    const state: StudentState = {
      userId,
      currentSkills: skills,
      recentSessions: sessions,
      behavioralPatterns: patterns,
      learningVelocity: velocity,
      interventionsNeeded: interventions,
    };

    // Store brain analysis
    await this.storeBrainAnalysis(state);

    return state;
  }

  /**
   * Get detailed skill states with trend analysis
   */
  private async getSkillStates(userId: string): Promise<SkillState[]> {
    const { data: skills } = await this.supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId);

    if (!skills) return [];

    // Get historical data for each skill
    const skillStates = await Promise.all(
      skills.map(async (skill: any) => {
        const { data: attempts } = await this.supabase
          .from('question_attempts')
          .select('*, sessions!inner(started_at)')
          .eq('skill_id', skill.id)
          .order('created_at', { ascending: false })
          .limit(20);

        return this.analyzeSkillTrend(skill, attempts || []);
      })
    );

    return skillStates;
  }

  /**
   * Analyze skill trend and detect struggling indicators
   */
  private analyzeSkillTrend(skill: any, recentAttempts: any[]): SkillState {
    if (recentAttempts.length === 0) {
      return {
        id: skill.id,
        domain: skill.domain,
        mastery: skill.mastery,
        trend: 'stable',
        velocity: 0,
        lastPracticed: new Date(skill.last_seen),
        strugglingIndicators: [],
      };
    }

    // Calculate trend
    const last5 = recentAttempts.slice(0, 5);
    const correctRate = last5.filter(a => a.correctness === 'correct').length / last5.length;
    const avgReasoning = last5.reduce((sum, a) => sum + (a.reasoning_quality || 0), 0) / last5.length;

    // Detect struggling indicators
    const indicators: string[] = [];
    
    if (correctRate < 0.4) indicators.push('low_success_rate');
    if (avgReasoning < 2.5) indicators.push('weak_reasoning');
    if (skill.mastery < 30 && skill.total_attempts > 10) indicators.push('stuck_at_low_mastery');
    
    const guessingCount = last5.filter(a => a.answer_style === 'guess').length;
    if (guessingCount > 2) indicators.push('frequent_guessing');

    const rushingCount = last5.filter(a => a.answer_style === 'rushed').length;
    if (rushingCount > 3) indicators.push('rushing_through');

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' | 'stuck' = 'stable';
    if (indicators.length >= 3) trend = 'stuck';
    else if (correctRate < 0.5 && avgReasoning < 3) trend = 'declining';
    else if (correctRate > 0.7 && avgReasoning > 3.5) trend = 'improving';

    // Calculate velocity (mastery change per week)
    const velocity = this.calculateSkillVelocity(recentAttempts);

    return {
      id: skill.id,
      domain: skill.domain,
      mastery: skill.mastery,
      trend,
      velocity,
      lastPracticed: new Date(skill.last_seen),
      strugglingIndicators: indicators,
    };
  }

  /**
   * Calculate how fast mastery is changing
   */
  private calculateSkillVelocity(attempts: any[]): number {
    if (attempts.length < 2) return 0;

    // Get attempts from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => 
      new Date(a.sessions.started_at) > weekAgo
    );

    if (recentAttempts.length === 0) return 0;

    // Calculate average mastery change
    const masteryChanges = recentAttempts.map((a): number => {
      if (a.correctness === 'correct') return a.reasoning_quality >= 4 ? 3 : 2;
      if (a.correctness === 'partial') return 0;
      return a.confidence_level === 'high' ? -3 : -2;
    });

    const avgChange = masteryChanges.reduce((sum: number, c: number) => sum + c, 0) / masteryChanges.length;
    
    // Extrapolate to weekly velocity
    const attemptsPerWeek = (recentAttempts.length / 7) * 7;
    return avgChange * attemptsPerWeek;
  }

  /**
   * Get recent session data
   */
  private async getRecentSessions(userId: string, days: number): Promise<SessionData[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: sessions } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: false });

    if (!sessions) return [];

    return sessions.map((s: any) => ({
      id: s.id,
      skillId: s.target_skill_id,
      masteryDelta: s.mastery_delta || 0,
      questionsAttempted: s.questions_attempted || 0,
      questionsCorrect: s.questions_correct || 0,
      averageReasoningQuality: s.reasoning_quality_avg || 0,
      attentionQuality: s.attention_quality || 'unknown',
      timestamp: new Date(s.started_at),
    }));
  }

  /**
   * PATTERN DETECTION
   * This is where the brain "learns" about the student
   */
  private async detectBehavioralPatterns(
    userId: string,
    sessions: SessionData[]
  ): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Pattern 1: Time of day performance
    const morningPerf = sessions.filter(s => s.timestamp.getHours() < 12);
    const afternoonPerf = sessions.filter(s => s.timestamp.getHours() >= 12);
    
    if (morningPerf.length > 3 && afternoonPerf.length > 3) {
      const morningAvg = morningPerf.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / morningPerf.length;
      const afternoonAvg = afternoonPerf.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / afternoonPerf.length;
      
      if (Math.abs(morningAvg - afternoonAvg) > 0.5) {
        patterns.push({
          pattern: morningAvg > afternoonAvg ? 'performs_better_morning' : 'performs_better_afternoon',
          confidence: Math.min(Math.abs(morningAvg - afternoonAvg) * 20, 100),
          firstSeen: sessions[sessions.length - 1].timestamp,
          occurrences: Math.min(morningPerf.length, afternoonPerf.length),
          impact: 'positive',
        });
      }
    }

    // Pattern 2: Session length sweet spot
    const shortSessions = sessions.filter(s => s.questionsAttempted <= 3);
    const mediumSessions = sessions.filter(s => s.questionsAttempted > 3 && s.questionsAttempted <= 6);
    const longSessions = sessions.filter(s => s.questionsAttempted > 6);

    const sessionTypes = [
      { type: 'short', sessions: shortSessions },
      { type: 'medium', sessions: mediumSessions },
      { type: 'long', sessions: longSessions },
    ];

    const bestType = sessionTypes.reduce((best, current) => {
      if (current.sessions.length === 0) return best;
      const avg = current.sessions.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / current.sessions.length;
      const bestAvg = best.sessions.length === 0 ? 0 : 
        best.sessions.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / best.sessions.length;
      return avg > bestAvg ? current : best;
    });

    if (bestType.sessions.length > 2) {
      patterns.push({
        pattern: `optimal_session_length_${bestType.type}`,
        confidence: 70,
        firstSeen: sessions[sessions.length - 1].timestamp,
        occurrences: bestType.sessions.length,
        impact: 'positive',
      });
    }

    // Pattern 3: Declining attention over time
    if (sessions.length >= 5) {
      const first3 = sessions.slice(-3);
      const last3 = sessions.slice(0, 3);
      
      const first3Avg = first3.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / 3;
      const last3Avg = last3.reduce((sum, s) => sum + s.averageReasoningQuality, 0) / 3;

      if (first3Avg - last3Avg > 0.7) {
        patterns.push({
          pattern: 'attention_declining_over_time',
          confidence: 80,
          firstSeen: last3[0].timestamp,
          occurrences: 3,
          impact: 'negative',
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate learning velocity across all skills
   */
  private async calculateLearningVelocity(
    userId: string,
    sessions: SessionData[]
  ): Promise<LearningVelocity> {
    if (sessions.length === 0) {
      return {
        overall: 0,
        byCategory: {},
        trend: 'stable',
        predictedBurnout: false,
      };
    }

    // Overall velocity
    const totalMasteryGain = sessions.reduce((sum, s) => sum + s.masteryDelta, 0);
    const daysSpan = (Date.now() - sessions[sessions.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const weeksSpan = Math.max(daysSpan / 7, 1);
    const overall = totalMasteryGain / weeksSpan;

    // Trend detection
    const recentHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const olderHalf = sessions.slice(Math.floor(sessions.length / 2));

    const recentVelocity = recentHalf.reduce((sum, s) => sum + s.masteryDelta, 0) / (recentHalf.length || 1);
    const olderVelocity = olderHalf.reduce((sum, s) => sum + s.masteryDelta, 0) / (olderHalf.length || 1);

    let trend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
    if (recentVelocity > olderVelocity * 1.2) trend = 'accelerating';
    else if (recentVelocity < olderVelocity * 0.8) trend = 'decelerating';

    // Burnout prediction
    const predictedBurnout = 
      trend === 'decelerating' && 
      sessions.length > 10 &&
      sessions.slice(0, 3).every(s => s.attentionQuality === 'declining');

    return {
      overall,
      byCategory: {}, // TODO: Calculate by category
      trend,
      predictedBurnout,
    };
  }

  /**
   * INTERVENTION DETERMINATION
   * This is where the brain decides what to do
   */
  private async determineInterventions(
    skills: SkillState[],
    sessions: SessionData[],
    patterns: BehavioralPattern[],
    velocity: LearningVelocity
  ): Promise<Intervention[]> {
    const interventions: Intervention[] = [];

    // Check each skill for struggles
    for (const skill of skills) {
      // URGENT: Student is stuck
      if (skill.trend === 'stuck' && skill.strugglingIndicators.length >= 3) {
        interventions.push({
          type: 'concept_reteach',
          priority: 'urgent',
          skillId: skill.id,
          reason: `Student stuck on ${skill.domain}. Indicators: ${skill.strugglingIndicators.join(', ')}`,
          suggestedAction: 'Generate remedial lesson with different teaching approach',
          estimatedImpact: 85,
        });

        // Also check prerequisites
        interventions.push({
          type: 'prerequisite_check',
          priority: 'high',
          skillId: skill.id,
          reason: 'May be missing foundational concepts',
          suggestedAction: 'Test prerequisite skills before continuing',
          estimatedImpact: 70,
        });
      }

      // HIGH: Declining performance
      if (skill.trend === 'declining' && skill.mastery < 50) {
        interventions.push({
          type: 'remedial_quiz',
          priority: 'high',
          skillId: skill.id,
          reason: `Mastery declining (${skill.mastery}). Needs targeted practice`,
          suggestedAction: 'Generate adaptive quiz focusing on weak areas',
          estimatedImpact: 75,
        });
      }

      // MEDIUM: Frequent guessing
      if (skill.strugglingIndicators.includes('frequent_guessing')) {
        interventions.push({
          type: 'difficulty_adjustment',
          priority: 'medium',
          skillId: skill.id,
          reason: 'Student guessing frequently - questions may be too hard',
          suggestedAction: 'Reduce difficulty temporarily, focus on building confidence',
          estimatedImpact: 60,
        });
      }
    }

    // Check for burnout
    if (velocity.predictedBurnout) {
      interventions.push({
        type: 'break_recommended',
        priority: 'high',
        skillId: '', // Applies to all
        reason: 'Attention declining, velocity dropping. Risk of burnout',
        suggestedAction: 'Recommend 1-2 day break, then return with easier content',
        estimatedImpact: 90,
      });
    }

    // Sort by priority and impact
    interventions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });

    return interventions;
  }

  /**
   * Store brain analysis for future reference
   */
  private async storeBrainAnalysis(state: StudentState): Promise<void> {
    // Store as a note for high-priority interventions
    for (const intervention of state.interventionsNeeded.filter(i => i.priority === 'urgent' || i.priority === 'high')) {
      await this.supabase.from('notes').insert({
        user_id: state.userId,
        sunny_comment: `[BRAIN] ${intervention.reason}. ${intervention.suggestedAction}`,
        related_skill_id: intervention.skillId || null,
        note_type: 'intervention',
        priority: intervention.priority === 'urgent' ? 'high' : intervention.priority,
        actionable: true,
      });
    }
  }

  /**
   * GENERATE ADAPTIVE INTERVENTION
   * Creates targeted content based on what student needs
   */
  async generateIntervention(intervention: Intervention, userId: string): Promise<any> {
    logger.info('Generating intervention', { type: intervention.type, userId });

    switch (intervention.type) {
      case 'remedial_quiz':
        return await this.generateRemedialQuiz(intervention.skillId, userId);
      
      case 'concept_reteach':
        return await this.generateConceptReteach(intervention.skillId, userId);
      
      case 'prerequisite_check':
        return await this.generatePrerequisiteCheck(intervention.skillId, userId);
      
      default:
        return null;
    }
  }

  /**
   * Generate a remedial quiz for struggling students
   */
  private async generateRemedialQuiz(skillId: string, userId: string): Promise<any> {
    // Get skill details
    const { data: skill } = await this.supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (!skill) return null;

    // Get recent mistakes
    const { data: attempts } = await this.supabase
      .from('question_attempts')
      .select('*')
      .eq('skill_id', skillId)
      .eq('correctness', 'incorrect')
      .order('created_at', { ascending: false })
      .limit(5);

    const commonMistakes = attempts?.map((a: any) => a.misunderstanding_label).filter(Boolean) || [];

    // Generate targeted quiz using AI
    const prompt = `You are Sunny, creating a REMEDIAL quiz for a struggling student.

SKILL: ${skill.display_name}
CURRENT MASTERY: ${skill.mastery}/100 (struggling)
COMMON MISTAKES: ${commonMistakes.join(', ') || 'Unknown'}

This student is STUCK. They need:
1. Easier questions to rebuild confidence
2. Step-by-step scaffolding
3. Immediate feedback after each question
4. Focus on ONE sub-concept at a time

Generate 5 questions that:
- Start VERY easy (success guaranteed)
- Gradually increase difficulty
- Target their specific misconceptions
- Require explanation, not just answers
- Build on each previous question

Return JSON array of questions with hints and encouragement.`;

    const response = await this.aiService.generateCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      maxTokens: 1500,
    });

    try {
      const questions = JSON.parse(response.content);
      return {
        type: 'remedial_quiz',
        skill: skill.display_name,
        difficulty: 'scaffolded',
        questions,
        specialInstructions: 'Take your time. We are rebuilding your foundation.',
      };
    } catch (error) {
      logger.error('Failed to parse remedial quiz', error as Error);
      return null;
    }
  }

  /**
   * Generate concept re-teaching with different approach
   */
  private async generateConceptReteach(skillId: string, userId: string): Promise<any> {
    const { data: skill } = await this.supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (!skill) return null;

    const prompt = `You are Sunny, re-teaching a concept that a student doesn't understand.

SKILL: ${skill.display_name}
PROBLEM: Student has tried ${skill.total_attempts} times but mastery is only ${skill.mastery}/100

They don't get it with the current approach. Try a COMPLETELY DIFFERENT method:
- If we used numbers, use visual diagrams
- If we used abstract, use real-world examples
- If we used formal language, use storytelling

Create a 3-part mini-lesson:
1. "Let's try this a different way" (new explanation)
2. "See it in action" (concrete example)
3. "Now you try" (guided practice)

Return JSON with lesson structure.`;

    const response = await this.aiService.generateCompletion({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.8,
      maxTokens: 1200,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if student is missing prerequisite skills
   */
  private async generatePrerequisiteCheck(skillId: string, userId: string): Promise<any> {
    // This would check skill dependencies
    // For now, return a simple diagnostic
    return {
      type: 'prerequisite_check',
      message: 'Checking if you have the foundation skills needed...',
      questions: [], // TODO: Generate diagnostic questions
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let brainInstance: LearningBrain | null = null;

export function getLearningBrain(): LearningBrain {
  if (!brainInstance) {
    brainInstance = new LearningBrain();
  }
  return brainInstance;
}
