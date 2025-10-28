/**
 * Automatic Intervention System
 * 
 * This runs automatically after each session to detect
 * if immediate intervention is needed.
 * 
 * Think of this as the "reflex" system - fast reactions
 * to critical situations.
 */

import { getLearningBrain } from './index';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

interface AutoInterventionTrigger {
  condition: (data: any) => boolean;
  action: (data: any) => Promise<void>;
  name: string;
  priority: 'critical' | 'high' | 'medium';
}

/**
 * Triggers that run after EVERY question attempt
 */
const IMMEDIATE_TRIGGERS: AutoInterventionTrigger[] = [
  {
    name: 'three_wrong_in_row',
    priority: 'critical',
    condition: (data) => {
      // If student got 3 wrong in a row with high confidence
      const last3 = data.recentAttempts.slice(0, 3);
      return last3.length === 3 &&
             last3.every((a: any) => a.correctness === 'incorrect') &&
             last3.filter((a: any) => a.confidence_level === 'high').length >= 2;
    },
    action: async (data) => {
      // STOP THE SESSION - they have a misconception
      await createUrgentNote(
        data.userId,
        data.skillId,
        data.sessionId,
        'CRITICAL: Student has misconception. Got 3 wrong with high confidence. STOP and reteach concept.'
      );
      
      // Generate immediate remedial content
      const brain = getLearningBrain();
      await brain.generateIntervention({
        type: 'concept_reteach',
        priority: 'urgent',
        skillId: data.skillId,
        reason: 'Misconception detected',
        suggestedAction: 'Immediate concept reteach',
        estimatedImpact: 95,
      }, data.userId);
    },
  },

  {
    name: 'rapid_guessing',
    priority: 'high',
    condition: (data) => {
      // If student answered in < 3 seconds and got it wrong
      return data.timeToAnswer < 3 && data.correctness === 'incorrect';
    },
    action: async (data) => {
      await createNote(
        data.userId,
        data.skillId,
        data.sessionId,
        'Student rushing/guessing. Questions may be too hard or student is disengaged.',
        'pattern'
      );
    },
  },

  {
    name: 'unusually_slow',
    priority: 'medium',
    condition: (data) => {
      // If student took 5x longer than average
      return data.averageTime && data.timeToAnswer > data.averageTime * 5;
    },
    action: async (data) => {
      await createNote(
        data.userId,
        data.skillId,
        data.sessionId,
        `Question took ${data.timeToAnswer}s (avg: ${data.averageTime}s). Something is confusing here.`,
        'insight'
      );
    },
  },

  {
    name: 'perfect_streak_broken',
    priority: 'medium',
    condition: (data) => {
      // If student had 5+ correct in a row, then got one wrong
      const attempts = data.recentAttempts;
      if (attempts.length < 6) return false;
      
      const last5 = attempts.slice(1, 6);
      const current = attempts[0];
      
      return last5.every((a: any) => a.correctness === 'correct') &&
             current.correctness === 'incorrect';
    },
    action: async (data) => {
      await createNote(
        data.userId,
        data.skillId,
        data.sessionId,
        'Broke perfect streak. This question revealed a gap. Mark for review.',
        'insight'
      );
    },
  },
];

/**
 * Triggers that run after EVERY session
 */
const SESSION_TRIGGERS: AutoInterventionTrigger[] = [
  {
    name: 'no_progress_in_session',
    priority: 'high',
    condition: (data) => {
      return data.masteryDelta <= 0 && data.questionsAttempted >= 5;
    },
    action: async (data) => {
      await createUrgentNote(
        data.userId,
        data.skillId,
        data.sessionId,
        `Session complete but NO mastery gain (${data.questionsAttempted} questions). Need different approach.`
      );

      // Trigger brain analysis
      const brain = getLearningBrain();
      await brain.analyzeStudent(data.userId);
    },
  },

  {
    name: 'declining_attention',
    priority: 'high',
    condition: (data) => {
      // If reasoning quality dropped significantly during session
      const attempts = data.sessionAttempts;
      if (attempts.length < 4) return false;

      const first2 = attempts.slice(0, 2);
      const last2 = attempts.slice(-2);

      const first2Avg = first2.reduce((sum: number, a: any) => sum + a.reasoning_quality, 0) / 2;
      const last2Avg = last2.reduce((sum: number, a: any) => sum + a.reasoning_quality, 0) / 2;

      return first2Avg - last2Avg > 1.5;
    },
    action: async (data) => {
      await createNote(
        data.userId,
        data.skillId,
        data.sessionId,
        'Attention declined during session. Started strong, ended weak. Sessions may be too long.',
        'pattern'
      );
    },
  },

  {
    name: 'mastery_threshold_reached',
    priority: 'medium',
    condition: (data) => {
      return data.newMastery >= 70 && data.oldMastery < 70;
    },
    action: async (data) => {
      await createNote(
        data.userId,
        data.skillId,
        data.sessionId,
        `🎉 Mastery threshold reached! ${data.skillName} is now at ${data.newMastery}%. Ready for harder challenges.`,
        'celebration'
      );
    },
  },
];

