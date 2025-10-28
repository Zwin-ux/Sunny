# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sunny AI for Kids is a Next.js 15-based educational AI chat application designed for children aged 6-10. The application provides:
- Child-friendly AI chat with Sunny, an adaptive AI tutor
- Interactive learning gallery with educational content organized by topic
- Teacher dashboard for creating and managing custom lesson plans
- Multi-agent learning system for personalized education
- Demo mode for showcasing without API dependencies

## Core Technology Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 18.3.1
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **AI Integration**: OpenAI API (gpt-4-turbo)
- **UI Components**: Radix UI primitives with custom components
- **Internationalization**: next-intl 4.1.0
- **Testing**: Vitest 3.2.4

## Common Development Commands

```bash
# Development server
npm run dev                  # Start dev server at http://localhost:3000

# Build and production
npm run build               # Production build
npm start                   # Start production server
npm run vercel-build        # Build for Vercel deployment (with type checking)

# Code quality
npm run lint                # Run ESLint
npm run typecheck           # Run TypeScript compiler without emitting files

# Testing
npm test                    # Run Vitest tests for sunny-ai module

# Pre-deployment verification
npm run preflight           # Run build, test, typecheck, and lint in sequence
```

## Architecture and Key Concepts

### Path Aliases

The project uses TypeScript path aliases for clean imports:
- `@/*` → `./src/*` (primary alias for source files)
- `~/*` → `./*` (root-level files)

Always use `@/` imports when referencing source files (e.g., `@/lib/sunny-ai`, `@/components/ui/button`).

### Demo Mode System

Sunny includes a robust demo mode (`src/lib/demo-mode.ts`) that activates when:
1. `SUNNY_DEMO_MODE=true` is set, OR
2. In production without proper API configuration

When demo mode is active:
- Mock data is used for lesson plans, chat history, and user profiles
- API calls return fallback responses instead of errors
- Full UI functionality maintained without backend dependencies

Check demo mode status: `isDemoMode()` from `@/lib/demo-mode`

### Multi-Agent Learning System

Located in `src/lib/agents/`, this is a sophisticated agentic architecture:

- **Agent Manager** (`agent-manager.ts`): Main interface for integrating agents with the Sunny application
  - Singleton instance: `globalAgentManager`
  - Initializes and coordinates multiple specialized agents
  - Converts between `StudentProfile` and `EnhancedStudentProfile`

- **Learning Orchestrator** (`orchestrator.ts`): Coordinates agent interactions
  - Manages learning state for each student
  - Processes student interactions through multiple agents
  - Publishes events for agent coordination

- **Event System** (`event-system.ts`): Pub/sub system for agent communication
  - Singleton instance: `globalEventSystem`
  - Handles event prioritization and routing

- **Agent Types** (defined in `types.ts`):
  - `assessment`: Evaluates student knowledge and progress
  - `contentGeneration`: Creates personalized learning content
  - `pathPlanning`: Plans learning paths and objectives
  - `intervention`: Detects when students need help
  - `communication`: Manages AI responses and tone

**Usage Pattern**:
```typescript
import { globalAgentManager } from '@/lib/agents';

// Initialize once
await globalAgentManager.initialize();

// Process student message
const result = await globalAgentManager.processStudentMessage(
  studentId,
  message,
  studentProfile
);
```

### AI Integration Architecture

Primary AI module: `src/lib/sunny-ai.ts`

Key functions:
- `generateSunnyResponse()`: Streams AI responses using OpenAI's GPT-4 Turbo
- `generateAgenticSunnyResponse()`: Enhanced responses using the multi-agent system (with fallback to traditional generation)
- `generateMiniChallenge()`: Creates dynamic educational challenges using OpenAI with JSON mode
- `generateFeedback()`: Provides personalized feedback on student answers
- `generatePersonalizedContent()`: Generates quizzes, lessons, or activities through agent system

All AI functions gracefully degrade to fallback responses when API calls fail.

### Lesson Plan System

Structured lesson plans in `src/lib/lesson-plans.ts`:

**Type Hierarchy**:
- `LessonPlan`: Top-level lesson structure with metadata (id, title, category, gradeLevel, author, tags)
- `LessonContent`: Learning content (title, description, keywords, learningOutcomes, activities, relatedTopics)
- `LearningActivity`: Individual activity within a lesson (id, type, difficulty, estimatedTimeMinutes, ageRange)

**Activity Types**: `multiple-choice`, `creative`, `discussion`, `pattern`, `matching`

