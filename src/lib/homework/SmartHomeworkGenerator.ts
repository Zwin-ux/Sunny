/**
 * Smart Homework Generator
 * Generates adaptive homework that targets weak areas and includes spaced repetition
 */

import { intelligentLearningSystem } from '@/lib/intelligent-learning-system';
import { DynamicQuizEngine } from '@/lib/quiz/DynamicQuizEngine';
import { AdaptiveQuestion, StudentPerformanceState } from '@/types/quiz';

export interface HomeworkConfig {
  userId: string;
  topicsToReinforce?: string[];
  difficultyCurve?: 'flat' | 'gradual' | 'steep';
  questionCount?: number;
  includeReview?: boolean;
  targetTime?: number; // minutes
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface HomeworkAssignment {
  id: string;
  userId: string;
  questions: AdaptiveQuestion[];
  estimatedTime: number;
  difficulty: string;
  topics: Record<string, number>;
  reviewQuestions: number;
  createdAt: Date;
  dueDate?: Date;
}

export class SmartHomeworkGenerator {
  private quizEngine: DynamicQuizEngine;

  constructor() {
    this.quizEngine = new DynamicQuizEngine();
  }

  /**
   * Generate smart homework assignment
   */
  async generateHomework(config: HomeworkConfig): Promise<HomeworkAssignment> {
    const {
      userId,
      topicsToReinforce = [],
      difficultyCurve = 'gradual',
      questionCount = 10,
      includeReview = true,
      targetTime = 15,
      timeOfDay = 'afternoon'
    } = config;

    // 1. Get student performance state
    const studentState = await this.getStudentState(userId);

    // 2. Determine topics to cover
    const topics = await this.determineTopics(
      userId,
      topicsToReinforce,
      studentState
    );

    // 3. Calculate question distribution
    const distribution = this.calculateDistribution(
      questionCount,
      topics.length,
      includeReview
    );

    // 4. Generate questions
    const questions = await this.generateQuestions(
      userId,
      topics,
      distribution,
      difficultyCurve,
      timeOfDay,
      studentState
    );

    // 5. Calculate estimated time
    const estimatedTime = this.estimateCompletionTime(
      questions,
      studentState,
      timeOfDay
    );

    // 6. Create assignment
    const assignment: HomeworkAssignment = {
      id: `hw-${Date.now()}`,
      userId,
      questions,
      estimatedTime,
      difficulty: this.describeDifficulty(difficultyCurve, questions),
      topics: this.countTopics(questions),
      reviewQuestions: questions.filter(q => q.isReview).length,
      createdAt: new Date(),
      dueDate: this.calculateDueDate(estimatedTime)
    };

    return assignment;
  }

  /**
   * Determine which topics to include
   */
  private async determineTopics(
    userId: string,
    requestedTopics: string[],
    studentState: StudentPerformanceState
  ): Promise<string[]> {
    const topics: string[] = [];

    // 1. Add requested topics
    topics.push(...requestedTopics);

    // 2. Add struggling areas (high priority)
    if (studentState.strugglingIndicators) {
      topics.push(...studentState.strugglingIndicators.slice(0, 2));
    }

    // 3. Add topics that need practice (medium priority)
    // Based on recent performance
    const recentTopics = this.getRecentTopics(studentState);
    const needsPractice = recentTopics.filter(t => 
      !topics.includes(t) && this.needsPractice(t, studentState)
    );
    topics.push(...needsPractice.slice(0, 1));

    // Deduplicate
    return [...new Set(topics)];
  }

  /**
   * Calculate question distribution
   */
  private calculateDistribution(
    totalQuestions: number,
    topicCount: number,
    includeReview: boolean
  ): { new: number; review: number } {
    if (!includeReview) {
      return { new: totalQuestions, review: 0 };
    }

    // 20% review questions (spaced repetition)
    const reviewCount = Math.floor(totalQuestions * 0.2);
    const newCount = totalQuestions - reviewCount;

    return { new: newCount, review: reviewCount };
  }

  /**
   * Generate questions for homework
   */
  private async generateQuestions(
    userId: string,
    topics: string[],
    distribution: { new: number; review: number },
    difficultyCurve: string,
    timeOfDay: string,
    studentState: StudentPerformanceState
  ): Promise<AdaptiveQuestion[]> {
    const questions: AdaptiveQuestion[] = [];

    // 1. Generate new questions
    const questionsPerTopic = Math.ceil(distribution.new / topics.length);
    
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const difficulty = this.getDifficultyForPosition(
        i,
        topics.length,
        difficultyCurve,
        timeOfDay
      );

      const topicQuestions = await this.quizEngine.generateQuestionsWithAI(
        topic,
        questionsPerTopic,
        difficulty,
        'apply', // Bloom's level for homework
        null
      );

      questions.push(...topicQuestions);
    }

    // 2. Add review questions (spaced repetition)
    if (distribution.review > 0) {
      const reviewQuestions = await this.getReviewQuestions(
        userId,
        distribution.review,
        studentState
      );
      
      // Mark as review
      reviewQuestions.forEach(q => {
        (q as any).isReview = true;
      });
      
      questions.push(...reviewQuestions);
    }

    // 3. Shuffle to mix topics
    return this.shuffleQuestions(questions.slice(0, distribution.new + distribution.review));
  }

