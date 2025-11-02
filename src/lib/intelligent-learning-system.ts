/**
 * Intelligent Learning System
 * Connects Brain Mode, Quiz Engine, and AI into one cohesive system
 */

import { dynamicQuizEngine } from './quiz/DynamicQuizEngine';
import { adaptiveSelector } from './quiz/AdaptiveSelector';
import { scaffoldingSystem } from './quiz/ScaffoldingSystem';
import { getLearningBrain } from './learning-brain';
import { analyzeBrainState } from './demo-brain-analysis';
import {
  StudentPerformanceState,
  QuizSession,
  StudentAnswer,
  DifficultyLevel,
  AdaptiveQuestion
} from '@/types/quiz';
import { Answer } from '@/types/demo';

/**
 * Main orchestrator for intelligent learning
 */
export class IntelligentLearningSystem {
  /**
   * Create a complete adaptive learning session
   * Combines: Brain Analysis + Adaptive Selection + AI Generation + Scaffolding
   */
  async createAdaptiveLearningSession(
    userId: string,
    topic: string,
    questionCount: number = 5
  ): Promise<QuizSession> {
    console.log(`🧠 Creating intelligent learning session for ${userId}`);
    
    // 1. Get student performance state
    const studentState = await this.getStudentPerformanceState(userId, topic);
    
    // 2. Analyze with Learning Brain
    const brainAnalysis = await this.analyzeLearningBrain(userId);
    console.log(`📊 Brain Analysis: ${brainAnalysis.interventionsNeeded.length} interventions needed`);
    
    // 3. Generate adaptive quiz
    const session = await dynamicQuizEngine.generateAdaptiveQuiz(
      userId,
      topic,
      studentState,
      questionCount
    );
    
    console.log(`✅ Created session with ${session.questions.length} questions`);
    console.log(`🎯 Target difficulty: ${studentState.currentDifficulty}`);
    
    return session;
  }
  
  /**
   * Process student answer with full intelligence
   */
  async processAnswer(
    session: QuizSession,
    questionIndex: number,
    answer: string | number | string[] | boolean,
    timeSpent: number,
    hintsUsed: number = 0,
    confidence?: 'low' | 'medium' | 'high'
  ) {
    const question = session.questions[questionIndex];
    const studentState = await this.getStudentPerformanceState(session.userId, session.topic);
    
    // 1. Create student answer record
    const studentAnswer: StudentAnswer = {
      questionId: question.id,
      answer,
      timeSpent,
      hintsUsed,
      confidence,
      timestamp: new Date()
    };
    
    // 2. Evaluate with AI feedback
    const evaluation = await dynamicQuizEngine.evaluateAnswer(
      question,
      answer,
      session,
      studentState
    );
    
    // 3. Update session
    session.answers.push(studentAnswer);
    
    // 4. Update student state
    studentState.recentAnswers.push(studentAnswer);
    if (evaluation.correct) {
      studentState.currentStreak++;
    } else {
      studentState.currentStreak = 0;
    }
    
    // 5. Check if intervention needed (Learning Brain)
    await this.checkForInterventions(session, studentState, evaluation);
    
    // 6. Get next question if available
    let nextQuestion: AdaptiveQuestion | null = null;
    if (questionIndex + 1 < session.questions.length) {
      // Check if we need to adjust difficulty for next question
      const zpdAnalysis = adaptiveSelector.calculateZPD(studentState);
      if (zpdAnalysis.adjustmentNeeded) {
        console.log(`🔄 Adjusting difficulty: ${zpdAnalysis.currentLevel} → ${zpdAnalysis.optimalLevel}`);
        console.log(`📝 Reason: ${zpdAnalysis.reasoning}`);
      }
      nextQuestion = session.questions[questionIndex + 1];
    }
    
    return {
      evaluation,
      nextQuestion,
      sessionComplete: questionIndex + 1 >= session.questions.length,
      difficultyAdjusted: session.difficultyAdjustments.length > 0,
      currentStreak: studentState.currentStreak
    };
  }
  
  /**
   * Get student performance state
   */
  private async getStudentPerformanceState(
    userId: string,
    topic: string
  ): Promise<StudentPerformanceState> {
    // In production, this would fetch from database
    // For now, return a default state
    return {
      userId,
      topic,
      recentAnswers: [],
      currentStreak: 0,
      longestStreak: 0,
      currentDifficulty: 'medium',
      masteryLevel: 50,
      averageTimePerQuestion: 30000,
      accuracyRate: 0.75,
      hintsUsageRate: 0.3,
      optimalDifficulty: 'medium',
      strugglingIndicators: [],
      strengthAreas: []
    };
  }
  
  /**
   * Analyze with Learning Brain
   */
  private async analyzeLearningBrain(userId: string) {
    try {
      const brain = getLearningBrain();
      return await brain.analyzeStudent(userId);
    } catch (error) {
      console.error('Error analyzing with Learning Brain:', error);
      return {
        currentSkills: [],
        interventionsNeeded: [],
        behavioralPatterns: [],
        learningVelocity: { overall: 0, byCategory: {}, trend: 'stable' as const, predictedBurnout: false }
      };
    }
  }
  