Sample lesson plans are exported in `sampleLessonPlans` array. Teachers can create custom lessons via the dashboard.

### Type System

Primary types defined in `src/types/`:

- **chat.ts**: Core chat and student types
  - `Message` union type: `UserMessage | AssistantMessage | ChallengeMessage | FeedbackMessage`
  - `StudentProfile`: Student data including emotion, learningStyle, difficulty
  - `Challenge`: Educational challenge structure
  - `LearningStyle`: `'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'logical'`
  - `DifficultyLevel`: `'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced'`

- **agents/types.ts**: Enhanced types for the agentic learning system
  - `EnhancedStudentProfile`: Extended profile with cognitive data, motivation factors, learning velocity
  - `LearningState`: Tracks student's current learning state
  - `AgentType`: Defines available agent types

### API Routes

Located in `src/app/api/`:

- **`/api/learn/route.ts`**: Main learning endpoint
  - Handles `type: 'plan'` for generating learning plans
  - Handles `type: 'quiz'` for generating adaptive quiz questions
  - Handles `type: 'chat'` for conversational learning
  - Includes rate limiting, caching, and graceful fallbacks
  - Demo mode support built-in

- **`/api/user/route.ts`**: User management (assumed from imports)

### Caching and Performance

**In-Memory Cache** (`src/lib/cache.ts`):
- Singleton instance: `cache`
- Methods: `get()`, `set()`, `delete()`, `clear()`
- Auto-cleanup of expired entries
- Max 1000 entries to prevent memory leaks

**Rate Limiting** (`src/lib/rate-limit.ts`):
- Function: `rateLimit(identifier, endpoint, windowSeconds, limit)`
- In-memory store (replace with Redis for production scaling)
- Auto-cleanup of expired records

### Logging

Structured logger in `src/lib/logger.ts`:
- Methods: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
- Used throughout API routes and core modules

## Environment Configuration

Create `.env.local` with:

```env
# Required for AI functionality
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Enable demo mode (also auto-enables in production without API key)
SUNNY_DEMO_MODE=true
```

## Application Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── learn/           # Main learning endpoint
│   │   └── user/            # User management
│   ├── dashboard/           # Teacher dashboard
│   ├── page.tsx             # Main student chat interface
│   └── layout.tsx           # Root layout with providers
├── components/              # Reusable React components
│   ├── ui/                 # Base UI components (Radix-based)
│   ├── interactive/        # Interactive learning components
│   ├── sunny-character.tsx # Animated Sunny character
│   ├── emotion-selector.tsx # Emotion selection UI
│   └── LanguageSelector.tsx # i18n language selector
├── lib/                     # Core business logic
│   ├── agents/             # Multi-agent learning system
│   │   ├── agent-manager.ts      # Main agent coordinator
│   │   ├── orchestrator.ts       # Learning orchestration
│   │   ├── event-system.ts       # Event pub/sub
│   │   ├── base-agent.ts         # Base agent class
│   │   └── types.ts              # Agent type definitions
│   ├── sunny-ai.ts         # OpenAI integration and AI functions
│   ├── lesson-plans.ts     # Lesson plan structure and samples
│   ├── demo-mode.ts        # Demo mode utilities and mock data
│   ├── cache.ts            # In-memory caching
│   ├── rate-limit.ts       # API rate limiting
│   ├── logger.ts           # Structured logging
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
│   ├── chat.ts             # Chat and student profile types
│   └── user.ts             # User data types
├── hooks/                   # Custom React hooks
│   ├── useSpeech.ts        # Speech synthesis
│   └── use-mobile.tsx      # Mobile detection
└── styles/                  # Global styles
    └── globals.css         # Tailwind and global CSS
