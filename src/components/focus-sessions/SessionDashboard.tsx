'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Target, TrendingUp, Brain } from 'lucide-react';
import { FocusSession, SessionLoop, ArtifactType } from '@/types/focus-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SessionDashboardProps {
  session: FocusSession;
  currentLoop?: SessionLoop;
  onLoopChange?: (loopNumber: number) => void;
}

export function SessionDashboard({ session, currentLoop, onLoopChange }: SessionDashboardProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(session.duration);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      setTimeElapsed(elapsed);
      setTimeRemaining(Math.max(0, session.duration - elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.startTime, session.duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeElapsed / session.duration) * 100;

  const getModalityIcon = (type: ArtifactType): string => {
    switch (type) {
      case 'flashcards':
        return '📚';
      case 'quiz':
        return '📝';
      case 'micro_game':
        return '🎮';
      default:
        return '📖';
    }
  };

  const getModalityLabel = (type: ArtifactType): string => {
    switch (type) {
      case 'flashcards':
        return 'Flashcards';
      case 'quiz':
        return 'Quiz';
      case 'micro_game':
        return 'Game';
      default:
        return 'Activity';
    }
  };

  const averageAccuracy =
    session.loops.length > 0
      ? session.loops.reduce((sum, loop) => sum + loop.performance.accuracy, 0) / session.loops.length
      : 0;

  const conceptsLearned = new Set(session.loops.flatMap((l) => l.artifact.targetSubtopics)).size;

  return (
    <div className="w-full space-y-4">
      {/* Header - Session Info */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-blue-600" />
            Focus Session: {session.topic}
          </CardTitle>
          <CardDescription>
            {session.status === 'active' ? '🔵 In Progress' : session.status === 'planning' ? '⚪ Planning' : '✅ Complete'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timer and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold">
                  {formatTime(timeElapsed)} / {formatTime(session.duration)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="text-lg font-semibold text-blue-600">{formatTime(timeRemaining)}</p>
              </div>
            </div>

            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Current Activity */}
          {currentLoop && (
            <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getModalityIcon(currentLoop.artifact.type)}</div>
                <div>
                  <p className="font-semibold">{getModalityLabel(currentLoop.artifact.type)}</p>
                  <p className="text-sm text-gray-600">
                    Loop {currentLoop.loopNumber} of {Math.ceil(session.duration / 360)}
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="text-sm">
                {session.currentDifficulty}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Accuracy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-green-600" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(averageAccuracy * 100)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {session.loops.length > 0 ? 'Average across loops' : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        {/* Concepts Learned */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-purple-600" />
              Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{conceptsLearned}</div>
            <p className="text-xs text-gray-600 mt-1">
              {conceptsLearned === 1 ? 'concept' : 'concepts'} practiced
            </p>
          </CardContent>
        </Card>

        {/* Loops Completed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {session.loops.length}/{Math.ceil(session.duration / 360)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Loops completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Concept Map Preview */}
      {session.conceptMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Learning Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {session.conceptMap.subtopics.map((subtopic) => (
                <Badge
                  key={subtopic.name}
                  variant={
                    subtopic.status === 'mastered'
                      ? 'default'
                      : subtopic.status === 'ok'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={`
                    ${
                      subtopic.status === 'mastered'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : subtopic.status === 'ok'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : subtopic.status === 'learning'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    }
                  `}
                >
                  {subtopic.name} {Math.round(subtopic.masteryLevel * 100)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loop History */}
      {session.loops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Session History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {session.loops.map((loop) => (
                <div
                  key={loop.loopNumber}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onLoopChange?.(loop.loopNumber)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{getModalityIcon(loop.artifact.type)}</div>
                    <div>
                      <p className="text-sm font-medium">
                        Loop {loop.loopNumber}: {getModalityLabel(loop.artifact.type)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {loop.artifact.targetSubtopics.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {Math.round(loop.performance.accuracy * 100)}%
                    </div>
                    <div className="text-xs text-gray-600">
                      {loop.performance.itemsCompleted}/{loop.performance.itemsTotal} items
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