/**
 * Run immediate triggers after a question attempt
 */
export async function checkImmediateTriggers(attemptData: any): Promise<void> {
  for (const trigger of IMMEDIATE_TRIGGERS) {
    try {
      if (trigger.condition(attemptData)) {
        logger.info(`Trigger activated: ${trigger.name}`, { 
          userId: attemptData.userId,
          priority: trigger.priority,
        });
        await trigger.action(attemptData);
      }
    } catch (error) {
      logger.error(`Error in trigger ${trigger.name}`, error as Error);
    }
  }
}

/**
 * Run session triggers after a session ends
 */
export async function checkSessionTriggers(sessionData: any): Promise<void> {
  for (const trigger of SESSION_TRIGGERS) {
    try {
      if (trigger.condition(sessionData)) {
        logger.info(`Session trigger activated: ${trigger.name}`, {
          userId: sessionData.userId,
          priority: trigger.priority,
        });
        await trigger.action(sessionData);
      }
    } catch (error) {
      logger.error(`Error in session trigger ${trigger.name}`, error as Error);
    }
  }
}

/**
 * Helper: Create a note
 */
async function createNote(
  userId: string,
  skillId: string,
  sessionId: string,
  comment: string,
  type: 'pattern' | 'insight' | 'intervention' | 'celebration'
): Promise<void> {
  const supabase = getAdminClient();
  if (!supabase) return;

  await supabase.from('notes').insert({
    user_id: userId,
    sunny_comment: comment,
    related_skill_id: skillId,
    related_session_id: sessionId,
    note_type: type,
    priority: 'medium',
    actionable: type === 'intervention',
  } as any);
}

/**
 * Helper: Create an urgent note
 */
async function createUrgentNote(
  userId: string,
  skillId: string,
  sessionId: string,
  comment: string
): Promise<void> {
  const supabase = getAdminClient();
  if (!supabase) return;

  await supabase.from('notes').insert({
    user_id: userId,
    sunny_comment: `⚠️ ${comment}`,
    related_skill_id: skillId,
    related_session_id: sessionId,
    note_type: 'intervention',
    priority: 'high',
    actionable: true,
  } as any);
}

/**
 * Weekly deep analysis (run via cron)
 */
export async function runWeeklyAnalysis(userId: string): Promise<void> {
  logger.info('Running weekly deep analysis', { userId });

  const brain = getLearningBrain();
  const analysis = await brain.analyzeStudent(userId);

  // Generate report
  const report = {
    userId,
    timestamp: new Date(),
    skillsAnalyzed: analysis.currentSkills.length,
    strugglingCount: analysis.currentSkills.filter(s => s.trend === 'stuck').length,
    improvingCount: analysis.currentSkills.filter(s => s.trend === 'improving').length,
    velocity: analysis.learningVelocity,
    patterns: analysis.behavioralPatterns,
    interventions: analysis.interventionsNeeded,
  };

  // Store report
  const supabase = getAdminClient();
  if (supabase) {
    await supabase.from('notes').insert({
      user_id: userId,
      sunny_comment: `Weekly Analysis: ${report.strugglingCount} skills need attention, ${report.improvingCount} improving. Velocity: ${report.velocity.overall.toFixed(1)} pts/week.`,
      note_type: 'insight',
      priority: report.strugglingCount > 2 ? 'high' : 'medium',
      actionable: report.strugglingCount > 2,
    } as any);
  }

  logger.info('Weekly analysis complete', { userId, report });
}
