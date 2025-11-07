# Sunny Multi-Agent Cognitive Learning System

## Architecture Overview

Sunny's multi-agent system implements a distributed cognitive architecture where specialized AI agents collaborate to provide adaptive, emotionally-aware educational experiences for children aged 6-10.

### Design Philosophy

1. **Modularity**: Each agent has a single responsibility and can be improved independently
2. **Transparency**: All decisions are traceable and explainable
3. **Adaptivity**: System learns from student interactions and adjusts in real-time
4. **Privacy**: COPPA-compliant, minimal data collection, no PII in logs
5. **Performance**: P95 < 400ms for tutor actions

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PERCEPTION LAYER                             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Student    │  │  Interaction │  │   Emotion    │              │
│  │   Input      │  │   Tracking   │  │   Detection  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        COGNITION LAYER                               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    ORCHESTRATOR                             │     │
│  │  - Coordinates agents via event-driven architecture        │     │
│  │  - Resolves conflicts (priority, consensus, weighted)      │     │
│  │  - Maintains learning state per student                    │     │
│  │  - Publishes events to Event System                        │     │
│  └─────────────────────┬──────────────────────────────────────┘     │
│                        │                                             │
│          ┌─────────────┼──────────────────────┐                     │
│          │             │                       │                     │
│          ▼             ▼                       ▼                     │
│  ┌──────────────┐ ┌──────────────┐  ┌──────────────┐               │
│  │ Assessment   │ │ Path Planner │  │   Content    │               │
│  │    Agent     │ │    Agent     │  │ Generation   │               │
│  │              │ │              │  │    Agent     │               │
│  │ • Gaps       │ │ • Learning   │  │ • Quizzes    │               │
│  │ • Mastery    │ │   Paths      │  │ • Lessons    │               │
│  │ • Difficulty │ │ • ZPD        │  │ • Activities │               │
│  └──────────────┘ └──────────────┘  └──────────────┘               │
│                                                                       │
│          ▼             ▼                       ▼                     │
│  ┌──────────────┐ ┌──────────────┐  ┌──────────────┐               │
│  │Intervention  │ │Communication │  │ Reflection   │               │
│  │    Agent     │ │    Agent     │  │    Agent     │               │
│  │              │ │              │  │              │               │
│  │ • Frustration│ │ • Tone Adapt │  │ • Summaries  │               │
│  │ • Confusion  │ │ • Encourage  │  │ • Metacog    │               │
│  │ • Fatigue    │ │ • Language   │  │ • Growth     │               │
│  └──────────────┘ └──────────────┘  └──────────────┘               │
│                                                                       │
│          ▼             ▼                                             │
│  ┌──────────────┐ ┌──────────────┐                                 │
│  │Collaboration │ │     Game     │                                 │
│  │    Agent     │ │    Agent     │                                 │
│  │              │ │              │                                 │
│  │ • Peer Learn │ │ • Recommends │                                 │
│  │ • Teaching   │ │ • Analyzes   │                                 │
│  │ • Social     │ │ • Adapts     │                                 │
│  └──────────────┘ └──────────────┘                                 │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ACTION LAYER                                 │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Generate    │  │   Trigger    │  │   Adapt      │              │
│  │   Content    │  │ Intervention │  │  Difficulty  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Recommend   │  │   Provide    │  │   Navigate   │              │
│  │    Path      │  │  Feedback    │  │   to App     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MEMORY LAYER                                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                  LEARNING GRAPH (PostgreSQL)                │     │
│  │                                                             │     │
│  │  Nodes: Concepts, Skills, Activities, Assessments          │     │
│  │  Edges: prerequisite, reinforces, assessed_by, next_best   │     │
│  │  Mastery: Bayesian Knowledge Tracing per student/node      │     │
│  │  Evidence: All interactions stored for learning            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              LEARNING STATES (Supabase + Cache)             │     │
│  │                                                             │     │
│  │  • Current objectives                                       │     │
│  │  • Knowledge map (concept mastery)                          │     │
│  │  • Engagement metrics                                       │     │
│  │  • Context history                                          │     │
│  │  • Active learning path                                     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                  AGENT MEMORY SYSTEM                         │     │
│  │                                                             │     │
│  │  • Conversation context (recent topics, focus)              │     │
│  │  • Learning insights (strengths, patterns)                  │     │
│  │  • Memory decay with spaced repetition                      │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Agent Specifications

