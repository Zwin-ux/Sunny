// Removed circular dependency - these types are not actually used in this file

// Define MessageType separately to avoid circular dependencies
export type MessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'challenge'
  | 'feedback'
  | 'flashcards';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'logical';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';

export type Flashcard = {
  front: string;
  back: string;
};

export type MessageContent =
  | string
  | Challenge
  | FeedbackContent
  | Flashcard[];

export interface BaseMessage {
  id: string;
  type: MessageType;
  content: MessageContent;
  timestamp: number;
  isLoading?: boolean;
  name: string;
  role?: 'user' | 'assistant' | 'system';
}

export interface UserMessage extends Omit<BaseMessage, 'type'> {
  type: 'user';
  role: 'user';
  content: string;
}

export type Emotion = 'happy' | 'neutral' | 'confused' | 'encouraging' | 'curious';

export interface AssistantMessage extends Omit<BaseMessage, 'type' | 'content'> {
  type: 'assistant' | 'system';
  role: 'assistant' | 'system';
  content: string;
  metadata?: {
    teachingStrategy?: string;
    learningStyle?: LearningStyle;
    knowledgeLevel?: DifficultyLevel;
    topics?: string[];
    knowledgeGaps?: string[];
    emotion?: Emotion; // New field for AI's emotional state
  };
}



export interface ChallengeMessage extends Omit<BaseMessage, 'type' | 'content'> {
  type: 'challenge';
  role: 'assistant';
  content: Challenge;
}

export interface FeedbackContent {
  isCorrect: boolean;
  message: string;
  explanation: string;
  nextSteps: string[];
}

export interface FeedbackMessage extends Omit<BaseMessage, 'type' | 'content'> {
  type: 'feedback';
  role: 'assistant';
  content: FeedbackContent;
}

export interface FlashcardMessage extends Omit<BaseMessage, 'type' | 'content'> {
  type: 'flashcards';
  role: 'assistant';
  content: Flashcard[];
}

export type Message =
  | UserMessage
  | AssistantMessage
  | ChallengeMessage
  | FeedbackMessage
  | FlashcardMessage;

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  name: string;
  timestamp: number;
  type: MessageType;
  isLoading?: boolean;
}

export interface ChatMessageProps {
  className?: string;
};

export interface ChatContextType {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearMessages: () => void;
  currentTopic?: string;
  learningObjectives?: string[];
  teachingStrategy?: string;
  preferredLearningStyle?: LearningStyle;
  knowledgeLevel?: DifficultyLevel;
}

export type SunnyChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name: string;
  timestamp: number;
  type?: MessageType;
};

export interface TeachingStrategy {
  name: string;
  description: string;
  bestFor: string[];
  techniques: string[];
}

export interface CompletedLesson {
  id: string;
  title: string;
  completedAt: string;
  score?: number;
}

export interface StudentProfile {
  name: string;
  level: number;
  points: number;
  completedLessons: CompletedLesson[];
  emotion?: string;
  learningStyle?: LearningStyle;
  difficulty?: DifficultyLevel;
  preferredLearningStyle?: LearningStyle;
  knownConcepts?: string[];
  knowledgeGaps?: string[];
  conversationHistory?: SunnyChatMessage[];
  lastChallenge?: {
    type: string;
    topic: string;
    timestamp: number;
    wasSuccessful: boolean;
  };
}

export interface Challenge {
  id: string;
  type: 'multiple-choice' | 'pattern' | 'open-ended' | 'matching' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty?: DifficultyLevel;
  learningStyle?: LearningStyle[];
  followUpQuestions?: string[];
  realWorldExample?: string;
}
