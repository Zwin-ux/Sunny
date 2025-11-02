/**
 * Adaptive Question Selector
 * Implements Zone of Proximal Development (ZPD) for optimal difficulty
 */

import {
  AdaptiveQuestion,
  StudentPerformanceState,
  StudentAnswer,
  DifficultyLevel,
  ZPDAnalysis,
  QuestionSelectionCriteria,
  BloomsLevel
} from '@/types/quiz';

export class AdaptiveQuestionSelector {
  private readonly TARGET_ACCURACY = 0.75; // 75% success rate (ZPD sweet spot)
  private readonly ACCURACY_TOLERANCE = 0.10; // ±10%
  
  /**
   * Select the next optimal question based on student performance
   */
  selectNextQuestion(
    availableQuestions: AdaptiveQuestion[],
    studentState: StudentPerformanceState,
    criteria?: QuestionSelectionCriteria
  ): AdaptiveQuestion | null {
    // 1. Analyze current performance and determine optimal difficulty
    const zpdAnalysis = this.calculateZPD(studentState);
    
    // 2. Filter questions based on criteria
    let candidates = this.filterQuestions(
      availableQuestions,
      zpdAnalysis.optimalLevel,
      criteria
    );
    
    // 3. If no questions at optimal level, try adjacent levels
    if (candidates.length === 0) {
      candidates = this.expandSearch(availableQuestions, zpdAnalysis.optimalLevel, criteria);
    }
    
    // 4. Prioritize questions that address knowledge gaps
    if (studentState.strugglingIndicators.length > 0) {
      const gapQuestions = this.prioritizeGapQuestions(
        candidates,
        studentState.strugglingIndicators
      );
      if (gapQuestions.length > 0) {
        candidates = gapQuestions;
      }
    }
    
    // 5. Avoid recently asked questions
    const recentQuestionIds = studentState.recentAnswers
      .slice(-5)
      .map(a => a.questionId);
    candidates = candidates.filter(q => !recentQuestionIds.includes(q.id));
    
    // 6. Select question with appropriate cognitive load
    const optimalQuestion = this.selectOptimalCognitiveLoad(
      candidates,
      studentState
    );
    
    return optimalQuestion;
  }
  
  /**
   * Calculate Zone of Proximal Development
   * Target: 70-80% success rate (challenging but achievable)
   */
  calculateZPD(studentState: StudentPerformanceState): ZPDAnalysis {
    const { accuracyRate, currentDifficulty, recentAnswers } = studentState;
    
    // Need at least 3 answers to make adjustment
    if (recentAnswers.length < 3) {
      return {
        currentLevel: currentDifficulty,
        optimalLevel: currentDifficulty,
        confidence: 0.5,
        reasoning: 'Insufficient data - maintaining current level',
        adjustmentNeeded: false
      };
    }
    
    // Calculate recent accuracy (last 5 questions)
    const recentAccuracy = this.calculateRecentAccuracy(recentAnswers.slice(-5));
    
    let optimalLevel = currentDifficulty;
    let reasoning = '';
    let adjustmentNeeded = false;
    let confidence = 0.8;
    
    // Too easy (>85% correct) → increase difficulty
    if (recentAccuracy > 0.85) {
      optimalLevel = this.increaseDifficulty(currentDifficulty);
      reasoning = `High accuracy (${(recentAccuracy * 100).toFixed(0)}%) - ready for more challenge`;
      adjustmentNeeded = optimalLevel !== currentDifficulty;
    }
    // Too hard (<60% correct) → decrease difficulty
    else if (recentAccuracy < 0.60) {
      optimalLevel = this.decreaseDifficulty(currentDifficulty);
      reasoning = `Low accuracy (${(recentAccuracy * 100).toFixed(0)}%) - need easier questions`;
      adjustmentNeeded = optimalLevel !== currentDifficulty;
    }
    // Just right (60-85%) → maintain
    else {
      reasoning = `Optimal accuracy (${(recentAccuracy * 100).toFixed(0)}%) - maintaining level`;
      adjustmentNeeded = false;
    }
    
    // Check for struggling patterns
    if (studentState.strugglingIndicators.length >= 2) {
      optimalLevel = this.decreaseDifficulty(currentDifficulty);
      reasoning += ' | Struggling indicators detected';
      adjustmentNeeded = true;
      confidence = 0.9;
    }
    
    return {
      currentLevel: currentDifficulty,
      optimalLevel,
      confidence,
      reasoning,
      adjustmentNeeded
    };
  }
  
  /**
   * Calculate accuracy from recent answers
   */
  private calculateRecentAccuracy(answers: StudentAnswer[]): number {
    if (answers.length === 0) return 0.5;
    
    // For now, we'll need to track correctness separately
    // This is a placeholder - in real implementation, answers would have correctness
    return 0.75; // Default to target accuracy
  }
  
  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard', 'advanced'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }
  
