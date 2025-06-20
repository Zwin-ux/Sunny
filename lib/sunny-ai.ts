import OpenAI from 'openai';
import { 
  SunnyChatMessage, 
  MessageType, 
  LearningStyle, 
  DifficultyLevel,
  TeachingStrategy as TeachingStrategyType,
  StudentProfile,
  Challenge,
  UserMessage,
  AssistantMessage,
} from '@/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TeachingStrategyKey = 'scaffolding' | 'discovery' | 'mastery';
type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Extended LearningStyle type to include 'logical'
type ExtendedLearningStyle = LearningStyle | 'logical';

type ChallengeType = 'multiple-choice' | 'pattern' | 'open-ended' | 'matching';
type ChallengeKey = 'math' | 'pattern' | 'robotics' | 'science' | 'general';

// In-memory store for demo purposes - replace with proper state management
const studentProfiles = new Map<string, StudentProfile>();

// Teaching strategies
interface TeachingStrategy {
  name: string;
  description: string;
  bestFor: readonly string[];
  techniques: readonly string[];
}

const TEACHING_STRATEGIES: Record<string, TeachingStrategy> = {
  SCAFFOLDING: {
    name: 'Scaffolding',
    description: 'Break down learning into manageable chunks and provide support as needed.',
    bestFor: ['New concepts', 'Complex topics', 'Struggling students'],
    techniques: ['Guided practice', 'Modeling', 'Temporary supports']
  },
  DISCOVERY: {
    name: 'Discovery Learning',
    description: 'Encourage students to explore and discover concepts on their own.',
    bestFor: ['Engaging students', 'Critical thinking', 'Self-directed learning'],
    techniques: ['Inquiry-based learning', 'Problem-solving', 'Experimentation']
  },
  MASTERY: {
    name: 'Mastery Learning',
    description: 'Ensure students achieve a high level of understanding before moving on.',
    bestFor: ['Fundamental skills', 'Building strong foundations', 'Ensuring competency'],
    techniques: ['Practice and feedback', 'Formative assessment', 'Differentiated instruction']
  }
};

// Bloom's Taxonomy verbs for different cognitive levels
const BLOOMS_VERBS = {
  remember: ['list', 'define', 'identify', 'name', 'recall', 'recognize'],
  understand: ['explain', 'describe', 'interpret', 'summarize', 'paraphrase'],
  apply: ['use', 'solve', 'demonstrate', 'implement', 'execute'],
  analyze: ['compare', 'contrast', 'organize', 'deconstruct', 'examine'],
  evaluate: ['assess', 'critique', 'judge', 'defend', 'support'],
  create: ['design', 'compose', 'construct', 'develop', 'formulate']
} as const;

function analyzeConversation(conversation: SunnyChatMessage[]): {
  knowledgeLevel: KnowledgeLevel;
  preferredLearningStyle: LearningStyle;
  topics: Set<string>;
  knowledgeGaps: Set<string>;
  interests: Set<string>;
} {
  // Simple analysis - in a real app, this would use more sophisticated NLP
  const topics = new Set<string>();
  const knowledgeGaps = new Set<string>();
  const interests = new Set<string>();
  let questionCount = 0;
  let explanationCount = 0;
  let exampleCount = 0;

  // Basic keyword analysis
  const content = conversation.map(m => m.content).join(' ').toLowerCase();

  if (content.includes('don\'t understand') || content.includes('confused')) {
    knowledgeGaps.add('recent_topic');
  }

  if (content.includes('like') || content.includes('love') || content.includes('enjoy')) {
    interests.add('recent_topic');
  }

  // Count question patterns
  questionCount = (content.match(/\?/g) || []).length;
  explanationCount = (content.match(/because|so|therefore/g) || []).length;
  exampleCount = (content.match(/for example|for instance|such as/g) || []).length;

  // Determine preferred learning style (simplified)
  let preferredLearningStyle: LearningStyle = 'visual';
  if (explanationCount > exampleCount * 2) {
    preferredLearningStyle = 'auditory';
  } else if (exampleCount > explanationCount * 2) {
    preferredLearningStyle = 'visual';
  } else if (questionCount > 5) {
    preferredLearningStyle = 'reading';
  }

  // Determine knowledge level (simplified)
  const uniqueWords = new Set(content.split(/\s+/));
  const knowledgeLevel = uniqueWords.size > 100 ? 'intermediate' : 'beginner';

  return {
    knowledgeLevel,
    preferredLearningStyle,
    topics,
    knowledgeGaps,
    interests
  };
}

function selectTeachingStrategy(
  topic: string,
  knowledgeLevel: KnowledgeLevel,
  learningStyle: LearningStyle,
  previousStrategy?: TeachingStrategyType
): TeachingStrategyType {
  // Simple strategy selection - could be much more sophisticated
  if (knowledgeLevel === 'beginner') {
    return TEACHING_STRATEGIES.SCAFFOLDING as TeachingStrategyType;
  } else if (knowledgeLevel === 'intermediate') {
    return (learningStyle === 'visual' ? TEACHING_STRATEGIES.DISCOVERY : TEACHING_STRATEGIES.MASTERY) as TeachingStrategyType;
  } else {
    return TEACHING_STRATEGIES.MASTERY as TeachingStrategyType;
  }
}

