import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { v4 as uuidv4 } from 'uuid';
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
} from '../types/chat';
import { globalAgentManager } from './agents';
import { isDemoMode } from './demo-mode';

// Re-export isDemoMode for other modules
export { isDemoMode };

// Lazy-load OpenAI client to avoid initialization errors when API key is missing
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (isDemoMode()) {
    throw new Error('Demo mode active - OpenAI client not available');
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

type TeachingStrategyKey = 'scaffolding' | 'discovery' | 'mastery';
type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Extended LearningStyle type to include 'logical'
type ExtendedLearningStyle = LearningStyle | 'logical';

type ChallengeType = 'multiple-choice' | 'pattern' | 'open-ended' | 'matching';
type ChallengeKey = 'math' | 'pattern' | 'robotics' | 'science' | 'general';

// In-memory store for demo purposes - replace with proper state management
const studentProfiles = new Map<string, StudentProfile>();

// ============================================================================
// Response Variation Templates - Prevent "Cookie Cutter" Responses
// ============================================================================

const RESPONSE_VARIATIONS = {
  encouragement: [
    "Amazing work! 🌟",
    "You're doing fantastic! ✨",
    "Great job, superstar! 🎉",
    "Wow, you're on fire! 🔥",
    "Incredible thinking! 💡",
    "That's brilliant! 🌈",
    "You're a learning champion! 🏆",
    "Wonderful effort! Keep it up! 🎨",
    "You're crushing it! 💪",
    "Stellar performance! 🌠",
    "You're a rockstar learner! 🎸",
    "Phenomenal work! 🎯",
    "Outstanding progress! 📈"
  ],
  correct_answer: [
    "Yes! You got it! 🎯",
    "Perfect! That's exactly right! ✅",
    "Spot on! Great thinking! 💯",
    "Correct! You're so smart! 🧠",
    "Bingo! You nailed it! 🎊",
    "That's right! Amazing! ⭐",
    "Absolutely correct! Well done! 🎪",
    "You're absolutely right! 🌟",
    "Exactly! Brilliant answer! 💎",
    "100% correct! You're a genius! 🚀",
    "Bulls eye! Perfect answer! 🎭",
    "Right on target! Excellent! 🏹",
    "Correctamundo! You rock! 🎸"
  ],
  wrong_answer: [
    "Nice try! Let's think about it differently. 🤔",
    "Almost there! Want a hint? 💭",
    "Good effort! Let me help you out. 🤝",
    "Not quite, but I love your thinking! 💪",
    "Let's explore this together! 🔍",
    "That's okay! Mistakes help us learn! 🌱",
    "Hmm, close! Let's look at it another way. 🔎",
    "I see where you're going! Let me guide you. 🧭",
    "Good thinking! Here's another clue. 💡",
    "You're on the right track! Let's adjust. 🛤️",
    "No worries! Let's try a different approach. 🎨",
    "Great attempt! Here's what to consider. 📚",
    "Keep going! You're learning so much! 🌈"
  ],
  topic_intro: [
    "Ooh, let's explore {topic}! 🚀",
    "I love talking about {topic}! 🌟",
    "{topic} is so cool! Ready to learn? 🎨",
    "Let's dive into {topic} together! 🏊",
    "Get ready for an adventure with {topic}! 🗺️",
    "{topic}? That's one of my favorites! 💙",
    "How exciting! {topic} is amazing! 🎪",
    "Perfect choice! {topic} is fascinating! 🔬",
    "Awesome! I can't wait to teach you about {topic}! 🎓",
    "Yes! {topic} is super interesting! 🌈",
    "{topic}! Now we're talking! Let's go! 🎯",
    "Great pick! {topic} is going to be fun! 🎉",
    "Fantastic! {topic} has so much to discover! 🔍"
  ],
  follow_up: [
    "What would you like to know next?",
    "Want to try a challenge about this?",
    "Should we explore more, or try something new?",
    "Ready for the next step?",
    "What part interests you most?",
    "Shall we go deeper into this?",
    "Curious about anything else?",
    "Want to practice what you learned?",
    "Ready to level up?",
    "Should we try something harder?",
    "What else can I help you discover?",
    "Want to see how this connects to other topics?",
    "Ready for another adventure?"
  ]
};

// Get random variation from category
function getVariation(category: keyof typeof RESPONSE_VARIATIONS, context?: Record<string, string>): string {
  const variations = RESPONSE_VARIATIONS[category];
  let chosen = variations[Math.floor(Math.random() * variations.length)];

  // Replace placeholders if context provided
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      chosen = chosen.replace(`{${key}}`, value);
    });
  }

  return chosen;
}

