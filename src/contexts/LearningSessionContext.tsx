import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Lesson, LearningProgress, StudentProgress, ContentType } from '../types/lesson';
import LessonRepository from '../lib/lessons/LessonRepository';

type LearningSessionContextType = {
  currentLesson: Lesson | null;
  progress: StudentProgress;
  isLoading: boolean;
  error: string | null;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  updateProgress: (contentId: string, completed: boolean, quizScore?: number) => void;
  setEnableAudio: (enabled: boolean) => void;
  enableAudio: boolean;
  setPreferredContentTypes: (contentTypes: ContentType[]) => void;
  preferredContentTypes: ContentType[];
  setDifficultyPreference: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  saveProgressToLocalStorage: (progress: StudentProgress) => void;
  currentContentIndex: number;
  isLessonInProgress: boolean;
  goToNextContent: () => void;
  goToPreviousContent: () => void;
  goToContent: (contentId: string) => void;
};

interface LearningPreferences {
  enableAudio: boolean;
  preferredContentTypes: ContentType[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
}

const defaultProgress: StudentProgress = {
  studentId: 'anonymous',
  lessons: {},
  totalPoints: 0,
  level: 1,
  achievements: [],
  lastActive: new Date().toISOString(),
  learningPreferences: {
    preferredContentType: [ContentType.Text, ContentType.Video],
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
  
  const [learningPreferences, setLearningPreferences] = useState<LearningPreferences>({
    enableAudio: true,
    preferredContentTypes: [ContentType.Text, ContentType.Video],
    difficultyPreference: 'beginner',
  });

  const progressRef = useRef(progress);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learningProgress', JSON.stringify(progress));
    }
    progressRef.current = progress;
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

  const completeLesson = () => {
    if (!currentLesson) return;

    setProgress(prev => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [currentLesson.id]: {
          ...prev.lessons[currentLesson.id],
          completed: true,
          completedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const updateProgress = (contentId: string, completed: boolean, quizScore?: number) => {
    if (!currentLesson) return;

    setProgress(prev => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [currentLesson.id]: {
          ...(prev.lessons[currentLesson.id] || {
            lessonId: currentLesson.id,
            completed: false,
            progress: 0,
            answers: {},
            startedAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            timeSpent: 0
          }),
          answers: {
            ...(prev.lessons[currentLesson.id]?.answers || {}),
            [contentId]: {
              answer: Array.isArray(quizScore) ? quizScore.map(String) : (quizScore !== undefined ? quizScore.toString() : ''),
              isCorrect: completed,
              submittedAt: new Date().toISOString(),
            },
          },
          progress: calculateLessonProgress(currentLesson, {
            ...(prev.lessons[currentLesson.id]?.answers || {}),
            [contentId]: { answer: Array.isArray(quizScore) ? quizScore.map(String) : (quizScore !== undefined ? quizScore.toString() : ''), isCorrect: completed, submittedAt: new Date().toISOString() },
          }),
          lastAccessed: new Date().toISOString(),
        },
      },
      lastActive: new Date().toISOString(),
      learningPreferences: {
        enableAudio: learningPreferences.enableAudio,
        preferredContentType: learningPreferences.preferredContentTypes,
        difficultyPreference: learningPreferences.difficultyPreference,
      },
    }));
  };

  const calculateLessonProgress = (lesson: Lesson, answers: Record<string, { answer: string | string[]; isCorrect: boolean; submittedAt: string }>): number => {
    const totalContent = lesson.content.length;
    const completedContent = Object.values(answers).filter(answer => answer.isCorrect).length;
    return totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
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
    setLearningPreferences(prev => ({ ...prev, enableAudio: enabled }));
  };

  const setDifficultyPreference = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    setLearningPreferences(prev => ({ ...prev, difficultyPreference: difficulty }));
    if (progressRef.current && progressRef.current.learningPreferences) {
      progressRef.current.learningPreferences.difficultyPreference = difficulty;
      saveProgressToLocalStorage(progressRef.current);
    }
  };

  const setPreferredContentTypes = (contentTypes: ContentType[]) => {
    setLearningPreferences(prev => ({ ...prev, preferredContentTypes: contentTypes }));
    if (progressRef.current && progressRef.current.learningPreferences) {
      progressRef.current.learningPreferences.preferredContentType = contentTypes;
      saveProgressToLocalStorage(progressRef.current);
    }
  };

  const saveProgressToLocalStorage = (progress: StudentProgress) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learningProgress', JSON.stringify(progress));
    }
  };

  const value = {
    currentLesson,
    progress,
    isLoading: false,
    error: null,
    startLesson,
    completeLesson,
    updateProgress,
    setEnableAudio,
    enableAudio: learningPreferences.enableAudio,
    setPreferredContentTypes,
    preferredContentTypes: learningPreferences.preferredContentTypes,
    setDifficultyPreference,
    difficultyPreference: learningPreferences.difficultyPreference,
    saveProgressToLocalStorage,
    currentContentIndex,
    isLessonInProgress: currentLesson !== null,
    goToNextContent,
    goToPreviousContent,
    goToContent,
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