```

## Development Patterns

### Adding New AI Features

1. Define types in `src/types/chat.ts` or create new type file
2. Implement AI logic in `src/lib/sunny-ai.ts` with OpenAI integration
3. Add fallback/demo data in `src/lib/demo-mode.ts`
4. Create API route in `src/app/api/` with rate limiting and caching
5. Build UI components in `src/components/`

### Working with Agents

When modifying the agent system:
1. Agent types are defined in `src/lib/agents/types.ts`
2. New agents should extend `BaseAgent` from `base-agent.ts`
3. Register agents in `agent-manager.ts` via `registerPlaceholderAgents()` or create dedicated agent classes
4. Use `globalAgentManager` for integration with Sunny application
5. Publish events via `globalEventSystem` for agent coordination

### Creating Lesson Plans

Lesson plans follow the structure in `src/lib/lesson-plans.ts`:
1. Define learning outcomes and activities
2. Specify age ranges and difficulty levels
3. Add to `sampleLessonPlans` or create via teacher dashboard
4. Use appropriate `ActivityType` for each activity

### Internationalization

The app uses `next-intl` for i18n:
- Language selector component: `src/components/LanguageSelector.tsx`
- Wrap strings in translation functions where needed
- Default language: English (en)

## Important Notes

- **Type Safety**: Always run `npm run typecheck` before committing
- **Demo Mode**: Test features in demo mode to ensure graceful degradation
- **Child Safety**: Keep all content age-appropriate for ages 6-10
- **Accessibility**: Maintain high contrast and large, colorful buttons
- **API Errors**: Always provide fallback responses for production stability
- **Path Imports**: Use `@/` prefix for all source imports
- **Gemini CLI**: The `gemini-cli` directory is excluded from TypeScript compilation (see tsconfig.json)

## Testing

- Primary test file: `src/lib/sunny-ai.test.ts`
- Run tests: `npm test`
- Tests use Vitest framework
- Add tests for new AI functions and utility modules

## Deployment

- Configured for Vercel deployment
- `npm run vercel-build` performs type checking before build
- Environment variables must be set in Vercel dashboard
- Demo mode automatically activates in production if OPENAI_API_KEY is missing

---

## Focus Sessions System ⭐ NEW

**20-Minute Adaptive Learning Sessions** - An advanced system that extracts concepts from conversations, generates practice artifacts (flashcards, quizzes, micro-games), and adapts difficulty in real-time.

### Overview

Located in `src/lib/focus-sessions/`, this system implements a structured learning loop:

1. **Extract**: Analyze context and build concept maps
2. **Choose**: Select optimal learning modality
3. **Generate**: Create adaptive artifacts using AI
4. **Score**: Track performance and engagement
5. **Plan**: Generate personalized review plans

### Core Components

#### Session Orchestrator (`session-orchestrator.ts`)

Main coordinator for 20-minute focus sessions:

```typescript
import { sessionOrchestrator } from '@/lib/focus-sessions';

// Start a new session
const session = await sessionOrchestrator.start({
  studentId: 'student-123',
  topic: 'multiplication',
  targetDuration: 1200, // 20 minutes in seconds
  inputContext: 'Recent chat messages about math',
  learningGoals: ['Master times tables', 'Apply to word problems']
});

// Start a learning loop
const loop = await sessionOrchestrator.startLoop(session.id, 1);

// Record student results
sessionOrchestrator.recordResults(session.id, loop.loopNumber, results);

// Complete the loop and calculate performance
const performance = await sessionOrchestrator.completeLoop(session.id, loop.loopNumber);

// Complete the entire session
const { performance: sessionPerf, reviewPlan } = await sessionOrchestrator.complete(session.id);
```

**Key Features**:
- Manages 3-4 learning loops per session
- Automatically adjusts difficulty based on performance
- Tracks concept mastery across sessions
- Generates adaptive review plans

#### Concept Extractor (`concept-extractor.ts`)

AI-powered concept extraction using GPT-4:

```typescript
import { conceptExtractor } from '@/lib/focus-sessions';

// Extract concepts from context
const conceptMap = await conceptExtractor.extractConcepts(
  'multiplication',
  'Student asked about 3 x 4 and 7 x 8...',
  ['Master multiplication facts', 'Understand commutative property']
);

// Update concept map based on performance
const updated = await conceptExtractor.updateConceptMap(
  existingMap,
  'New interaction context',
  [{ subtopic: 'Times Tables', accuracy: 0.85, timestamp: Date.now() }]
);

// Get next subtopics to practice
const nextTopics = conceptExtractor.suggestNextSubtopics(conceptMap, 3);
```

**Concept Map Structure**:
- Topic and subtopics with mastery levels
- Prerequisites and dependencies
- Common misconceptions
- Concrete examples
- Learning goals

#### Artifact Generator (`artifact-generator.ts`)

Generates three types of learning artifacts using AI:

**1. Flashcards**:
```typescript
import { artifactGenerator } from '@/lib/focus-sessions';

