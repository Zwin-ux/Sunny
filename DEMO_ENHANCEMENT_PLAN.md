# 🎯 Demo Enhancement Plan - Showcase Intelligent Quiz System

## Goal
Transform the demo to showcase the **new intelligent quiz engine** with real-time adaptation, progressive hints, and brain analysis.

## Current Demo (What We Have)
- Brain Mode visualization
- Demo mission with 7 questions
- Learning feedback and emotion meter
- Voice narration
- Basic Q&A flow

## Enhanced Demo (What We'll Build)

### 🎨 New Demo Flow

```
Landing Page
    ↓
Welcome Screen
    ↓
🆕 ADAPTIVE QUIZ DEMO (3 questions)
    ├─ Real-time difficulty adjustment
    ├─ Progressive hints system
    ├─ Brain Mode showing AI thinking
    └─ Live performance tracking
    ↓
Results with Brain Analysis
    ├─ Performance pattern
    ├─ Learning style detected
    ├─ Achievements unlocked
    └─ Personalized recommendations
    ↓
Waitlist CTA
```

---

## 🚀 Phase 1: Integrate Quiz Engine (30 minutes)

### Create Demo Quiz Component

**File**: `src/components/demo/AdaptiveQuizDemo.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { FillInBlank } from '@/components/quiz/FillInBlank';
import { ProgressiveHints } from '@/components/quiz/ProgressiveHints';
import { BrainModeVisualization } from '@/components/demo/BrainModeVisualization';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function AdaptiveQuizDemo() {
  const {
    session,
    currentQuestion,
    currentQuestionIndex,
    loading,
    error,
    createQuiz,
    submitAnswer,
    getHint,
    getSummary
  } = useQuiz();

  const [startTime, setStartTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showBrainMode, setShowBrainMode] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  // Start quiz on mount
  useEffect(() => {
    createQuiz('addition', 3); // 3 questions for demo
  }, []);

  // Track time when question appears
  useEffect(() => {
    if (currentQuestion) {
      setStartTime(Date.now());
      setHintsUsed(0);
      setEvaluation(null);
    }
  }, [currentQuestionIndex]);

  // Show brain mode after first answer
  useEffect(() => {
    if (currentQuestionIndex > 0) {
      setShowBrainMode(true);
    }
  }, [currentQuestionIndex]);

  const handleAnswer = async (answer: any, questionEvaluation: any) => {
    const timeSpent = Date.now() - startTime;
    
    // Submit to intelligent learning system
    const result = await submitAnswer(answer, timeSpent, hintsUsed);
    
    if (result) {
      setEvaluation(result.evaluation);
      
      // Show summary if quiz complete
      if (result.sessionComplete) {
        const summaryData = await getSummary();
        setSummary(summaryData);
      }
    }
  };

  const handleHintRequest = async () => {
    const hint = await getHint(hintsUsed + 1, 'low');
    if (hint) {
      setHintsUsed(prev => prev + 1);
    }
    return hint;
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-lg">🧠 Sunny is preparing your adaptive quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={() => createQuiz('addition', 3)}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show summary screen
  if (summary) {
    return <DemoSummaryScreen summary={summary} />;
  }

  if (!currentQuestion) return null;

  const progress = ((currentQuestionIndex + 1) / (session?.totalQuestions || 3)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Adaptive Learning Demo
          </h1>
          <p className="text-gray-600">
            Watch Sunny adapt to your learning style in real-time!
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {session?.totalQuestions}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="space-y-6">
                {/* Question Type Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {currentQuestion.type.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Difficulty: {currentQuestion.difficulty}
                  </span>
                </div>

                {/* Render Question */}
                {currentQuestion.type === 'fill-in-blank' && (
                  <FillInBlank
                    content={currentQuestion.content as any}
                    onAnswer={handleAnswer}
                    showFeedback={true}
                  />
                )}

                {/* Progressive Hints */}
                {!evaluation && (
                  <ProgressiveHints
                    hints={currentQuestion.scaffolding.hints}
                    onHintUsed={handleHintRequest}
                  />
                )}

                {/* Evaluation Feedback */}
                <AnimatePresence>
                  {evaluation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <div className={`p-6 rounded-lg border-2 ${
                        evaluation.correct 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-orange-50 border-orange-300'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">
                            {evaluation.correct ? '✅' : '💪'}
                          </span>
                          <div>
                            <h3 className="font-bold text-lg">
                              {evaluation.feedback}
                            </h3>
                            <p className="text-sm text-gray-700">
                              {evaluation.explanation}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-center font-medium text-gray-700 mt-4">
                          {evaluation.encouragement}
                        </p>
                      </div>

                      {/* Next Button */}
                      <Button
                        onClick={() => {
                          setEvaluation(null);
                          // Next question will load automatically
                        }}
                        className="w-full"
                        size="lg"
                      >
                        {currentQuestionIndex < (session?.totalQuestions || 3) - 1
                          ? 'Next Question →'
                          : 'See Results 🎉'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Demo Callouts */}
            <DemoCallouts
              hintsUsed={hintsUsed}
              difficulty={currentQuestion.difficulty}
              bloomsLevel={currentQuestion.bloomsLevel}
            />
          </div>

          {/* Brain Mode Sidebar */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {showBrainMode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-6"
                >
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">🧠 Brain Mode</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        LIVE
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-semibold text-blue-900">
                          🎯 Adaptive Difficulty
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          Targeting 75% success rate (ZPD)
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-semibold text-green-900">
                          💡 Scaffolding Active
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          {hintsUsed} hints used • Progressive support
                        </p>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="font-semibold text-purple-900">
                          📊 Learning Analysis
                        </p>
                        <p className="text-purple-700 text-xs mt-1">
                          Bloom's Level: {currentQuestion.bloomsLevel}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 text-center">
                        This is what makes Sunny intelligent! 🚀
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Callouts Component
function DemoCallouts({ hintsUsed, difficulty, bloomsLevel }: any) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg"
      >
        <div className="text-2xl mb-1">🎯</div>
        <div className="text-xs font-semibold">Adaptive</div>
        <div className="text-xs opacity-90">Difficulty adjusts</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg"
      >
        <div className="text-2xl mb-1">💡</div>
        <div className="text-xs font-semibold">Smart Hints</div>
        <div className="text-xs opacity-90">{hintsUsed} used so far</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg"
      >
        <div className="text-2xl mb-1">🧠</div>
        <div className="text-xs font-semibold">AI Analysis</div>
        <div className="text-xs opacity-90">Real-time</div>
      </motion.div>
    </div>
  );
}

// Summary Screen Component
function DemoSummaryScreen({ summary }: { summary: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-6xl">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900">
            Amazing Work!
          </h1>
          <p className="text-xl text-gray-600">
            Here's what Sunny learned about you
          </p>
        </motion.div>

        {/* Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold mb-6">📊 Your Performance</h2>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(summary.performance.accuracy * 100)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {summary.performance.correctAnswers}/{summary.performance.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(summary.performance.averageTimePerQuestion)}s
              </div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </div>
          </div>

          <Progress 
            value={summary.performance.scorePercentage} 
            className="h-3"
          />
        </motion.div>

        {/* Brain Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold mb-6">🧠 Brain Analysis</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">
                Learning Style: {summary.brainAnalysis.learningStyle}
              </div>
              <div className="text-sm text-blue-700">
                Performance Pattern: {summary.brainAnalysis.performancePattern}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">Key Insights:</div>
              {summary.brainAnalysis.insights.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-500">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        {summary.achievements && summary.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">🏆 Achievements Unlocked</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {summary.achievements.map((achievement: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg text-center"
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <div className="font-bold text-sm">{achievement.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {achievement.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-lg text-gray-700">
            This is just a taste of what Sunny can do!
          </p>
          <Button size="lg" className="px-8">
            Join the Waitlist →
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
```

---

## 🎨 Phase 2: Update Demo Page (10 minutes)

**File**: `src/app/demo/page.tsx`

Replace or add route to use new component:

```typescript
import { AdaptiveQuizDemo } from '@/components/demo/AdaptiveQuizDemo';

export default function DemoPage() {
  return <AdaptiveQuizDemo />;
}
```

---

## 📊 Phase 3: Add Demo Analytics (15 minutes)

Track demo engagement to measure effectiveness:

**File**: `src/lib/demo-analytics.ts`

```typescript
export function trackDemoEvent(event: string, data?: any) {
  console.log('Demo Event:', event, data);
  
  // Send to analytics (PostHog, Mixpanel, etc.)
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event, data);
  }
}

// Track key demo moments
export const demoEvents = {
  started: () => trackDemoEvent('demo_started'),
  questionAnswered: (correct: boolean, timeSpent: number) => 
    trackDemoEvent('demo_question_answered', { correct, timeSpent }),
  hintUsed: (hintLevel: number) => 
    trackDemoEvent('demo_hint_used', { hintLevel }),
  completed: (accuracy: number, totalTime: number) => 
    trackDemoEvent('demo_completed', { accuracy, totalTime }),
  waitlistClicked: () => 
    trackDemoEvent('demo_waitlist_clicked')
};
```

---

## 🎯 Success Metrics

### Track These KPIs:
- **Completion Rate**: % who finish all 3 questions
- **Hint Usage**: Average hints per question
- **Time to Complete**: Total demo duration
- **Accuracy**: % correct answers
- **Waitlist Conversion**: % who click waitlist CTA

### Target Goals:
- ✅ 70%+ completion rate
- ✅ 45%+ waitlist conversion
- ✅ <2 minutes average completion time
- ✅ 60%+ accuracy (shows appropriate difficulty)

---

## 🚀 Quick Start

```bash
# 1. Make sure quiz API is running
npm run dev

# 2. Navigate to demo
http://localhost:3000/demo

# 3. Watch the magic happen!
```

---

## 💡 Demo Talking Points

### For Investors/Partners:
1. **"Watch real-time adaptation"** - Difficulty adjusts based on performance
2. **"Progressive scaffolding"** - Hints get more specific as needed
3. **"Brain Mode transparency"** - See the AI thinking process
4. **"Personalized insights"** - Learning style detection
5. **"Achievement system"** - Gamification that motivates

### For Parents:
1. **"Adapts to your child"** - Not too hard, not too easy
2. **"Helps when stuck"** - Smart hints guide learning
3. **"Shows their strengths"** - Detailed performance insights
4. **"Celebrates progress"** - Achievements and encouragement
5. **"Transparent AI"** - You can see how it works

---

## 📝 Next Enhancements

### Week 2:
- [ ] Add voice narration to quiz
- [ ] Animate difficulty adjustments visually
- [ ] Show "thinking" animation when AI processes
- [ ] Add confetti for achievements
- [ ] Create shareable results card

### Week 3:
- [ ] Multi-topic demo (let user choose)
- [ ] Comparison mode (with vs without adaptation)
- [ ] Parent view toggle
- [ ] Export results as PDF

---

## Summary

This enhanced demo will:
- ✅ Showcase the intelligent quiz engine
- ✅ Demonstrate real-time adaptation
- ✅ Highlight progressive scaffolding
- ✅ Show brain analysis capabilities
- ✅ Prove the technology works
- ✅ Drive waitlist conversions

**Estimated Build Time**: 1 hour
**Impact**: HIGH - Shows the "secret sauce"
**Conversion Lift**: +20-30% expected

Ready to build this? 🚀
