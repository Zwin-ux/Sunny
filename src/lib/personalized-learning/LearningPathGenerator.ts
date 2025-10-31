/**
 * Personalized Learning Path Generator
 * Creates custom learning journeys based on student's brain analysis
 */

import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';
import { getLearningBrain } from '@/lib/learning-brain';

export interface LearningPath {
  studentId: string;
  currentLevel: number;
  strengths: string[];
  needsWork: string[];
  recommendedTopics: RecommendedTopic[];
  pace: 'accelerated' | 'standard' | 'supportive';
  estimatedCompletion: Date;
  milestones: Milestone[];
}

export interface RecommendedTopic {
  topic: string;
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'advanced';
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  prerequisites: string[];
  unlocks: string[];
}

export interface Milestone {
  date: Date;
  achievement: string;
  topics: string[];
  unlocks: string[];
}

export class LearningPathGenerator {
  /**
   * Generate personalized learning path for a student
   */
  async generatePath(userId: string): Promise<LearningPath> {
    // 1. Get brain analysis
    const brain = getLearningBrain();
    const analysis = await brain.analyzeStudent(userId);
    
    // 2. Get performance state from recent quizzes
    const performanceState = await this.getPerformanceState(userId);
    
    // 3. Determine current level and pace
    const currentLevel = performanceState.masteryLevel;
    const pace = this.determinePace(analysis, performanceState);
    
    // 4. Identify strengths and weaknesses
    const strengths = this.identifyStrengths(analysis, performanceState);
    const needsWork = this.identifyWeaknesses(analysis, performanceState);
    
    // 5. Generate recommended topics
    const recommendedTopics = await this.generateRecommendedTopics(
      currentLevel,
      strengths,
      needsWork,
      pace
    );
    
    // 6. Create milestones
    const milestones = this.createMilestones(recommendedTopics, pace);
    
    // 7. Estimate completion
    const estimatedCompletion = this.estimateCompletion(milestones);
    
    return {
      studentId: userId,
      currentLevel,
      strengths,
      needsWork,
      recommendedTopics,
      pace,
      estimatedCompletion,
      milestones
    };
  }
  
  /**
   * Determine optimal learning pace
   */
  private determinePace(
    analysis: any,
    performanceState: any
  ): 'accelerated' | 'standard' | 'supportive' {
    const accuracy = performanceState.accuracyRate || 0.75;
    const velocity = analysis.learningVelocity?.overall || 0;
    
    // Accelerated: High accuracy + fast learning
    if (accuracy > 0.85 && velocity > 0.7) {
      return 'accelerated';
    }
    
    // Supportive: Low accuracy or slow learning
    if (accuracy < 0.65 || velocity < 0.3) {
      return 'supportive';
    }
    
    // Standard: Everything else
    return 'standard';
  }
  
  /**
   * Identify student strengths
   */
  private identifyStrengths(analysis: any, performanceState: any): string[] {
    const strengths: string[] = [];
    
    // From brain analysis
    if (analysis.currentSkills) {
      analysis.currentSkills
        .filter((skill: any) => skill.trend === 'improving' || skill.proficiency > 0.8)
        .forEach((skill: any) => strengths.push(skill.domain));
    }
    
    // From performance state
    if (performanceState.strengthAreas) {
      strengths.push(...performanceState.strengthAreas);
    }
    
    // Deduplicate
    return [...new Set(strengths)];
  }
  
  /**
   * Identify areas needing work
   */
  private identifyWeaknesses(analysis: any, performanceState: any): string[] {
    const weaknesses: string[] = [];
    
    // From brain analysis - urgent interventions
    if (analysis.interventionsNeeded) {
      analysis.interventionsNeeded
        .filter((i: any) => i.priority === 'high' || i.priority === 'urgent')
        .forEach((i: any) => weaknesses.push(i.skillId));
    }
    
    // From performance state
    if (performanceState.strugglingIndicators) {
      weaknesses.push(...performanceState.strugglingIndicators);
    }
    
    // Deduplicate
    return [...new Set(weaknesses)];
  }
  