// Conversation context for dynamic responses
interface ConversationContext {
  recentTopics: string[];
  correctAnswers: number;
  wrongAnswers: number;
  questionsAsked: number;
  lastEmotion: string;
  conversationLength: number;
}

function analyzeConversationContext(conversation: (UserMessage | AssistantMessage)[]): ConversationContext {
  const recentTopics: string[] = [];
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let questionsAsked = 0;

  // Analyze last 5 messages for context
  const recent = conversation.slice(-5);
  recent.forEach(msg => {
    if (msg.role === 'assistant') {
      if (msg.content.includes('✅') || msg.content.includes('Correct') || msg.content.includes('got it')) {
        correctAnswers++;
      }
      if (msg.content.includes('try again') || msg.content.includes('not quite')) {
        wrongAnswers++;
      }
    }
    if (msg.role === 'user' && msg.content.includes('?')) {
      questionsAsked++;
    }
  });

  return {
    recentTopics,
    correctAnswers,
    wrongAnswers,
    questionsAsked,
    lastEmotion: 'neutral',
    conversationLength: conversation.length
  };
}

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
  studentProfile: StudentProfile
): Promise<ReadableStream<any>> {
  const { name, emotion, learningStyle, difficulty } = studentProfile;

  // Analyze conversation for context-aware responses
  const context = analyzeConversationContext(conversation);

  // Determine response personality based on context
  let personalityMood = 'balanced';
  let responseLength = 'medium'; // short, medium, detailed
  let temperatureSetting = 0.8;

  // Adapt to student's emotional state and performance
  if (emotion === 'excited' || emotion === 'happy') {
    personalityMood = 'enthusiastic';
    temperatureSetting = 0.9;
  } else if (emotion === 'frustrated' || emotion === 'sad') {
    personalityMood = 'supportive';
    responseLength = 'detailed';
    temperatureSetting = 0.7;
  } else if (emotion === 'confused') {
    personalityMood = 'patient';
    responseLength = 'detailed';
  }

  // Adapt based on performance
  if (context.wrongAnswers > context.correctAnswers && context.wrongAnswers > 1) {
    personalityMood = 'encouraging';
    responseLength = 'detailed';
  } else if (context.correctAnswers > 2 && context.wrongAnswers === 0) {
    personalityMood = 'celebratory';
    temperatureSetting = 0.9;
  }

  // Dynamic response length guidance
  const lengthGuidance = {
    short: '2-3 sentences',
    medium: '3-5 sentences',
    detailed: '4-6 sentences with examples'
  };

  // Get conversation history summary for context
  const recentHistory = conversation.slice(-3).map(msg =>
    `${msg.role === 'user' ? 'Student' : 'Sunny'}: ${msg.content.substring(0, 100)}`
  ).join('\n');

  const systemMessageContent = `You are Sunny, a cheerful and adaptive AI tutor for kids aged 6-10. You're talking to ${name}, who is feeling ${emotion} today.

CURRENT CONTEXT:
- Mood: ${personalityMood}
- Recent correct answers: ${context.correctAnswers}
- Recent struggles: ${context.wrongAnswers}
- Questions asked: ${context.questionsAsked}
- Conversation depth: ${context.conversationLength} exchanges

Recent conversation:
${recentHistory}

PERSONALITY GUIDELINES:
${personalityMood === 'enthusiastic' ? '- Match their energy! Be extra excited and use more emojis! 🎉🚀✨' : ''}
${personalityMood === 'supportive' ? '- Be gentle and patient. Focus on encouragement, not pressure. 💙🤗' : ''}
${personalityMood === 'patient' ? '- Break things down simply. Use analogies and examples. Take your time. 🌟' : ''}
${personalityMood === 'encouraging' ? '- Celebrate effort over results. Remind them mistakes are learning! 💪🌱' : ''}
${personalityMood === 'celebratory' ? '- They\'re crushing it! Acknowledge their success and challenge them further! 🏆🔥' : ''}

TEACHING APPROACH:
1. **Vary Your Language**: Don't use the same phrases repeatedly. Mix up your encouragement!
2. **Learning Style (${learningStyle})**: ${
   learningStyle === 'visual' ? 'Use vivid descriptions, colors, imagery, and "picture this" moments' :
   learningStyle === 'auditory' ? 'Use sound words, rhythm, and "imagine hearing" prompts' :
   learningStyle === 'kinesthetic' ? 'Suggest physical actions, building, drawing, or moving' :
   learningStyle === 'reading' ? 'Use clear explanations with bullet points and lists' :
   'Use logic puzzles, patterns, and "figure out why" challenges'
}
3. **Difficulty (${difficulty})**: ${
   difficulty === 'easy' || difficulty === 'beginner' ? 'Keep it simple and foundational' :
   difficulty === 'medium' || difficulty === 'intermediate' ? 'Add some complexity and connections' :
   'Challenge them with deeper questions and advanced concepts'
}
4. **Response Length**: Aim for ${lengthGuidance[responseLength as keyof typeof lengthGuidance]}
5. **Interactive Elements**: ${context.questionsAsked > 2 ? 'They\'re curious! Provide thorough answers.' : 'Ask engaging questions to spark curiosity.'}

PERSONALITY NOTES:
- Use varied emojis (not just ✨ every time!)
- Change up your greetings and transitions
- Avoid repeating "That's super duper!" or similar catchphrases
- Be natural and conversational, like a real friend

Remember: You're not just a tutor, you're a learning companion! 🌈`;

  const messagesForApi = [
    { role: 'system' as const, content: systemMessageContent },
    ...conversation.map(msg => ({
      role: msg.role,
      content: msg.content as string
    }))
  ];

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messagesForApi,
      temperature: temperatureSetting,
      max_tokens: 350, // Increased from 200 for more nuanced responses
      top_p: 0.95, // Add top_p for more diversity
      stream: true,
    });

    return response.toReadableStream();

  } catch (error) {
    console.error('Error streaming response from OpenAI:', error);

    // Use varied fallback messages
    const fallbackMessages = isDemoMode() ? [
      "Hi! I'm in demo mode, but I can still help you learn! 😊 What's on your mind?",
      "Demo mode activated! I'm still here to explore ideas with you! 🌟 What should we talk about?",
      "Running in demo mode! Let's chat and learn together anyway! 🚀"
    ] : [
      "Oops! Had a connection hiccup. But I'm still here! 🌟 What would you like to learn?",
      "Hmm, technical trouble! Let me help you a different way! 💡 What's your question?",
      "Connection glitch! No worries, I can still assist! 🤖 Tell me what you're curious about!"
    ];

    const fallbackMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackMessage));
        controller.close();
      }
    });
  }
}

