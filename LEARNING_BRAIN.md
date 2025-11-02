# 🧠 Sunny's Learning Brain - Intelligence System

## What This Is

The **Learning Brain** is Sunny's intelligence layer. It's not just tracking scores - it's **understanding** the student.

Think of it as the difference between:
- ❌ "Student got 60% correct" (data)
- ✅ "Student is stuck because they're confusing numerators and denominators, and they're guessing instead of reasoning" (intelligence)

## How It Works

### 1. Continuous Analysis

The brain runs **after every question** and **after every session**:

```typescript
// After each answer:
checkImmediateTriggers({
  userId, skillId, sessionId,
  correctness, timeToAnswer, confidence,
  recentAttempts // Last 5 attempts
})

// After each session:
checkSessionTriggers({
  userId, skillId, sessionId,
  masteryDelta, questionsAttempted,
  sessionAttempts // All attempts in session
})
```

### 2. Pattern Detection

The brain detects:

**Behavioral Patterns:**
- "Student performs better in the morning"
- "Optimal session length is 5-6 questions"
- "Attention declining over time"

**Struggle Indicators:**
- Low success rate (<40%)
- Weak reasoning (avg < 2.5/5)
- Stuck at low mastery (>10 attempts, still <30%)
- Frequent guessing
- Rushing through questions

**Learning Velocity:**
- How fast mastery is changing (points/week)
- Trend: accelerating, decelerating, stable
- Burnout prediction

### 3. Automatic Interventions

When the brain detects problems, it **acts immediately**:

#### Critical Triggers (Immediate Action)

**Three Wrong in a Row (High Confidence)**
```
Condition: 3 incorrect + 2 with high confidence
Action: STOP SESSION → Generate concept reteach
Reason: Student has misconception, not just confusion
```

**Rapid Guessing**
```
Condition: Answer in <3 seconds + incorrect
Action: Create note about rushing/disengagement
Reason: Questions may be too hard or student checked out
```

**No Progress in Session**
```
Condition: 5+ questions, mastery delta ≤ 0
Action: Trigger full brain analysis + generate intervention
Reason: Current approach isn't working
```

#### Session-Level Triggers

**Declining Attention**
```
Condition: Reasoning quality drops >1.5 points during session
Action: Note pattern, suggest shorter sessions
```

**Mastery Threshold Reached**
```
Condition: Cross 70% mastery
Action: Celebrate + unlock harder challenges
```

### 4. Intervention Generation

When a student is struggling, the brain generates **targeted content**:

#### Remedial Quiz
```typescript
// For declining performance
{
  type: 'remedial_quiz',
  approach: 'scaffolded', // Start VERY easy
  questions: [
    // Q1: Success guaranteed (rebuild confidence)
    // Q2-3: Gradual increase
    // Q4-5: Target specific misconceptions
  ],
  specialInstructions: 'Take your time. Rebuilding foundation.'
}
```

#### Concept Reteach
```typescript
// For stuck students
{
  type: 'concept_reteach',
  approach: 'completely_different', // Not the same method
  structure: {
    part1: 'New explanation (visual if was abstract)',
    part2: 'Concrete example (real-world)',
    part3: 'Guided practice'
  }
}
```

#### Prerequisite Check
```typescript
// For persistent struggles
{
  type: 'prerequisite_check',
  diagnostic: true,
  checkSkills: ['foundational_concept_1', 'foundational_concept_2']
}
```

## Intelligence Features

### Skill Trend Analysis

Each skill gets a **trend classification**:

```typescript
{
  trend: 'improving' | 'declining' | 'stable' | 'stuck',
  velocity: 5.2, // mastery points per week
  strugglingIndicators: [
    'low_success_rate',
    'weak_reasoning',
    'frequent_guessing'
  ]
}
```

**"Stuck" Detection:**
- Mastery < 30%
- 10+ attempts
- 3+ struggling indicators
- Velocity near zero

### Learning Velocity Tracking

```typescript
{
  overall: 12.5, // mastery points/week across all skills
  byCategory: {
    math: 15.2,
    reading: 9.8
  },
  trend: 'accelerating' | 'decelerating' | 'stable',
  predictedBurnout: false
}
```

**Burnout Prediction:**
- Velocity decelerating
- 10+ recent sessions
- Last 3 sessions show declining attention

### Behavioral Pattern Recognition

The brain learns what works for each student:

```typescript
{
  pattern: 'performs_better_morning',
  confidence: 85,
  occurrences: 12,
  impact: 'positive'
}

{
  pattern: 'optimal_session_length_medium', // 4-6 questions
  confidence: 70,
  occurrences: 8,
  impact: 'positive'
}

{
  pattern: 'attention_declining_over_time',
  confidence: 80,
  occurrences: 3,
  impact: 'negative'
}
```

## API Usage

### Analyze a Student

```typescript
POST /api/brain/analyze
{
  "userId": "user-123"
}

Response:
{
  "analysis": {
    "skillsAnalyzed": 5,
    "strugglingSkills": 2,
    "improvingSkills": 3,
    "learningVelocity": {
      "overall": 12.5,
      "trend": "accelerating",
      "predictedBurnout": false
    },
    "behavioralPatterns": [...],
    "interventionsNeeded": [
      {
        "type": "concept_reteach",
        "priority": "urgent",
        "skillId": "skill-uuid",
        "reason": "Student stuck on fractions_comparison...",
        "suggestedAction": "Generate remedial lesson...",
        "estimatedImpact": 85
      }
    ],
    "generatedInterventions": [
      {
        "type": "concept_reteach",
        "content": {
          "part1": "Let's try fractions a different way...",
          "part2": "Imagine you have two pizzas...",
          "part3": "Now you try..."
        }
      }
    ]
  }
}
```

