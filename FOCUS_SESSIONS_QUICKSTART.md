# Focus Sessions - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Import the System
```typescript
import { sessionOrchestrator, memoryManager } from '@/lib/focus-sessions';
import { SessionDashboard, FlashcardPlayer, SessionReview } from '@/components/focus-sessions';
```

### 2. Start a Session
```typescript
const session = await sessionOrchestrator.start({
  studentId: 'student-123',
  topic: 'multiplication',
  targetDuration: 1200, // 20 minutes
  inputContext: 'Student asked about 3 × 4 and struggling with word problems',
  learningGoals: ['Master times tables', 'Solve word problems']
});
```

### 3. Run a Loop
```typescript
const loop = await sessionOrchestrator.startLoop(session.id, 1);

// Loop artifact is automatically generated!
console.log(loop.artifact.type); // 'flashcards' | 'quiz' | 'micro_game'
```

### 4. Show UI
```tsx
{loop.artifact.type === 'flashcards' && (
  <FlashcardPlayer
    flashcardSet={loop.artifact.data}
    onComplete={(results) => {
      // Record results
      sessionOrchestrator.recordResults(session.id, loop.loopNumber, results);

      // Calculate performance
      const perf = await sessionOrchestrator.completeLoop(session.id, loop.loopNumber);

      console.log(`Accuracy: ${perf.accuracy}`);
      console.log(`Frustration: ${perf.frustrationLevel}`);
    }}
  />
)}
```

### 5. Complete Session
```typescript
const { performance, session: finalSession } = await sessionOrchestrator.complete(session.id);

// Show review
<SessionReview
  performance={performance}
  reviewPlan={finalSession.reviewPlan}
  onStartNextSession={() => startNewSession()}
/>
```

## 📊 Quick Access to Data

```typescript
// Session history
const recent = memoryManager.getRecentSessionSummaries(10);
const byTopic = memoryManager.getSessionSummariesByTopic('multiplication');

// Concept tracking
const weak = memoryManager.getWeakConcepts(0.6);
const dueForReview = memoryManager.getConceptsDueForReview();

// Storage stats
const stats = memoryManager.getStorageStats();
```

## 🎯 Common Patterns

### Pattern 1: Auto-Start from Chat
```typescript
// In useLearningChat.ts
if (message.toLowerCase().includes('practice session')) {
  const topic = extractTopicFrom(message);

  const session = await sessionOrchestrator.start({
    studentId: profile.id,
    topic,
    inputContext: recentMessages.join('\n')
  });

  setActiveFocusSession(session);
}
```

### Pattern 2: Listen to Events
```typescript
sessionOrchestrator.on('session:difficulty:adjusted', (event) => {
  showNotification(`Difficulty changed to ${event.adjustment.toDifficulty}: ${event.adjustment.reason}`);
});

sessionOrchestrator.on('session:concept:mastered', (event) => {
  celebrate(`You mastered ${event.concept}! 🎉`);
});
```

### Pattern 3: Custom Difficulty
```typescript
// Override automatic difficulty selection
const loop = await sessionOrchestrator.startLoop(
  session.id,
  loopNum,
  'quiz' // force quiz modality
);

// Or manually adjust
session.currentDifficulty = 'advanced';
```

### Pattern 4: Recover Session
```typescript
// On page load
const activeSession = memoryManager.getActiveSession();
if (activeSession) {
  console.log(`Recovered session ${activeSession.id}`);
  sessionOrchestrator.recoverSession();
}
```

## ⚙️ Configuration

```typescript
import { DEFAULT_SESSION_CONFIG } from '@/types/focus-session';

// Defaults:
{
  defaultDuration: 1200,       // 20 min
  loopDuration: 360,           // 6 min per loop
  difficultyUpThreshold: 0.8,  // 80% accuracy
  difficultyDownThreshold: 0.5, // 50% accuracy
  frustrationThreshold: 0.6,   // 60% frustration
  flashcardSetSize: 10,
  quizItemCount: 8,
  microGameRounds: 3
}
```

## 🔧 Troubleshooting