### 1. Assessment Agent

**Purpose**: Analyzes student interactions to detect knowledge gaps, estimate mastery, and recommend difficulty adjustments.

**Inputs**:
- Student interaction (question answer, activity completion)
- Response time
- Self-reported confidence
- Current topic context

**Outputs**:
- Understanding score (0-1)
- Engagement score (0-1)
- Confidence estimate (0-1)
- Identified knowledge gaps
- Difficulty recommendations

**Algorithm**: Bayesian Knowledge Tracing (BKT)
- `P(mastery)` updated with each correct/incorrect response
- Parameters: `p_learn`, `p_guess`, `p_slip`, `p_init`
- 7 struggle indicators tracked

**Telemetry**:
- Assessment request rate
- Average assessment time
- Knowledge gap detection rate
- Difficulty adjustment frequency

**Fail-safes**:
- Falls back to heuristic assessment if BKT fails
- Never reduces difficulty below "beginner"
- Caps difficulty increases to prevent frustration

---

### 2. Path Planner Agent

**Purpose**: Generates adaptive learning paths with prerequisite chains, skips mastered content, adds remedial support.

**Inputs**:
- Learning goal
- Current knowledge state
- Available time
- Preferred difficulty

**Outputs**:
- Ordered learning path (nodes)
- Estimated time per node
- Prerequisites satisfied check
- Alternative paths (if available)

**Algorithm**: Graph traversal + ZPD calculation
- Recursively finds prerequisites via Learning Graph
- Filters nodes by mastery (<80% mastery)
- Orders by prerequisite depth + difficulty

**Telemetry**:
- Path generation time
- Path completion rate
- Average path length
- Adaptation frequency (real-time adjustments)

**Fail-safes**:
- Prevents cycles in learning paths
- Limits path depth to 10 nodes
- Falls back to linear progression if graph unavailable

---

### 3. Content Generation Agent

**Purpose**: Creates personalized quizzes, lessons, and activities aligned to Bloom's taxonomy and learning style.

**Inputs**:
- Topic
- Difficulty level
- Learning style (visual, auditory, kinesthetic, reading, logical)
- Knowledge gaps (from Assessment Agent)

**Outputs**:
- Quiz (adaptive questions with hints)
- Lesson (structured explanation + examples)
- Activity (hands-on task)

**AI Integration**: OpenAI GPT-4 Turbo with JSON mode
- System prompt includes Bloom's level verbs
- Templates for each content type
- Caching to reduce API costs

**Telemetry**:
- Content generation time
- Cache hit rate
- Student engagement with generated content
- Quality ratings (thumbs up/down)

**Fail-safes**:
- Template fallbacks when AI unavailable
- Content moderation (no inappropriate content)
- Age-appropriateness checks (6-10 vocabulary)

---

### 4. Intervention Agent

**Purpose**: Detects and responds to frustration, disengagement, confusion, fatigue, and success.

**Inputs**:
- Recent performance trend
- Session duration
- Engagement metrics (attention, frustration)
- Current activity

**Outputs**:
- Intervention type (encouragement, difficulty reduction, break, etc.)
- Urgency level (low, medium, high, urgent)
- Suggested actions

**Detection Logic**:
- **Frustration**: 3+ consecutive failures OR accuracy <30% over 5 attempts
- **Disengagement**: Response time >2x average, declining attention score
- **Confusion**: Multiple hints used, long response times, expressed confusion
- **Fatigue**: Session >30 min, declining performance over time
- **Success**: Accuracy >80%, streak of 5+ correct

**Telemetry**:
- Intervention trigger frequency per type
- Intervention effectiveness (engagement change)
- Cooldown violations (too many interventions)

**Fail-safes**:
- 5-minute cooldown between interventions (prevents spam)
- Never more than 3 interventions per session
- Escalates to "suggest break" if multiple interventions fail

---

### 5. Communication Agent

**Purpose**: Adapts tone, vocabulary, and style based on student emotion and cognitive profile.

**Inputs**:
- Student message
- Student profile (cognitive, motivational, behavioral patterns)
- Conversation history

**Outputs**:
- Adapted tone (supportive, energetic, encouraging, playful, warm)
- Vocabulary level (simple, intermediate, advanced)
- Response suggestions (3 options)
- Communication strategy (discovery, scaffolding, collaborative, direct)

**Tone Selection Logic**:
- High frustration → supportive
- Low engagement → energetic
- High intrinsic motivation → encouraging
- High competitive → playful
- Default → warm

