import { Lesson, ContentType } from '../../types/lesson';
import LessonRepository from '../lessons/LessonRepository';

export enum IntentType {
  learn = 'learn',
  quiz = 'quiz',
  repeat = 'repeat',
  help = 'help',
  change_topic = 'change_topic',
  clarify = 'clarify',
  unknown = 'unknown',
}

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: {
    topic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    contentType?: ContentType;
  };
}

// Keywords for intent detection
const LEARN_KEYWORDS = [
  'learn', 'teach', 'tell me about', 'explain', 'what is', 'who is', 'how does', 
  'i want to learn', 'can you teach', 'tell me more', 'i\'d like to know'
];
const QUIZ_KEYWORDS = ['quiz', 'test', 'question', 'challenge', 'assess', 'evaluate'];
const REPEAT_KEYWORDS = ['repeat', 'say that again', 'go back', 'previous', 'one more time'];
const HELP_KEYWORDS = ['help', 'what can you do', 'how does this work', 'instructions', 'guide me'];
const DIFFICULTY_KEYWORDS = {
  beginner: ['easy', 'simple', 'basic', 'beginner', 'introductory', 'for kids', 'elementary'],
  intermediate: ['intermediate', 'medium', 'detailed', 'more about', 'deeper', 'more complex'],
  advanced: ['advanced', 'hard', 'complex', 'in-depth', 'expert', 'detailed', 'comprehensive']
};

// Common educational topics for better topic extraction
const COMMON_TOPICS = [
  'animals', 'plants', 'space', 'planets', 'history', 'math', 'science', 
  'geography', 'technology', 'art', 'music', 'literature', 'environment',
  'climate', 'oceans', 'dinosaurs', 'insects', 'mammals', 'birds', 'reptiles',
  'amphibians', 'fish', 'cells', 'atoms', 'molecules', 'energy', 'forces',
  'electricity', 'magnetism', 'light', 'sound', 'heat', 'weather', 'seasons',
  'solar system', 'stars', 'galaxies', 'universe', 'earth', 'moon', 'sun'
];

export class IntentParser {
  private lessons: Lesson[] = [];
  
  constructor(lessons: Lesson[] = []) {
    this.lessons = lessons;
    // If no lessons were provided, try to get them from the repository
    if (this.lessons.length === 0) {
      try {
        this.lessons = LessonRepository.getAllLessons();
      } catch (error) {
        console.warn('Failed to load lessons from repository:', error);
      }
    }
  }

  /**
   * Parse user input to determine intent and extract entities
   * This is our main NLU function that detects learning topics
   */
  async parse(input: string): Promise<Intent> {
    const normalizedInput = input.toLowerCase().trim();
    
    // Check for help intent first
    if (HELP_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.help);
    }