const flashcards = await artifactGenerator.generateFlashcards({
  modality: 'flashcards',
  targetSubtopics: ['Basic Multiplication', 'Word Problems'],
  difficulty: 'easy',
  constraints: {
    timeLimitSeconds: 300,
    maxItems: 10,
    includeHints: true,
    includeExplanations: true,
    visualAids: true,
  },
  conceptMap,
});
```

**2. Quizzes**:
```typescript
const quiz = await artifactGenerator.generateQuiz({
  modality: 'quiz',
  targetSubtopics: ['Times Tables'],
  difficulty: 'medium',
  constraints: { maxItems: 8, includeHints: true },
  conceptMap,
});
```

**3. Micro-Games**:
```typescript
const game = await artifactGenerator.generateMicroGame({
  modality: 'micro_game',
  targetSubtopics: ['Pattern Recognition'],
  difficulty: 'easy',
  constraints: { timeLimitSeconds: 180 },
  conceptMap,
});
```

**Artifact Features**:
- AI-generated unique content for each session
- Age-appropriate language (6-10 years old)
- Adaptive difficulty based on performance
- Integrated with existing game system
- Spaced repetition for flashcards

#### Difficulty Adapter (`difficulty-adapter.ts`)

Real-time difficulty adjustment:

```typescript
import { difficultyAdapter } from '@/lib/focus-sessions';

// Check if difficulty should adjust
const check = difficultyAdapter.shouldAdjustDifficulty(
  loopPerformance,
  currentDifficulty
);

if (check.shouldAdjust) {
  console.log(`Adjusting to ${check.newDifficulty}: ${check.reason}`);
}

// Get difficulty parameters
const params = difficultyAdapter.getDifficultyParameters('medium');
// { targetAccuracy: 0.7, hintsAvailable: 2, timePerItem: 20, ... }

// Calculate frustration level
const frustration = difficultyAdapter.calculateFrustrationLevel({
  accuracy: 0.45,
  consecutiveFailures: 3,
  hintsUsed: 5,
  averageTimePerItem: 35,
  engagementLevel: 0.4,
});
```

**Adjustment Triggers**:
- **Increase Difficulty**: accuracy ≥ 80% + low frustration
- **Decrease Difficulty**: accuracy ≤ 50% OR frustration ≥ 60%
- **Switch Modality**: Low engagement or high frustration

**Difficulty Tiers**: `beginner` → `easy` → `medium` → `hard` → `advanced` → `expert`

#### Memory Manager (`memory-manager.ts`)

Persistent storage of session summaries and concept memories:

```typescript
import { memoryManager } from '@/lib/focus-sessions';

// Store session summary (automatic after session completes)
const summary = await memoryManager.generateSessionSummary(session, performance);

// Get session history
const recentSessions = memoryManager.getRecentSessionSummaries(10);
const topicSessions = memoryManager.getSessionSummariesByTopic('multiplication');

// Concept memory tracking
memoryManager.updateConceptMemory(
  'Times Tables',
  { type: 'quiz', result: 'success', timestamp: Date.now(), context: 'Focus session', weight: 0.8 },
  0.85 // new mastery level
);

// Get concepts needing review
const dueForReview = memoryManager.getConceptsDueForReview();
const weakConcepts = memoryManager.getWeakConcepts(0.6);

// Storage stats
const stats = memoryManager.getStorageStats();
// { totalSessions: 25, totalConcepts: 120, storageUsed: 45000, hasActiveSession: true }
```

**Storage Strategy**:
- **Browser**: localStorage for session history (last 50 sessions)
- **Concept Memories**: Top 200 concepts by mastery and recency
- **Spaced Repetition**: Automatic scheduling based on performance
- **Future**: Vector embeddings for semantic search

### UI Components

Located in `src/components/focus-sessions/`:

#### SessionDashboard

Real-time session monitoring:

```tsx
import { SessionDashboard } from '@/components/focus-sessions';

<SessionDashboard
  session={currentSession}
  currentLoop={activeLoop}
  onLoopChange={(loopNumber) => console.log(`View loop ${loopNumber}`)}
/>
```

**Features**:
- Live timer with progress bar
- Current activity indicator
- Accuracy and concept tracking
- Loop history with performance
- Concept map visualization

#### FlashcardPlayer

Interactive flashcard practice:

```tsx
import { FlashcardPlayer } from '@/components/focus-sessions';

<FlashcardPlayer
  flashcardSet={flashcards}
  onComplete={(results) => {
    // Process flashcard results
    console.log(`Recalled ${results.filter(r => r.recalled).length} cards`);
  }}
  onCardResult={(result) => {
    // Real-time result tracking
  }}
