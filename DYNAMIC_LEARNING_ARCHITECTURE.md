# 🎯 Dynamic Learning Architecture - Implementation Plan

## Executive Summary

This document outlines the architecture for transforming Sunny into a **truly effective teaching platform** with:
1. **Dynamic, Adaptive Quizzes** - Not static Q&A, but intelligent assessments
2. **Evidence-Based Teaching Methods** - Pedagogically sound approaches
3. **Customizable Lesson Plans** - Teachers/parents can create and share
4. **Enhanced Settings** - Granular control over learning experience

## Current Architecture Analysis

### ✅ Strengths
- **Solid Foundation**: Lesson repository, content types, learning brain
- **Agentic System**: Multi-agent architecture for intelligent responses
- **Database Schema**: Already has `lesson_plans` table
- **Type System**: Well-defined types for lessons, challenges, content

### ⚠️ Gaps
- **Quiz Generation**: Currently basic, not pedagogically optimized
- **Teaching Strategies**: Defined but not deeply integrated
- **Lesson Plan UI**: No interface for creating/editing lesson plans
- **Assessment Depth**: Limited formative assessment capabilities
- **Scaffolding**: Not systematically applied

## Proposed Architecture

### 1. Dynamic Quiz System

#### A. Pedagogical Quiz Engine
```typescript
interface PedagogicalQuiz {
  id: string;
  topic: string;
  learningObjectives: string[];
  
  // Bloom's Taxonomy levels targeted
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  
  // Question progression
  questions: AdaptiveQuestion[];
  
  // Scaffolding strategy
  scaffolding: {
    hints: string[];
    examples: string[];
    prerequisiteCheck: boolean;
  };
  
  // Formative assessment
  assessment: {
    diagnosticQuestions: Question[];  // Identify knowledge gaps
    progressiveQuestions: Question[]; // Build on success
    challengeQuestions: Question[];   // Extend learning
  };
}
```

#### B. Question Types (Beyond Multiple Choice)
```typescript
type QuestionType = 
  | 'multiple-choice'
  | 'multiple-select'      // Select all that apply
  | 'fill-in-blank'        // Complete the sentence
  | 'drag-and-drop'        // Order/match items
  | 'number-line'          // Place on a number line
  | 'drawing'              // Draw the answer
  | 'explain-your-thinking' // Open-ended with rubric
  | 'true-false-explain'   // T/F with justification
  | 'error-analysis'       // Find and fix the mistake
  | 'real-world-application'; // Apply to scenario
```

#### C. Adaptive Question Selection
```typescript
interface QuestionSelector {
  // Select next question based on:
  selectNextQuestion(
    studentState: StudentState,
    previousAnswers: Answer[],
    learningObjective: string
  ): AdaptiveQuestion;
  
  // Criteria:
  // 1. Zone of Proximal Development (ZPD)
  // 2. Error pattern analysis
  // 3. Cognitive load management
  // 4. Spaced repetition timing
}
```

### 2. Evidence-Based Teaching Methods

#### A. Teaching Strategy Framework
```typescript
interface TeachingMethod {
  name: string;
  evidence: 'high' | 'moderate' | 'emerging';
  bestFor: string[];
  implementation: {
    introduction: (topic: string) => Content;
    practice: (topic: string, level: number) => Activity[];
    assessment: (topic: string) => Quiz;
    feedback: (performance: Performance) => Feedback;
  };
}

const TEACHING_METHODS = {
  // High-evidence methods
  SPACED_REPETITION: { /* ... */ },
  RETRIEVAL_PRACTICE: { /* ... */ },
  INTERLEAVING: { /* ... */ },
  CONCRETE_EXAMPLES: { /* ... */ },
  DUAL_CODING: { /* ... */ },
  
  // Moderate-evidence methods
  ELABORATIVE_INTERROGATION: { /* ... */ },
  SELF_EXPLANATION: { /* ... */ },
  
  // Scaffolding techniques
  WORKED_EXAMPLES: { /* ... */ },
  FADING_SUPPORT: { /* ... */ },
  THINK_ALOUD: { /* ... */ }
};
```

#### B. Cognitive Load Management
```typescript
interface CognitiveLoadManager {
  // Prevent overload
  assessIntrinsicLoad(content: Content): number;
  assessExtraneousLoad(presentation: Presentation): number;
  assessGermaneLoad(activity: Activity): number;
  
  // Optimize presentation
  optimizeForLoad(
    content: Content,
    studentCapacity: number
  ): OptimizedContent;
  
  // Strategies:
  // - Chunking information
  // - Progressive disclosure
  // - Worked examples before practice
  // - Dual coding (visual + verbal)
}
```

### 3. Lesson Plan System

#### A. Lesson Plan Builder
```typescript
interface LessonPlanBuilder {
  // Template-based creation
  createFromTemplate(template: LessonTemplate): LessonPlan;
  
  // AI-assisted generation
  generateWithAI(params: {
    topic: string;
    gradeLevel: string;
    duration: number;
    learningObjectives: string[];
    teachingMethod: TeachingMethod;
  }): Promise<LessonPlan>;
  
  // Customization
  customize(plan: LessonPlan, modifications: Partial<LessonPlan>): LessonPlan;
  
  // Validation
  validate(plan: LessonPlan): ValidationResult;
}
```

