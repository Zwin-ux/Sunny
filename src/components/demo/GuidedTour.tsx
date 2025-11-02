'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  autoStart?: boolean;
}

export function GuidedTour({ steps, onComplete, onSkip, autoStart = true }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (isActive && step?.targetElement) {
      const element = document.querySelector(step.targetElement);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isActive, step]);

  const handleNext = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (isLastStep) {
      setIsActive(false);
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip();
  };

  if (!isActive || !step) return null;

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[9998]"
          onClick={handleSkip}
        />
      </AnimatePresence>

      {/* Highlight Spotlight */}
      {step.highlight && step.targetElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
          }}
        />
      )}

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed z-[10000] ${getPositionClasses(step.position)}`}
        >
          <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-purple-600">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index <= currentStep ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6 leading-relaxed">{step.description}</p>

            {/* Action Button (if provided) */}
            {step.action && (
              <div className="mb-6">
                <Button
                  onClick={step.action.onClick}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {step.action.label}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={isFirstStep}
                variant="outline"
                className="border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <button
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
              >
                Skip Tour
              </button>

              <Button
                onClick={handleNext}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Pointer Arrow */}
          {step.position !== 'center' && (
            <div className={`absolute ${getArrowClasses(step.position)}`}>
              <div className="w-0 h-0 border-8 border-transparent border-t-black" />
              <div className="w-0 h-0 border-8 border-transparent border-t-white absolute top-[-2px] left-[-8px]" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function getPositionClasses(position: TourStep['position']): string {
  switch (position) {
    case 'top':
      return 'top-24 left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'bottom-24 left-1/2 -translate-x-1/2';
    case 'left':
      return 'left-8 top-1/2 -translate-y-1/2';
    case 'right':
      return 'right-8 top-1/2 -translate-y-1/2';
    case 'center':
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}

function getArrowClasses(position: TourStep['position']): string {
  switch (position) {
    case 'top':
      return 'bottom-[-16px] left-1/2 -translate-x-1/2 rotate-180';
    case 'bottom':
      return 'top-[-16px] left-1/2 -translate-x-1/2';
    case 'left':
      return 'right-[-16px] top-1/2 -translate-y-1/2 rotate-90';
    case 'right':
      return 'left-[-16px] top-1/2 -translate-y-1/2 -rotate-90';
    default:
      return 'hidden';
  }
}

// Pre-defined tour configurations
export const DEMO_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sunny! ☀️',
    description:
      "I'm your AI learning companion! I adapt to how YOU learn best. Let me show you around in just 2 minutes.",
    position: 'center',
  },
  {
    id: 'adaptive',
    title: 'Real-Time Adaptation',
    description:
      'Watch how I adjust difficulty based on your answers. If you get something right, I make it harder. If you struggle, I slow down and explain more.',
    position: 'top',
    targetElement: '#demo-question',
  },
  {
    id: 'voice',
    title: 'Hear Me Speak! 🎙️',
    description:
      'Click the speaker icon to hear my voice. I can read questions aloud and give encouraging feedback!',
    position: 'right',
    targetElement: '#voice-button',
  },
  {
    id: 'emotion',
    title: 'Tell Me How You Feel',
    description:
      "Your emotions matter! Let me know if you're excited, focused, struggling, or confident. I'll adjust my teaching style to match.",
    position: 'bottom',
    targetElement: '#emotion-selector',
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description:
      'See your XP, streak, and mastery levels grow in real-time. Every question helps me understand you better!',
    position: 'left',
    targetElement: '#progress-display',
  },
  {
    id: 'learning-os',
    title: 'Your Learning OS',
    description:
      'After the demo, you will unlock the full Learning OS with 8 learning apps, games, missions, and personalized insights!',
    position: 'center',
  },
  {
    id: 'start',
    title: 'Ready to Begin?',
    description:
      "Let's start with a quick check to see what you know. Don't worry—there are no wrong answers, only learning opportunities!",
    position: 'center',
    action: {
      label: 'Start Demo →',
      onClick: () => {
        // This will be handled by the parent component
        console.log('Starting demo...');
      },
    },
  },
];

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome-dashboard',
    title: 'Welcome to Your Dashboard! 🎉',
    description:
      'This is your learning home base. Everything you need is right here!',
    position: 'center',
  },
  {
    id: 'stats',
    title: 'Your Stats',
    description:
      'Track your streak, XP, missions completed, and topics mastered. Watch these numbers grow!',
    position: 'top',
    targetElement: '#stats-cards',
  },
  {
    id: 'apps',
    title: 'Learning Apps',
    description:
      'Unlock 8 different learning apps as you earn XP. Each app teaches different skills in fun ways!',
    position: 'center',
    targetElement: '#apps-launcher',
  },
  {
    id: 'quick-start',
    title: 'Quick Actions',
    description:
      'Jump right into chatting with me or try the demo again anytime!',
    position: 'left',
    targetElement: '#quick-start',
  },
  {
    id: 'activity',
    title: 'Recent Activity',
    description:
      'See what you have accomplished recently and get personalized encouragement!',
    position: 'right',
    targetElement: '#recent-activity',
  },
];
