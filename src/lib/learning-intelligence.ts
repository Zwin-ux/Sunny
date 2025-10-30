/**
 * Learning Intelligence System
 *
 * Analyzes student interactions to provide smart recommendations,
 * detect learning patterns, and trigger appropriate interventions.
 */

export interface MessageAnalysis {
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  sentiment: 'positive' | 'neutral' | 'frustrated';
  engagement: number; // 0-1
  conceptsDiscussed: string[];
  suggestedActions: LearningAction[];
}

export interface LearningAction {
  type: 'focus_session' | 'game_suggestion' | 'difficulty_adjust' | 'encouragement' | 'mini_quiz';
  priority: 'low' | 'medium' | 'high';
  reason: string;
  data?: any;
}

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string; timestamp: Date }>;
  topicsDiscussed: Map<string, number>; // topic -> frequency
  questionsAsked: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageResponseTime?: number;
  sessionDuration: number; // minutes
}

// Topic keywords for detection
const TOPIC_KEYWORDS: Record<string, string[]> = {
  math: ['add', 'subtract', 'multiply', 'divide', 'number', 'count', 'plus', 'minus', 'times', 'equation', 'fraction', 'geometry', 'shape', 'circle', 'square'],
  science: ['experiment', 'hypothesis', 'observe', 'measure', 'plant', 'animal', 'energy', 'force', 'gravity', 'weather', 'solar', 'earth'],
  reading: ['story', 'book', 'character', 'plot', 'setting', 'read', 'comprehension', 'vocabulary', 'author', 'narrative'],
  writing: ['write', 'sentence', 'paragraph', 'essay', 'grammar', 'punctuation', 'spelling', 'composition'],
  geography: ['country', 'continent', 'ocean', 'map', 'location', 'capital', 'city', 'mountain', 'river'],
  history: ['past', 'historical', 'ancient', 'century', 'event', 'civilization', 'war', 'empire'],
  art: ['draw', 'paint', 'color', 'create', 'design', 'art', 'creative', 'imagine'],
  music: ['song', 'melody', 'rhythm', 'note', 'instrument', 'beat', 'sound', 'compose'],
};

// Frustration indicators
const FRUSTRATION_KEYWORDS = [
  'i don\'t know', 'i don\'t understand', 'confused', 'hard', 'difficult',
  'help', 'stuck', 'can\'t', 'impossible', 'frustrated', 'give up', 'too hard'
];

// Positive indicators
const POSITIVE_KEYWORDS = [
  'fun', 'cool', 'awesome', 'love', 'like', 'interesting', 'yes', 'got it',
  'understand', 'easy', 'great', 'amazing', 'yay', 'wow'
];

/**
 * Analyzes a single message for topic, sentiment, and engagement
 */
export function analyzeMessage(
  message: string,
  context: ConversationContext
): MessageAnalysis {
  const lowerMessage = message.toLowerCase();

  // Detect topic
  let detectedTopic: string | null = null;
  let maxMatches = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTopic = topic;
    }
  }

  // Detect sentiment
  const frustrationMatches = FRUSTRATION_KEYWORDS.filter(kw => lowerMessage.includes(kw)).length;
  const positiveMatches = POSITIVE_KEYWORDS.filter(kw => lowerMessage.includes(kw)).length;

  let sentiment: 'positive' | 'neutral' | 'frustrated';
  if (frustrationMatches > positiveMatches && frustrationMatches > 0) {
    sentiment = 'frustrated';
  } else if (positiveMatches > frustrationMatches && positiveMatches > 0) {
    sentiment = 'positive';
  } else {
    sentiment = 'neutral';
  }

  // Calculate engagement (message length, question marks, exclamation marks)
  const messageLength = message.trim().length;
  const hasQuestions = (message.match(/\?/g) || []).length;
  const hasExclamations = (message.match(/!/g) || []).length;

  let engagement = Math.min(1, (messageLength / 100) * 0.5 + hasQuestions * 0.2 + hasExclamations * 0.1);
  engagement = Math.max(0, Math.min(1, engagement));

  // Extract concepts discussed
  const conceptsDiscussed: string[] = [];
  if (detectedTopic) {
    const topicKeywords = TOPIC_KEYWORDS[detectedTopic] || [];
    topicKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        conceptsDiscussed.push(keyword);
      }
    });
  }

  // Generate suggested actions
  const suggestedActions = generateActions(
    detectedTopic,
    sentiment,
    engagement,
    context
  );

  // Determine difficulty based on vocabulary complexity
  const complexity = calculateComplexity(message);
  let difficulty: 'easy' | 'medium' | 'hard';
  if (complexity < 0.3) difficulty = 'easy';
  else if (complexity < 0.7) difficulty = 'medium';
  else difficulty = 'hard';

  return {
    topic: detectedTopic,
    difficulty,
    sentiment,
    engagement,
    conceptsDiscussed,
    suggestedActions,
  };
}