    // Check for repeat intent
    if (REPEAT_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.repeat);
    }

    // Check for quiz intent
    if (QUIZ_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      const entities = this.extractEntities(normalizedInput);
      return this.createIntent(IntentType.quiz, entities);
    }

    // Check for learn intent with explicit keywords
    for (const keyword of LEARN_KEYWORDS) {
      if (normalizedInput.includes(keyword)) {
        // Extract the topic that follows the keyword
        const parts = normalizedInput.split(keyword);
        if (parts.length > 1 && parts[1].trim()) {
          const potentialTopic = parts[1].trim();
          const entities = this.extractEntities(potentialTopic);
          
          // If we found a topic, return it with high confidence
          if (entities.topic) {
            return this.createIntent(IntentType.learn, entities, 0.95);
          }
          
          // Otherwise, use the text after the keyword as the topic
          return this.createIntent(IntentType.learn, { ...entities, topic: potentialTopic }, 0.8);
        }
      }
    }

    // If no explicit learn keywords, try to extract a topic directly
    const entities = this.extractEntities(normalizedInput);
    if (entities.topic) {
      return this.createIntent(IntentType.learn, entities, 0.8);
    }

    // Simulate GPT-3.5 function call for topic extraction
    // This mimics what a GPT-3.5 API call might do for topic extraction
    const simulatedTopic = this.simulateGptTopicExtraction(normalizedInput);
    if (simulatedTopic) {
      return this.createIntent(IntentType.learn, { topic: simulatedTopic }, 0.7);
    }

    // If we can't determine intent, ask for clarification
    return this.createIntent(IntentType.unknown);
  }
  
  /**
   * Simulate what a GPT-3.5 function call would do for topic extraction
   * This is a simplified version of what an actual API call would do
   */
  private simulateGptTopicExtraction(input: string): string | null {
    // Check if the input contains any common educational topics
    for (const topic of COMMON_TOPICS) {
      if (input.toLowerCase().includes(topic)) {
        return topic;
      }
    }
    
    // If the input is very short (1-3 words), it might be a direct topic
    const words = input.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 1 && words.length <= 3) {
      return words.join(' ');
    }
    
    return null;
  }

  /**
   * Create an intent object with the specified type, entities, and confidence
   */
  private createIntent(
    type: IntentType, 
    entities: Intent['entities'] = {}, 
    confidence: number = 1.0
  ): Intent {
    return {
      type,
      confidence,
      entities
    };
  }

  /**
   * Extract entities (topic, difficulty, content type) from user input
   */
  private extractEntities(input: string): Intent['entities'] {
    const entities: Intent['entities'] = {};
    const normalizedInput = input.toLowerCase().trim();
    
    // Extract topic by matching against lesson titles, topics, and keywords
    for (const lesson of this.lessons) {
      // Check lesson title
      if (normalizedInput.includes(lesson.title.toLowerCase())) {
        entities.topic = lesson.id;
        break;
      }
      
      // Check lesson topics
      if (lesson.topics && lesson.topics.some(topic => 
        normalizedInput.includes(topic.toLowerCase()))) {
        entities.topic = lesson.id;
        break;
      }
      
      // Check lesson keywords
      if (lesson.keywords && lesson.keywords.some(keyword => 
        normalizedInput.includes(keyword.toLowerCase()))) {
        entities.topic = lesson.id;
        break;
      }
      
      // Check for partial matches in longer phrases
      const words = normalizedInput.split(/\s+/);
      if (words.length > 1) {
        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j <= words.length; j++) {
            const phrase = words.slice(i, j).join(' ');
            if (phrase.length < 3) continue; // Skip very short phrases
            
            if (lesson.title.toLowerCase().includes(phrase) || 
                (lesson.keywords && lesson.keywords.some(k => k.toLowerCase().includes(phrase))) ||
                (lesson.topics && lesson.topics.some(t => t.toLowerCase().includes(phrase)))) {
              entities.topic = lesson.id;
              break;
            }
          }
          if (entities.topic) break;
        }
      }
    }

    // Extract difficulty
    for (const [level, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
      if (keywords.some(keyword => normalizedInput.includes(keyword))) {
        entities.difficulty = level as 'beginner' | 'intermediate' | 'advanced';
        break;
      }
    }

    // Extract content type preference with more comprehensive checks
    const contentTypePatterns = {
      [ContentType.Video]: [
        /video/i,
        /watch/i,
        /see/i,
        /visual/i,
      ],
      [ContentType.Image]: [
        /image/i,
        /picture/i,
        /diagram/i,
        /visual/i,
      ],
      [ContentType.Quiz]: [
        /quiz/i,
        /test/i,
        /exam/i,
        /question/i,
        /assess/i,
      ],
      [ContentType.Fact]: [
        /fact/i,
        /trivia/i,
        /info/i,
        /knowledge/i,
      ],
      [ContentType.Text]: [
        /text/i,
        /read/i,
        /article/i,
        /explanation/i,
        /explain/i,
      ],
    };
    
    for (const [type, patterns] of Object.entries(contentTypePatterns)) {
      if (patterns.some(pattern => pattern.test(normalizedInput))) {
        entities.contentType = type as ContentType;
        break;
      }
    }

    return entities;
  }

  /**
   * Get a clarification prompt for unknown intents
   */
  getClarificationPrompt(): string {
    return "I'm not sure what you'd like to learn about. Would you like to learn about animals, space, or something else? You can say 'teach me about...' followed by any topic you're interested in!";
  }

  /**
   * Get a help response explaining what Sunny can do
   */
  getHelpResponse(): string {
    return `I'm Sunny, your learning companion! Here's what I can help with:
- Learn about different topics (e.g., "Tell me about bees" or "I want to learn about space")
- Test your knowledge with quizzes (e.g., "Quiz me on space")
- Change difficulty level (e.g., "Explain simply" or "More advanced details please")
- Repeat the last explanation (e.g., "Say that again")
- Show me videos or diagrams about a topic
- Tell me fun facts

What would you like to learn about today?`;
  }
  
  /**
   * Get available topics for suggestions
   */
  getAvailableTopics(): string[] {
    return this.lessons.map(lesson => lesson.title);
  }
}

// Create and export a singleton instance for easy access
export const intentParser = new IntentParser();
export default intentParser;