### No AI responses?
```typescript
// Check API key
console.log(process.env.OPENAI_API_KEY ? 'OK' : 'Missing');

// Falls back to demo mode automatically
// Look for "OpenAI not configured" in console
```

### Session won't complete?
```typescript
// Check all loops are completed
session.loops.forEach(loop => {
  if (!loop.endTime) {
    console.log(`Loop ${loop.loopNumber} not completed`);
  }
});
```

### Storage full?
```typescript
// Clear old data
memoryManager.clearAllData();

// Or check usage
const { storageUsed, totalSessions } = memoryManager.getStorageStats();
console.log(`Using ${storageUsed} bytes, ${totalSessions} sessions`);
```

## 📚 Key Types

```typescript
// Session
interface FocusSession {
  id: string;
  topic: string;
  status: 'planning' | 'active' | 'completed';
  currentDifficulty: DifficultyLevel;
  conceptMap: ConceptMap;
  loops: SessionLoop[];
}

// Performance
interface LoopPerformance {
  accuracy: number;              // 0-1
  frustrationLevel: number;      // 0-1
  engagementLevel: number;       // 0-1
  conceptsImproved: string[];
  weakAreas: string[];
}

// Review Plan
interface ReviewPlan {
  nextGoals: string[];
  recommendedModality: 'flashcards' | 'quiz' | 'micro_game';
  targetDifficulty: DifficultyLevel;
  targetSubtopics: string[];
  reviewSubtopics: string[];
  reasoning: string;
}
```

## 🎨 UI Component Props

### SessionDashboard
```tsx
<SessionDashboard
  session={session}              // FocusSession
  currentLoop={loop}             // SessionLoop | undefined
  onLoopChange={(num) => {...}}  // optional
/>
```

### FlashcardPlayer
```tsx
<FlashcardPlayer
  flashcardSet={flashcards}      // FlashcardSet
  onComplete={(results) => {...}} // FlashcardResult[]
  onCardResult={(result) => {...}} // optional per-card tracking
/>
```

### SessionReview
```tsx
<SessionReview
  performance={performance}       // SessionPerformance
  reviewPlan={reviewPlan}        // ReviewPlan
  onStartNextSession={() => {...}}
  onClose={() => {...}}
/>
```

## 🔗 Integration Checklist

- [ ] Import focus sessions modules
- [ ] Add session state to component
- [ ] Create session start trigger (button/chat command)
- [ ] Implement loop flow (3-4 loops)
- [ ] Handle flashcard/quiz/game rendering
- [ ] Record results after each loop
- [ ] Show SessionReview on completion
- [ ] Test difficulty adaptation
- [ ] Test session recovery
- [ ] Add analytics tracking

## 💡 Pro Tips

1. **Start Easy**: Begin with 'easy' or 'beginner' difficulty for new topics
2. **Mix Modalities**: Cycle through flashcards → quiz → game for engagement
3. **Watch Frustration**: If >0.6, system auto-adjusts but you can override
4. **Use Review Plans**: They contain AI-powered next steps - leverage them!
5. **Track Concepts**: Use `memoryManager.getConceptMemory(concept)` to see detailed history
6. **Event Driven**: Listen to orchestrator events for real-time insights
7. **Demo Mode**: Test without OpenAI - all features work with fallbacks
8. **Storage Aware**: Monitor `getStorageStats()` and prune if needed

## 📖 Learn More

- **Full Docs**: See `CLAUDE.md` → "Focus Sessions System" section
- **Implementation Details**: See `FOCUS_SESSIONS_IMPLEMENTATION.md`
- **Type Definitions**: See `src/types/focus-session.ts`
- **Examples**: See `CLAUDE.md` → "Usage Example" section

## 🆘 Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npm run typecheck` |
| AI not generating | Check `OPENAI_API_KEY` env var |
| Storage errors | Check browser localStorage enabled |
| Session not saving | Verify `memoryManager.storeActiveSession()` called |
| UI not updating | Check React state updates after async calls |

---

**Ready to build amazing adaptive learning experiences!** 🚀

For complete examples, see the full documentation in CLAUDE.md.
