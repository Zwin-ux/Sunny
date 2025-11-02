'use client';

import React from 'react';
import { Trophy, TrendingUp, Target, Brain, Star, BookOpen } from 'lucide-react';
import { SessionPerformance, ReviewPlan } from '@/types/focus-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SessionReviewProps {
  performance: SessionPerformance;
  reviewPlan: ReviewPlan;
  onStartNextSession?: () => void;
  onClose?: () => void;
}

export function SessionReview({
  performance,
  reviewPlan,
  onStartNextSession,
  onClose,
}: SessionReviewProps) {
  const accuracyPercent = Math.round(performance.averageAccuracy * 100);
  const improvementPercent = Math.round(performance.improvementRate * 100);

  const getPerformanceLevel = (): {
    icon: string;
    title: string;
    color: string;
    message: string;
  } => {
    if (accuracyPercent >= 90) {
      return {
        icon: '🌟',
        title: 'Outstanding!',
        color: 'text-yellow-600',
        message: "You're crushing it! Amazing work!",
      };
    } else if (accuracyPercent >= 80) {
      return {
        icon: '🎉',
        title: 'Excellent!',
        color: 'text-green-600',
        message: 'Great job! You really know your stuff!',
      };
    } else if (accuracyPercent >= 70) {
      return {
        icon: '👍',
        title: 'Well Done!',
        color: 'text-blue-600',
        message: 'Good work! Keep practicing!',
      };
    } else {
      return {
        icon: '💪',
        title: 'Keep Going!',
        color: 'text-purple-600',
        message: "You're learning! Every session makes you smarter!",
      };
    }
  };

  const performanceLevel = getPerformanceLevel();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      {/* Header - Celebration */}
      <Card className="border-4 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">{performanceLevel.icon}</div>
          <CardTitle className={`text-3xl ${performanceLevel.color}`}>
            {performanceLevel.title}
          </CardTitle>
          <CardDescription className="text-lg mt-2">{performanceLevel.message}</CardDescription>
        </CardHeader>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-green-600" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{accuracyPercent}%</div>
            <Progress value={accuracyPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {improvementPercent > 0 ? '+' : ''}
              {improvementPercent}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Over the session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {performance.conceptsMastered.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Mastered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-yellow-600" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{performance.loopsCompleted}</div>
            <p className="text-xs text-gray-600 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {performance.conceptsMastered.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-600" />
              You Mastered These Concepts! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {performance.conceptsMastered.map((concept) => (
                <Badge key={concept} className="bg-green-500 text-white text-sm py-1 px-3">
                  ✓ {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas to Review */}
      {performance.conceptsNeedingReview.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Let's Practice These More
            </CardTitle>
            <CardDescription>These concepts need a bit more work - that's okay!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {performance.conceptsNeedingReview.map((concept) => (
                <Badge key={concept} variant="outline" className="border-blue-300 text-blue-800 text-sm">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Topic</p>
              <p className="font-semibold">{performance.topic}</p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-semibold">{Math.round(performance.totalTime / 60)} minutes</p>
            </div>
            <div>
              <p className="text-gray-600">Activities</p>
              <p className="font-semibold">
                📚 {performance.flashcardsCompleted} • 📝 {performance.quizzesCompleted} • 🎮{' '}
                {performance.gamesCompleted}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Difficulty</p>
              <p className="font-semibold">
                {performance.startDifficulty} → {performance.endDifficulty}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            What's Next?
          </CardTitle>
          <CardDescription>{reviewPlan.reasoning}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Next Goals:</p>
            <ul className="space-y-1">
              {reviewPlan.nextGoals.map((goal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-600">•</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-purple-200">
            <p className="text-sm text-gray-700 mb-2">
              Recommended next session:{' '}
              <strong>
                {reviewPlan.recommendedModality === 'flashcards'
                  ? '📚 Flashcards'
                  : reviewPlan.recommendedModality === 'quiz'
                  ? '📝 Quiz'
                  : '🎮 Game'}
              </strong>{' '}
              at <strong>{reviewPlan.targetDifficulty}</strong> difficulty
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          onClick={onStartNextSession}
        >
          <Trophy className="h-5 w-5 mr-2" />
          Start Next Session
        </Button>

        <Button size="lg" variant="outline" onClick={onClose}>
          Finish
        </Button>
      </div>
    </div>
  );
}