**AI Integration**: GPT-4 Turbo for response generation
- 5-minute response cache per student+tone combination
- Automatic cache cleanup (max 100 entries)

**Telemetry**:
- Tone distribution
- Response generation time
- Cache hit rate
- Student engagement after adapted communication

**Fail-safes**:
- Fallback responses per tone when AI unavailable
- Language simplification for struggling students
- Emoji moderation (not excessive)

---

### 6. Reflection Agent

**Purpose**: Generates post-session summaries, progress narratives, and self-evaluation prompts for metacognition.

**Inputs**:
- Learning state (session data)
- Student profile
- Timeframe (session, week, month, all-time)

**Outputs**:
- Session summary (topics, mastery, insights, next steps)
- Progress narrative (story-format journey)
- Self-evaluation prompts (metacognitive questions)

**Summary Components**:
- Duration, topics covered, concepts mastered/struggling
- Emotional journey inference
- AI-generated insights (GPT-4)
- Celebration moments (achievements, streaks)
- Recommended next steps

**AI Integration**: GPT-4 Turbo for narrative generation
- Educational psychologist persona
- Growth mindset framing
- Age-appropriate language (6-10)

**Telemetry**:
- Summary generation frequency
- Student engagement with summaries
- Self-evaluation completion rate

**Fail-safes**:
- Template-based summaries when AI unavailable
- Always includes at least one positive insight
- Caps negative feedback (max 2 growth areas)

---

### 7. Collaboration Agent

**Purpose**: Simulates peer learning experiences, facilitates group activities, creates peer teaching opportunities.

**Inputs**:
- Student profile (collaborative motivation)
- Current topic
- Interaction type (question, explanation, challenge, encouragement)

**Outputs**:
- Peer learning activity (with roles, materials, instructions)
- Simulated peer dialogue
- Peer teaching scenario
- Group challenge

**Simulated Peers**:
- **Alex** (curious, peer level)
- **Maya** (supportive, slightly ahead)
- **Jordan** (playful, peer level)
- **Sam** (slightly behind, needs help)

**AI Integration**: GPT-4 Turbo for dialogue generation
- Peer personality reflected in language
- Natural, age-appropriate conversations

**Telemetry**:
- Collaboration recommendation acceptance rate
- Peer teaching success criteria met
- Student engagement in collaborative activities

**Fail-safes**:
- Template activities when AI unavailable
- Always includes clear roles and instructions
- Success criteria defined upfront

---

### 8. Game Agent

**Purpose**: Recommends educational games based on engagement, frustration, and topic.

**Inputs**:
- Learning state (current topic, engagement)
- Student profile (learning style)
- Recent game performance

**Outputs**:
- Game recommendation (type, difficulty, topic)
- Game configuration
- Performance analysis

**Game Types**:
- Pattern recognition
- Math challenges
- Creative challenges
- Word builders
- Memory match
- Science experiments

**Telemetry**:
- Game recommendation frequency
- Game completion rate
- Performance improvement after games
- Engagement boost (before vs. during game)

**Fail-safes**:
- Defaults to medium difficulty if mastery data missing
- Limits game time to 15 minutes per session
- Falls back to non-game activities if games not engaging

---

## Event System

### Architecture

Singleton `globalEventSystem` provides pub/sub messaging for agent coordination.

**Event Structure**:
```typescript
{
  id: string;
  type: EventType; // 'assessment:complete', 'intervention:triggered', etc.
  priority: Priority; // low, medium, high, urgent
  timestamp: number;
  sourceAgentId: string;
  targetAgentType?: AgentType;
  payload: any;
}
```

**Priority Routing**:
- **Urgent**: Processed immediately (interventions, errors)
- **High**: Processed within 100ms (assessments, content requests)
- **Medium**: Processed within 500ms (analytics, logs)
- **Low**: Processed within 2s (background tasks)

**Event Queue**:
- Max size: 1000 events
- Timeout: 5s per handler
- Automatic retry with exponential backoff

### Event Types

| Event Type | Publisher | Subscribers | Purpose |
|-----------|-----------|-------------|---------|
| `assessment:complete` | Assessment Agent | Path Planner, Intervention | Share assessment results |
| `knowledge_gap:detected` | Assessment Agent | Content Generation, Path Planner | Trigger remedial content |
| `intervention:triggered` | Intervention Agent | Communication, Content Generation | Adjust tone/difficulty |
| `mastery:achieved` | Assessment Agent | Reflection, Path Planner | Celebrate, unlock next |
| `session:started` | Orchestrator | All Agents | Initialize session state |
| `session:ended` | Orchestrator | Reflection, Memory | Generate summaries |