### Automatic Triggers (Built-in)

These run automatically - no API call needed:

```typescript
// In your grade_attempt API:
import { checkImmediateTriggers } from '@/lib/learning-brain/auto-interventions';

// After grading:
await checkImmediateTriggers({
  userId,
  skillId,
  sessionId,
  correctness,
  timeToAnswer,
  confidence,
  recentAttempts, // Last 5 attempts for this skill
  averageTime, // Average time for this skill
});
```

## Why This Matters

### Traditional System:
```
Student gets question wrong
→ Mark as incorrect
→ Move to next question
→ End of story
```

### Sunny's Brain:
```
Student gets question wrong
→ Analyze: Why wrong? Guessing? Misconception? Confusion?
→ Check: Is this a pattern? 3rd wrong in a row?
→ Decide: Continue? Intervene? Change approach?
→ Act: Generate targeted help if needed
→ Learn: Update student model
→ Remember: Store pattern for future
```

## Real Example

**Scenario:** Student struggling with fractions

**Without Brain:**
```
Session 1: 3/7 correct, mastery 35 → 37
Session 2: 2/6 correct, mastery 37 → 35
Session 3: 3/7 correct, mastery 35 → 37
(Student stuck, no intervention)
```

**With Brain:**
```
Session 1: 3/7 correct
→ Brain detects: Low success rate, weak reasoning
→ Creates note: "Struggling with fractions"

Session 2: 2/6 correct, mastery dropping
→ Brain detects: Declining trend, frequent guessing
→ Trigger: "no_progress_in_session"
→ Action: Generate remedial quiz

Session 3: Remedial quiz (scaffolded)
→ Start with 1/2 vs 1/4 (success guaranteed)
→ Build to 3/4 vs 2/3 (with visual aids)
→ Mastery 35 → 45 (breakthrough!)

Session 4: Regular practice
→ 5/7 correct, mastery 45 → 52
→ Brain detects: Improving trend
→ Note: "Visual approach working"
```

## Integration Points

### 1. After Every Question (Real-time)
```typescript
// In /api/mission/grade
await checkImmediateTriggers(attemptData);
```

### 2. After Every Session
```typescript
// When session ends
await checkSessionTriggers(sessionData);
```

### 3. Weekly Deep Analysis (Cron)
```typescript
// Run via cron job
await runWeeklyAnalysis(userId);
```

### 4. On-Demand Analysis
```typescript
// When teacher/parent requests
POST /api/brain/analyze
```

## Configuration

### Trigger Sensitivity

You can adjust trigger thresholds:

```typescript
// In auto-interventions.ts

// More sensitive (intervene sooner):
condition: (data) => data.recentAttempts.slice(0, 2).every(a => a.correctness === 'incorrect')

// Less sensitive (wait longer):
condition: (data) => data.recentAttempts.slice(0, 5).every(a => a.correctness === 'incorrect')
```

### Intervention Types

Add custom interventions:

```typescript
const CUSTOM_TRIGGER = {
  name: 'visual_learner_text_heavy',
  priority: 'medium',
  condition: (data) => {
    return data.learningStyle === 'visual' &&
           data.questionFormat === 'text_only' &&
           data.correctRate < 0.5;
  },
  action: async (data) => {
    // Switch to visual format
    await generateVisualQuestions(data.skillId);
  }
};
```

## Future Enhancements

### 1. Cross-Student Learning
```typescript
// Learn what works across all students
"Students who struggle with X often succeed with approach Y"
```

### 2. Prerequisite Mapping
```typescript
// Automatic skill dependency detection
"Can't master fractions_division without fractions_comparison"
```

### 3. Predictive Difficulty
```typescript
// Predict which questions will be hard for this student
"Based on past patterns, this student will struggle with word problems"
```

### 4. Adaptive Pacing
```typescript
// Adjust session length based on attention patterns
"This student's optimal session: 5 questions, morning, visual format"
```

## Testing the Brain

```bash
# 1. Create a test student
POST /api/user/create { name: "Test Student" }

# 2. Run a few sessions with intentional struggles
POST /api/mission/next?userId=test-123
POST /api/mission/grade (answer wrong 3 times with high confidence)

# 3. Check brain analysis
POST /api/brain/analyze { userId: "test-123" }

# 4. Verify interventions created
GET /api/dashboard?userId=test-123
# Check sunnyNotes for intervention suggestions
```

## Key Insights

1. **The brain learns the STUDENT, not just the subject**
2. **Interventions are AUTOMATIC, not manual**
3. **Patterns are DETECTED, not programmed**
4. **Actions are PREDICTIVE, not reactive**

This is what makes Sunny a **learning OS**, not just a quiz app.

---

**Status:** Production Ready ✅  
**Integration:** Automatic (runs with existing APIs)  
**Cost:** Minimal (only generates AI content when intervention needed)  
**Impact:** Massive (catches struggling students before they give up)
