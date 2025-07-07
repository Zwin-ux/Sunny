export type MessageRole = 'user' | 'assistant' | 'system';

export interface BaseMessage {
  id: string;
  timestamp: number;
  type: string;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string;
  name?: string;
  type: 'text';
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string;
  name?: string;
  type: 'text';
}

export interface ChallengeMessage extends BaseMessage {
  role: 'assistant';
  content: string;
  name?: string;
  type: 'challenge';
}

export interface FeedbackMessage extends BaseMessage {
  role: 'assistant';
  content: string;
  name: string;
  type: 'feedback';
}

export type Message = UserMessage | AssistantMessage | ChallengeMessage | FeedbackMessage;

export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
}
