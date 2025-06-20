import { 
  SunnyChatMessage, 
  MessageType, 
  LearningStyle, 
  DifficultyLevel,
  TeachingStrategy as TeachingStrategyType,
  StudentProfile,
  Challenge,
  BaseMessage,
  UserMessage,
  AssistantMessage,
  ChallengeMessage,
  FeedbackMessage
} from '@/types/chat';

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
  prompt: string, 
  name: string,
  conversationHistory: SunnyChatMessage[] = [],
  additionalContext: {
    currentTopic?: string;
    learningObjectives?: string[];
    previousResponses?: string[];
    previousStrategy?: string;
  } = {}
): Promise<{content: string; metadata?: any}> {
  try {
    // Get or create student profile
    if (!studentProfiles.has(name)) {
      studentProfiles.set(name, {
        name,
        preferredLearningStyle: 'visual',
        knownConcepts: [],
        knowledgeGaps: [],
        conversationHistory: []
      });
    }
    
    const student = studentProfiles.get(name)!;
    // Create user message with proper type
    const userMessage: UserMessage = {
      role: 'user',
      content: prompt,
      name: name || 'Friend',
      timestamp: Date.now(),
      type: 'user' as const
    };
    
    const conversation: SunnyChatMessage[] = [
      ...conversationHistory,
      userMessage
    ];
    
    // Analyze conversation to determine teaching strategy and learning style
    const analysis = analyzeConversation(conversation);
    const teachingStrategy = selectTeachingStrategy(
      analysis.topics.values().next().value || 'general',
      analysis.knowledgeLevel,
      analysis.preferredLearningStyle as LearningStyle,
      additionalContext.previousStrategy
    ) as TeachingStrategyType;

    // Prepare system message with teaching strategy
    const systemMessage: SunnyChatMessage = {
      role: 'system',
      content: `You are Sunny, a friendly and encouraging AI tutor for young students. ` +
        `Your goal is to help students learn in a fun and engaging way. ` +
        `Use simple language, be patient, and provide positive reinforcement. ` +
        `The student's name is ${name || 'friend'}. ` +
        `Current teaching strategy: ${teachingStrategy}`,
      name: 'System',
      timestamp: Date.now(),
      type: 'system' as const
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [systemMessage, ...conversation],
        name: name || 'Friend',
        teachingStrategy,
        preferredLearningStyle: analysis.preferredLearningStyle,
        knowledgeLevel: analysis.knowledgeLevel
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response from AI');
    }

    const data = await response.json();
    
    // Create assistant message with proper type
    const assistantMessage: SunnyChatMessage = {
      role: 'assistant',
      content: data.content,
      name: 'Sunny',
      timestamp: Date.now(),
      type: 'assistant' as const
    };
    
    // Update conversation history with proper typing
    student.conversationHistory = [
      ...student.conversationHistory,
      userMessage,
      assistantMessage
    ].slice(-20); // Keep only the last 20 messages
    
    return {
      content: data.content,
      metadata: {
        teachingStrategy,
        preferredLearningStyle: analysis.preferredLearningStyle,
        knowledgeLevel: analysis.knowledgeLevel,
        detectedTopics: Array.from(analysis.topics),
        knowledgeGaps: Array.from(analysis.knowledgeGaps)
      }
    };
    
  } catch (error) {
    console.error('Error generating response:', error);
    
    // More engaging and child-friendly error responses
    const fallbackResponses = [
      `Hmm, my brain is doing somersaults right now, ${name}! Could you ask me something else?`,
      `Whoopsie-daisy! I'm feeling a bit stuck, ${name}. Let's try a different question!`,
      `Hmm, I'm scratching my head on that one, ${name}. What else would you like to explore?`,
      `Let's talk about something else, ${name}! Did you know the sun is so big that about 1 million Earths could fit inside it? ☀️`,
      `I'm still learning, just like you! Let's try a different question, ${name}!`,
      `My circuits are feeling extra wobbly today! Could you ask me something else, ${name}?`,
      `That's a tricky one! Let's come back to it later. What else are you curious about, ${name}?`
    ];
    
    // Add a fun emoji to make the error more engaging
    const emojis = ['🌟', '🌈', '🚀', '🎨', '🔍', '🧠', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    return `${fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]} ${randomEmoji}`;
  }
}

export async function generateMiniChallenge(topic: string): Promise<Challenge> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simple challenge generation - replace with AI-generated challenges
  const challenges: Record<string, Omit<Challenge, 'content'> & { content: any }> = {
    'math': {
      type: 'multiple-choice' as const,
      question: 'What comes after 5 + 3?',
      options: ['7', '8', '9', '10'],
      correctAnswer: '8',
      explanation: 'When you add 5 and 3 together, you get 8.',
      difficulty: 'beginner' as const,
      learningStyle: ['visual' as const, 'logical' as const],
      followUpQuestions: ['What is 5 + 4?', 'Can you think of another way to make 8?'],
      content: {
        type: 'multiple-choice',
        question: 'What comes after 5 + 3?',
        options: ['7', '8', '9', '10'],
        correctAnswer: '8',
        explanation: 'When you add 5 and 3 together, you get 8.',
        difficulty: 'beginner',
        learningStyle: ['visual', 'logical'],
        followUpQuestions: ['What is 5 + 4?', 'Can you think of another way to make 8?']
      }
    },
    'pattern': {
      type: 'pattern' as const,
      question: 'What comes next in the pattern?',
      options: ['🔴', '🔵', '🟢', '🟡'],
      correctAnswer: ['🔵', '🔴', '🔵', '🔴'],
      explanation: 'The pattern alternates between blue and red circles.',
      difficulty: 'intermediate' as const,
      learningStyle: ['visual' as const, 'logical' as const],
      realWorldExample: 'Like traffic lights changing colors in a pattern.',
      content: {
        type: 'pattern',
        question: 'What comes next in the pattern?',
        options: ['🔴', '🔵', '🟢', '🟡'],
        correctAnswer: ['🔵', '🔴', '🔵', '🔴'],
        explanation: 'The pattern alternates between blue and red circles.',
        difficulty: 'intermediate',
        learningStyle: ['visual', 'logical'],
        realWorldExample: 'Like traffic lights changing colors in a pattern.'
      }
    },
    'robotics': {
      type: 'multiple-choice' as const,
      question: 'Which of these helps a robot \'see\'?',
      options: ['Camera', 'Speaker', 'Wheel', 'Battery'],
      correctAnswer: 'Camera',
      explanation: 'Cameras are the sensors that allow robots to see their environment.',
      difficulty: 'beginner' as const,
      learningStyle: ['visual' as const, 'kinesthetic' as const],
      followUpQuestions: ['What other sensors might a robot have?'],
      content: {
        type: 'multiple-choice',
        question: 'Which of these helps a robot \'see\'?',
        options: ['Camera', 'Speaker', 'Wheel', 'Battery'],
        correctAnswer: 'Camera',
        explanation: 'Cameras are the sensors that allow robots to see their environment.',
        difficulty: 'beginner',
        learningStyle: ['visual', 'kinesthetic'],
        followUpQuestions: ['What other sensors might a robot have?']
      }
    },
    'science': {
      type: 'multiple-choice' as const,
      question: 'Which planet is known as the Red Planet?',
      options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswer: 'Mars',
      explanation: 'Mars is often called the Red Planet because of its reddish appearance.',
      difficulty: 'beginner' as const,
      learningStyle: ['visual' as const, 'reading' as const],
      realWorldExample: 'The Mars rovers explore the surface of the Red Planet.',
      content: {
        type: 'multiple-choice',
        question: 'Which planet is known as the Red Planet?',
        options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
        correctAnswer: 'Mars',
        explanation: 'Mars is often called the Red Planet because of its reddish appearance.',
        difficulty: 'beginner',
        learningStyle: ['visual', 'reading'],
        realWorldExample: 'The Mars rovers explore the surface of the Red Planet.'
      }
    }
  };

  // Return a challenge based on the topic, or a default one
  const challenge = challenges[topic as ChallengeKey] || challenges.math;
  return {
    ...challenge,
    content: {
      ...challenge,
      metadata: {}
    }
  };
}