  /**
   * Decrease difficulty level
   */
  private decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard', 'advanced'];
    const currentIndex = levels.indexOf(current);
    return levels[Math.max(currentIndex - 1, 0)];
  }
  
  /**
   * Filter questions based on criteria
   */
  private filterQuestions(
    questions: AdaptiveQuestion[],
    targetDifficulty: DifficultyLevel,
    criteria?: QuestionSelectionCriteria
  ): AdaptiveQuestion[] {
    let filtered = questions.filter(q => q.difficulty === targetDifficulty);
    
    if (!criteria) return filtered;
    
    // Filter by topic
    if (criteria.topic) {
      filtered = filtered.filter(q => 
        q.topic.toLowerCase().includes(criteria.topic.toLowerCase())
      );
    }
    
    // Filter by Bloom's level
    if (criteria.bloomsLevel) {
      filtered = filtered.filter(q => q.bloomsLevel === criteria.bloomsLevel);
    }
    
    // Filter by cognitive load
    if (criteria.maxCognitiveLoad) {
      const loadOrder = { low: 1, medium: 2, high: 3 };
      const maxLoad = loadOrder[criteria.maxCognitiveLoad];
      filtered = filtered.filter(q => loadOrder[q.cognitiveLoad] <= maxLoad);
    }
    
    // Exclude specific questions
    if (criteria.excludeQuestionIds) {
      filtered = filtered.filter(q => !criteria.excludeQuestionIds!.includes(q.id));
    }
    
    return filtered;
  }
  
  /**
   * Expand search to adjacent difficulty levels if no matches
   */
  private expandSearch(
    questions: AdaptiveQuestion[],
    targetDifficulty: DifficultyLevel,
    criteria?: QuestionSelectionCriteria
  ): AdaptiveQuestion[] {
    const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard', 'advanced'];
    const targetIndex = levels.indexOf(targetDifficulty);
    
    // Try one level easier
    if (targetIndex > 0) {
      const easier = this.filterQuestions(questions, levels[targetIndex - 1], criteria);
      if (easier.length > 0) return easier;
    }
    
    // Try one level harder
    if (targetIndex < levels.length - 1) {
      const harder = this.filterQuestions(questions, levels[targetIndex + 1], criteria);
      if (harder.length > 0) return harder;
    }
    
    // Return any available questions as last resort
    return questions;
  }
  
  /**
   * Prioritize questions that address knowledge gaps
   */
  private prioritizeGapQuestions(
    questions: AdaptiveQuestion[],
    gaps: string[]
  ): AdaptiveQuestion[] {
    return questions.filter(q => {
      // Check if question addresses any of the gaps
      return gaps.some(gap => 
        q.topic.toLowerCase().includes(gap.toLowerCase()) ||
        q.subtopic?.toLowerCase().includes(gap.toLowerCase()) ||
        q.tags?.some(tag => tag.toLowerCase().includes(gap.toLowerCase()))
      );
    });
  }
  
  /**
   * Select question with appropriate cognitive load
   * Avoid overwhelming students with high cognitive load questions consecutively
   */
  private selectOptimalCognitiveLoad(
    questions: AdaptiveQuestion[],
    studentState: StudentPerformanceState
  ): AdaptiveQuestion | null {
    if (questions.length === 0) return null;
    
    // Check if recent questions had high cognitive load
    const recentHighLoad = studentState.recentAnswers
      .slice(-2)
      .length >= 2; // Simplified - would check actual cognitive load
    
    // If recent questions were high load, prefer low/medium load
    if (recentHighLoad) {
      const lowerLoad = questions.filter(q => 
        q.cognitiveLoad === 'low' || q.cognitiveLoad === 'medium'
      );
      if (lowerLoad.length > 0) {
        return this.selectRandom(lowerLoad);
      }
    }
    
    // Otherwise, select randomly from available questions
    return this.selectRandom(questions);
  }
  
  /**
   * Select random question from array
   */
  private selectRandom(questions: AdaptiveQuestion[]): AdaptiveQuestion {
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  /**
   * Determine if student is in their Zone of Proximal Development
   */
  isInZPD(accuracyRate: number): boolean {
    return accuracyRate >= (this.TARGET_ACCURACY - this.ACCURACY_TOLERANCE) &&
           accuracyRate <= (this.TARGET_ACCURACY + this.ACCURACY_TOLERANCE);
  }
  
  /**
   * Get recommended Bloom's level based on mastery
   */
  getRecommendedBloomsLevel(masteryLevel: number): BloomsLevel {
    if (masteryLevel < 30) return 'remember';
    if (masteryLevel < 50) return 'understand';
    if (masteryLevel < 70) return 'apply';
    if (masteryLevel < 85) return 'analyze';
    if (masteryLevel < 95) return 'evaluate';
    return 'create';
  }
}

// Export singleton instance
export const adaptiveSelector = new AdaptiveQuestionSelector();
