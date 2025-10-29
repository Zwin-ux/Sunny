/**
 * Focus Sessions Page - 20-minute structured practice
 * Uses existing focus sessions system
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Target, Trophy, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/ui/TabNavigation';
import { getCurrentUser } from '@/lib/auth';
import { sessionOrchestrator } from '@/lib/focus-sessions/session-orchestrator';
import { SessionDashboard } from '@/components/focus-sessions/SessionDashboard';
import { FlashcardPlayer } from '@/components/focus-sessions/FlashcardPlayer';
import { SessionReview } from '@/components/focus-sessions/SessionReview';
import type { FocusSession } from '@/types/focus-session';
import { recordSession, addSunnyNote } from '@/lib/db';

function FocusPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLoop, setCurrentLoop] = useState<any>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Get user
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Auto-start session if params provided
  useEffect(() => {
    const topic = searchParams.get('topic');
    const duration = searchParams.get('duration');

    if (topic && user && !session) {
      startFocusSession(topic, duration ? parseInt(duration) : 1200);
    }
  }, [searchParams, user, session]);

  const startFocusSession = async (topic: string, durationSeconds: number = 1200) => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log(`🎯 Starting focus session: ${topic} for ${durationSeconds}s`);

      const newSession = await sessionOrchestrator.start({
        studentId: user.id || user.name,
        topic,
        targetDuration: durationSeconds,
        inputContext: `Focus session on ${topic}`,
        learningGoals: [`Master ${topic}`]
      });

      setSession(newSession);

      // Start first loop
      const firstLoop = await sessionOrchestrator.startLoop(newSession.id, 1);
      setCurrentLoop(firstLoop);

    } catch (error) {
      console.error('Failed to start focus session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoopComplete = async (results: any) => {
    if (!session || !currentLoop) return;

    console.log(`✅ Loop ${currentLoop.loopNumber} complete`, results);

    // Record results
    sessionOrchestrator.recordResults(session.id, currentLoop.loopNumber, results);

    // Complete loop
    const performance = await sessionOrchestrator.completeLoop(session.id, currentLoop.loopNumber);
    console.log('Loop performance:', performance);

    // 💾 Phase 4: Record loop to database
    if (user && performance) {
      try {
        const accuracy = performance.accuracy || 0;
        const totalQuestions = performance.totalQuestions || 0;
        const correctAnswers = Math.round(totalQuestions * accuracy);
        const loopDuration = Math.round((performance.timeSpent || 0) / 1000);

        // Record this loop as a session
        await recordSession({
          userId: user.id || user.name,
          missionType: 'focus_session',
          sunnyGoal: `${session.topic} - Loop ${currentLoop.loopNumber}`,
          difficultyLevel: currentLoop.difficulty || session.currentDifficulty || 'medium',
          questionsAttempted: totalQuestions,
          questionsCorrect: correctAnswers,
          durationSeconds: loopDuration,
          attentionQuality: performance.engagementLevel > 0.7 ? 'high' : performance.engagementLevel > 0.4 ? 'medium' : 'low',
          sunnySummary: `Completed loop ${currentLoop.loopNumber} of ${session.topic} with ${(accuracy * 100).toFixed(0)}% accuracy`
        });

        console.log('✅ Loop recorded to database');

        // Add Sunny notes based on performance
        if (accuracy >= 0.9 && performance.engagementLevel > 0.8) {
          await addSunnyNote(
            user.id || user.name,
            `Excellent focus in ${session.topic} loop ${currentLoop.loopNumber}! Strong engagement and accuracy.`,
            'milestone',
            undefined,
            'medium',
            false
          );
        } else if (accuracy < 0.5 && performance.frustrationLevel > 0.6) {
          await addSunnyNote(
            user.id || user.name,
            `Struggled in ${session.topic} loop ${currentLoop.loopNumber}. May need easier difficulty or break.`,
            'concern',
            undefined,
            'high',
            true
          );
        } else if (performance.engagementLevel < 0.3) {
          await addSunnyNote(
            user.id || user.name,
            `Low engagement in ${session.topic} loop ${currentLoop.loopNumber}. Consider changing activities.`,
            'observation',
            undefined,
            'medium',
            true
          );
        }

      } catch (error) {
        console.error('Error recording loop to database:', error);
      }
    }

    // Check if session should continue
    if (currentLoop.loopNumber < 3) {
      // Start next loop
      const nextLoop = await sessionOrchestrator.startLoop(session.id, currentLoop.loopNumber + 1);
      setCurrentLoop(nextLoop);
    } else {
      // Complete session
      const { session: finalSession, performance: sessionPerf } = await sessionOrchestrator.complete(session.id);
      setSession(finalSession);
      setSessionComplete(true);

      // 💾 Phase 4: Record final session summary
      if (user && sessionPerf) {
        try {
          const overallAccuracy = sessionPerf.averageAccuracy || 0;
          const totalDuration = Math.round((Date.now() - finalSession.startTime) / 1000);
          const conceptsMastered = sessionPerf.conceptsMastered?.length || 0;

          await recordSession({
            userId: user.id || user.name,
            missionType: 'focus_session_complete',
            sunnyGoal: `${session.topic} - Full Session (${currentLoop.loopNumber} loops)`,
            difficultyLevel: finalSession.currentDifficulty || 'medium',
            questionsAttempted: sessionPerf.totalQuestions || 0,
            questionsCorrect: sessionPerf.correctAnswers || 0,
            durationSeconds: totalDuration,
            attentionQuality: sessionPerf.engagementLevel > 0.7 ? 'high' : sessionPerf.engagementLevel > 0.4 ? 'medium' : 'low',
            sunnySummary: `Completed ${currentLoop.loopNumber}-loop focus session on ${session.topic} with ${(overallAccuracy * 100).toFixed(0)}% accuracy. Mastered ${conceptsMastered} concepts.`
          });

          console.log('✅ Full session recorded to database');

          // Add milestone note for completing full session
          if (overallAccuracy >= 0.8) {
            await addSunnyNote(
              user.id || user.name,
              `Completed full 20-minute focus session on ${session.topic} with excellent performance (${(overallAccuracy * 100).toFixed(0)}%)!`,
              'milestone',
              undefined,
              'high',
              false
            );
          } else if (overallAccuracy >= 0.6) {
            await addSunnyNote(
              user.id || user.name,
              `Completed focus session on ${session.topic}. Good effort! Keep practicing to improve.`,
              'observation',
              undefined,
              'low',
              false
            );
          }

        } catch (error) {
          console.error('Error recording full session to database:', error);
        }
      }
    }
  };

  const handleExitSession = () => {
    setSession(null);
    setCurrentLoop(null);
    setSessionComplete(false);
    router.push('/chat');
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">☀️</div>
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Show session review after completion
  if (sessionComplete && session?.reviewPlan) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <SessionReview
            performance={session.performance || {
              averageAccuracy: 0.8,
              totalQuestions: 30,
              correctAnswers: 24,
              averageTimePerItem: 12,
              conceptsMastered: [],
              conceptsNeedingReview: [],
              frustrationLevel: 0.2,
              engagementLevel: 0.9
            }}
            reviewPlan={session.reviewPlan}
            onStartNextSession={() => {
              setSessionComplete(false);
              setSession(null);
              setCurrentLoop(null);
            }}
            onClose={handleExitSession}
          />
        </div>
      </AppShell>
    );
  }

  // Show active session
  if (session && currentLoop) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back button */}
          <Button
            onClick={handleExitSession}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Session
          </Button>

          {/* Session Dashboard */}
          <SessionDashboard
            session={session}
            currentLoop={currentLoop}
            onLoopChange={(loopNum) => console.log(`Switch to loop ${loopNum}`)}
          />

          {/* Activity Player */}
          <div className="mt-8">
            {currentLoop.artifact.type === 'flashcards' && (
              <FlashcardPlayer
                flashcardSet={currentLoop.artifact.data}
                onComplete={handleLoopComplete}
                onCardResult={(result) => {
                  console.log('Card result:', result);
                }}
              />
            )}

            {currentLoop.artifact.type === 'quiz' && (
              <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-bold mb-4">Quiz Time!</h3>
                <p className="text-gray-600">Quiz component coming soon...</p>
                <Button onClick={() => handleLoopComplete({ accuracy: 0.8 })} className="mt-4">
                  Complete Quiz
                </Button>
              </div>
            )}

            {currentLoop.artifact.type === 'micro_game' && (
              <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-bold mb-4">Mini Game!</h3>
                <p className="text-gray-600">Game component coming soon...</p>
                <Button onClick={() => handleLoopComplete({ accuracy: 0.85 })} className="mt-4">
                  Complete Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // Show topic selection
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-5xl font-black mb-4">Focus Session</h1>
          <p className="text-xl text-gray-600">
            20 minutes of focused practice to master a topic
          </p>
        </motion.div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => startFocusSession('math')}
          >
            <div className="text-4xl mb-3">🔢</div>
            <h3 className="text-xl font-bold mb-2">Math Practice</h3>
            <p className="text-gray-600">Practice arithmetic, fractions, and problem-solving</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => startFocusSession('reading')}
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2">Reading Skills</h3>
            <p className="text-gray-600">Improve comprehension and vocabulary</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => startFocusSession('science')}
          >
            <div className="text-4xl mb-3">🔬</div>
            <h3 className="text-xl font-bold mb-2">Science Facts</h3>
            <p className="text-gray-600">Explore animals, plants, and nature</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            onClick={() => startFocusSession('geography')}
          >
            <div className="text-4xl mb-3">🌍</div>
            <h3 className="text-xl font-bold mb-2">World Geography</h3>
            <p className="text-gray-600">Learn about countries, capitals, and cultures</p>
          </motion.div>
        </div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <h2 className="text-2xl font-bold mb-6">How Focus Sessions Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold">20 Minutes</h3>
              </div>
              <p className="text-sm text-gray-600">Perfect length for focused learning</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="font-bold">Adaptive</h3>
              </div>
              <p className="text-sm text-gray-600">Adjusts to your skill level in real-time</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="font-bold">Track Progress</h3>
              </div>
              <p className="text-sm text-gray-600">See your improvement over time</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <FocusPageContent />
    </Suspense>
  );
}
