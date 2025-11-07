'use client';

/**
 * CloudGardenStage Component
 *
 * Complete implementation of the Cloud Garden emotional learning stage
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stageManager } from '@/lib/env-server';
import { cloudGardenStage } from '@/lib/env-server/stages/cloud-garden';
import type {
  StageSession,
  LessonState,
  TaskItem,
  ItemResult,
  TaskResult,
} from '@/types/env-server';
import { ThoughtBubble } from './ThoughtBubble';
import { SortingTarget } from './SortingTarget';
import { PlantGrowth } from './PlantGrowth';
import { DialogueDisplay } from './DialogueDisplay';
import { ReflectionInterface } from './ReflectionInterface';
import { RewardScreen } from './RewardScreen';

interface CloudGardenStageProps {
  playerId: string;
  onComplete?: () => void;
}

export function CloudGardenStage({
  playerId,
  onComplete,
}: CloudGardenStageProps) {
  const [session, setSession] = useState<StageSession | null>(null);
  const [currentState, setCurrentState] = useState<LessonState | null>(null);
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);
  const [placedItems, setPlacedItems] = useState<Set<string>>(new Set());
  const [wateredPlants, setWateredPlants] = useState<Set<string>>(new Set());
  const [targetCounts, setTargetCounts] = useState<Record<string, number>>({});

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      const newSession = await stageManager.startSession(
        playerId,
        cloudGardenStage
      );
      setSession(newSession);
      setCurrentState(cloudGardenStage.lessonPlan.states[0]);
    };

    initSession();

    // Listen for state changes
    const handleStateChange = (event: any) => {
      setCurrentState(event.data.newState);
    };

    stageManager.on('session:state-changed', handleStateChange);

    return () => {
      stageManager.off('session:state-changed', handleStateChange);
    };
  }, [playerId]);

  if (!session || !currentState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading Cloud Garden... ☁️</div>
      </div>
    );
  }

  // Handle thought bubble drop
  const handleThoughtDrop = (item: TaskItem, targetId: string | null) => {
    if (!targetId || placedItems.has(item.id)) return;

    const isCorrect = item.correctTarget === targetId;

    const result: ItemResult = {
      itemId: item.id,
      action: 'placed',
      targetId,
      correct: isCorrect,
      timestamp: Date.now(),
      timeToComplete: 0, // Can track drag time
    };

    setItemResults((prev) => [...prev, result]);
    setPlacedItems((prev) => new Set([...prev, item.id]));

    // Update target counts
    if (isCorrect) {
      setTargetCounts((prev) => ({
        ...prev,
        [targetId]: (prev[targetId] || 0) + 1,
      }));
    }

    // Check if all items are placed
    const allItems = currentState.task?.items || [];
    if (placedItems.size + 1 === allItems.length) {
      // Task complete - record results
      setTimeout(() => {
        const taskResult: TaskResult = {
          taskId: currentState.id,
          taskType: 'sorting',
          startTime: Date.now() - 60000, // Approximate
          endTime: Date.now(),
          correct: itemResults.filter((r) => r.correct).length + (isCorrect ? 1 : 0),
          incorrect: itemResults.filter((r) => !r.correct).length + (isCorrect ? 0 : 1),
          accuracy:
            (itemResults.filter((r) => r.correct).length + (isCorrect ? 1 : 0)) /
            allItems.length,
          itemResults: [...itemResults, result],
          hintsUsed: 0,
        };

        stageManager.recordTaskResult(session.id, taskResult);

        // Auto-advance to next state
        setTimeout(() => {
          stageManager.nextState(session.id);
          setItemResults([]);
          setPlacedItems(new Set());
          setTargetCounts({});
        }, 2000);
      }, 1000);
    }
  };

  // Handle plant watered
  const handlePlantWatered = (plantId: string) => {
    setWateredPlants((prev) => new Set([...prev, plantId]));

    const allPlants = currentState.task?.items || [];
    if (wateredPlants.size + 1 === allPlants.length) {
      // All plants watered - record results
      const taskResult: TaskResult = {
        taskId: currentState.id,
        taskType: 'collection',
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        correct: allPlants.length,
        incorrect: 0,
        accuracy: 1.0,
        itemResults: allPlants.map((plant) => ({
          itemId: plant.id,
          action: 'selected' as const,
          correct: true,
          timestamp: Date.now(),
          timeToComplete: 0,
        })),
        hintsUsed: 0,
      };

      stageManager.recordTaskResult(session.id, taskResult);

      // Auto-advance
      setTimeout(() => {
        stageManager.nextState(session.id);
        setWateredPlants(new Set());
      }, 2000);
    }
  };

  // Handle reflection complete
  const handleReflectionComplete = (
    responses: Array<{ question: string; response: string; aiFollowUp?: string }>
  ) => {
    // Record reflections
    responses.forEach((r, i) => {
      stageManager.recordReflection(
        session.id,
        `reflection-${i + 1}`,
        r.question,
        r.response,
        r.aiFollowUp
      );
    });

    // Advance to reward
    setTimeout(() => {
      stageManager.nextState(session.id);
    }, 1000);
  };

  // Handle reward complete
  const handleRewardComplete = () => {
    // Award rewards
    cloudGardenStage.lessonPlan.rewards.forEach((reward) => {
      stageManager.awardReward(session.id, reward);
    });

    // Complete session
    const summary = stageManager.completeSession(session.id);
    console.log('Session summary:', summary);

    onComplete?.();
  };

  // Render state-specific content
  const renderStateContent = () => {
    switch (currentState.type) {
      case 'intro':
      case 'instruction':
        return (
          <DialogueDisplay
            dialogue={currentState.dialogue || []}
            onComplete={() => stageManager.nextState(session.id)}
            autoAdvance={true}
          />
        );

      case 'activity':
        if (currentState.task?.type === 'sorting') {
          return renderSortingActivity();
        } else if (currentState.task?.type === 'collection') {
          return renderGrowthActivity();
        }
        return null;

      case 'reflection':
        return (
          <div className="space-y-8">
            <DialogueDisplay
              dialogue={currentState.dialogue || []}
              onComplete={() => {}}
              autoAdvance={false}
            />
            <ReflectionInterface
              questions={cloudGardenStage.lessonPlan.reflectionQuestions}
              onComplete={handleReflectionComplete}
            />
          </div>
        );

      case 'reward':
        const updatedSession = stageManager.getSession(session.id);
        return (
          <div className="space-y-8">
            <DialogueDisplay
              dialogue={currentState.dialogue || []}
              onComplete={() => {}}
              autoAdvance={false}
            />
            {updatedSession && (
              <RewardScreen
                rewards={cloudGardenStage.lessonPlan.rewards}
                score={updatedSession.playerState.score}
                accuracy={
                  updatedSession.playerState.taskResults.reduce(
                    (sum, t) => sum + t.accuracy,
                    0
                  ) / Math.max(updatedSession.playerState.taskResults.length, 1)
                }
                timeElapsed={updatedSession.playerState.timeElapsed}
                onContinue={handleRewardComplete}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSortingActivity = () => {
    const items = currentState.task?.items || [];
    const targets = currentState.task?.targets || [];
    const unplacedItems = items.filter((item) => !placedItems.has(item.id));

    return (
      <div className="space-y-8">
        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {currentState.name}
          </h2>
          <p className="text-lg text-gray-600">
            {currentState.task?.instructions}
          </p>
        </div>

        {/* Sorting targets */}
        <div className="flex justify-center gap-8">
          {targets.map((target) => (
            <SortingTarget
              key={target.id}
              target={target}
              itemCount={targetCounts[target.id] || 0}
            />
          ))}
        </div>

        {/* Thought bubbles */}
        <div className="flex flex-wrap justify-center gap-6 min-h-[300px]">
          {unplacedItems.map((item) => (
            <ThoughtBubble
              key={item.id}
              item={item}
              onDragEnd={handleThoughtDrop}
              isPlaced={placedItems.has(item.id)}
            />
          ))}
        </div>

        {/* Progress */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {placedItems.size} / {items.length} thoughts sorted
          </p>
        </div>
      </div>
    );
  };

  const renderGrowthActivity = () => {
    const plants = currentState.task?.items || [];

    return (
      <div className="space-y-8">
        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {currentState.name}
          </h2>
          <p className="text-lg text-gray-600">
            {currentState.task?.instructions}
          </p>
        </div>

        {/* Plants */}
        <div className="flex flex-wrap justify-center gap-8">
          {plants.map((plant) => (
            <PlantGrowth
              key={plant.id}
              plant={plant}
              onWatered={handlePlantWatered}
            />
          ))}
        </div>

        {/* Progress */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {wateredPlants.size} / {plants.length} plants watered
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full p-8 transition-colors duration-1000"
      style={{
        backgroundColor: cloudGardenStage.visual.backgroundColor,
      }}
    >
      {/* Sunny mascot */}
      <motion.div
        className={`fixed ${
          cloudGardenStage.visual.mascotPosition === 'left'
            ? 'left-8'
            : cloudGardenStage.visual.mascotPosition === 'right'
            ? 'right-8'
            : 'left-1/2 -translate-x-1/2'
        } top-8 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-6xl shadow-2xl z-50`}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        ☀️
      </motion.div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentState.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {renderStateContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-gray-200">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-green-600"
          initial={{ width: 0 }}
          animate={{
            width: `${
              ((cloudGardenStage.lessonPlan.states.findIndex(
                (s) => s.id === currentState.id
              ) +
                1) /
                cloudGardenStage.lessonPlan.states.length) *
              100
            }%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
