import { LearningStyle, DifficultyLevel, Challenge } from './chat';

// Format for Markdown content metadata
export interface MarkdownContent {
  source: string;       // Path to the markdown file or raw markdown content
  isPath?: boolean;     // If true, source is a path to a file; if false, source is raw markdown
  frontmatter?: {       // Optional metadata extracted from markdown frontmatter
    [key: string]: any;
  };
}

export interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  altText?: string;
  caption?: string;
}

export interface QuizQuestion {
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

export enum ContentType {
  Text = 'text',
  Image = 'image',
  Video = 'video',
  Quiz = 'quiz',
  Challenge = 'challenge',
  Interactive = 'interactive'
}

export interface LessonContent {
  id: string;
  type: ContentType;
  title: string;
  content: string | QuizQuestion | MediaContent | MarkdownContent | Challenge;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  prerequisites?: string[];
  relatedLessons?: string[];
  media?: MediaContent[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  topics: string[];
  content: LessonContent[];
  difficulty: DifficultyLevel;
  targetAgeRange: {
    min: number;
    max: number;
  };
  learningObjectives: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningProgress {
  lessonId: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
  timeSpent: number; // in seconds
  lastAccessed: string;
  answers?: {
    [questionId: string]: {
      answer: string | string[];
      isCorrect: boolean;
      submittedAt: string;
    };
  };
}

export interface StudentProgress {
  studentId: string;
  lessons: {
    [lessonId: string]: LearningProgress;
  };
  totalPoints: number;
  level: number;
  achievements: string[];
  lastActive: string;
  learningPreferences: {
    preferredContentType: ContentType[];
    difficultyPreference: DifficultyLevel;
    enableAudio: boolean;
  };
}

export { ContentType };
