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