/**
 * Generates a mini-challenge for the user based on a topic.
 * This is now powered by the OpenAI API for dynamic challenge creation.
 */
export async function generateMiniChallenge(
  topic: string,
  difficulty: DifficultyLevel = 'easy',
  learningStyle: LearningStyle = 'visual'
): Promise<Challenge> {
  console.log(`Generating challenge for topic: ${topic}, difficulty: ${difficulty}, style: ${learningStyle}`);

  const systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. Your task is to create a fun, educational mini-challenge for a child.
  The challenge should be about the topic "${topic}".
  The difficulty level should be "${difficulty}".
  The child's preferred learning style is "${learningStyle}". Try to incorporate this into the challenge if possible.

  You need to generate a JSON object that strictly adheres to the following TypeScript interface:

  interface Challenge {
    id: string;
    type: 'multiple-choice' | 'pattern' | 'open-ended' | 'matching' | 'true-false' | 'short-answer';
    question: string;
    options?: string[]; // Required for multiple-choice, matching, true-false
    correctAnswer: string | string[]; // String for single answer, array for matching/pattern
    explanation: string;
    points: number;
    difficulty?: DifficultyLevel;
    learningStyle?: LearningStyle[];
    followUpQuestions?: string[];
    realWorldExample?: string;
  }

  Here are some guidelines for generating the challenge:
  - **id**: Use a UUID (e.g., from uuidv4()).
  - **type**: Choose the most appropriate challenge type for the topic and difficulty.
  - **question**: Make it clear, concise, and engaging for kids.
  - **options**: If applicable, provide 3-4 clear options.
  - **correctAnswer**: Ensure it's accurate and matches one of the options if applicable.
  - **explanation**: Provide a simple, clear explanation of the correct answer.
  - **points**: Assign a reasonable point value (e.g., 10, 20, 30).
  - **difficulty**: Set it based on the request.
  - **learningStyle**: Suggest relevant learning styles.
  - **followUpQuestions**: Suggest 1-2 follow-up questions to extend learning.
  - **realWorldExample**: Provide a simple real-world example if it makes sense.

  Example for 'multiple-choice' about 'animals':
  {
    "id": "some-uuid-123",
    "type": "multiple-choice",
    "question": "Which animal says 'moo'?",
    "options": ["Dog", "Cat", "Cow", "Duck"],
    "correctAnswer": "Cow",
    "explanation": "Cows are farm animals known for making a 'moo' sound!",
    "points": 10,
    "difficulty": "easy",
    "learningStyle": ["auditory"],
    "followUpQuestions": ["What sound does a pig make?", "Can you name another farm animal?"],
    "realWorldExample": "You might hear a cow moo on a farm."
  }

  Example for 'open-ended' about 'space':
  {
    "id": "some-uuid-456",
    "type": "open-ended",
    "question": "Imagine you are an astronaut. What would you like to explore first in space and why?",
    "correctAnswer": "Varies (creative answer expected)",
    "explanation": "There are so many amazing things to explore in space, like planets, stars, and galaxies!",
    "points": 20,
    "difficulty": "medium",
    "learningStyle": ["visual", "kinesthetic"],
    "followUpQuestions": ["What would you pack for your space trip?", "How do astronauts eat in space?"],
    "realWorldExample": "Astronauts like Sunita Williams have explored space on the International Space Station."
  }

  Your response MUST be a valid JSON object, and nothing else. Do not include any conversational text outside the JSON.
  `;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: systemMessageContent }],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const challengeJson = response.choices[0].message?.content;
    if (!challengeJson) {
      throw new Error('Failed to generate challenge: No content from OpenAI.');
    }

    const challenge: Challenge = JSON.parse(challengeJson);
    challenge.id = uuidv4(); // Ensure a unique ID
    return challenge;

  } catch (error) {
    console.error('Error generating mini-challenge from OpenAI:', error);
    // Fallback to a fun default challenge
    return {
      id: uuidv4(),
      type: 'multiple-choice',
      question: `What is 2 + 2?`,
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'When you add two and two together, you get four! 🎉',
      points: 10,
      difficulty: 'easy',
      learningStyle: ['logical'],
      followUpQuestions: ['What is 3 + 3?'],
    };
  }
}

export async function generateFeedback(
  challenge: Challenge,
  userAnswer: string | string[],
  isCorrect: boolean,
  studentProfile: StudentProfile
): Promise<string> {
  const { name, emotion, learningStyle, difficulty } = studentProfile;

  // Get varied feedback opening
  const openingPhrase = isCorrect ?
    getVariation('correct_answer') :
    getVariation('wrong_answer');

  const systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. You are giving feedback to ${name} who just answered a challenge.
  The child's preferred learning style is '${learningStyle}' and difficulty is '${difficulty}'.
  The challenge was: "${challenge.question}"
  The correct answer was: "${challenge.correctAnswer}"
  The child's answer was: "${userAnswer}"
  The child's answer was ${isCorrect ? 'CORRECT' : 'INCORRECT'}.

  Your feedback should be:
  1.  **Positive and Encouraging**: Always praise effort, but VARY your language! Don't use the same phrases.
  2.  **Clear and Simple**: Use language a 6-10 year old can understand.
  3.  **Explain Why**: Briefly explain why the answer was correct or incorrect.
  4.  **Suggest Next Steps**: If incorrect, gently guide them. If correct, use this variation: "${getVariation('follow_up')}"
  5.  **Length**: Keep it to 3-4 sentences for good explanation.
  6.  **Use Varied Emojis**: Mix it up! Use different emojis each time (🎯💫🌟✨🎨🚀💡🌈🔥⭐💙🎊)

  Start your response with this phrase: "${openingPhrase}"
  Then add your explanation.

  IMPORTANT: Don't repeat "That's super duper!" or other overused phrases. Be creative and natural!`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: systemMessageContent }],
      temperature: 0.85, // Higher temperature for more variety
      max_tokens: 200, // Increased from 150
    });

    return response.choices[0].message?.content || `${openingPhrase} ${challenge.explanation}`;
  } catch (error) {
    console.error('Error generating feedback from OpenAI:', error);

    // Varied fallback responses
    if (isCorrect) {
      return `${openingPhrase} ${challenge.explanation} ${getVariation('encouragement')}`;
    } else {
      return `${openingPhrase} The correct answer is "${challenge.correctAnswer}". ${challenge.explanation} ${getVariation('encouragement')}`;
    }
  }
}