  /**
   * Generate recommended topics based on analysis
   */
  private async generateRecommendedTopics(
    currentLevel: number,
    strengths: string[],
    needsWork: string[],
    pace: string
  ): Promise<RecommendedTopic[]> {
    const topics: RecommendedTopic[] = [];
    
    // 1. Address weaknesses first (high priority)
    for (const weakness of needsWork.slice(0, 2)) {
      topics.push({
        topic: weakness,
        difficulty: 'easy', // Start easy for weak areas
        reason: 'Needs reinforcement - identified as growth area',
        priority: 'high',
        estimatedTime: pace === 'supportive' ? 45 : 30,
        prerequisites: [],
        unlocks: this.getUnlocks(weakness)
      });
    }
    
    // 2. Build on strengths (medium priority)
    for (const strength of strengths.slice(0, 2)) {
      topics.push({
        topic: `Advanced ${strength}`,
        difficulty: 'medium',
        reason: 'Building on your strengths',
        priority: 'medium',
        estimatedTime: pace === 'accelerated' ? 20 : 30,
        prerequisites: [strength],
        unlocks: this.getUnlocks(`Advanced ${strength}`)
      });
    }
    
    // 3. New challenges (low priority)
    const newTopics = this.getNewTopics(currentLevel, strengths, needsWork);
    for (const newTopic of newTopics.slice(0, 2)) {
      topics.push({
        topic: newTopic,
        difficulty: this.getDifficultyForLevel(currentLevel),
        reason: 'Ready for new concepts',
        priority: 'low',
        estimatedTime: 30,
        prerequisites: this.getPrerequisites(newTopic),
        unlocks: this.getUnlocks(newTopic)
      });
    }
    
    return topics;
  }
  
  /**
   * Create learning milestones
   */
  private createMilestones(
    topics: RecommendedTopic[],
    pace: string
  ): Milestone[] {
    const milestones: Milestone[] = [];
    const now = new Date();
    
    // Pace multiplier
    const paceMultiplier = pace === 'accelerated' ? 0.7 : pace === 'supportive' ? 1.5 : 1;
    
    let cumulativeTime = 0;
    let currentMilestoneTopics: string[] = [];
    
    topics.forEach((topic, index) => {
      currentMilestoneTopics.push(topic.topic);
      cumulativeTime += topic.estimatedTime * paceMultiplier;
      
      // Create milestone every 3 topics or at end
      if ((index + 1) % 3 === 0 || index === topics.length - 1) {
        const milestoneDate = new Date(now.getTime() + cumulativeTime * 60 * 1000);
        
        milestones.push({
          date: milestoneDate,
          achievement: `Master ${currentMilestoneTopics.length} topics`,
          topics: [...currentMilestoneTopics],
          unlocks: currentMilestoneTopics.flatMap(t => this.getUnlocks(t))
        });
        
        currentMilestoneTopics = [];
      }
    });
    
    return milestones;
  }
  
  /**
   * Estimate completion date
   */
  private estimateCompletion(milestones: Milestone[]): Date {
    if (milestones.length === 0) {
      return new Date();
    }
    return milestones[milestones.length - 1].date;
  }
  
  /**
   * Get performance state (stub - would fetch from DB)
   */
  private async getPerformanceState(userId: string): Promise<any> {
    // In production, fetch from database
    return {
      masteryLevel: 65,
      accuracyRate: 0.75,
      strengthAreas: ['addition', 'patterns'],
      strugglingIndicators: ['word-problems', 'fractions']
    };
  }
  
  /**
   * Get what a topic unlocks
   */
  private getUnlocks(topic: string): string[] {
    const unlockMap: Record<string, string[]> = {
      'addition': ['subtraction', 'mental-math'],
      'subtraction': ['negative-numbers', 'algebra-basics'],
      'multiplication': ['division', 'fractions'],
      'fractions': ['decimals', 'percentages'],
      'word-problems': ['real-world-math', 'problem-solving']
    };
    
    return unlockMap[topic.toLowerCase()] || [];
  }
  
  /**
   * Get prerequisites for a topic
   */
  private getPrerequisites(topic: string): string[] {
    const prereqMap: Record<string, string[]> = {
      'subtraction': ['addition'],
      'multiplication': ['addition'],
      'division': ['multiplication'],
      'fractions': ['division'],
      'decimals': ['fractions'],
      'percentages': ['fractions', 'decimals']
    };
    
    return prereqMap[topic.toLowerCase()] || [];
  }
  
  /**
   * Get new topics based on level
   */
  private getNewTopics(
    level: number,
    strengths: string[],
    needsWork: string[]
  ): string[] {
    const allTopics = [
      'addition', 'subtraction', 'multiplication', 'division',
      'fractions', 'decimals', 'percentages', 'geometry',
      'measurement', 'data-analysis', 'problem-solving'
    ];
    
    // Filter out what they already know
    return allTopics.filter(t => 
      !strengths.includes(t) && !needsWork.includes(t)
    );
  }
  
  /**
   * Get difficulty for mastery level
   */
  private getDifficultyForLevel(level: number): RecommendedTopic['difficulty'] {
    if (level < 30) return 'beginner';
    if (level < 50) return 'easy';
    if (level < 70) return 'medium';
    if (level < 85) return 'hard';
    return 'advanced';
  }
}

// Export singleton
export const learningPathGenerator = new LearningPathGenerator();

/**
 * Convenience function
 */
export async function generateLearningPath(userId: string): Promise<LearningPath> {
  return learningPathGenerator.generatePath(userId);
}
