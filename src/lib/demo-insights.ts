import { Answer, DemoInsights, DifficultyLevel } from '@/types/demo';

/**
 * Track topic preferences based on answer patterns
 */
export function trackTopicPreferences(answers: Answer[]): Record<string, number> {
  const topicScores: Record<string, number> = {};
  
  answers.forEach(answer => {
    if (!topicScores[answer.topic]) {
      topicScores[answer.topic] = 0;
    }
    // Increase score for correct answers, maintain for incorrect
    topicScores[answer.topic] += answer.correct ? 15 : 5;
  });
  
  // Normalize to 0-100 scale
  const maxScore = Math.max(...Object.values(topicScores), 1);
  Object.keys(topicScores).forEach(topic => {
    topicScores[topic] = Math.round((topicScores[topic] / maxScore) * 100);
  });
  
  return topicScores;
}

/**
 * Detect emotional state based on answer patterns
 */
export function detectEmotionalState(
  answers: Answer[]
): 'excited' | 'focused' | 'struggling' | 'confident' {
  if (answers.length === 0) return 'focused';
  
  const recentAnswers = answers.slice(-3);
  const correctCount = recentAnswers.filter(a => a.correct).length;
  const avgTime = recentAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / recentAnswers.length;
  
  // Quick and correct = excited
  if (correctCount >= 2 && avgTime < 8000) return 'excited';
  
  // All correct but slower = confident
  if (correctCount === 3) return 'confident';
  
  // Mixed results = focused
  if (correctCount >= 1) return 'focused';
  
  // Struggling
  return 'struggling';
}

/**
 * Calculate focus level (0-100)
 */
export function calculateFocusLevel(answers: Answer[]): number {
  if (answers.length === 0) return 50;
  
  const recentAnswers = answers.slice(-5);
  const avgTime = recentAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / recentAnswers.length;
  
  // Ideal time is 5-15 seconds
  // Too fast (<3s) or too slow (>30s) = lower focus
  if (avgTime < 3000) return 40;
  if (avgTime > 30000) return 30;
  if (avgTime >= 5000 && avgTime <= 15000) return 95;
  if (avgTime >= 3000 && avgTime <= 20000) return 75;
  return 60;
}

/**
 * Generate adaptive message based on learning patterns
 */
export function generateAdaptiveMessage(
  answers: Answer[],
  topicPreferences: Record<string, number>
): string | undefined {
  if (answers.length < 3) return undefined;
  
  const recentAnswers = answers.slice(-3);
  const correctCount = recentAnswers.filter(a => a.correct).length;
  
  // Find favorite topic
  const topTopic = Object.entries(topicPreferences)
    .sort(([, a], [, b]) => b - a)[0];
  
  // Streak of correct answers
  if (correctCount === 3) {
    return "You're on fire! 🔥 Want to try a harder challenge?";
  }
  
  // Struggling
  if (correctCount === 0) {
    return "Let's try something different. I'll adjust to help you succeed! 💪";
  }
  
  // Topic preference detected
  if (topTopic && topTopic[1] > 60) {
    return `I noticed you like ${topTopic[0]}! Want to explore more ${topTopic[0]} questions?`;
  }
  
  // Steady progress
  if (correctCount === 2) {
    return "Great progress! You're learning fast! ⭐";
  }
  
  return undefined;
}

/**
 * Analyze demo performance and generate personalized insights
 */
export function analyzePerformance(answers: Answer[], totalTime: number): DemoInsights {
  const correctAnswers = answers.filter(a => a.correct);
  const accuracy = answers.length > 0 ? correctAnswers.length / answers.length : 0;
  
  // Analyze by topic
  const topicPerformance = analyzeByTopic(answers);
  
  // Determine learning speed based on average time per question
  const avgTimePerQuestion = totalTime / answers.length;
  const learningSpeed = determineLearningSpeed(avgTimePerQuestion);
  
  // Find strong and growing areas
  const strongAreas = Object.entries(topicPerformance)
    .filter(([_, acc]) => acc >= 0.8)
    .map(([topic]) => capitalizeFirst(topic));
  
  const growingAreas = Object.entries(topicPerformance)
    .filter(([_, acc]) => acc < 0.8 && acc >= 0.4)
    .map(([topic]) => capitalizeFirst(topic));
  
  // Recommend next topics
  const nextTopics = suggestNextTopics(topicPerformance, answers);
  
  // Determine recommended level
  const recommendedLevel = determineRecommendedLevel(accuracy, answers);
  
  return {
    strongAreas: strongAreas.length > 0 ? strongAreas : ['Getting started'],
    growingAreas: growingAreas.length > 0 ? growingAreas : [],
    nextTopics,
    learningSpeed,
    recommendedLevel,
    accuracy,
    totalTime,
  };
}

