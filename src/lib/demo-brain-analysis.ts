import { Answer } from '@/types/demo';

/**
 * Advanced brain analysis for demo - shows Sunny's "thinking"
 */

export interface BrainAnalysis {
  performancePattern: 'excelling' | 'steady' | 'struggling' | 'inconsistent';
  confidenceLevel: number; // 0-100
  learningStyle: 'fast' | 'methodical' | 'needs-support';
  adaptationReason: string;
  nextAction: string;
  insights: string[];
}

/**
 * Analyze student performance and generate brain insights
 */
export function analyzeBrainState(answers: Answer[]): BrainAnalysis {
  if (answers.length === 0) {
    return {
      performancePattern: 'steady',
      confidenceLevel: 50,
      learningStyle: 'methodical',
      adaptationReason: 'Waiting for initial data',
      nextAction: 'Continue monitoring',
      insights: ['Starting assessment...']
    };
  }

  const recentAnswers = answers.slice(-5);
  const correctCount = recentAnswers.filter(a => a.correct).length;
  const accuracy = correctCount / recentAnswers.length;
  
  // Analyze time patterns
  const avgTime = recentAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / recentAnswers.length;
  const timeVariance = calculateVariance(recentAnswers.map(a => a.timeSpent));
  
  // Determine performance pattern
  let performancePattern: BrainAnalysis['performancePattern'] = 'steady';
  if (accuracy >= 0.8) performancePattern = 'excelling';
  else if (accuracy <= 0.4) performancePattern = 'struggling';
  else if (timeVariance > 10000) performancePattern = 'inconsistent';
  
  // Calculate confidence level
  const confidenceLevel = Math.round(
    (accuracy * 60) + // 60% weight on accuracy
    (avgTime < 15000 ? 20 : avgTime < 30000 ? 10 : 0) + // 20% on speed
    (timeVariance < 5000 ? 20 : 10) // 20% on consistency
  );
  
  // Determine learning style
  let learningStyle: BrainAnalysis['learningStyle'] = 'methodical';
  if (avgTime < 8000 && accuracy >= 0.6) learningStyle = 'fast';
  else if (accuracy < 0.5 || avgTime > 25000) learningStyle = 'needs-support';
  
  // Generate adaptation reason
  const adaptationReason = generateAdaptationReason(
    performancePattern,
    accuracy,
    avgTime,
    answers
  );
  
  // Determine next action
  const nextAction = determineNextAction(performancePattern, accuracy, learningStyle);
  
  // Generate insights
  const insights = generateInsights(answers, performancePattern, learningStyle);
  
  return {
    performancePattern,
    confidenceLevel,
    learningStyle,
    adaptationReason,
    nextAction,
    insights
  };
}

/**
 * Generate human-readable adaptation reason based on ACTUAL performance
 */
function generateAdaptationReason(
  pattern: string,
  accuracy: number,
  avgTime: number,
  answers: Answer[]
): string {
  const last3 = answers.slice(-3);
  const last3Correct = last3.filter(a => a.correct).length;
  const lastAnswer = answers[answers.length - 1];
  
  // Analyze the ACTUAL last answer
  if (lastAnswer.correct) {
    if (lastAnswer.timeSpent < 3000) {
      return `Quick correct answer (${(lastAnswer.timeSpent / 1000).toFixed(1)}s) - student shows strong understanding`;
    } else if (lastAnswer.timeSpent > 20000) {
      return `Correct but slow (${(lastAnswer.timeSpent / 1000).toFixed(1)}s) - student is thinking deeply, may need more practice`;
    } else {
      return `Correct in ${(lastAnswer.timeSpent / 1000).toFixed(1)}s - good pace and understanding`;
    }
  } else {
    if (lastAnswer.timeSpent < 3000) {
      return `Quick incorrect answer (${(lastAnswer.timeSpent / 1000).toFixed(1)}s) - possible rushing or guessing`;
    } else if (lastAnswer.timeSpent > 20000) {
      return `Incorrect after ${(lastAnswer.timeSpent / 1000).toFixed(1)}s - student is struggling with this concept`;
    } else {
      return `Incorrect in ${(lastAnswer.timeSpent / 1000).toFixed(1)}s - needs scaffolding support`;
    }
  }
  
  // Fallback for streak patterns
  if (last3Correct === 3) {
    return 'Student mastered current level - 3 correct in a row';
  }
  
  if (last3Correct === 0) {
    return 'Student struggling - 3 incorrect in a row, reducing difficulty';
  }
  
  if (pattern === 'excelling') {
    return `High accuracy (${(accuracy * 100).toFixed(0)}%) - ready for challenge`;
  }
  
  if (pattern === 'struggling') {
    return `Low accuracy (${(accuracy * 100).toFixed(0)}%) - need easier questions`;
  }
  
  if (avgTime < 5000) {
    return 'Very fast responses - may be guessing or highly confident';
  }
  
  if (avgTime > 30000) {
    return 'Slow responses - questions may be too difficult';
  }
  
  return 'Performance stable - maintaining current difficulty';
}

/**
 * Determine what Sunny should do next
 */