#### B. Lesson Plan Structure (Enhanced)
```typescript
interface EnhancedLessonPlan extends LessonPlan {
  // Pedagogical metadata
  pedagogy: {
    teachingMethod: TeachingMethod;
    bloomsLevels: BloomsLevel[];
    scaffoldingStrategy: ScaffoldingStrategy;
    assessmentType: 'formative' | 'summative' | 'diagnostic';
  };
  
  // Sequencing
  sequence: {
    warmUp: Activity;           // Activate prior knowledge
    directInstruction: Content; // Teach new concept
    guidedPractice: Activity[]; // Practice with support
    independentPractice: Activity[]; // Apply independently
    closure: Activity;          // Summarize and reflect
  };
  
  // Differentiation
  differentiation: {
    support: Activity[];        // For struggling students
    extension: Activity[];      // For advanced students
    modifications: {
      visual: Modification[];
      auditory: Modification[];
      kinesthetic: Modification[];
    };
  };
  
  // Assessment
  assessment: {
    preAssessment: Quiz;        // What do they know?
    formative: Quiz[];          // Are they learning?
    summative: Quiz;            // What did they learn?
    rubric?: Rubric;
  };
}
```

### 4. Enhanced Settings System

#### A. Learning Settings
```typescript
interface LearningSettings {
  // Difficulty adaptation
  difficulty: {
    current: DifficultyLevel;
    autoAdjust: boolean;
    adjustmentSpeed: 'instant' | 'gradual' | 'conservative';
    minLevel: DifficultyLevel;
    maxLevel: DifficultyLevel;
  };
  
  // Teaching preferences
  teaching: {
    method: TeachingMethod;
    scaffoldingLevel: 'high' | 'medium' | 'low';
    feedbackTiming: 'immediate' | 'delayed' | 'end-of-session';
    hintAvailability: 'always' | 'after-attempt' | 'never';
  };
  
  // Content preferences
  content: {
    questionTypes: QuestionType[];  // Enabled question types
    mediaTypes: MediaType[];        // Video, audio, text, interactive
    exampleFrequency: 'high' | 'medium' | 'low';
    realWorldConnections: boolean;
  };
  
  // Session management
  session: {
    duration: number;               // Minutes
    breakFrequency: number;         // Questions before break
    questionsPerSession: number;
    reviewFrequency: number;        // Days between reviews
  };
  
  // Accessibility
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    readAloud: boolean;
    reducedMotion: boolean;
    dyslexiaFont: boolean;
  };
}
```

#### B. Parent/Teacher Controls
```typescript
interface ParentControls {
  // Content filtering
  contentRestrictions: {
    allowedTopics: string[];
    blockedTopics: string[];
    maxDifficulty: DifficultyLevel;
  };
  
  // Time management
  timeControls: {
    dailyLimit: number;           // Minutes per day
    weeklyLimit: number;
    allowedTimes: TimeRange[];
    requireBreaks: boolean;
  };
  
  // Progress monitoring
  monitoring: {
    weeklyReports: boolean;
    strugglingAlerts: boolean;
    achievementNotifications: boolean;
    detailedAnalytics: boolean;
  };
  
  // Lesson plan management
  lessonPlans: {
    canCreate: boolean;
    canEdit: boolean;
    canShare: boolean;
    approvalRequired: boolean;
  };
}
```

## Implementation Phases

### Phase 1: Dynamic Quiz Engine (Week 1-2)
**Priority: HIGH - Core teaching effectiveness**

**Tasks:**
1. Create `DynamicQuizEngine` class
2. Implement adaptive question selection
3. Add new question types (fill-in-blank, drag-drop, explain-thinking)
4. Integrate Bloom's Taxonomy targeting
5. Add scaffolding system (hints, examples, worked solutions)
6. Implement formative assessment flow

**Files to Create:**
- `src/lib/quiz/DynamicQuizEngine.ts`
- `src/lib/quiz/QuestionSelector.ts`
- `src/lib/quiz/ScaffoldingSystem.ts`
- `src/components/quiz/QuestionTypes/` (directory)
- `src/lib/pedagogy/BloomsTaxonomy.ts`

**Files to Modify:**
- `src/lib/sunny-ai.ts` (integrate new quiz generation)
- `src/types/lesson.ts` (add new question types)

### Phase 2: Teaching Methods Integration (Week 2-3)
**Priority: HIGH - Pedagogical foundation**

**Tasks:**
1. Implement evidence-based teaching methods
2. Create cognitive load manager
3. Add spaced repetition system
4. Implement retrieval practice
5. Add worked examples generator
6. Create interleaving scheduler

**Files to Create:**
- `src/lib/pedagogy/TeachingMethods.ts`
- `src/lib/pedagogy/CognitiveLoadManager.ts`
- `src/lib/pedagogy/SpacedRepetition.ts`
- `src/lib/pedagogy/RetrievalPractice.ts`
- `src/lib/pedagogy/WorkedExamples.ts`

