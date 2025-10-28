// Game Engine - Core logic for adaptive game system

import { 
  GameConfig, 
  GameState, 
  GamePerformance, 
  GameResult, 
  DifficultyLevel,
  PerformanceLevel,
  AdaptiveGameSession,
  GameFeedback
} from '@/types/game';

export class GameEngine {
  private sessions: Map<string, AdaptiveGameSession> = new Map();
  
  /**
   * Start a new adaptive game session
   */
  startSession(studentId: string, initialDifficulty: DifficultyLevel = 'easy'): AdaptiveGameSession {
    const session: AdaptiveGameSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      startTime: Date.now(),
      games: [],
      results: [],
      performance: [],
      initialDifficulty,
      currentDifficulty: initialDifficulty,
      difficultyAdjustments: [],
      conceptsIntroduced: [],
      conceptsMastered: [],
      conceptsNeedingReview: [],
      agentInsights: []
    };
    
    this.sessions.set(session.sessionId, session);
    return session;
  }
  
  /**
   * Initialize a new game within a session
   */
  initializeGame(sessionId: string, config: GameConfig): GameState {
    const gameState: GameState = {
      gameId: config.id,
      startTime: Date.now(),
      currentQuestion: 0,
      totalQuestions: 10, // default, can be configured
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      isComplete: false,
      currentStreak: 0,
      longestStreak: 0
    };
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.games.push(gameState);
    }
    
    return gameState;
  }
  
  /**
   * Record a game result and update state
   */
  recordResult(sessionId: string, gameId: string, result: GameResult): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.results.push(result);
    
    // Update game state
    const gameState = session.games.find(g => g.gameId === gameId);
    if (!gameState) return;
    
    gameState.currentQuestion++;
    gameState.timeElapsed += result.timeSpent;
    gameState.hintsUsed += result.hintsUsed;
    
    if (result.isCorrect) {
      gameState.correctAnswers++;
      gameState.currentStreak++;
      gameState.longestStreak = Math.max(gameState.longestStreak, gameState.currentStreak);
    } else {
      gameState.incorrectAnswers++;
      gameState.currentStreak = 0;
    }
    
    // Check if game is complete
    if (gameState.currentQuestion >= gameState.totalQuestions) {
      gameState.isComplete = true;
      this.analyzePerformance(sessionId, gameId);
    }
  }
  
  /**
   * Analyze performance and generate insights
   */
  private analyzePerformance(sessionId: string, gameId: string): GamePerformance | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const gameState = session.games.find(g => g.gameId === gameId);
    if (!gameState) return null;
    
    const gameResults = session.results.filter(r => r.questionId.startsWith(gameId));
    
    // Calculate metrics
    const totalQuestions = gameState.totalQuestions;
    const accuracy = gameState.correctAnswers / totalQuestions;
    const avgTimePerQuestion = gameState.timeElapsed / totalQuestions;
    const speed = 60 / avgTimePerQuestion; // questions per minute
    const efficiency = gameState.correctAnswers / (gameState.timeElapsed / 60); // correct per minute
    
    // Engagement metrics
    const attentionScore = this.calculateAttentionScore(gameResults);
    const persistenceScore = this.calculatePersistenceScore(gameResults);
    const frustrationLevel = this.calculateFrustrationLevel(gameResults);
    
    // Learning indicators
    const improvementRate = this.calculateImprovementRate(gameResults);
    const conceptMastery = this.analyzeConceptMastery(gameResults);
    const knowledgeGaps = this.identifyKnowledgeGaps(conceptMastery);
    
    // Determine teaching strategy
    const performanceLevel = this.determinePerformanceLevel(accuracy, improvementRate);
    const teachingStrategy = this.determineTeachingStrategy(performanceLevel, frustrationLevel);
    const suggestedDifficulty = this.suggestDifficulty(accuracy, session.currentDifficulty);
    
    const performance: GamePerformance = {
      gameId,
      studentId: session.studentId,
      gameType: 'pattern-recognition', // TODO: get from game config
      difficulty: session.currentDifficulty,
      topic: 'general', // TODO: get from game config
      accuracy,
      speed,
      efficiency,
      completionRate: 1.0,
      attentionScore,
      persistenceScore,
      frustrationLevel,
      improvementRate,
      conceptMastery,
      knowledgeGaps,
      suggestedDifficulty,
      suggestedNextGame: 'math-challenge', // TODO: intelligent selection
      teachingStrategy,
      timestamp: Date.now()
    };
    
    session.performance.push(performance);
    
    // Adapt difficulty if needed
    if (suggestedDifficulty !== session.currentDifficulty) {
      this.adjustDifficulty(sessionId, suggestedDifficulty, 
        `Performance-based adjustment: ${accuracy.toFixed(2)} accuracy`);
    }
    
    return performance;
  }
  
  /**
   * Calculate attention score based on response patterns
   */
  private calculateAttentionScore(results: GameResult[]): number {
    if (results.length === 0) return 0.5;
    
    // Factors: consistent response times, not too fast (random guessing), not too slow (distracted)
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;
    const timeVariance = results.reduce((sum, r) => sum + Math.pow(r.timeSpent - avgTime, 2), 0) / results.length;
    
    // Lower variance = more consistent attention
    const consistencyScore = Math.max(0, 1 - (timeVariance / (avgTime * avgTime)));
    
    // Not too fast, not too slow
    const optimalTime = 15; // seconds
    const speedScore = Math.max(0, 1 - Math.abs(avgTime - optimalTime) / optimalTime);
    
    return (consistencyScore * 0.6 + speedScore * 0.4);
  }
  
  /**
   * Calculate persistence score based on attempts and hint usage
   */
  private calculatePersistenceScore(results: GameResult[]): number {
    if (results.length === 0) return 0.5;
    
    const avgAttempts = results.reduce((sum, r) => sum + r.attempts, 0) / results.length;
    const avgHints = results.reduce((sum, r) => sum + r.hintsUsed, 0) / results.length;
    
    // More attempts = more persistence (up to a point)
    const attemptScore = Math.min(1, avgAttempts / 3);
    
    // Fewer hints = more persistence
    const hintScore = Math.max(0, 1 - (avgHints / 3));
    
    return (attemptScore * 0.5 + hintScore * 0.5);
  }
  
  /**
   * Calculate frustration level based on patterns
   */
  private calculateFrustrationLevel(results: GameResult[]): number {
    if (results.length === 0) return 0;
    
    let frustrationIndicators = 0;
    
    // Check for consecutive failures
    let consecutiveFailures = 0;
    for (const result of results) {
      if (!result.isCorrect) {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) frustrationIndicators += 0.2;
      } else {
        consecutiveFailures = 0;
      }
    }
    
    // Check for excessive hint usage
    const avgHints = results.reduce((sum, r) => sum + r.hintsUsed, 0) / results.length;
    if (avgHints > 2) frustrationIndicators += 0.3;
    
    // Check for very long response times (possible confusion)
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length;
    if (avgTime > 30) frustrationIndicators += 0.2;
    
    return Math.min(1, frustrationIndicators);
  }
  
  /**
   * Calculate improvement rate over the session
   */
  private calculateImprovementRate(results: GameResult[]): number {
    if (results.length < 3) return 0;
    
    // Compare first third vs last third
    const thirdSize = Math.floor(results.length / 3);
    const firstThird = results.slice(0, thirdSize);
    const lastThird = results.slice(-thirdSize);
    
    const firstAccuracy = firstThird.filter(r => r.isCorrect).length / firstThird.length;
    const lastAccuracy = lastThird.filter(r => r.isCorrect).length / lastThird.length;
    
    return lastAccuracy - firstAccuracy; // -1 to 1
  }
  
  /**
   * Analyze mastery of individual concepts
   */
  private analyzeConceptMastery(results: GameResult[]): Record<string, number> {
    const conceptPerformance: Record<string, { correct: number; total: number }> = {};
    
    // Group results by concept (would need concept info in results)
    // For now, return placeholder
    return {
      'basic-patterns': 0.8,
      'advanced-patterns': 0.6
    };
  }
  
  /**
   * Identify concepts that need more work
   */
  private identifyKnowledgeGaps(conceptMastery: Record<string, number>): string[] {
    return Object.entries(conceptMastery)
      .filter(([_, mastery]) => mastery < 0.7)
      .map(([concept, _]) => concept);
  }
  
  /**
   * Determine overall performance level
   */
  private determinePerformanceLevel(accuracy: number, improvementRate: number): PerformanceLevel {
    if (accuracy >= 0.85 && improvementRate >= 0) return 'mastering';
    if (accuracy >= 0.70) return 'proficient';
    if (accuracy >= 0.50 || improvementRate > 0.2) return 'learning';
    return 'struggling';
  }
  
  /**
   * Determine appropriate teaching strategy
   */
  private determineTeachingStrategy(
    performanceLevel: PerformanceLevel, 
    frustrationLevel: number
  ): 'reinforce' | 'advance' | 'remediate' | 'diversify' {
    // High frustration = diversify approach
    if (frustrationLevel > 0.6) return 'diversify';
    
    switch (performanceLevel) {
      case 'mastering':
        return 'advance';
      case 'proficient':
        return 'reinforce';
      case 'learning':
        return 'reinforce';
      case 'struggling':
        return 'remediate';
    }
  }
  
  /**
   * Suggest next difficulty level
   */
  private suggestDifficulty(accuracy: number, currentDifficulty: DifficultyLevel): DifficultyLevel {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    
    // Increase difficulty if high accuracy
    if (accuracy >= 0.85 && currentIndex < difficultyLevels.length - 1) {
      return difficultyLevels[currentIndex + 1];
    }
    
    // Decrease difficulty if struggling
    if (accuracy < 0.50 && currentIndex > 0) {
      return difficultyLevels[currentIndex - 1];
    }
    
    // Maintain current difficulty
    return currentDifficulty;
  }
  
  /**
   * Adjust session difficulty
   */
  private adjustDifficulty(sessionId: string, newDifficulty: DifficultyLevel, reason: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.difficultyAdjustments.push({
      timestamp: Date.now(),
      from: session.currentDifficulty,
      to: newDifficulty,
      reason
    });
    
    session.currentDifficulty = newDifficulty;
  }
  
  /**
   * Generate adaptive feedback based on performance
   */
  generateFeedback(result: GameResult, performance: GamePerformance): GameFeedback {
    const { isCorrect, hintsUsed, attempts } = result;
    const { accuracy, frustrationLevel } = performance;
    
    // Correct answer
    if (isCorrect) {
      if (hintsUsed === 0 && attempts === 1) {
        return {
          type: 'celebration',
          message: "🌟 Perfect! You got it on the first try!",
          tone: 'excited',
          includeExplanation: false,
          visualElement: 'confetti'
        };
      } else if (attempts > 2) {
        return {
          type: 'encouragement',
          message: "Great job sticking with it! You figured it out! 💪",
          tone: 'supportive',
          includeExplanation: true,
          visualElement: 'star'
        };
      } else {
        return {
          type: 'encouragement',
          message: "Nice work! You're getting the hang of this! ⭐",
          tone: 'enthusiastic',
          includeExplanation: false
        };
      }
    }
    
    // Incorrect answer
    if (frustrationLevel > 0.6) {
      return {
        type: 'guidance',
        message: "Let's try a different approach. I'll break this down for you! 🤔",
        tone: 'gentle',
        includeExplanation: true,
        suggestNextStep: "Let's try an easier example first",
        visualElement: 'thinking'
      };
    } else if (accuracy < 0.5) {
      return {
        type: 'hint',
        message: "Not quite! Let me give you a hint to help you out. 💡",
        tone: 'supportive',
        includeExplanation: true,
        suggestNextStep: "Think about..."
      };
    } else {
      return {
        type: 'correction',
        message: "Almost! Let's look at this together. 🔍",
        tone: 'supportive',
        includeExplanation: true
      };
    }
  }
  
  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string): {
    totalGames: number;
    averageAccuracy: number;
    improvementRate: number;
    conceptsMastered: string[];
    recommendedNextSteps: string[];
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const performances = session.performance;
    if (performances.length === 0) {
      return {
        totalGames: 0,
        averageAccuracy: 0,
        improvementRate: 0,
        conceptsMastered: [],
        recommendedNextSteps: []
      };
    }
    
    const avgAccuracy = performances.reduce((sum, p) => sum + p.accuracy, 0) / performances.length;
    const avgImprovement = performances.reduce((sum, p) => sum + p.improvementRate, 0) / performances.length;
    
    return {
      totalGames: session.games.length,
      averageAccuracy: avgAccuracy,
      improvementRate: avgImprovement,
      conceptsMastered: session.conceptsMastered,
      recommendedNextSteps: this.generateRecommendations(session)
    };
  }
  
  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(session: AdaptiveGameSession): string[] {
    const recommendations: string[] = [];
    const latestPerformance = session.performance[session.performance.length - 1];
    
    if (!latestPerformance) return recommendations;
    
    if (latestPerformance.accuracy >= 0.85) {
      recommendations.push("You're doing great! Ready for more challenging content?");
    }
    
    if (latestPerformance.knowledgeGaps.length > 0) {
      recommendations.push(`Let's review: ${latestPerformance.knowledgeGaps.join(', ')}`);
    }
    
    if (latestPerformance.frustrationLevel > 0.6) {
      recommendations.push("Let's try a different type of activity to keep things fun!");
    }
    
    if (latestPerformance.improvementRate > 0.2) {
      recommendations.push("You're improving quickly! Keep up the great work!");
    }
    
    return recommendations;
  }
}

// Singleton instance
export const gameEngine = new GameEngine();