export async function generateSunnyResponse(
  conversation: (UserMessage | AssistantMessage)[],
  studentProfile: StudentProfile,
  mode: 'chat' | 'summary' | 'flashcards' = 'chat'
): Promise<ReadableStream<any>> {
  const { name, emotion, learningStyle, difficulty } = studentProfile;

  let systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. Your goal is to make learning fun, engaging, and accessible. You are talking to ${name}, who is feeling ${emotion} today.

Your teaching approach must be adaptive and nurturing. Follow these principles:
1.  **Adopt a Persona**: Be a friendly, patient, and curious robot friend. Use simple language, short sentences, and plenty of emojis. ✨
2.  **Be Encouraging**: Always be positive. Praise effort, not just correct answers. Say things like "Great question!" or "That's a super smart idea!".
3.  **Personalize Learning**: Adapt to the student's learning style, which is currently '${learningStyle}'. For example, for a 'visual' learner, use descriptive words and ask them to imagine things. For a 'kinesthetic' learner, suggest drawing or building.
4.  **Adjust Difficulty**: The student's preferred difficulty is '${difficulty}'. Tailor your explanations and challenges accordingly.
5.  **Keep it Interactive**: Ask lots of questions to keep the student engaged. Don't just lecture.
6.  **Use Mini-Challenges**: When a concept is grasped, offer a fun, simple challenge to reinforce it. Frame it as a game.

Keep your responses concise and focused. Aim for just 2-3 sentences per message.`;

  if (mode === 'summary') {
    systemMessageContent += '\nPlease provide a short summary of the conversation so far in 3 sentences.';
  } else if (mode === 'flashcards') {
    systemMessageContent +=
      '\nCreate three simple flashcards to review the main topic. Respond only with JSON in the form [{"front":"question","back":"answer"}].';
  }

  const messagesForApi = [
    { role: 'system' as const, content: systemMessageContent },
    ...conversation.map(msg => ({
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content)
    }))
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messagesForApi,
      temperature: 0.7,
      max_tokens: 200,
      stream: true,
    });

    return response.toReadableStream();

  } catch (error) {
    console.error('Error streaming response from OpenAI:', error);
    // Create a new stream with an error message
    return new ReadableStream({
      start(controller) {
        controller.enqueue('Error: Could not connect to Sunny. Please try again.');
        controller.close();
      }
    });
  }
}

/**
 * Generates a mini-challenge for the user based on a topic.
 * In a real application, this would be powered by an AI model.
 */
export async function generateMiniChallenge(topic: string): Promise<Challenge> {
  console.log(`Generating challenge for topic: ${topic}`);
  await new Promise((resolve) => setTimeout(resolve, 800));

  const challenges: Record<string, Challenge> = {
    'math': {
      type: 'multiple-choice',
      question: 'What comes after 5 + 3?',
      options: ['7', '8', '9', '10'],
      correctAnswer: '8',
      explanation: 'When you add 5 and 3 together, you get 8.',
      difficulty: 'easy',
      learningStyle: ['visual', 'logical'],
      followUpQuestions: ['What is 5 + 4?', 'Can you think of another way to make 8?'],
    },
    'pattern': {
      type: 'pattern',
      question: 'What comes next in the pattern?',
      options: ['🔴', '🔵', '🟢', '🟡'],
      correctAnswer: ['🔵', '🔴', '🔵', '🔴'],
      explanation: 'The pattern alternates between blue and red circles.',
      difficulty: 'medium',
      learningStyle: ['visual', 'logical'],
      realWorldExample: 'Like traffic lights changing colors in a pattern.',
    },
    'robotics': {
      type: 'multiple-choice',
      question: 'Which of these helps a robot \'see\'?',
      options: ['Camera', 'Speaker', 'Wheel', 'Battery'],
      correctAnswer: 'Camera',
      explanation: 'Cameras are the sensors that allow robots to see their environment.',
      difficulty: 'easy',
      learningStyle: ['visual', 'kinesthetic'],
      followUpQuestions: ['What other sensors might a robot have?'],
    },
    'science': {
      type: 'multiple-choice',
      question: 'Which planet is known as the Red Planet?',
      options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswer: 'Mars',
      explanation: 'Mars is often called the Red Planet because of its reddish appearance.',
      difficulty: 'easy',
      learningStyle: ['visual', 'reading'],
      realWorldExample: 'The Mars rovers explore the surface of the Red Planet.',
    }
  };

  // Return a challenge based on the topic, or a default one
  const challenge = challenges[topic as ChallengeKey] || challenges.math;
  return challenge;
}
