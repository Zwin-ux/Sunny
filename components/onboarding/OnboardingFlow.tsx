'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const LEARNING_GOALS = [
  'Improve math skills',
  'Learn to code',
  'Science concepts',
  'Language learning',
  'Test preparation',
  'Homework help'
];

export function OnboardingFlow() {
  const {
    currentStep,
    profile,
    updateProfile,
    nextStep,
    prevStep,
    completeOnboarding,
    isOnboardingComplete
  } = useOnboarding();

  const toggleGoal = (goal: string) => {
    if (!profile) return;
    
    const updatedGoals = profile.learningGoals.includes(goal)
      ? profile.learningGoals.filter(g => g !== goal)
      : [...profile.learningGoals, goal];
    
    updateProfile({ learningGoals: updatedGoals });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      nextStep();
    } else {
      completeOnboarding();
    }
  };

  const steps = [
    {
      title: 'Welcome to Sunny!',
      description: 'Let\'s get to know you better to personalize your learning experience.',
      component: (
        <div className="space-y-4">
          <p>Sunny is your AI learning assistant that adapts to your unique learning style.</p>
          <p>This quick setup will help us create the best experience for you.</p>
        </div>
      )
    },
    {
      title: 'Tell us about yourself',
      description: 'We\'ll use this to personalize your experience.',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={profile?.name || ''}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Alex Johnson"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="alex@example.com"
              className="mt-1"
            />
          </div>
        </div>
      )
    },
    {
      title: 'What are your learning goals?',
      description: 'Select all that apply',
      component: (
        <div className="space-y-3">
          {LEARNING_GOALS.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal}`}
                checked={profile?.learningGoals.includes(goal) || false}
                onCheckedChange={() => toggleGoal(goal)}
              />
              <Label htmlFor={`goal-${goal}`} className="font-normal">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'You\'re all set!',
      description: 'Ready to start learning?',
      component: (
        <div className="space-y-4">
          <p>Great job, {profile?.name || 'there'}! 🎉</p>
          <p>You can always update your preferences in your profile settings.</p>
        </div>
      )
    }
  ];

  if (isOnboardingComplete) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>
            
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              
              <Button type="submit">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              </Button>
            </div>
            
            <div className="mt-6 flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full',
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