/**
 * Analyze performance by topic
 */
function analyzeByTopic(answers: Answer[]): Record<string, number> {
  const topicStats: Record<string, { correct: number; total: number }> = {};
  
  answers.forEach(answer => {
    if (!topicStats[answer.topic]) {
      topicStats[answer.topic] = { correct: 0, total: 0 };
    }
    
    topicStats[answer.topic].total++;
    if (answer.correct) {
      topicStats[answer.topic].correct++;
    }
  });
  
  const topicAccuracy: Record<string, number> = {};
  Object.entries(topicStats).forEach(([topic, stats]) => {
    topicAccuracy[topic] = stats.total > 0 ? stats.correct / stats.total : 0;
  });
  
  return topicAccuracy;
}

/**
 * Determine learning speed based on average time per question
 */
function determineLearningSpeed(avgTime: number): 'slow' | 'medium' | 'fast' {
  // Times in milliseconds
  if (avgTime < 5000) return 'fast';      // < 5 seconds
  if (avgTime < 10000) return 'medium';   // 5-10 seconds
  return 'slow';                           // > 10 seconds
}

/**
 * Suggest next topics based on performance
 */
function suggestNextTopics(
  topicPerformance: Record<string, number>,
  answers: Answer[]
): string[] {
  const topics: string[] = [];
  
  // Get the highest difficulty level attempted
  const maxDifficulty = getMaxDifficulty(answers);
  
  // Suggest based on what they've mastered
  if (topicPerformance['addition'] >= 0.8) {
    if (!topicPerformance['subtraction'] || topicPerformance['subtraction'] < 0.8) {
      topics.push('Subtraction');
    }
  }
  
  if (topicPerformance['subtraction'] >= 0.8 && topicPerformance['addition'] >= 0.8) {
    if (!topicPerformance['multiplication']) {
      topics.push('Multiplication basics');
    }
  }
  
  if (topicPerformance['multiplication'] >= 0.8) {
    if (!topicPerformance['division']) {
      topics.push('Division basics');
    }
  }
  
  // If they're doing well, suggest advancing
  if (maxDifficulty === 'easy' && Object.values(topicPerformance).every(acc => acc >= 0.7)) {
    topics.push('Harder problems');
  }
  
  // Default suggestions
  if (topics.length === 0) {
    topics.push('Practice current skills');
  }
  
  return topics.slice(0, 2); // Max 2 suggestions
}

/**
 * Get the maximum difficulty level attempted
 */
function getMaxDifficulty(answers: Answer[]): DifficultyLevel {
  const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard'];
  let maxLevel: DifficultyLevel = 'beginner';
  
  answers.forEach(answer => {
    const currentIndex = levels.indexOf(answer.difficulty);
    const maxIndex = levels.indexOf(maxLevel);
    if (currentIndex > maxIndex) {
      maxLevel = answer.difficulty;
    }
  });
  
  return maxLevel;
}

/**
 * Determine recommended difficulty level for future sessions
 */
function determineRecommendedLevel(accuracy: number, answers: Answer[]): DifficultyLevel {
  const maxDifficulty = getMaxDifficulty(answers);
  const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard'];
  const currentIndex = levels.indexOf(maxDifficulty);
  
  // If high accuracy, recommend next level
  if (accuracy >= 0.85) {
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }
  
  // If moderate accuracy, stay at current level
  if (accuracy >= 0.6) {
    return maxDifficulty;
  }
  
  // If low accuracy, go down a level
  return levels[Math.max(currentIndex - 1, 0)];
}

/**
 * Generate a personalized analysis message
 */
export function generateAnalysisMessage(insights: DemoInsights): string {
  const messages: string[] = [];
  
  // Opening based on accuracy
  if (insights.accuracy >= 0.9) {
    messages.push("Wow! You're a math superstar!");
  } else if (insights.accuracy >= 0.75) {
    messages.push("Great job! You're really getting the hang of this!");
  } else if (insights.accuracy >= 0.5) {
    messages.push("Nice work! You're making good progress!");
  } else {
    messages.push("You're doing great! Learning takes practice!");
  }
  
  // Comment on strong areas
  if (insights.strongAreas.length > 0) {
    messages.push(`You're really strong at ${insights.strongAreas.join(' and ')}.`);
  }
  
  // Comment on learning speed
  if (insights.learningSpeed === 'fast') {
    messages.push("I noticed you solve problems quickly!");
  }
  
  // Suggest next steps
  if (insights.nextTopics.length > 0) {
    messages.push(`Next, let's work on ${insights.nextTopics[0].toLowerCase()}!`);
  }
  
  return messages.join(' ');
}

/**
 * Helper to capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