function determineNextAction(
  pattern: string,
  accuracy: number,
  learningStyle: string
): string {
  if (pattern === 'excelling') {
    return 'Increase difficulty to maintain engagement';
  }
  
  if (pattern === 'struggling') {
    return 'Decrease difficulty to rebuild confidence';
  }
  
  if (learningStyle === 'fast' && accuracy >= 0.7) {
    return 'Accelerate progression - student is ready';
  }
  
  if (learningStyle === 'needs-support') {
    return 'Provide scaffolding and hints';
  }
  
  return 'Continue current approach - monitor closely';
}

/**
 * Generate actionable insights based on REAL patterns
 */
function generateInsights(
  answers: Answer[],
  pattern: string,
  learningStyle: string
): string[] {
  const insights: string[] = [];
  const recentAnswers = answers.slice(-5);
  const lastAnswer = answers[answers.length - 1];
  
  // Analyze ACTUAL topic performance
  const topicCounts: Record<string, { correct: number; total: number; avgTime: number }> = {};
  recentAnswers.forEach(a => {
    if (!topicCounts[a.topic]) {
      topicCounts[a.topic] = { correct: 0, total: 0, avgTime: 0 };
    }
    topicCounts[a.topic].total++;
    topicCounts[a.topic].avgTime += a.timeSpent;
    if (a.correct) topicCounts[a.topic].correct++;
  });
  
  // Generate SPECIFIC topic insights
  Object.entries(topicCounts).forEach(([topic, stats]) => {
    const accuracy = stats.correct / stats.total;
    const avgTime = stats.avgTime / stats.total / 1000; // Convert to seconds
    
    if (accuracy === 1 && stats.total >= 2) {
      insights.push(`Mastered ${topic} - ${stats.total}/${stats.total} correct in ${avgTime.toFixed(1)}s avg`);
    } else if (accuracy >= 0.7 && stats.total >= 2) {
      insights.push(`Good progress in ${topic} - ${stats.correct}/${stats.total} correct`);
    } else if (accuracy < 0.5 && stats.total >= 2) {
      insights.push(`Struggling with ${topic} - ${stats.correct}/${stats.total} correct, needs support`);
    }
  });
  
  // Analyze ACTUAL time patterns
  const times = recentAnswers.map(a => a.timeSpent / 1000);
  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  if (maxTime - minTime > 15) {
    insights.push(`Variable pace: ${minTime.toFixed(1)}s to ${maxTime.toFixed(1)}s - adapting to difficulty`);
  } else if (avgTime < 5) {
    insights.push(`Lightning fast (${avgTime.toFixed(1)}s avg) - strong confidence or rushing?`);
  } else if (avgTime > 15) {
    insights.push(`Thoughtful pace (${avgTime.toFixed(1)}s avg) - taking time to understand`);
  } else {
    insights.push(`Steady pace (${avgTime.toFixed(1)}s avg) - good balance of speed and accuracy`);
  }
  
  // Detect ACTUAL streaks and patterns
  const correctStreak = getCorrectStreak(answers);
  const incorrectStreak = getIncorrectStreak(answers);
  
  if (correctStreak >= 3) {
    insights.push(`🔥 Hot streak! ${correctStreak} correct in a row - momentum building`);
  } else if (incorrectStreak >= 2) {
    insights.push(`⚠️ ${incorrectStreak} incorrect - may need hint or easier question`);
  }
  
  // Analyze improvement trend
  if (answers.length >= 4) {
    const firstHalf = answers.slice(0, Math.floor(answers.length / 2));
    const secondHalf = answers.slice(Math.floor(answers.length / 2));
    const firstAccuracy = firstHalf.filter(a => a.correct).length / firstHalf.length;
    const secondAccuracy = secondHalf.filter(a => a.correct).length / secondHalf.length;
    
    if (secondAccuracy > firstAccuracy + 0.2) {
      insights.push(`📈 Improving! Accuracy up from ${(firstAccuracy * 100).toFixed(0)}% to ${(secondAccuracy * 100).toFixed(0)}%`);
    } else if (secondAccuracy < firstAccuracy - 0.2) {
      insights.push(`📉 Accuracy declining - may need break or easier content`);
    }
  }
  
  return insights.slice(0, 4); // Max 4 most relevant insights
}

/**
 * Get current incorrect answer streak
 */
function getIncorrectStreak(answers: Answer[]): number {
  let streak = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].correct) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calculate variance in time spent
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Get current correct answer streak
 */
function getCorrectStreak(answers: Answer[]): number {
  let streak = 0;
  for (let i = answers.length - 1; i >= 0; i--) {
    if (answers[i].correct) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Predict next difficulty adjustment
 */
export function predictDifficultyChange(
  currentDifficulty: string,
  analysis: BrainAnalysis
): 'increase' | 'decrease' | 'maintain' {
  if (analysis.performancePattern === 'excelling' && analysis.confidenceLevel >= 75) {
    return 'increase';
  }
  
  if (analysis.performancePattern === 'struggling' || analysis.confidenceLevel < 40) {
    return 'decrease';
  }
  
  return 'maintain';
}
