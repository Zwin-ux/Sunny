/**
 * AnimatedAgentDemo Component
 * 
 * Auto-playing visual simulation showing how 5 AI agents work together.
 * Demonstrates the complete flow from student question to personalized content.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  activeAgents: number[];
  content?: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Student asks a question',
    description: '"I don\'t understand fractions..."',
    activeAgents: [],
    content: '💭 "I don\'t understand fractions..."'
  },
  {
    id: 2,
    title: 'Assessment Agent analyzes',
    description: 'Evaluating current knowledge level',
    activeAgents: [0],
  },
  {
    id: 3,
    title: 'Path Planning Agent creates route',
    description: 'Mapping optimal learning path',
    activeAgents: [0, 2],
  },
  {
    id: 4,
    title: 'Content Agent generates lesson',
    description: 'Creating personalized materials',
    activeAgents: [0, 1, 2],
  },
  {
    id: 5,
    title: 'Support Agent provides encouragement',
    description: 'Monitoring engagement and motivation',
    activeAgents: [0, 1, 2, 3],
  },
  {
    id: 6,
    title: 'Communication Agent delivers',
    description: 'Adapting tone and style',
    activeAgents: [0, 1, 2, 3, 4],
  },
  {
    id: 7,
    title: 'Personalized lesson created!',
    description: 'Ready for the student',
    activeAgents: [],
    content: '📚 "Visual Fractions Guide - Just for You!"'
  },
  {
    id: 8,
    title: 'Teacher gets progress update',
    description: 'Real-time analytics dashboard',
    activeAgents: [],
    content: '📊 Knowledge gap identified • Lesson generated • Engagement: 85%'
  },
];

const agents = [
  { id: 0, name: 'Assessment', icon: '🧠', color: 'from-blue-400 to-blue-600' },
  { id: 1, name: 'Content', icon: '✨', color: 'from-purple-400 to-purple-600' },
  { id: 2, name: 'Planning', icon: '🎯', color: 'from-green-400 to-green-600' },
  { id: 3, name: 'Support', icon: '💪', color: 'from-orange-400 to-orange-600' },
  { id: 4, name: 'Communication', icon: '💬', color: 'from-pink-400 to-pink-600' },
];

export function AnimatedAgentDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStep < demoSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setHasStarted(true);
      } else {
        // Loop back to start
        setTimeout(() => {
          setCurrentStep(0);
        }, 2000);
      }
    }, 2500); // 2.5 seconds per step

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!hasStarted) setHasStarted(true);
  };

  const step = demoSteps[currentStep];

  return (
    <div className="relative">
      {/* Play/Pause Control */}
      <button
        onClick={togglePlay}
        className="absolute top-4 right-4 z-10 bg-white p-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        aria-label={isPlaying ? 'Pause demo' : 'Play demo'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-gray-900" />
        ) : (
          <Play className="w-5 h-5 text-gray-900" />
        )}
      </button>

      {/* Main Demo Area */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl border-4 border-black p-8 min-h-[400px] flex flex-col">
        
        {/* Current Step Display */}
        <div className="text-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Agent Cards */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {agents.map((agent, index) => {
            const isActive = step.activeAgents.includes(agent.id);
            const justActivated = isActive && (currentStep > 0 && !demoSteps[currentStep - 1]?.activeAgents.includes(agent.id));
            
            return (
              <motion.div
                key={agent.id}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{
                  scale: isActive ? 1.1 : 0.9,
                  opacity: isActive ? 1 : 0.4,
                  y: isActive ? -8 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`relative p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isActive ? `bg-gradient-to-br ${agent.color}` : 'bg-white'
                }`}
              >
                {/* Pulse effect when activated */}
                {justActivated && (
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.color}`}
                  />
                )}
                
                <div className="text-3xl mb-2">{agent.icon}</div>
                <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {agent.name}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Connection Lines Animation */}
        {step.activeAgents.length > 1 && (
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 0.5 }}
              className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
            />
          </div>
        )}

        {/* Content Display */}
        <AnimatePresence mode="wait">
          {step.content && (
            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center"
            >
              <p className="text-lg font-bold text-gray-900">{step.content}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="mt-auto pt-6">
          <div className="flex justify-center gap-2">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Step {currentStep + 1} of {demoSteps.length}
        </p>
      </div>
    </div>
  );
}
