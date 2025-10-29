'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SunnyVoice } from '@/components/voice/SunnyVoice';
import { ProgressBar } from '@/components/demo/ProgressBar';
import { BadgeDisplay } from '@/components/demo/BadgeDisplay';
import { WorldUnlock } from '@/components/demo/WorldUnlock';
import { Answer, Badge } from '@/types/demo';
import { analyzePerformance, generateAnalysisMessage } from '@/lib/demo-insights';
import { 
  initializeGameProgress, 
  updateGameProgress, 
  calculateLevel,
  ALL_WORLDS 
} from '@/lib/demo-gamification';

interface DemoResultsProps {
  answers: Answer[];
  onContinue: () => void;
}

export function DemoResults({ answers, onContinue }: DemoResultsProps) {
  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
  const insights = analyzePerformance(answers, totalTime);
  const analysisMessage = generateAnalysisMessage(insights);
  
  const score = answers.filter(a => a.correct).length;
  const total = answers.length;
  const percentage = Math.round((score / total) * 100);
  
  // Gamification state
  const [gameProgress, setGameProgress] = useState(initializeGameProgress());
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<Badge[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  useEffect(() => {
    // Calculate progress
    const oldLevel = gameProgress.level;
    const updatedProgress = updateGameProgress(gameProgress, answers);
    setGameProgress(updatedProgress);
    
    // Check for newly earned badges
    const newBadges = updatedProgress.badges.filter(b => 
      b.earned && !gameProgress.badges.find(gb => gb.id === b.id)?.earned
    );
    if (newBadges.length > 0) {
      setNewlyEarnedBadges(newBadges);
      // Clear after 3 seconds
      setTimeout(() => setNewlyEarnedBadges([]), 3000);
    }
    
    // Check for level up
    if (updatedProgress.level > oldLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [answers]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-white">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">☀️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Amazing work!
          </h1>
        </div>

        {/* Score Card */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">You got</p>
            <p className="text-6xl font-bold text-gray-900 mb-2">
              {score}/{total}
            </p>
            <p className="text-2xl font-semibold text-yellow-700 mb-4">
              That's {percentage}%! 🎉
            </p>
            <Progress value={percentage} className="h-3" />
          </div>
        </Card>

        {/* Insights Panel */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 What Sunny Learned About You:
          </h2>

          <div className="space-y-3">
            {/* Strong Areas */}
            {insights.strongAreas.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-semibold">✅ Strong at:</span>
                <span className="text-gray-700">{insights.strongAreas.join(', ')}</span>
              </div>
            )}

            {/* Growing Areas */}
            {insights.growingAreas.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-semibold">📈 Growing:</span>
                <span className="text-gray-700">{insights.growingAreas.join(', ')}</span>
              </div>
            )}

            {/* Next Topics */}
            {insights.nextTopics.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">💡 Next:</span>
                <span className="text-gray-700">{insights.nextTopics.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Gamification Progress */}
        <div className="mb-6">
          <ProgressBar
            xp={gameProgress.xp}
            level={gameProgress.level}
            nextLevelXP={gameProgress.level * 100}
            showLevelUp={showLevelUp}
          />
        </div>

        {/* Badges */}
        <div className="mb-6">
          <BadgeDisplay
            badges={gameProgress.badges}
            newlyEarned={newlyEarnedBadges}
          />
        </div>

        {/* Worlds */}
        <div className="mb-6">
          <WorldUnlock
            worlds={ALL_WORLDS}
            currentXP={gameProgress.xp}
          />
        </div>

        {/* Sunny's Analysis */}
        <Card className="p-6 mb-6 bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Sunny's Analysis:
              </p>
              <p className="text-gray-800 text-lg leading-relaxed">
                {analysisMessage}
              </p>
            </div>
            <SunnyVoice text={analysisMessage} autoPlay={false} />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {insights.recommendedLevel}
            </p>
            <p className="text-sm text-gray-600">Your Level</p>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {insights.learningSpeed}
            </p>
            <p className="text-sm text-gray-600">Learning Speed</p>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(totalTime / 1000)}s
            </p>
            <p className="text-sm text-gray-600">Total Time</p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={onContinue}
            size="lg"
            className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg px-8 py-6 font-semibold shadow-lg"
          >
            Want More? Join the Waitlist! →
          </Button>
        </div>
      </div>
    </div>
  );
}
