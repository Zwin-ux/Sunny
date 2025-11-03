export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  progress: Record<string, any>;
  chatHistory: any[];
  learningInterests: string[];
  quizProgress: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}