'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LearningSession {
  id: string;
  title: string;
  content: any[];
  currentIndex: number;
  completed: boolean;
}

interface LearningSessionContextType {
  currentLesson: LearningSession | null;
  currentContentIndex: number;
  isLessonInProgress: boolean;
  startLesson: (lesson: LearningSession) => void;
  goToNextContent: () => void;
  goToPreviousContent: () => void;
  completeLesson: () => void;
  exitLesson: () => void;
}

const LearningSessionContext = createContext<LearningSessionContextType | undefined>(undefined);

export function LearningSessionProvider({ children }: { children: ReactNode }) {
  const [currentLesson, setCurrentLesson] = useState<LearningSession | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);

  const isLessonInProgress = currentLesson !== null;

  const startLesson = (lesson: LearningSession) => {
    setCurrentLesson(lesson);
    setCurrentContentIndex(0);
  };

  const goToNextContent = () => {
    if (currentLesson && currentContentIndex < currentLesson.content.length - 1) {
      setCurrentContentIndex(prev => prev + 1);
    }
  };

  const goToPreviousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1);
    }
  };

  const completeLesson = () => {
    if (currentLesson) {
      setCurrentLesson({ ...currentLesson, completed: true });
    }
  };

  const exitLesson = () => {
    setCurrentLesson(null);
    setCurrentContentIndex(0);
  };

  return (
    <LearningSessionContext.Provider value={{
      currentLesson,
      currentContentIndex,
      isLessonInProgress,
      startLesson,
      goToNextContent,
      goToPreviousContent,
      completeLesson,
      exitLesson
    }}>
      {children}
    </LearningSessionContext.Provider>
  );
}

export function useLearningSession() {
  const context = useContext(LearningSessionContext);
  if (context === undefined) {
    throw new Error('useLearningSession must be used within a LearningSessionProvider');
  }
  return context;
}