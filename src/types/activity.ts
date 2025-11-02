export type ActivityType = 'quiz' | 'story' | 'puzzle';

export interface ActivityStep {
  prompt: string;
  choices?: string[];
  correctAnswer?: string;
  hint?: string;
}

export interface ActivityPayload {
  type: ActivityType;
  topic: string;
  goal: string;
  steps: ActivityStep[];
}