---

## Orchestrator

### Responsibilities

1. **Agent Lifecycle Management**
   - Start/stop agents
   - Monitor agent health
   - Handle agent failures

2. **Learning State Management**
   - Maintains `Map<studentId, LearningState>`
   - Updates state after each interaction
   - Persists to database (Supabase)

3. **Conflict Resolution**
   - **Priority-based**: Highest priority recommendation wins
   - **Consensus-based**: Requires 2+ agents to agree
   - **Weighted-based** (default): Scores by `priority * confidence * engagement_context`

4. **Decision Execution**
   - Content generation
   - Intervention triggers
   - Strategy updates

### Core Workflow

```typescript
async processStudentInteraction(studentId, interaction) {
  // 1. Assessment
  const assessment = await assessmentAgent.processMessage({
    type: 'assessment',
    payload: { studentId, interaction }
  });

  // 2. Gather recommendations from agents
  const recommendations = await Promise.all([
    pathPlannerAgent.processMessage({ type: 'recommend_next', payload: { studentId } }),
    contentGenerationAgent.processMessage({ type: 'check_content_need', payload: { studentId } }),
    interventionAgent.processMessage({ type: 'detect_triggers', payload: { studentId } }),
    communicationAgent.processMessage({ type: 'adapt_tone', payload: { studentId } })
  ]);

  // 3. Resolve conflicts
  const decisions = this.resolveConflicts(recommendations, 'weighted');

  // 4. Execute decisions
  const actions = await this.executeDecisions(decisions);

  // 5. Update learning state
  await this.updateLearningState(studentId, { assessment, actions });

  // 6. Return response
  return { response: actions.response, actions: actions.list };
}
```

---

## Learning Graph

### Schema

**Node Types**:
- `concept` - Abstract idea (e.g., "addition")
- `skill` - Concrete skill (e.g., "add two-digit numbers")
- `activity` - Learning activity
- `assessment` - Test/quiz
- `intervention` - Remedial activity
- `evidence` - Evidence of learning

**Edge Types**:
- `prerequisite` - A must come before B
- `reinforces` - A strengthens B
- `assessed_by` - Concept tested by assessment
- `next_best` - Recommended next step
- `related_to` - Semantically related
- `part_of` - Component of larger concept
- `applies_to` - Skill applies to context
- `evidences` - Evidence supports mastery claim

### Bayesian Knowledge Tracing (BKT)

**Parameters**:
- `p_init` = 0.05 - Initial probability of knowing
- `p_learn` = 0.3 - Probability of learning from instruction
- `p_guess` = 0.25 - Probability of guessing correctly
- `p_slip` = 0.1 - Probability of mistake despite knowing

**Update Formula** (correct response):
```
P(L_new) = P(L_prev) / [P(L_prev) + (1 - P(L_prev)) * P(G)]
```

**Update Formula** (incorrect response):
```
P(L_new) = [P(L_prev) * P(S)] / [P(L_prev) * P(S) + (1 - P(L_prev)) * (1 - P(G))]
```

**Learning from instruction**:
```
P(L_new) = P(L_new) + (1 - P(L_new)) * p_learn
```

**Mastery Levels** (from probability):
- `unknown` (0-10%)
- `introduced` (10-30%)
- `developing` (30-60%)
- `proficient` (60-85%)
- `mastered` (85-95%)
- `expert` (95-100%)

### Spaced Repetition

Review intervals based on mastery level:
- Unknown: 1 day
- Introduced: 1 day
- Developing: 3 days
- Proficient: 7 days
- Mastered: 14 days
- Expert: 30 days

### Functions

- `update_mastery(student_id, node_id, correct, time_spent)` - Updates BKT mastery
- `get_prerequisites(node_id)` - Recursive prerequisite chain
- `get_next_best_nodes(student_id, limit)` - Pathfinding for recommendations

---

## Performance Characteristics

### Latency Targets

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Assessment | 150ms | 300ms | 500ms |
| Plan Generation | 200ms | 400ms | 600ms |
| Intervention Detection | 100ms | 250ms | 400ms |
| Content Generation (cached) | 50ms | 100ms | 150ms |
| Content Generation (AI) | 1200ms | 2500ms | 4000ms |
| Learning Graph Query | 80ms | 200ms | 350ms |

