import { Lesson, ContentType } from '../../types/lesson';
import LessonRepository from '../lessons/LessonRepository';

export enum IntentType {
  // Existing learning intents
  learn = 'learn',
  quiz = 'quiz',
  repeat = 'repeat',
  help = 'help',
  change_topic = 'change_topic',
  clarify = 'clarify',
  unknown = 'unknown',

  // NEW - Learning modes (Learning OS)
  story_mode = 'story_mode',
  game_time = 'game_time',
  focus_session = 'focus_session',

  // NEW - Creation/building
  build_robot = 'build_robot',
  draw_picture = 'draw_picture',
  write_story = 'write_story',
  create_something = 'create_something',

  // NEW - Homework help
  explain_step = 'explain_step',
  check_answer = 'check_answer',
  show_example = 'show_example',

  // NEW - Emotional/social
  feeling_sad = 'feeling_sad',
  feeling_frustrated = 'feeling_frustrated',
  feeling_bored = 'feeling_bored',
  celebrate = 'celebrate',

  // NEW - Progress/meta
  show_progress = 'show_progress',
  unlock_check = 'unlock_check',
  change_difficulty = 'change_difficulty',
}

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: {
    topic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    contentType?: ContentType;
    emotion?: 'sad' | 'frustrated' | 'bored' | 'excited' | 'happy';
  };
  app?: {
    name: string;
    route: string;
    shouldNavigate: boolean;
  };
}

// Map intents to apps (Learning OS routing)
export const INTENT_TO_APP_MAP: Record<string, { name: string; route: string }> = {
  [IntentType.game_time]: { name: 'GAMES', route: '/games' },
  [IntentType.story_mode]: { name: 'STORY_BUILDER', route: '/stories' },
  [IntentType.write_story]: { name: 'STORY_BUILDER', route: '/stories' },
  [IntentType.focus_session]: { name: 'FOCUS_SESSION', route: '/focus' },
  [IntentType.build_robot]: { name: 'ROBOT_BUILDER', route: '/builder' },
  [IntentType.draw_picture]: { name: 'ART_STUDIO', route: '/art' },
  [IntentType.create_something]: { name: 'CREATOR_LAB', route: '/create' },
  [IntentType.show_progress]: { name: 'DASHBOARD', route: '/progress' },
  [IntentType.quiz]: { name: 'QUIZ_LAB', route: '/quiz' },
};

// Keywords for intent detection
const LEARN_KEYWORDS = [
  'learn', 'teach', 'tell me about', 'explain', 'what is', 'who is', 'how does',
  'i want to learn', 'can you teach', 'tell me more', 'i\'d like to know'
];
const QUIZ_KEYWORDS = ['quiz', 'test', 'question', 'challenge', 'assess', 'evaluate'];
const REPEAT_KEYWORDS = ['repeat', 'say that again', 'go back', 'previous', 'one more time'];
const HELP_KEYWORDS = ['help', 'what can you do', 'how does this work', 'instructions', 'guide me'];

