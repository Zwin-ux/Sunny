export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  learningStyle?: import('./chat').LearningStyle;
  progress: Record<string, number>; // lessonId -> completion percentage
  chatHistory: import('./chat').SunnyChatMessage[];
}