### Throughput

- **Agent processing**: 100 requests/sec per agent
- **Orchestrator**: 200 requests/sec
- **Learning Graph**: 500 queries/sec

### Scalability

**Horizontal Scaling**:
- Agents are stateless (can scale to multiple instances)
- Orchestrator state stored in Redis (distributed)
- Learning Graph in PostgreSQL (read replicas)

**Vertical Scaling**:
- Each agent: ~50MB memory
- Orchestrator: ~200MB memory
- Total system: ~500MB for 8 agents + orchestrator

---

## Privacy & Security

### COPPA Compliance

- No collection of PII without parental consent
- Student IDs are UUIDs (not names/emails)
- Chat history encrypted at rest
- Data retention: 90 days (configurable)
- Right to be forgotten (delete all student data)

### Data Minimization

- Logs contain no PII
- Only aggregate analytics exported
- Student data never leaves server
- No third-party analytics

### Access Control

- Row-Level Security (RLS) on all tables
- Students can only access their own data
- Teachers can view students in their classes
- Admins have full access (audited)

---

## Evaluation & Testing

### Regression Tests

**Agent Unit Tests**:
- Each agent has test suite (`*.test.ts`)
- Mocks for AI calls
- Edge case coverage (empty inputs, errors)

**Integration Tests**:
- End-to-end flows (student interaction → response)
- Multi-agent scenarios
- Conflict resolution tests

### Behavior Tests

**Student Simulators**:
- **Struggling Learner**: Low accuracy, high frustration
- **Average Learner**: Balanced performance
- **Advanced Learner**: High accuracy, fast responses
- **Disengaged Learner**: Slow responses, low attention

**Metrics**:
- Intervention trigger rates per simulator
- Difficulty adjustment correctness
- Content relevance ratings

### Performance Tests

**Load Testing**:
- 1000 concurrent students
- Measure P95 latency
- Identify bottlenecks

**Stress Testing**:
- 10,000 concurrent students
- Measure failure modes
- Verify graceful degradation

---

## Deployment

### Production Stack

- **Compute**: Vercel (serverless Next.js)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Vercel KV (Redis)
- **AI**: OpenAI API (GPT-4 Turbo)
- **Monitoring**: Vercel Analytics + Sentry

### CI/CD

1. **Pre-commit**: ESLint, Prettier, TypeScript check
2. **Pre-push**: Unit tests, integration tests
3. **PR Checks**: All tests + type check + build
4. **Deploy**: Vercel automatic deployment on merge to `main`

### Monitoring

**Metrics**:
- Agent processing time (per agent, per operation)
- Error rates (per agent)
- API costs (OpenAI usage)
- Database query performance

**Alerts**:
- P95 latency >400ms
- Error rate >1%
- Database connection pool exhausted
- OpenAI API rate limit hit

---

## Future Enhancements

### Planned Features

1. **Vector Embeddings for Concept Similarity**
   - Use OpenAI embeddings for semantic search
   - Find related concepts automatically
   - Improve content recommendations

2. **Multi-Session Learning Paths**
   - Long-term curriculum progression
   - Cross-session skill building
   - Milestone tracking

3. **Parent/Teacher Dashboard Integration**
   - Expose agent insights
   - Visualize learning graphs
   - Intervention history timeline

4. **Voice-Guided Learning**
   - Text-to-speech for lessons
   - Speech-to-text for student responses
   - Voice tone analysis for emotion detection

5. **Collaborative Multi-Student Sessions**
   - Real-time collaboration
   - Group challenges with role assignment
   - Peer teaching matchmaking

### Research Areas

- **Curriculum Alignment**: Map Learning Graph to Common Core, NGSS
- **Explainable AI**: LIME/SHAP for agent decision transparency
- **Reinforcement Learning**: Optimize agent strategies via RL
- **Transfer Learning**: Apply student models across subjects

---

## References

- Bayesian Knowledge Tracing: [Corbett & Anderson, 1995]
- Zone of Proximal Development: [Vygotsky, 1978]
- Bloom's Taxonomy: [Bloom et al., 1956]
- Spaced Repetition: [Ebbinghaus, 1885; Leitner, 1972]
- Growth Mindset: [Dweck, 2006]