/**
 * Generates smart learning actions based on analysis
 */
function generateActions(
  topic: string | null,
  sentiment: 'positive' | 'neutral' | 'frustrated',
  engagement: number,
  context: ConversationContext
): LearningAction[] {
  const actions: LearningAction[] = [];

  // Detect if student is struggling (low success rate or frustrated)
  const successRate = context.questionsAsked > 0
    ? context.correctAnswers / context.questionsAsked
    : 1;

  const isStruggling = successRate < 0.5 || sentiment === 'frustrated';
  const recentIncorrect = context.incorrectAnswers > 2;

  // Suggest focus session if struggling with a topic
  if (isStruggling && topic && recentIncorrect) {
    actions.push({
      type: 'focus_session',
      priority: 'high',
      reason: `Student seems to be struggling with ${topic}. A focused practice session could help build confidence.`,
      data: { topic, suggestedDuration: 1200 } // 20 minutes
    });
  }

  // Suggest game if engagement is dropping but not frustrated
  if (engagement < 0.3 && sentiment !== 'frustrated' && topic) {
    actions.push({
      type: 'game_suggestion',
      priority: 'medium',
      reason: 'Student engagement is low. A fun game might re-energize the learning session.',
      data: { topic, gameType: 'interactive' }
    });
  }

  // Suggest difficulty adjustment
  if (successRate > 0.85 && context.questionsAsked >= 3) {
    actions.push({
      type: 'difficulty_adjust',
      priority: 'medium',
      reason: 'Student is performing well. Consider increasing difficulty for optimal challenge.',
      data: { direction: 'increase' }
    });
  } else if (successRate < 0.4 && context.questionsAsked >= 3) {
    actions.push({
      type: 'difficulty_adjust',
      priority: 'high',
      reason: 'Student is struggling. Consider reducing difficulty to rebuild confidence.',
      data: { direction: 'decrease' }
    });
  }

  // Provide encouragement if frustrated
  if (sentiment === 'frustrated') {
    actions.push({
      type: 'encouragement',
      priority: 'high',
      reason: 'Student appears frustrated. Extra encouragement and support needed.',
      data: { tone: 'supportive' }
    });
  }

  // Suggest mini quiz after good engagement
  if (engagement > 0.7 && sentiment === 'positive' && topic) {
    actions.push({
      type: 'mini_quiz',
      priority: 'low',
      reason: 'Student is engaged and positive. A quick quiz could reinforce learning.',
      data: { topic, questionCount: 3 }
    });
  }

  return actions;
}

/**
 * Calculate message complexity based on word length and variety
 */
function calculateComplexity(message: string): number {
  const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const uniqueWords = new Set(words).size;
  const vocabulary = uniqueWords / words.length;

  // Complexity is a combination of word length and vocabulary diversity
  const lengthScore = Math.min(1, avgWordLength / 8); // 8+ chars is complex
  const vocabScore = vocabulary; // More unique words = more complex

  return (lengthScore + vocabScore) / 2;
}

/**
 * Analyzes entire conversation for patterns
 */