/>
```

**Features**:
- Flip animation (front/back)
- Confidence rating (Didn't Know / Hard / Good / Easy)
- Spaced repetition integration
- Progress tracking with streak counter
- Navigation between cards

#### SessionReview

Post-session summary and recommendations:

```tsx
import { SessionReview } from '@/components/focus-sessions';

<SessionReview
  performance={sessionPerformance}
  reviewPlan={reviewPlan}
  onStartNextSession={() => startNewSession()}
  onClose={() => exitSession()}
/>
```

**Shows**:
- Overall performance metrics
- Concepts mastered vs. needing review
- Session achievements
- Personalized next steps
- Recommended difficulty and modality

### Type Definitions

All types defined in `src/types/focus-session.ts`:

**Core Types**:
- `FocusSession` - Complete session state
- `SessionLoop` - Individual 5-7 minute loop
- `ConceptMap` - Topic breakdown with subtopics
- `FlashcardSet`, `Quiz`, `MicroGameSpec` - Artifact types
- `LoopPerformance`, `SessionPerformance` - Metrics
- `ReviewPlan` - Next session recommendations
- `SessionSummary` - Condensed session history
- `ConceptMemory` - Long-term concept tracking

**Constants**:
```typescript
import { DEFAULT_SESSION_CONFIG } from '@/types/focus-session';

// Default configuration
{
  defaultDuration: 1200, // 20 minutes
  loopDuration: 360, // 5-7 minutes per loop
  difficultyUpThreshold: 0.8,
  difficultyDownThreshold: 0.5,
  frustrationThreshold: 0.6,
  flashcardSetSize: 10,
  quizItemCount: 8,
  microGameRounds: 3,
}
```

### Performance Metrics

Focus Sessions track **15+ metrics**:

**Accuracy Metrics**:
- Correct/incorrect responses
- Completion rate
- Per-concept mastery

**Engagement Metrics**:
- Attention score (0-1)
- Frustration level (0-1)
- Engagement level (0-1)
- Time on task

**Learning Indicators**:
- Improvement rate over loops
- Concept mastery by topic
- Knowledge gaps identified
- Teaching strategy (reinforce/advance/remediate/diversify)

### Integration with Existing Systems

#### With Agent System

Focus sessions can be triggered and monitored by the agent system:

```typescript
// In a custom focus session agent
import { sessionOrchestrator } from '@/lib/focus-sessions';

class FocusSessionAgent extends BaseAgent {
  async processMessage(message: AgentMessage) {
    // Detect when student would benefit from focus session
    if (shouldStartFocusSession(message)) {
      const session = await sessionOrchestrator.start({
        studentId: message.payload.studentId,
        topic: detectedTopic,
        targetDuration: 1200,
      });

      return {
        success: true,
        recommendations: [{
          type: 'action',
          priority: 'high',
          description: 'Start focus session',
          data: { sessionId: session.id },
          confidence: 0.9,
        }],
      };
    }
  }
}
```

#### With Game System

Micro-games integrate with the existing game system:

```typescript
// Convert MicroGameSpec to GameConfig
const gameConfig = {
  id: microGame.id,
  type: microGame.gameType,
  difficulty: microGame.difficulty,
  // ... map other fields
};

// Use existing GameContainer component
<GameContainer
  studentId={studentId}
  gameConfig={gameConfig}
  onComplete={(performance) => {
    // Feed results back to focus session
    sessionOrchestrator.recordResults(sessionId, loopNumber, gameResults);
  }}
/>
```

#### With Chat Interface

Trigger sessions from conversation:

```typescript
// In useLearningChat.ts
if (message.includes('focus session') || message.includes('practice session')) {
  const session = await sessionOrchestrator.start({
    studentId: profile.name,
    topic: extractedTopic,
    inputContext: recentMessages.join('\n'),
  });

  // Show focus session UI
  setActiveFocusSession(session);
}
```

### Event System

Focus sessions emit events via EventEmitter:

```typescript
sessionOrchestrator.on('session:started', (event) => {
  console.log(`Session started: ${event.session.id}`);
});

sessionOrchestrator.on('session:loop:completed', (event) => {
  console.log(`Loop ${event.loop.loopNumber} completed`);
  console.log(`Accuracy: ${event.performance.accuracy}`);
});

sessionOrchestrator.on('session:difficulty:adjusted', (event) => {
  console.log(`Difficulty changed: ${event.adjustment.reason}`);
});

sessionOrchestrator.on('session:concept:mastered', (event) => {
  console.log(`Mastered ${event.concept}! 🎉`);
});

