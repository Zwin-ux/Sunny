import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lesson, LearningProgress, StudentProgress } from '../types/lesson';
import LessonRepository from '../lib/lessons/LessonRepository';

type LearningSessionContextType = {
  // Current lesson state
  currentLesson: Lesson | null;
  setCurrentLesson: (lesson: Lesson | null) => void;
  
  // Progress tracking
  progress: StudentProgress;
  startLesson: (lessonId: string) => void;
  completeLesson: (score?: number) => void;
  updateProgress: (contentId: string, isCompleted: boolean, answer?: any) => void;
  
  // Navigation
  currentContentIndex: number;
  goToNextContent: () => void;
  goToPreviousContent: () => void;
  goToContent: (contentId: string) => void;
  
  // Session management
  isLessonInProgress: boolean;
  startNewSession: () => void;
  endSession: () => void;
  
  // Learning preferences
  preferences: {
    enableAudio: boolean;
    setEnableAudio: (enabled: boolean) => void;
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    setPreferredDifficulty: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  };
};

const defaultProgress: StudentProgress = {
  studentId: 'anonymous',
  lessons: {},
  totalPoints: 0,
  level: 1,
  achievements: [],
  lastActive: new Date().toISOString(),
  learningPreferences: {
    preferredContentType: ['text', 'video'],
    difficultyPreference: 'beginner',
    enableAudio: true,
  },
};

const LearningSessionContext = createContext<LearningSessionContextType | undefined>(undefined);

export const LearningSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState<number>(0);
  const [progress, setProgress] = useState<StudentProgress>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learningProgress');
      return saved ? JSON.parse(saved) : { ...defaultProgress };
    }
    return { ...defaultProgress };
  });
  
  const [preferences, setPreferences] = useState({
    enableAudio: true,
    preferredDifficulty: 'beginner' as const,
  });

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learningProgress', JSON.stringify(progress));
    }
  }, [progress]);

  const startLesson = (lessonId: string) => {
    const lesson = LessonRepository.getLesson(lessonId);
    if (!lesson) return;

    setCurrentLesson(lesson);
    setCurrentContentIndex(0);
    
    // Initialize progress for this lesson if it doesn't exist
    if (!progress.lessons[lessonId]) {
      setProgress(prev => ({
        ...prev,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            lessonId,
            completed: false,
            timeSpent: 0,
            lastAccessed: new Date().toISOString(),
            answers: {},
          },
        },
      }));
    }
  };

  const completeLesson = (score?: number) => {
    if (!currentLesson) return;

    setProgress(prev => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [currentLesson.id]: {
          ...prev.lessons[currentLesson.id],
          completed: true,
          completedAt: new Date().toISOString(),
          score,
        },
      },
      totalPoints: prev.totalPoints + (score || 0),
    }));
  };

  const updateProgress = (contentId: string, isCompleted: boolean, answer?: any) => {
    if (!currentLesson) return;

    setProgress(prev => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [currentLesson.id]: {
          ...prev.lessons[currentLesson.id],
          answers: {
            ...(prev.lessons[currentLesson.id]?.answers || {}),
            [contentId]: {
              answer,
              isCorrect: isCompleted,
              submittedAt: new Date().toISOString(),
            },
          },
        },
      },
    }));
  };

  const goToNextContent = () => {
    if (!currentLesson) return;
    if (currentContentIndex < currentLesson.content.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
    }
  };

  const goToPreviousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1);
    }
  };

  const goToContent = (contentId: string) => {
    if (!currentLesson) return;
    const index = currentLesson.content.findIndex(item => item.id === contentId);
    if (index !== -1) {
      setCurrentContentIndex(index);
    }
  };

  const startNewSession = () => {
    setProgress(prev => ({
      ...prev,
      lastActive: new Date().toISOString(),
    }));
  };

  const endSession = () => {
    // Save any final progress before ending the session
    setProgress(prev => ({
      ...prev,
      lastActive: new Date().toISOString(),
    }));
    setCurrentLesson(null);
    setCurrentContentIndex(0);
  };

  const setEnableAudio = (enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      enableAudio: enabled,
    }));
  };

  const setPreferredDifficulty = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setPreferences(prev => ({
      ...prev,
      preferredDifficulty: level,
    }));
  };

  const value = {
    currentLesson,
    setCurrentLesson,
    progress,
    startLesson,
    completeLesson,
    updateProgress,
    currentContentIndex,
    goToNextContent,
    goToPreviousContent,
    goToContent,
    isLessonInProgress: !!currentLesson,
    startNewSession,
    endSession,
    preferences: {
      ...preferences,
      setEnableAudio,
      setPreferredDifficulty,
    },
  };

  return (
    <LearningSessionContext.Provider value={value}>
      {children}
    </LearningSessionContext.Provider>
  );
};

export const useLearningSession = (): LearningSessionContextType => {
  const context = useContext(LearningSessionContext);
  if (context === undefined) {
    throw new Error('useLearningSession must be used within a LearningSessionProvider');
  }
  return context;
};