export function analyzeConversation(context: ConversationContext): {
  dominantTopics: string[];
  overallSentiment: 'positive' | 'neutral' | 'frustrated';
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  recommendedNextSteps: LearningAction[];
} {
  const topicCounts = new Map<string, number>();
  let totalEngagement = 0;
  let sentimentScores = { positive: 0, neutral: 0, frustrated: 0 };

  // Analyze each message
  context.recentMessages.forEach(msg => {
    if (msg.role === 'user') {
      const analysis = analyzeMessage(msg.content, context);

      if (analysis.topic) {
        topicCounts.set(analysis.topic, (topicCounts.get(analysis.topic) || 0) + 1);
      }

      totalEngagement += analysis.engagement;
      sentimentScores[analysis.sentiment]++;
    }
  });

  // Get dominant topics
  const dominantTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);

  // Overall sentiment
  const maxSentiment = Math.max(sentimentScores.positive, sentimentScores.neutral, sentimentScores.frustrated);
  let overallSentiment: 'positive' | 'neutral' | 'frustrated' = 'neutral';
  if (maxSentiment === sentimentScores.positive) overallSentiment = 'positive';
  if (maxSentiment === sentimentScores.frustrated) overallSentiment = 'frustrated';

  // Engagement trend (compare first half to second half of messages)
  const userMessages = context.recentMessages.filter(m => m.role === 'user');
  const midpoint = Math.floor(userMessages.length / 2);
  const firstHalf = userMessages.slice(0, midpoint);
  const secondHalf = userMessages.slice(midpoint);

  const firstHalfEngagement = firstHalf.reduce((sum, msg) => {
    return sum + analyzeMessage(msg.content, context).engagement;
  }, 0) / Math.max(1, firstHalf.length);

  const secondHalfEngagement = secondHalf.reduce((sum, msg) => {
    return sum + analyzeMessage(msg.content, context).engagement;
  }, 0) / Math.max(1, secondHalf.length);

  let engagementTrend: 'increasing' | 'stable' | 'decreasing';
  if (secondHalfEngagement > firstHalfEngagement + 0.15) {
    engagementTrend = 'increasing';
  } else if (secondHalfEngagement < firstHalfEngagement - 0.15) {
    engagementTrend = 'decreasing';
  } else {
    engagementTrend = 'stable';
  }

  // Generate next steps
  const recommendedNextSteps: LearningAction[] = [];

  if (engagementTrend === 'decreasing') {
    recommendedNextSteps.push({
      type: 'game_suggestion',
      priority: 'high',
      reason: 'Engagement is declining. A game could help refresh the learning session.',
      data: { topic: dominantTopics[0] }
    });
  }

  if (dominantTopics.length > 0 && context.questionsAsked >= 5) {
    recommendedNextSteps.push({
      type: 'focus_session',
      priority: 'medium',
      reason: `Good discussion on ${dominantTopics[0]}. Ready for a focused practice session?`,
      data: { topic: dominantTopics[0], suggestedDuration: 1200 }
    });
  }

  return {
    dominantTopics,
    overallSentiment,
    engagementTrend,
    recommendedNextSteps,
  };
}

/**
 * Calculates adaptive XP reward based on interaction quality
 */
export function calculateAdaptiveXP(
  baseXP: number,
  analysis: MessageAnalysis,
  context: ConversationContext
): { xp: number; reason: string } {
  let multiplier = 1.0;
  const reasons: string[] = [];

  // Engagement bonus
  if (analysis.engagement > 0.7) {
    multiplier += 0.3;
    reasons.push('high engagement');
  } else if (analysis.engagement > 0.4) {
    multiplier += 0.1;
    reasons.push('good engagement');
  }

  // Concept exploration bonus
  if (analysis.conceptsDiscussed.length >= 3) {
    multiplier += 0.2;
    reasons.push('exploring multiple concepts');
  }

  // Positive sentiment bonus
  if (analysis.sentiment === 'positive') {
    multiplier += 0.1;
    reasons.push('positive attitude');
  }

  // Streak bonus
  if (context.correctAnswers > 3 && context.incorrectAnswers === 0) {
    multiplier += 0.4;
    reasons.push('perfect streak');
  } else if (context.correctAnswers > 2 && context.incorrectAnswers <= 1) {
    multiplier += 0.2;
    reasons.push('great performance');
  }

  // Session duration bonus (reward sustained effort)
  if (context.sessionDuration >= 15) {
    multiplier += 0.3;
    reasons.push('sustained effort');
  } else if (context.sessionDuration >= 10) {
    multiplier += 0.15;
    reasons.push('consistent learning');
  }

  const finalXP = Math.round(baseXP * multiplier);
  const reason = reasons.length > 0
    ? `${reasons.join(', ')} (+${Math.round((multiplier - 1) * 100)}%)`
    : 'participation';

  return { xp: finalXP, reason };
}

/**
 * Detects if student needs a break
 */
export function shouldSuggestBreak(context: ConversationContext): boolean {
  // Suggest break after 30+ minutes of continuous learning
  if (context.sessionDuration > 30) return true;

  // Suggest break if consistently frustrated
  const recentMsgs = context.recentMessages.slice(-5);
  const frustratedCount = recentMsgs.filter(msg => {
    if (msg.role !== 'user') return false;
    const analysis = analyzeMessage(msg.content, context);
    return analysis.sentiment === 'frustrated';
  }).length;

  return frustratedCount >= 3;
}

/**
 * Generates personalized encouragement message based on context
 */
export function generateEncouragement(context: ConversationContext): string {
  const successRate = context.questionsAsked > 0
    ? context.correctAnswers / context.questionsAsked
    : 0;

  if (successRate >= 0.8) {
    return "You're absolutely crushing it! 🌟 Your hard work is really paying off!";
  } else if (successRate >= 0.6) {
    return "You're doing great! Keep up the awesome work! ✨";
  } else if (successRate >= 0.4) {
    return "You're learning so much! Every question helps you get stronger! 💪";
  } else {
    return "I can see you're working hard! Remember, making mistakes is how we learn best! 🌈 You've got this!";
  }
}
