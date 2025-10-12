'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const learningStyles = [
  { id: 'visual', emoji: '👁️', title: 'Visual', description: 'Learns best with images, diagrams, and videos' },
  { id: 'auditory', emoji: '👂', title: 'Auditory', description: 'Learns best by listening and discussing' },
  { id: 'kinesthetic', emoji: '🤸', title: 'Kinesthetic', description: 'Learns best by doing and hands-on activities' },
  { id: 'reading', emoji: '📖', title: 'Reading/Writing', description: 'Learns best through reading and writing' }
];

const interests = [
  { id: 'math', emoji: '🔢', title: 'Math', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
  { id: 'science', emoji: '🔬', title: 'Science', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
  { id: 'space', emoji: '🚀', title: 'Space', color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
  { id: 'animals', emoji: '🐾', title: 'Animals', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
  { id: 'robots', emoji: '🤖', title: 'Robots', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300' },
  { id: 'art', emoji: '🎨', title: 'Art', color: 'bg-pink-100 hover:bg-pink-200 border-pink-300' },
  { id: 'music', emoji: '🎵', title: 'Music', color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300' },
  { id: 'history', emoji: '📜', title: 'History', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
  { id: 'languages', emoji: '🌍', title: 'Languages', color: 'bg-teal-100 hover:bg-teal-200 border-teal-300' }
];

const difficultyLevels = [
  { id: 'easy', title: 'Beginner', description: 'Just starting out, take it slow', emoji: '🌱' },
  { id: 'medium', title: 'Intermediate', description: 'Some experience, ready for more', emoji: '🌿' },
  { id: 'hard', title: 'Advanced', description: 'Confident learner, bring the challenge!', emoji: '🌳' }
];

const goals = [
  { id: 'improve_grades', title: 'Improve Grades', emoji: '📈' },
  { id: 'learn_new_things', title: 'Learn New Things', emoji: '💡' },
  { id: 'homework_help', title: 'Homework Help', emoji: '📝' },
  { id: 'stay_curious', title: 'Stay Curious', emoji: '🔍' },
  { id: 'build_confidence', title: 'Build Confidence', emoji: '💪' },
  { id: 'have_fun', title: 'Have Fun Learning', emoji: '🎉' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    learningStyle: '',
    interests: [] as string[],
    difficulty: '',
    goals: [] as string[],
    preferredTime: 'anytime'
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    // Validation for each step
    if (step === 1 && !profile.learningStyle) {
      toast.error('Please select a learning style');
      return;
    }
    if (step === 2 && profile.interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    if (step === 3 && !profile.difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }
    if (step === 4 && profile.goals.length === 0) {
      toast.error('Please select at least one goal');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save profile to localStorage (temporary solution)
    const user = JSON.parse(localStorage.getItem('sunny_user') || '{}');
    const updatedUser = {
      ...user,
      profile,
      onboarded: true
    };
    localStorage.setItem('sunny_user', JSON.stringify(updatedUser));

    toast.success('Profile complete! Let\'s start learning! 🎉');
    router.push('/');
  };

  const toggleInterest = (id: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const toggleGoal = (id: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter(g => g !== id)
        : [...prev.goals, id]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Step {step} of {totalSteps}</span>
            <span className="text-sm font-bold text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>

        {/* Animated Sunny Character */}
        <motion.div
          key={step}
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="text-8xl inline-block">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ☀️
            </motion.div>
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="bg-white rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Learning Style */}
              {step === 1 && (
                <div>
                  <h2 className="text-3xl font-black mb-3">How do you learn best?</h2>
                  <p className="text-gray-600 mb-8">This helps Sunny teach in a way that works for you!</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {learningStyles.map((style) => (
                      <motion.button
                        key={style.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setProfile({ ...profile, learningStyle: style.id })}
                        className={`p-6 rounded-2xl border-3 transition-all text-left ${
                          profile.learningStyle === style.id
                            ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-5xl mb-3">{style.emoji}</div>
                        <div className="text-xl font-bold mb-2">{style.title}</div>
                        <div className={profile.learningStyle === style.id ? 'text-white/90' : 'text-gray-600'}>
                          {style.description}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Interests */}
              {step === 2 && (
                <div>
                  <h2 className="text-3xl font-black mb-3">What interests you?</h2>
                  <p className="text-gray-600 mb-8">Pick as many as you like - we'll customize your learning!</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {interests.map((interest) => {
                      const isSelected = profile.interests.includes(interest.id);
                      return (
                        <motion.button
                          key={interest.id}
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleInterest(interest.id)}
                          className={`p-6 rounded-xl border-2 transition-all relative ${
                            isSelected
                              ? `${interest.color} border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="text-4xl mb-2">{interest.emoji}</div>
                          <div className="font-bold text-sm">{interest.title}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Difficulty */}
              {step === 3 && (
                <div>
                  <h2 className="text-3xl font-black mb-3">What's your level?</h2>
                  <p className="text-gray-600 mb-8">Don't worry, Sunny will adjust as you learn!</p>

                  <div className="space-y-4">
                    {difficultyLevels.map((level) => (
                      <motion.button
                        key={level.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setProfile({ ...profile, difficulty: level.id })}
                        className={`w-full p-6 rounded-2xl border-3 transition-all text-left flex items-center gap-4 ${
                          profile.difficulty === level.id
                            ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-5xl">{level.emoji}</div>
                        <div className="flex-1">
                          <div className="text-2xl font-bold mb-1">{level.title}</div>
                          <div className={profile.difficulty === level.id ? 'text-white/90' : 'text-gray-600'}>
                            {level.description}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Goals */}
              {step === 4 && (
                <div>
                  <h2 className="text-3xl font-black mb-3">What are your goals?</h2>
                  <p className="text-gray-600 mb-8">Select all that apply - we'll help you achieve them!</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {goals.map((goal) => {
                      const isSelected = profile.goals.includes(goal.id);
                      return (
                        <motion.button
                          key={goal.id}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleGoal(goal.id)}
                          className={`p-5 rounded-xl border-2 transition-all text-left flex items-center gap-3 relative ${
                            isSelected
                              ? 'bg-gradient-to-br from-yellow-200 to-orange-200 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="text-3xl">{goal.emoji}</div>
                          <div className="font-bold">{goal.title}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="text-8xl mb-6"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-4xl font-black mb-4">You're all set!</h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Sunny is ready to create your personalized learning journey
                  </p>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-black mb-8">
                    <h3 className="font-bold text-lg mb-4">Your Learning Profile:</h3>
                    <div className="space-y-3 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Learning Style:</span>
                        <span className="px-3 py-1 bg-white rounded-full text-sm border border-gray-300">
                          {learningStyles.find(s => s.id === profile.learningStyle)?.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">Level:</span>
                        <span className="px-3 py-1 bg-white rounded-full text-sm border border-gray-300">
                          {difficultyLevels.find(d => d.id === profile.difficulty)?.title}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block mb-2">Interests:</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map(id => {
                            const interest = interests.find(i => i.id === id);
                            return (
                              <span key={id} className="px-3 py-1 bg-white rounded-full text-sm border border-gray-300">
                                {interest?.emoji} {interest?.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold block mb-2">Goals:</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.goals.map(id => {
                            const goal = goals.find(g => g.id === id);
                            return (
                              <span key={id} className="px-3 py-1 bg-white rounded-full text-sm border border-gray-300">
                                {goal?.emoji} {goal?.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t-2 border-gray-200">
            <Button
              onClick={handleBack}
              disabled={step === 1}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
            >
              {step === totalSteps ? (
                <>
                  Start Learning
                  <Sparkles className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
