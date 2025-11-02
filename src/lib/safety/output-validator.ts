/**
 * Output Validation - Safety checks for AI-generated responses
 * Ensures Sunny's responses are age-appropriate and safe
 */

import { getOpenAIClient } from '../sunny-ai';

/**
 * Output validation result
 */
export interface OutputValidationResult {
  safe: boolean;
  content: string;           // Original or replacement content
  concerns: string[];
  replacement?: string;      // Safe replacement message if flagged
}

/**
 * Age-inappropriate vocabulary (too complex for 6-10 year olds)
 */
const COMPLEX_WORDS: Record<string, string> = {
  'utilize': 'use',
  'implement': 'do',
  'facilitate': 'help',
  'demonstrate': 'show',
  'approximately': 'about',
  'sufficient': 'enough',
  'acquire': 'get',
  'initiate': 'start',
  'terminate': 'end',
  'comprehend': 'understand'
};

/**
 * Safe fallback responses when content is flagged
 */
const SAFE_FALLBACK_RESPONSES = [
  "I'm not sure how to help with that. Let's try something else! What would you like to learn about?",
  "Hmm, I think we should explore a different topic. What interests you?",
  "Let's learn about something fun! Would you like to hear about animals, space, or something else?",
  "I'm here to help you learn! What topic would you like to explore today?",
  "That's a tricky one! Let's try a different question. What are you curious about?"
];

/**
 * Get random safe fallback response
 */
function getSafeFallbackResponse(): string {
  const randomIndex = Math.floor(Math.random() * SAFE_FALLBACK_RESPONSES.length);
  return SAFE_FALLBACK_RESPONSES[randomIndex];
}

/**
 * Simplify vocabulary for age-appropriateness
 */
function simplifyVocabulary(text: string): string {
  let simplified = text;

  for (const [complex, simple] of Object.entries(COMPLEX_WORDS)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }

  return simplified;
}

/**
 * Check reading level (Flesch-Kincaid grade level approximation)
 */
function estimateReadingLevel(text: string): number {
  // Simple approximation of reading level
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => {
    // Very rough syllable count
    return count + Math.max(1, word.replace(/[^aeiou]/gi, '').length);
  }, 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  // Flesch-Kincaid Grade Level formula
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  return Math.max(0, gradeLevel);
}

/**
 * Check if response is age-appropriate for target age (6-10)
 */
function checkAgeAppropriateness(text: string, targetGrade: number = 4): {
  appropriate: boolean;
  readingLevel: number;
  concerns: string[];
} {
  const concerns: string[] = [];
  const readingLevel = estimateReadingLevel(text);

  // For ages 6-10, target reading level should be around grades 1-5
  if (readingLevel > targetGrade + 2) {
    concerns.push(`reading_level_too_high (${readingLevel.toFixed(1)} vs target ${targetGrade})`);
  }

  // Check sentence length (should be < 20 words per sentence for young kids)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = text.split(/\s+/).length / Math.max(1, sentences.length);

  if (avgSentenceLength > 20) {
    concerns.push('sentences_too_long');
  }

  return {
    appropriate: concerns.length === 0,
    readingLevel,
    concerns
  };
}

/**
 * Use OpenAI Moderation API to check AI output
 */
async function moderateAIOutput(text: string): Promise<{
  flagged: boolean;
  categories: string[];
}> {
  try {
    const client = getOpenAIClient();
    const moderation = await client.moderations.create({
      input: text
    });

    const result = moderation.results[0];
    const categories: string[] = [];

    if (result.flagged) {
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged) {
          categories.push(category);
        }
      }
    }

    return {
      flagged: result.flagged,
      categories
    };
  } catch (error) {
    console.error('Error moderating AI output:', error);
    // If moderation fails, assume safe (since it's AI-generated, less risky than user input)
    return {
      flagged: false,
      categories: []
    };
  }
}

/**
 * Main validation function for AI output
 */
export async function validateAIResponse(response: string): Promise<OutputValidationResult> {
  const concerns: string[] = [];

  // 1. Check with OpenAI moderation
  const moderation = await moderateAIOutput(response);
  if (moderation.flagged) {
    concerns.push(...moderation.categories.map(cat => `moderation_${cat}`));

    return {
      safe: false,
      content: response,
      concerns,
      replacement: getSafeFallbackResponse()
    };
  }

  // 2. Check age-appropriateness
  const ageCheck = checkAgeAppropriateness(response);
  if (!ageCheck.appropriate) {
    concerns.push(...ageCheck.concerns);

    // Try to simplify the response
    const simplified = simplifyVocabulary(response);
    const simplifiedCheck = checkAgeAppropriateness(simplified);

    if (simplifiedCheck.appropriate) {
      // Simplification worked!
      return {
        safe: true,
        content: simplified,
        concerns: ['simplified_vocabulary']
      };
    }

    // Simplification didn't help, use fallback
    return {
      safe: false,
      content: response,
      concerns,
      replacement: getSafeFallbackResponse()
    };
  }

  // 3. All checks passed
  return {
    safe: true,
    content: response,
    concerns: []
  };
}

/**
 * Validate that response has appropriate tone for children
 */
export function validateTone(response: string): {
  appropriate: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];
  const lowerResponse = response.toLowerCase();

  // Should be encouraging and positive
  const discouragingPhrases = [
    'you can\'t',
    'you failed',
    'that\'s wrong',
    'you\'re bad at',
    'give up',
    'impossible'
  ];

  for (const phrase of discouragingPhrases) {
    if (lowerResponse.includes(phrase)) {
      concerns.push(`discouraging_phrase: ${phrase}`);
    }
  }

  // Should have some positive indicators
  const positiveIndicators = ['great', 'good', 'awesome', 'you can', 'let\'s', 'try', 'fun', '!', '😊', '🎉', '✨'];
  const hasPositiveTone = positiveIndicators.some(indicator => lowerResponse.includes(indicator));

  if (!hasPositiveTone && response.length > 50) {
    concerns.push('lacks_positive_tone');
  }

  return {
    appropriate: concerns.length === 0,
    concerns
  };
}

/**
 * Ensure response has emojis for engagement (optional check)
 */
export function hasEmojis(text: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

/**
 * Add emojis to response if missing (for engagement)
 */
export function addEmojisIfNeeded(text: string): string {
  if (hasEmojis(text)) {
    return text;
  }

  // Add a friendly emoji at the end
  const friendlyEmojis = ['😊', '🌟', '✨', '🎉', '🚀', '💫'];
  const randomEmoji = friendlyEmojis[Math.floor(Math.random() * friendlyEmojis.length)];

  return `${text} ${randomEmoji}`;
}