  /**
   * Get difficulty for question position (implements curve)
   */
  private getDifficultyForPosition(
    position: number,
    total: number,
    curve: string,
    timeOfDay: string
  ): 'easy' | 'medium' | 'hard' {
    const progress = position / total;

    // Adjust for time of day
    const timeAdjustment = timeOfDay === 'morning' ? -0.1 : 
                          timeOfDay === 'evening' ? -0.05 : 0;

    const adjustedProgress = Math.max(0, Math.min(1, progress + timeAdjustment));

    switch (curve) {
      case 'flat':
        return 'medium';
      
      case 'gradual':
        if (adjustedProgress < 0.3) return 'easy';
        if (adjustedProgress < 0.7) return 'medium';
        return 'hard';
      
      case 'steep':
        if (adjustedProgress < 0.2) return 'easy';
        return 'hard';
      
      default:
        return 'medium';
    }
  }

  /**
   * Get review questions for spaced repetition
   */
  private async getReviewQuestions(
    userId: string,
    count: number,
    studentState: StudentPerformanceState
  ): Promise<AdaptiveQuestion[]> {
    // In production, fetch from database based on spaced repetition algorithm
    // For now, generate questions from recent topics
    const recentTopics = this.getRecentTopics(studentState);
    
    if (recentTopics.length === 0) {
      return [];
    }

    const reviewQuestions = await this.quizEngine.generateQuestionsWithAI(
      recentTopics[0],
      count,
      'easy', // Review should be easier
      'remember', // Lower Bloom's level for review
      null
    );

    return reviewQuestions;
  }

  /**
   * Estimate completion time
   */
  private estimateCompletionTime(
    questions: AdaptiveQuestion[],
    studentState: StudentPerformanceState,
    timeOfDay: string
  ): number {
    const baseTimePerQuestion = studentState.averageTimePerQuestion / 1000 / 60; // Convert to minutes
    
    // Time of day adjustment
    const timeMultiplier = timeOfDay === 'morning' ? 1.2 : 
                          timeOfDay === 'evening' ? 1.1 : 1.0;

    // Difficulty adjustment
    const avgDifficulty = questions.reduce((sum, q) => {
      const diffValue = q.difficulty === 'easy' ? 0.8 : 
                       q.difficulty === 'medium' ? 1.0 : 1.3;
      return sum + diffValue;
    }, 0) / questions.length;

    const estimatedMinutes = questions.length * baseTimePerQuestion * timeMultiplier * avgDifficulty;
    
    return Math.round(estimatedMinutes);
  }

  /**
   * Describe difficulty curve
   */
  private describeDifficulty(curve: string, questions: AdaptiveQuestion[]): string {
    const easyCount = questions.filter(q => q.difficulty === 'easy').length;
    const hardCount = questions.filter(q => q.difficulty === 'hard').length;

    if (curve === 'flat') return 'Consistent difficulty';
    if (curve === 'gradual') return 'Starts easy, builds up gradually';
    if (curve === 'steep') return 'Quick ramp to challenging questions';

    return 'Mixed difficulty';
  }

  /**
   * Count questions per topic
   */
  private countTopics(questions: AdaptiveQuestion[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    questions.forEach(q => {
      const topic = q.topic || 'general';
      counts[topic] = (counts[topic] || 0) + 1;
    });

    return counts;
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(estimatedMinutes: number): Date {
    // Due in 24 hours by default
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24);
    return dueDate;
  }

  /**
   * Get recent topics from student state
   */
  private getRecentTopics(studentState: StudentPerformanceState): string[] {
    // Extract from recent answers
    if (!studentState.recentAnswers || studentState.recentAnswers.length === 0) {
      return [];
    }

    const topics = studentState.recentAnswers
      .map((a: any) => a.topic)
      .filter((t: string) => t);

    return [...new Set(topics)];
  }

  /**
   * Check if topic needs practice
   */
  private needsPractice(topic: string, studentState: StudentPerformanceState): boolean {
    // Check if accuracy is below threshold for this topic
    const topicAnswers = studentState.recentAnswers?.filter((a: any) => a.topic === topic) || [];
    
    if (topicAnswers.length === 0) return false;

    const accuracy = topicAnswers.filter((a: any) => a.correct).length / topicAnswers.length;
    return accuracy < 0.75; // Needs practice if below 75%
  }

  /**
   * Shuffle questions
   */
  private shuffleQuestions(questions: AdaptiveQuestion[]): AdaptiveQuestion[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get student state (stub - would fetch from DB)
   */
  private async getStudentState(userId: string): Promise<StudentPerformanceState> {
    // In production, fetch from database
    return {
      userId,
      topic: 'general',
      recentAnswers: [],
      currentStreak: 0,
      longestStreak: 0,
      currentDifficulty: 'medium',
      masteryLevel: 65,
      averageTimePerQuestion: 30000,
      accuracyRate: 0.75,
      hintsUsageRate: 0.3,
      optimalDifficulty: 'medium',
      strugglingIndicators: [],
      strengthAreas: []
    };
  }
}

// Export singleton
export const smartHomeworkGenerator = new SmartHomeworkGenerator();

/**
 * Convenience function
 */
export async function generateSmartHomework(config: HomeworkConfig): Promise<HomeworkAssignment> {
  return smartHomeworkGenerator.generateHomework(config);
}