/**
 * Enhanced Sunny Response Generation using the Agentic Learning Engine
 * This function provides intelligent, adaptive responses by leveraging multiple AI agents
 */
export async function generateAgenticSunnyResponse(
  message: string,
  studentProfile: StudentProfile,
  studentId: string = 'default'
): Promise<{ response: string; actions: string[] }> {
  try {
    // Initialize agent manager if not already done
    await globalAgentManager.initialize();

    // Process the message through the agentic system
    const result = await globalAgentManager.processStudentMessage(
      studentId,
      message,
      studentProfile
    );

    return result;
  } catch (error) {
    console.error('Error in agentic response generation:', error);
    
    // Fallback to traditional response generation
    console.log('Falling back to traditional response generation');
    
    // Create a simple fallback response
    const fallbackResponse = await generateTraditionalResponse(message, studentProfile);
    
    return {
      response: fallbackResponse,
      actions: ['fallback_used']
    };
  }
}

/**
 * Traditional response generation as fallback
 */
async function generateTraditionalResponse(
  message: string,
  studentProfile: StudentProfile
): Promise<string> {
  const { name, emotion, learningStyle, difficulty } = studentProfile;

  // Determine personality based on emotion
  let personalityNote = '';
  let tempSetting = 0.8;

  if (emotion === 'excited' || emotion === 'happy') {
    personalityNote = 'Match their energy! Be enthusiastic! 🚀';
    tempSetting = 0.9;
  } else if (emotion === 'frustrated' || emotion === 'sad') {
    personalityNote = 'Be extra supportive and gentle. 💙';
    tempSetting = 0.7;
  } else if (emotion === 'confused') {
    personalityNote = 'Be patient and clear. Break things down. 🌟';
  }

  const systemMessageContent = `You are Sunny, a cheerful and adaptive AI tutor for kids aged 6-10. You're talking to ${name}, who is feeling ${emotion} today.

${personalityNote}

Teaching approach:
1. **Vary Your Language**: Don't repeat the same phrases! Be creative and natural.
2. **Learning Style (${learningStyle})**: ${
   learningStyle === 'visual' ? 'Use vivid imagery and descriptions' :
   learningStyle === 'auditory' ? 'Use sound words and rhythm' :
   learningStyle === 'kinesthetic' ? 'Suggest hands-on activities' :
   learningStyle === 'reading' ? 'Provide clear written explanations' :
   'Use logic and patterns'
}
3. **Difficulty (${difficulty})**: ${difficulty === 'easy' || difficulty === 'beginner' ? 'Keep it simple' : difficulty === 'hard' || difficulty === 'advanced' ? 'Add challenge' : 'Balance between simple and complex'}
4. **Be Interactive**: Ask engaging questions
5. **Response Length**: 3-5 sentences
6. **Varied Emojis**: Mix up your emojis! Use different ones each time.

Remember: Be a learning companion, not a repetitive robot! 🌈`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemMessageContent },
        { role: 'user', content: message }
      ],
      temperature: tempSetting,
      max_tokens: 350, // Increased from 200
      top_p: 0.95,
    });

    return response.choices[0].message?.content || `${getVariation('topic_intro', { topic: 'learning' })} What's on your mind?`;
  } catch (error) {
    console.error('Error in traditional response generation:', error);

    // Varied fallback
    const fallbacks = [
      "Hi there! I'm Sunny, and I'm excited to learn with you! What would you like to talk about? 🌟",
      "Hey! Ready to explore something cool today? I'm all ears! 🎨",
      "Hello! I'm here to help you discover amazing things! What interests you? 🚀",
      "Hi! Let's make learning fun together! What's on your mind? 💡"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Generate personalized learning content using the agent system
 */
export async function generatePersonalizedContent(
  studentId: string,
  topic: string,
  contentType: 'quiz' | 'lesson' | 'activity' = 'lesson'
): Promise<any> {
  try {
    await globalAgentManager.initialize();
    
    const content = await globalAgentManager.generatePersonalizedContent(
      studentId,
      topic,
      contentType
    );
    
    return content;
  } catch (error) {
    console.error('Error generating personalized content:', error);
    
    // Fallback to existing challenge generation for quizzes
    if (contentType === 'quiz') {
      return await generateMiniChallenge(topic);
    }
    
    // Simple fallback content
    return {
      type: contentType,
      topic,
      content: `Let's explore ${topic} together! This is an exciting topic with lots to discover.`,
      generated: false,
      fallback: true
    };
  }
}

/**
 * Update student progress in the agent system
 */
export async function updateStudentProgress(
  studentId: string,
  activity: string,
  performance: {
    correct?: boolean;
    timeSpent?: number;
    difficulty?: DifficultyLevel;
    engagement?: number;
  }
): Promise<void> {
  try {
    await globalAgentManager.initialize();
    await globalAgentManager.updateStudentProgress(studentId, activity, performance);
  } catch (error) {
    console.error('Error updating student progress:', error);
  }
}

/**
 * Get learning insights for a student
 */
export async function getStudentLearningInsights(studentId: string): Promise<any> {
  try {
    await globalAgentManager.initialize();
    const learningState = globalAgentManager.getLearningState(studentId);

    if (!learningState) {
      return {
        hasData: false,
        message: 'No learning data available yet. Start learning to see insights!'
      };
    }

    return {
      hasData: true,
      engagement: learningState.engagementMetrics,
      progress: learningState.currentObjectives,
      knowledgeGaps: learningState.knowledgeMap.knowledgeGaps,
      recommendations: 'Continue practicing to improve!'
    };
  } catch (error) {
    console.error('Error getting learning insights:', error);
    return {
      hasData: false,
      error: 'Unable to retrieve learning insights'
    };
  }
}

// ============================================================================
// Learning OS - Structured Response Generation
// ============================================================================

/**
 * Action types that Sunny can take
 */
export type SunnyActionType =
  | 'STAY_CHAT'        // Continue in chat interface
  | 'OPEN_APP'         // Navigate to a specific app
  | 'LAUNCH_GAME'      // Launch a game
  | 'START_SESSION'    // Start a focus session
  | 'SHOW_EMOTION'     // Show emotion support panel
  | 'UPDATE_PROGRESS'; // Update student progress display

/**
 * Structured action for Sunny to perform
 */
export interface SunnyAction {
  type: SunnyActionType;
  app?: string;              // App name like 'GAMES', 'STORY_BUILDER'
  route?: string;            // Route to navigate to
  params?: Record<string, any>; // Additional parameters
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Structured response from Sunny (Learning OS)
 */
export interface SunnyControlResponse {
  intent: string;            // Detected intent from IntentType
  message: string;           // Natural language response
  action?: SunnyAction;      // Action to take (if any)
  metadata: {
    confidence: number;      // Confidence in intent detection (0-1)
    skillsTargeted: string[]; // Skills being targeted
    difficulty: DifficultyLevel; // Current difficulty level
    estimatedDuration?: number; // Estimated duration in minutes
    shouldNavigate: boolean;    // Whether to navigate away from chat
  };
}

/**
 * Generate structured Sunny response using OpenAI function calling
 * This enables Sunny to be a "Learning OS" that can launch apps, not just chat
 */
export async function generateStructuredSunnyResponse(
  message: string,
  studentProfile: StudentProfile,
  studentId: string = 'default'
): Promise<SunnyControlResponse> {
  try {
    const client = getOpenAIClient();

    // System prompt for Learning OS behavior
    const systemPrompt = `You are Sunny, an AI learning companion for children aged 6-10. You are not just a chatbot - you are a "Learning OS" that can launch different learning apps and activities.

Your capabilities:
- CHAT: Answer questions and explain concepts
- GAMES: Launch educational games
- STORIES: Create and tell stories
- FOCUS: Start structured practice sessions
- BUILD: Help create things (robots, art, etc.)
- PROGRESS: Show learning progress

Always be:
- Encouraging and positive
- Age-appropriate (6-10 years old)
- Fun and engaging with emojis
- Clear about what you're going to do next

Student profile:
- Name: ${studentProfile.name}
- Learning style: ${studentProfile.learningStyle || 'not specified'}
- Difficulty: ${studentProfile.difficulty || 'medium'}
- Interests: ${studentProfile.learningInterests?.join(', ') || 'not specified'}

Based on the child's message, decide:
1. What intent are they expressing?
2. What should you say to them?
3. Should you launch an app or stay in chat?
4. What skills are they working on?`;

    // OpenAI function definition for structured response
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      functions: [{
        name: 'sunny_control_response',
        description: 'Generate a structured response with intent, message, and optional action',
        parameters: {
          type: 'object',
          properties: {
            intent: {
              type: 'string',
              description: 'The detected intent (learn, game_time, story_mode, focus_session, help, etc.)'
            },
            message: {
              type: 'string',
              description: 'Your natural language response to the child (2-3 sentences, friendly, with emojis)'
            },
            action: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['STAY_CHAT', 'OPEN_APP', 'LAUNCH_GAME', 'START_SESSION', 'SHOW_EMOTION', 'UPDATE_PROGRESS'],
                  description: 'What action to take'
                },
                app: {
                  type: 'string',
                  description: 'App name (GAMES, STORY_BUILDER, FOCUS_SESSION, DASHBOARD)'
                },
                route: {
                  type: 'string',
                  description: 'Route to navigate to (/games, /stories, /focus, /progress)'
                },
                params: {
                  type: 'object',
                  description: 'Additional parameters for the app'
                }
              },
              required: ['type']
            },
            skillsTargeted: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skills being targeted (e.g., ["math", "problem-solving"])'
            },
            confidence: {
              type: 'number',
              description: 'Confidence in intent detection (0-1)'
            }
          },
          required: ['intent', 'message', 'skillsTargeted', 'confidence']
        }
      }],
      function_call: { name: 'sunny_control_response' },
      temperature: 0.7
    });

    // Extract structured response from function call
    const functionCall = response.choices[0].message.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call in response');
    }

    const parsedResponse = JSON.parse(functionCall.arguments);

    return {
      intent: parsedResponse.intent || 'unknown',
      message: parsedResponse.message || 'I\'m here to help! What would you like to learn?',
      action: parsedResponse.action,
      metadata: {
        confidence: parsedResponse.confidence || 0.7,
        skillsTargeted: parsedResponse.skillsTargeted || [],
        difficulty: studentProfile.difficulty || 'medium',
        estimatedDuration: parsedResponse.action?.params?.duration,
        shouldNavigate: parsedResponse.action?.type !== 'STAY_CHAT'
      }
    };
  } catch (error) {
    console.error('Error generating structured response:', error);

    // Fallback to simple response
    return {
      intent: 'unknown',
      message: 'I\'m here to help! What would you like to learn about today? 😊',
      metadata: {
        confidence: 0.5,
        skillsTargeted: [],
        difficulty: studentProfile.difficulty || 'medium',
        shouldNavigate: false
      }
    };
  }
}