### Phase 3: Lesson Plan Builder (Week 3-4)
**Priority: MEDIUM - Customization capability**

**Tasks:**
1. Create lesson plan builder UI
2. Implement template system
3. Add AI-assisted generation
4. Create lesson plan editor
5. Add sharing/publishing system
6. Implement lesson plan library

**Files to Create:**
- `src/app/lesson-builder/page.tsx`
- `src/components/lesson-builder/` (directory)
- `src/lib/lesson-builder/LessonPlanBuilder.ts`
- `src/lib/lesson-builder/Templates.ts`
- `src/app/api/lesson-plans/` (API routes)

**Database:**
- Already have `lesson_plans` table - just need to use it!

### Phase 4: Enhanced Settings (Week 4)
**Priority: MEDIUM - User control**

**Tasks:**
1. Expand settings page with new categories
2. Add learning preferences section
3. Create parent/teacher controls
4. Implement accessibility settings
5. Add session management controls
6. Create settings presets (beginner, advanced, etc.)

**Files to Modify:**
- `src/app/settings/page.tsx` (major expansion)
- `src/hooks/useSettings.ts` (new hook)
- `src/contexts/SettingsContext.tsx` (new context)

### Phase 5: Integration & Testing (Week 5)
**Priority: HIGH - Quality assurance**

**Tasks:**
1. Integrate all systems
2. Create comprehensive tests
3. User testing with real children
4. Performance optimization
5. Documentation
6. Demo preparation

## Technical Specifications

### Database Schema Updates

```sql
-- Enhanced lesson plans table (already exists, just document usage)
-- Add columns if needed:
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS pedagogy JSONB;
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS sequence JSONB;
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS differentiation JSONB;
ALTER TABLE lesson_plans ADD COLUMN IF NOT EXISTS assessment JSONB;

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  learning_settings JSONB NOT NULL DEFAULT '{}',
  parent_controls JSONB NOT NULL DEFAULT '{}',
  accessibility JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question bank table (for reusable questions)
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  blooms_level TEXT NOT NULL,
  cognitive_load INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spaced repetition schedule
CREATE TABLE IF NOT EXISTS spaced_repetition (
  user_id TEXT REFERENCES users(id),
  question_id TEXT REFERENCES question_bank(id),
  next_review TIMESTAMP WITH TIME ZONE,
  interval_days INTEGER,
  ease_factor DECIMAL,
  repetitions INTEGER,
  PRIMARY KEY (user_id, question_id)
);
```

### API Endpoints

```typescript
// Lesson Plans
POST   /api/lesson-plans          // Create lesson plan
GET    /api/lesson-plans          // List lesson plans
GET    /api/lesson-plans/:id      // Get specific plan
PUT    /api/lesson-plans/:id      // Update plan
DELETE /api/lesson-plans/:id      // Delete plan
POST   /api/lesson-plans/generate // AI-generate plan

// Quizzes
POST   /api/quizzes/generate      // Generate adaptive quiz
POST   /api/quizzes/submit        // Submit answer
GET    /api/quizzes/next-question // Get next question

// Settings
GET    /api/settings              // Get user settings
PUT    /api/settings              // Update settings
GET    /api/settings/presets      // Get preset configurations
```

## Success Metrics

### Educational Effectiveness
- **Learning Gains**: Pre/post assessment improvement
- **Retention**: Knowledge retention after 1 week, 1 month
- **Engagement**: Session completion rate, time on task
- **Mastery**: Percentage reaching mastery level

### User Experience
- **Settings Usage**: % of users customizing settings
- **Lesson Plan Creation**: Number of custom plans created
- **Question Type Diversity**: Distribution of question types used
- **Accessibility**: % using accessibility features

### Technical Performance
- **Quiz Generation Time**: < 2 seconds
- **Adaptive Selection**: < 500ms
- **Page Load**: < 1 second
- **Database Queries**: < 100ms average

## Key Differentiators

### vs. Khan Academy
- ✅ **More adaptive**: Real-time adjustment, not just topic-based
- ✅ **Younger focus**: Optimized for 6-10, not 13+
- ✅ **Customizable**: Parents/teachers can create content

### vs. IXL
- ✅ **Less drill-focused**: Emphasizes understanding over repetition
- ✅ **More engaging**: Varied question types, not just multiple choice
- ✅ **Transparent**: Shows reasoning, not black-box scoring

### vs. Duolingo
- ✅ **Deeper learning**: Not just gamification, actual pedagogy
- ✅ **Broader subjects**: Not just language
- ✅ **Customizable**: Not one-size-fits-all path

## Next Steps

1. **Review & Approve** this architecture
2. **Prioritize** features based on impact/effort
3. **Start Phase 1** - Dynamic Quiz Engine
4. **Iterate** based on testing and feedback

---

**Bottom Line**: This architecture transforms Sunny from "adaptive quiz app" to "intelligent teaching system" grounded in learning science.