sessionOrchestrator.on('session:completed', (event) => {
  console.log(`Session complete!`);
  console.log(`Performance: ${event.performance.averageAccuracy}`);
});
```

### Usage Example

**Complete Focus Session Flow**:

```typescript
import { sessionOrchestrator, memoryManager } from '@/lib/focus-sessions';
import { SessionDashboard, FlashcardPlayer, SessionReview } from '@/components/focus-sessions';

// 1. Start session
const session = await sessionOrchestrator.start({
  studentId: 'student-123',
  topic: 'multiplication',
  targetDuration: 1200,
  inputContext: 'Recent conversation about math',
  learningGoals: ['Master times tables'],
});

// 2. Run 3-4 loops
for (let loopNum = 1; loopNum <= 3; loopNum++) {
  // Start loop (generates artifact)
  const loop = await sessionOrchestrator.startLoop(session.id, loopNum);

  // Present artifact to student
  if (loop.artifact.type === 'flashcards') {
    <FlashcardPlayer
      flashcardSet={loop.artifact.data}
      onComplete={(results) => {
        sessionOrchestrator.recordResults(session.id, loopNum, results);
        sessionOrchestrator.completeLoop(session.id, loopNum);
      }}
    />
  }
  // ... handle quiz and micro_game similarly
}

// 3. Complete session
const { session: finalSession, performance } = await sessionOrchestrator.complete(session.id);

// 4. Show review
<SessionReview
  performance={performance}
  reviewPlan={finalSession.reviewPlan}
  onStartNextSession={() => {
    // Start new session based on recommendations
  }}
/>

// 5. Access session history
const recentSessions = memoryManager.getRecentSessionSummaries(5);
const conceptMemories = memoryManager.getAllConceptMemories();
```

### Best Practices

**When to Use Focus Sessions**:
- Student requests structured practice
- Specific topic needs reinforcement
- Regular 20-minute learning bursts
- Spaced repetition review
- Concept mastery tracking

**Configuration Tips**:
- Start with `easy` or `beginner` difficulty
- Allow 3-4 loops per 20-minute session
- Mix modalities for engagement
- Check for frustration and adapt quickly
- Save summaries for future reference

**Error Handling**:
- All generators have fallback modes (work without OpenAI)
- Session state persists in localStorage
- Recover interrupted sessions on page reload
- Demo mode compatible

### Spaced Repetition

Flashcards use SM-2 algorithm:

```typescript
// Automatic interval calculation
const card = {
  easeFactor: 2.5, // 1.3 - 2.5
  interval: 1, // days until next review
  timesReviewed: 0,
  timesCorrect: 0,
};

// After correct recall
if (confidence === 'easy') {
  card.easeFactor += 0.15;
  card.interval *= 2.5;
} else if (confidence === 'good') {
  card.interval *= 2.0;
} else if (confidence === 'hard') {
  card.easeFactor -= 0.15;
  card.interval *= 1.2;
}

// After incorrect recall
card.interval = 1; // reset to 1 day
card.easeFactor -= 0.2;
```

**Review Schedule**:
- Cards auto-scheduled for review
- `memoryManager.getConceptsDueForReview()` returns cards due today
- Weak concepts (<60% mastery) prioritized
- Review plans include spaced repetition recommendations

### Troubleshooting

**Session won't start**:
- Check OpenAI API key configured
- Fall back to demo mode works without API
- Check studentId is valid

**Difficulty not adjusting**:
- Verify performance thresholds met (80% up, 50% down)
- Check frustration level calculation
- Review loop performance data

**Storage full**:
```typescript
// Clear old data
memoryManager.clearAllData();

// Or manually prune
const summaries = memoryManager.getAllSessionSummaries();
// Keep only recent ones and re-save
```

**Performance tracking**:
- All metrics logged to console in development
- Use browser DevTools to inspect session state
- Check localStorage for persisted data

### Future Enhancements

**Planned Features**:
- Vector embeddings for semantic concept matching
- Multi-session learning paths
- Collaborative focus sessions
- Voice-guided flashcards
- Visual concept map editor
- Export session reports
- Parent/teacher dashboards
- Integration with curriculum standards

**Database Integration** (when backend added):
```typescript
// Replace localStorage with API calls
// POST /api/focus-sessions/summaries
// GET /api/focus-sessions/concepts/:studentId
// PUT /api/focus-sessions/concepts/:conceptId
```

---
