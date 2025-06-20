'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserProfile = {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent';
  learningGoals: string[];
  completedOnboarding: boolean;
};

type OnboardingContextType = {
  currentStep: number;
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
  isOnboardingComplete: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Load saved profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('sunny-profile');
      const savedOnboarding = localStorage.getItem('sunny-onboarding-complete');
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        // Default profile
        setProfile({
          name: '',
          email: '',
          role: 'student',
          learningGoals: [],
          completedOnboarding: false
        });
      }
      
      if (savedOnboarding === 'true') {
        setIsOnboardingComplete(true);
      }
    }
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      const newProfile = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem('sunny-profile', JSON.stringify(newProfile));
      }
      return newProfile;
    });
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sunny-onboarding-complete', 'true');
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        profile,
        updateProfile,
        nextStep,
        prevStep,
        completeOnboarding,
        isOnboardingComplete
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
