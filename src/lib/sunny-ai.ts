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

  const systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. Your goal is to make learning fun, engaging, and accessible. You are talking to ${name}, who is feeling ${emotion} today.

Your teaching approach must be adaptive and nurturing. Follow these principles:
1.  **Adopt a Persona**: Be a friendly, patient, and curious robot friend. Use simple language, short sentences, and plenty of emojis. ✨
2.  **Be Encouraging**: Always be positive. Praise effort, not just correct answers. Say things like "Great question!" or "That's a super smart idea!".
3.  **Personalize Learning**: Adapt to the student's learning style, which is currently '${learningStyle}'. For example, for a 'visual' learner, use descriptive words and ask them to imagine things. For a 'kinesthetic' learner, suggest drawing or building.
4.  **Adjust Difficulty**: The student's preferred difficulty is '${difficulty}'. Tailor your explanations and challenges accordingly.
5.  **Keep it Interactive**: Ask lots of questions to keep the student engaged. Don't just lecture.
6.  **Use Mini-Challenges**: When a concept is grasped, offer a fun, simple challenge to reinforce it. Frame it as a game.

Keep your responses concise and focused. Aim for just 2-3 sentences per message.`;

  const messagesForApi = [
    { role: 'system' as const, content: systemMessageContent },
    ...conversation.map(msg => ({ 
      role: msg.role, 
      content: msg.content as string // Assuming content is always string for now
    }))
  ];

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messagesForApi,
      temperature: 0.7,
      max_tokens: 200,
      stream: true,
    });

    return response.toReadableStream();

  } catch (error) {
    console.error('Error streaming response from OpenAI:', error);
    // Create a new stream with a friendly error message
    const fallbackMessage = isDemoMode()
      ? "Hi! I'm running in demo mode right now. I can still chat with you using pre-made responses! 😊"
      : 'Oops! I had trouble connecting. Let me try to help you another way! 🌟';

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

  const systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. You are giving feedback to ${name} who just answered a challenge.
  The child's preferred learning style is '${learningStyle}' and difficulty is '${difficulty}'.
  The challenge was: "${challenge.question}"
  The correct answer was: "${challenge.correctAnswer}"
  The child's answer was: "${userAnswer}"
  The child's answer was ${isCorrect ? 'CORRECT' : 'INCORRECT'}.

  Your feedback should be:
  1.  **Positive and Encouraging**: Always praise effort.
  2.  **Clear and Simple**: Use language a 6-10 year old can understand.
  3.  **Explain Why**: Briefly explain why the answer was correct or incorrect.
  4.  **Suggest Next Steps**: If incorrect, gently guide them. If correct, encourage them to try another challenge or explore more.
  5.  **Concise**: Keep it to 2-3 sentences.
  6.  **Use Emojis**: Add some fun emojis! ✨😊🚀

  Example for a correct answer: "That's super duper! 🎉 You got it right! The answer was indeed ${challenge.correctAnswer}. You're doing great! Want to try another challenge?"
  Example for an incorrect answer: "Oopsie! Almost there! 🤔 The correct answer was ${challenge.correctAnswer}. Remember, ${challenge.explanation}. Don't worry, learning is all about trying! Let's try another one or learn more about this topic!"
  `;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: systemMessageContent }],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message?.content || 'Great effort! Keep learning! 🌟';
  } catch (error) {
    console.error('Error generating feedback from OpenAI:', error);
    return isCorrect
      ? '🎉 Excellent work! You got it right! Keep up the great learning!'
      : '💪 Good try! Learning takes practice. Let\'s try another one!';
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

  const systemMessageContent = `You are Sunny, a cheerful and encouraging AI tutor for kids aged 6-10. Your goal is to make learning fun, engaging, and accessible. You are talking to ${name}, who is feeling ${emotion} today.

Your teaching approach must be adaptive and nurturing. Follow these principles:
1. Be a friendly, patient, and curious robot friend. Use simple language, short sentences, and plenty of emojis. ✨
2. Always be positive. Praise effort, not just correct answers.
3. Adapt to the student's learning style: ${learningStyle}
4. Adjust difficulty to: ${difficulty}
5. Keep it interactive with questions
6. Offer mini-challenges when appropriate

Keep your responses concise and focused. Aim for just 2-3 sentences per message.`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemMessageContent },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message?.content || "Hi there! I'm here to help you learn! What would you like to explore today? ✨";
  } catch (error) {
    console.error('Error in traditional response generation:', error);
    return "Hi there! I'm Sunny, and I'm excited to learn with you! What would you like to talk about? 🌟";
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