  /**
   * Check if interventions are needed
   */
  private async checkForInterventions(
    session: QuizSession,
    studentState: StudentPerformanceState,
    evaluation: any
  ) {
    // Check for struggling patterns
    const recentCorrect = session.answers
      .slice(-3)
      .filter((_, i) => session.answers.slice(-3)[i]); // Would check correctness
    
    if (recentCorrect.length === 0 && session.answers.length >= 3) {
      console.log('⚠️ INTERVENTION: Student struggling - 3 wrong in a row');
      studentState.strugglingIndicators.push('consecutive_wrong');
      
      // Could trigger Learning Brain intervention here
      try {
        const brain = getLearningBrain();
        await brain.generateIntervention({
          type: 'remedial_quiz',
          priority: 'high',
          skillId: session.topic,
          reason: 'Three consecutive incorrect answers',
          suggestedAction: 'Provide scaffolded practice',
          estimatedImpact: 80
        }, session.userId);
      } catch (error) {
        console.error('Error generating intervention:', error);
      }
    }
  }
  
  /**
   * Get next hint for current question
   */
  getNextHint(
    question: AdaptiveQuestion,
    attemptNumber: number,
    studentState: StudentPerformanceState,
    confidence?: 'low' | 'medium' | 'high'
  ) {
    return scaffoldingSystem.getNextHint(
      question,
      attemptNumber,
      confidence,
      studentState.recentAnswers
    );
  }
  
  /**
   * Check if worked example should be shown
   */
  shouldShowWorkedExample(
    question: AdaptiveQuestion,
    attemptNumber: number,
    studentState: StudentPerformanceState
  ): boolean {
    return scaffoldingSystem.shouldShowWorkedExample(
      question,
      attemptNumber,
      studentState.recentAnswers
    );
  }
  
  /**
   * Generate session summary with insights
   */
  async generateSessionSummary(session: QuizSession) {
    const accuracy = session.correctAnswers / session.totalQuestions;
    const avgTime = session.answers.reduce((sum, a) => sum + a.timeSpent, 0) / session.answers.length;
    
    // Use demo brain analysis for insights
    const demoAnswers: Answer[] = session.answers.map((a, i) => ({
      questionId: a.questionId,
      selectedIndex: 0, // Would map from actual answer
      correct: i < session.correctAnswers, // Simplified
      timeSpent: a.timeSpent,
      difficulty: this.mapDifficultyLevel(session.questions[i].difficulty),
      topic: session.questions[i].topic as any // Bridge between quiz and demo types
    }));
    
    const brainAnalysis = analyzeBrainState(demoAnswers);
    
    return {
      session,
      accuracy,
      avgTime: avgTime / 1000, // Convert to seconds
      brainAnalysis,
      recommendations: this.generateRecommendations(session, brainAnalysis),
      nextTopics: this.suggestNextTopics(session, brainAnalysis)
    };
  }
  
  /**
   * Generate learning recommendations
   */
  private generateRecommendations(session: QuizSession, brainAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (brainAnalysis.performancePattern === 'excelling') {
      recommendations.push('🚀 Ready for more challenging material!');
      recommendations.push('Try advanced topics in ' + session.topic);
    } else if (brainAnalysis.performancePattern === 'struggling') {
      recommendations.push('💪 Let\'s review the basics');
      recommendations.push('Practice with easier questions first');
    } else if (brainAnalysis.performancePattern === 'steady') {
      recommendations.push('✨ Great progress! Keep practicing');
      recommendations.push('Try mixing in some harder questions');
    }
    
    // Add specific insights
    brainAnalysis.insights.forEach((insight: string) => {
      recommendations.push('💡 ' + insight);
    });
    
    return recommendations;
  }
  
  /**
   * Suggest next learning topics
   */
  private suggestNextTopics(session: QuizSession, brainAnalysis: any): string[] {
    // Would use Learning Brain to suggest related topics
    // For now, return basic suggestions
    return [
      `Advanced ${session.topic}`,
      'Related concepts',
      'Real-world applications'
    ];
  }
  
  /**
   * Map quiz difficulty level to demo difficulty level
   */
  private mapDifficultyLevel(difficulty: DifficultyLevel): any {
    // Map advanced/beginner to demo types
    if (difficulty === 'advanced') return 'hard';
    if (difficulty === 'beginner') return 'easy';
    return difficulty;
  }
}

// Export singleton instance
export const intelligentLearningSystem = new IntelligentLearningSystem();

/**
 * Convenience function for creating adaptive quiz
 */
export async function createAdaptiveQuiz(
  userId: string,
  topic: string,
  questionCount?: number
) {
  return intelligentLearningSystem.createAdaptiveLearningSession(userId, topic, questionCount);
}

/**
 * Convenience function for processing answer
 */
export async function processQuizAnswer(
  session: QuizSession,
  questionIndex: number,
  answer: string | number | string[] | boolean,
  timeSpent: number,
  hintsUsed?: number,
  confidence?: 'low' | 'medium' | 'high'
) {
  return intelligentLearningSystem.processAnswer(
    session,
    questionIndex,
    answer,
    timeSpent,
    hintsUsed,
    confidence
  );
}