// NEW - Learning OS intent keywords
const STORY_KEYWORDS = ['story', 'tell me a story', 'story time', 'read me', 'make up a story'];
const GAME_KEYWORDS = ['game', 'play', 'fun', 'let\'s play', 'i want to play', 'game time'];
const FOCUS_KEYWORDS = ['practice', 'focus', 'drill', 'study', 'work on', 'focus session', 'practice session'];
const BUILD_KEYWORDS = ['build', 'make', 'create', 'construct', 'design'];
const ROBOT_KEYWORDS = ['robot', 'bot', 'machine', 'automaton'];
const DRAW_KEYWORDS = ['draw', 'paint', 'art', 'picture', 'sketch', 'color'];
const WRITE_STORY_KEYWORDS = ['write', 'author', 'compose', 'create a story', 'make a story'];
const EXPLAIN_STEP_KEYWORDS = ['how do i', 'show me how', 'step by step', 'walk me through', 'guide me'];
const CHECK_ANSWER_KEYWORDS = ['is this right', 'check my answer', 'did i get it', 'is this correct', 'am i right'];
const EXAMPLE_KEYWORDS = ['example', 'show me an example', 'give me an example', 'like what'];
const SAD_KEYWORDS = ['sad', 'unhappy', 'down', 'upset', 'crying'];
const FRUSTRATED_KEYWORDS = ['frustrated', 'angry', 'annoyed', 'this is hard', 'i can\'t', 'i don\'t understand'];
const BORED_KEYWORDS = ['bored', 'boring', 'not fun', 'this is dull', 'something else'];
const CELEBRATE_KEYWORDS = ['i did it', 'yes', 'yay', 'hooray', 'i got it', 'success', 'woohoo'];
const PROGRESS_KEYWORDS = ['progress', 'how am i doing', 'my stats', 'my level', 'my score'];
const UNLOCK_KEYWORDS = ['unlock', 'what can i do', 'what\'s next', 'new stuff', 'what\'s available'];

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
   * This is our main NLU function that detects learning topics and app routing
   */
  async parse(input: string): Promise<Intent> {
    const normalizedInput = input.toLowerCase().trim();
    const entities = this.extractEntities(normalizedInput);

    // NEW - Check for emotional intents first (high priority)
    if (SAD_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.feeling_sad, { emotion: 'sad' });
    }
    if (FRUSTRATED_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.feeling_frustrated, { emotion: 'frustrated' });
    }
    if (BORED_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.feeling_bored, { emotion: 'bored' });
    }
    if (CELEBRATE_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.celebrate, { emotion: 'excited' });
    }

    // NEW - Check for progress/meta intents
    if (PROGRESS_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.show_progress);
    }
    if (UNLOCK_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.unlock_check);
    }

    // Check for help intent
    if (HELP_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.help);
    }

    // Check for repeat intent
    if (REPEAT_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.repeat);
    }

    // NEW - Check for game intent (high engagement activity)
    if (GAME_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.game_time, entities);
    }

    // NEW - Check for story mode
    if (STORY_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.story_mode, entities);
    }

    // NEW - Check for focus session
    if (FOCUS_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.focus_session, entities);
    }

    // NEW - Check for building/creation intents
    const hasBuild = BUILD_KEYWORDS.some(keyword => normalizedInput.includes(keyword));
    const hasRobot = ROBOT_KEYWORDS.some(keyword => normalizedInput.includes(keyword));
    if (hasBuild && hasRobot) {
      return this.createIntent(IntentType.build_robot, entities);
    }
    if (DRAW_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.draw_picture, entities);
    }
    if (WRITE_STORY_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.write_story, entities);
    }
    if (hasBuild) {
      return this.createIntent(IntentType.create_something, entities);
    }

    // NEW - Check for homework help intents
    if (EXPLAIN_STEP_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.explain_step, entities);
    }
    if (CHECK_ANSWER_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.check_answer, entities);
    }
    if (EXAMPLE_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.show_example, entities);
    }

    // Check for quiz intent
    if (QUIZ_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.createIntent(IntentType.quiz, entities);
    }

    // Check for learn intent with explicit keywords
    for (const keyword of LEARN_KEYWORDS) {
      if (normalizedInput.includes(keyword)) {
        // Extract the topic that follows the keyword
        const parts = normalizedInput.split(keyword);
        if (parts.length > 1 && parts[1].trim()) {
          const potentialTopic = parts[1].trim();
          const topicEntities = this.extractEntities(potentialTopic);

          // If we found a topic, return it with high confidence
          if (topicEntities.topic) {
            return this.createIntent(IntentType.learn, topicEntities, 0.95);
          }

          // Otherwise, use the text after the keyword as the topic
          return this.createIntent(IntentType.learn, { ...topicEntities, topic: potentialTopic }, 0.8);
        }
      }
    }

    // If no explicit learn keywords, try to extract a topic directly
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
   * Includes app routing information for Learning OS intents
   */
  private createIntent(
    type: IntentType,
    entities: Intent['entities'] = {},
    confidence: number = 1.0
  ): Intent {
    const intent: Intent = {
      type,
      confidence,
      entities
    };

    // Add app routing if this intent maps to an app
    const appMapping = INTENT_TO_APP_MAP[type];
    if (appMapping) {
      intent.app = {
        name: appMapping.name,
        route: appMapping.route,
        shouldNavigate: true
      };
    }

    return intent;
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

// Lazy-load singleton instance to avoid build-time initialization
let intentParserInstance: IntentParser | null = null;

function getIntentParser(): IntentParser {
  if (!intentParserInstance) {
    intentParserInstance = new IntentParser();
  }
  return intentParserInstance;
}

// Create and export a singleton instance for easy access
export const intentParser = {
  parse: (input: string) => getIntentParser().parse(input),
  getClarificationPrompt: () => getIntentParser().getClarificationPrompt(),
  getHelpResponse: () => getIntentParser().getHelpResponse(),
  getAvailableTopics: () => getIntentParser().getAvailableTopics()
};

export default intentParser;
