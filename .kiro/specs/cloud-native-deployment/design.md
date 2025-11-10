# Design Document

## Overview

This design document outlines the architecture for transforming Sunny into a production-ready, cloud-native AI teaching companion deployed on Google Cloud Platform. The system leverages Google Cloud Run for serverless auto-scaling, Gemini API for adaptive lesson generation, Firestore for secure data storage, and implements behavioral analytics for personalized learning experiences.

### Design Principles

1. **Cloud-Native First**: Leverage Google Cloud managed services for scalability and reliability
2. **Privacy by Design**: All personalization runs on Google infrastructure without third-party tracking
3. **Explainable AI**: Transparent rationales for every teaching decision
4. **Performance Optimized**: Sub-3-second cold starts, sub-2-second API responses
5. **Cost Efficient**: Smart caching and resource optimization for sustainable scaling
6. **Developer Friendly**: Clear APIs, comprehensive monitoring, infrastructure-as-code

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Students & Educators                         │
│                    (Web Browser / Mobile)                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTPS
             │
┌────────────▼────────────────────────────────────────────────────┐
│                   Google Cloud Load Balancer                    │
│                   (SSL Termination, CDN)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             │
┌────────────▼────────────────────────────────────────────────────┐
│                    Google Cloud Run                             │
│                    (Next.js Application)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes                                              │  │
│  │  • /api/health     → Health & readiness checks          │  │
│  │  • /api/teach      → Lesson generation                  │  │
│  │  • /api/feedback   → Student response analysis          │  │
│  │  • /api/metrics    → Learning outcomes                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Behavioral Analytics Engine                             │  │
│  │  • Frustration detection                                 │  │
│  │  • Confidence scoring                                    │  │
│  │  • Learning mode adaptation                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────┬────────────────┬────────────────┬────────────────┬─────────┘
     │                │                │                │
     │                │                │                │
┌────▼─────┐   ┌─────▼──────┐   ┌────▼─────┐   ┌─────▼──────┐
│ Gemini   │   │ Firestore  │   │  Cloud   │   │  Google    │
│   API    │   │  Database  │   │ Storage  │   │ Classroom  │
│          │   │            │   │          │   │    API     │
└──────────┘   └────────────┘   └──────────┘   └────────────┘
```



### Deployment Architecture

**Google Cloud Run Configuration**:
- Containerized Next.js 15 application
- Auto-scaling: 0 to 100 instances based on CPU and request metrics
- CPU: 2 vCPU per instance
- Memory: 1GB per instance
- Concurrency: 80 requests per instance
- Timeout: 60 seconds
- Min instances: 1 (production), 0 (development)

**Multi-Region Strategy**:
- Primary: us-central1 (Iowa)
- Secondary: europe-west1 (Belgium)
- Failover: Automatic with Cloud Load Balancer
- Data residency: Configurable per deployment

## Components and Interfaces

### 1. Containerized Application

**Dockerfile Structure**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 8080
CMD ["node", "server.js"]
```

**Key Design Decisions**:
- Multi-stage build reduces final image size to ~150MB
- Standalone output mode for optimal Next.js deployment
- Alpine Linux base for security and size
- Build-time optimization with npm ci



### 2. Health Endpoint

**File**: `src/app/api/health/route.ts`

**Interface**:
```typescript
// GET /api/health
// Response: {
//   status: 'healthy' | 'degraded' | 'unhealthy',
//   timestamp: string,
//   checks: {
//     database: boolean,
//     gemini: boolean,
//     storage: boolean
//   },
//   version: string
// }
```

**Implementation**:
```typescript
export async function GET() {
  const checks = {
    database: await checkFirestore(),
    gemini: await checkGeminiAPI(),
    storage: await checkCloudStorage()
  };
  
  const allHealthy = Object.values(checks).every(v => v);
  const status = allHealthy ? 'healthy' : 
                 Object.values(checks).some(v => v) ? 'degraded' : 
                 'unhealthy';
  
  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.APP_VERSION || 'unknown'
  }, {
    status: allHealthy ? 200 : 503
  });
}
```

**Design Decisions**:
- Comprehensive health checks for all dependencies
- Returns 503 when unhealthy for load balancer detection
- Includes version for deployment tracking
- Timeout: 5 seconds per check



### 3. Teach Endpoint with Behavioral Analytics

**File**: `src/app/api/teach/route.ts`

**Interface**:
```typescript
// POST /api/teach
// Request: {
//   studentId: string,
//   topic: string,
//   grade: string,
//   context?: {
//     previousAttempts: number,
//     responseDelay: number,
//     lastScore: number
//   }
// }
// Response: {
//   lesson: {
//     content: string,
//     steps: string[],
//     visualAids: string[],
//     quiz: QuizQuestion[]
//   },
//   metadata: {
//     difficulty: 'easy' | 'medium' | 'hard',
//     mode: 'visual' | 'textual' | 'interactive',
//     confidence: number,
//     rationale: string
//   }
// }
```

**Behavioral Analytics Logic**:

1. **Frustration Detection**:
```typescript
function detectFrustration(context: StudentContext): FrustrationLevel {
  const { previousAttempts, responseDelay, lastScore } = context;
  
  if (previousAttempts >= 3 && lastScore < 50) {
    return 'high';
  }
  if (responseDelay > 30000 || previousAttempts >= 2) {
    return 'medium';
  }
  return 'low';
}
```

2. **Adaptive Difficulty**:
```typescript
function calculateDifficulty(
  studentHistory: LearningHistory,
  frustration: FrustrationLevel
): Difficulty {
  const baseLevel = studentHistory.averageScore > 80 ? 'hard' :
                    studentHistory.averageScore > 60 ? 'medium' : 'easy';
  
  // Reduce difficulty if frustrated
  if (frustration === 'high' && baseLevel !== 'easy') {
    return baseLevel === 'hard' ? 'medium' : 'easy';
  }
  
  return baseLevel;
}
```

3. **Learning Mode Selection**:
```typescript
function selectLearningMode(
  studentPreferences: Preferences,
  topicType: string
): LearningMode {
  // Prefer visual for spatial/geometric topics
  if (topicType === 'geometry' || topicType === 'fractions') {
    return 'visual';
  }
  
  // Use student's preferred mode if available
  if (studentPreferences.mode) {
    return studentPreferences.mode;
  }
  
  return 'textual'; // Default
}
```



### 4. Gemini API Integration

**File**: `src/lib/gemini-client.ts`

**Interface**:
```typescript
export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  temperature: number;
  maxTokens: number;
}

export interface LessonPrompt {
  topic: string;
  grade: string;
  difficulty: Difficulty;
  mode: LearningMode;
  context: string;
}

export async function generateLesson(
  prompt: LessonPrompt,
  config: GeminiConfig
): Promise<LessonContent>;
```

**Implementation Strategy**:

1. **Prompt Engineering**:
```typescript
function buildPrompt(prompt: LessonPrompt): string {
  return `You are Sunny, an adaptive teaching companion for ${prompt.grade} grade students.

Topic: ${prompt.topic}
Difficulty: ${prompt.difficulty}
Learning Mode: ${prompt.mode}
Context: ${prompt.context}

Generate a lesson that:
1. Explains the core concept in simple terms
2. Provides 3-5 progressive learning steps
3. Includes ${prompt.mode} examples
4. Ends with 2-3 quiz questions

Format your response as JSON with this structure:
{
  "content": "main lesson text",
  "steps": ["step 1", "step 2", ...],
  "visualAids": ["description of visual 1", ...],
  "quiz": [{"question": "...", "options": [...], "correct": 0}]
}`;
}
```

2. **Caching Strategy**:
```typescript
const lessonCache = new Map<string, CachedLesson>();

async function getCachedLesson(
  cacheKey: string,
  generator: () => Promise<LessonContent>
): Promise<LessonContent> {
  const cached = lessonCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.content;
  }
  
  const content = await generator();
  lessonCache.set(cacheKey, {
    content,
    timestamp: Date.now()
  });
  
  return content;
}
```

3. **Error Handling & Fallback**:
```typescript
async function generateLessonWithFallback(
  prompt: LessonPrompt
): Promise<LessonContent> {
  try {
    return await generateLesson(prompt, geminiConfig);
  } catch (error) {
    if (error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT') {
      // Use demo mode fallback
      return getDemoLesson(prompt.topic, prompt.grade);
    }
    throw error;
  }
}
```



### 5. Firestore Data Model

**Collections Structure**:

```typescript
// /students/{studentId}
interface Student {
  id: string;
  name: string;
  grade: string;
  googleId?: string;
  preferences: {
    learningMode: LearningMode;
    difficultyPreference: Difficulty;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// /students/{studentId}/sessions/{sessionId}
interface LearningSession {
  id: string;
  studentId: string;
  topic: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  interactions: Interaction[];
  outcomes: {
    questionsAttempted: number;
    correctAnswers: number;
    timeToMastery: number;
    frustrationEvents: number;
  };
}

// /students/{studentId}/progress/{topicId}
interface TopicProgress {
  studentId: string;
  topicId: string;
  masteryLevel: number; // 0-100
  attempts: number;
  lastAttemptDate: Timestamp;
  averageScore: number;
  learningVelocity: number; // improvement rate
}

// /analytics/aggregated/{cohortId}
interface CohortAnalytics {
  cohortId: string;
  period: string; // YYYY-MM
  metrics: {
    averageTimeToMastery: number;
    errorRecoveryRate: number;
    engagementScore: number;
    topicsCompleted: number;
  };
  topicBreakdown: Record<string, TopicMetrics>;
}
```

**Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students can only read/write their own data
    match /students/{studentId} {
      allow read, write: if request.auth.uid == studentId;
      
      match /sessions/{sessionId} {
        allow read, write: if request.auth.uid == studentId;
      }
      
      match /progress/{topicId} {
        allow read, write: if request.auth.uid == studentId;
      }
    }
    
    // Educators can read aggregated analytics
    match /analytics/aggregated/{cohortId} {
      allow read: if request.auth.token.role == 'educator';
    }
  }
}
```



### 6. Google Classroom Integration

**File**: `src/lib/google-classroom.ts`

**Interface**:
```typescript
export interface ClassroomClient {
  syncRoster(courseId: string): Promise<Student[]>;
  postGrade(courseId: string, studentId: string, grade: number): Promise<void>;
  getCourses(teacherId: string): Promise<Course[]>;
}

export async function createClassroomClient(
  accessToken: string
): Promise<ClassroomClient>;
```

**Implementation**:

1. **OAuth Flow**:
```typescript
// Using next-auth with Google provider
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.rosters.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students'
          ].join(' ')
        }
      }
    })
  ]
};
```

2. **Roster Sync**:
```typescript
async function syncRoster(courseId: string): Promise<Student[]> {
  const classroom = google.classroom({ version: 'v1', auth: oAuth2Client });
  
  const response = await classroom.courses.students.list({
    courseId,
    pageSize: 100
  });
  
  const students = response.data.students?.map(s => ({
    id: s.userId!,
    name: s.profile?.name?.fullName || 'Unknown',
    grade: extractGradeFromCourse(courseId),
    googleId: s.userId!
  })) || [];
  
  // Store in Firestore
  await Promise.all(students.map(s => 
    db.collection('students').doc(s.id).set(s, { merge: true })
  ));
  
  return students;
}
```

3. **Grade Posting**:
```typescript
async function postGrade(
  courseId: string,
  studentId: string,
  grade: number
): Promise<void> {
  const classroom = google.classroom({ version: 'v1', auth: oAuth2Client });
  
  await classroom.courses.courseWork.studentSubmissions.patch({
    courseId,
    courseWorkId: 'sunny-assignment',
    id: studentId,
    updateMask: 'assignedGrade',
    requestBody: {
      assignedGrade: grade
    }
  });
}
```



### 7. Demo Mode Implementation

**File**: `src/lib/demo-mode.ts`

**Interface**:
```typescript
export interface DemoConfig {
  enabled: boolean;
  lessons: Record<string, LessonTemplate>;
}

export function getDemoLesson(
  topic: string,
  grade: string
): LessonContent;

export function isDemoMode(): boolean;
```

**Lesson Templates**:
```typescript
const DEMO_LESSONS: Record<string, LessonTemplate> = {
  'fractions-grade3': {
    content: `Let's explore fractions! A fraction represents a part of a whole. 
    Imagine cutting a pizza into 8 equal slices. If you eat 3 slices, 
    you've eaten 3/8 (three-eighths) of the pizza.`,
    steps: [
      'Understand that fractions show parts of a whole',
      'Learn to read fractions: numerator (top) and denominator (bottom)',
      'Practice with visual examples like pizza slices',
      'Try identifying fractions in everyday objects'
    ],
    visualAids: [
      'Pizza divided into 8 slices with 3 highlighted',
      'Number line showing 0 to 1 with fractions marked',
      'Pie chart showing 3/8 shaded'
    ],
    quiz: [
      {
        question: 'If a pizza has 8 slices and you eat 3, what fraction did you eat?',
        options: ['3/8', '3/5', '5/8', '8/3'],
        correct: 0,
        explanation: 'You ate 3 out of 8 total slices, which is 3/8'
      }
    ]
  },
  'photosynthesis-grade5': {
    content: `Photosynthesis is how plants make their own food using sunlight! 
    Plants are like tiny factories that convert light energy into chemical energy 
    stored in glucose (sugar).`,
    steps: [
      'Plants absorb sunlight through their leaves',
      'They take in carbon dioxide from the air',
      'Roots absorb water from the soil',
      'Chlorophyll (green pigment) helps convert these into glucose and oxygen',
      'Plants use glucose for energy and release oxygen for us to breathe'
    ],
    visualAids: [
      'Diagram of a leaf showing chloroplasts',
      'Flow chart: Sunlight + CO2 + Water → Glucose + Oxygen',
      'Illustration of a plant with labeled parts'
    ],
    quiz: [
      {
        question: 'What do plants need for photosynthesis?',
        options: [
          'Sunlight, water, and carbon dioxide',
          'Only water',
          'Soil and air',
          'Oxygen and glucose'
        ],
        correct: 0,
        explanation: 'Plants need sunlight, water, and carbon dioxide to make food'
      }
    ]
  }
};
```

**Demo Mode Detection**:
```typescript
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || 
         !process.env.GEMINI_API_KEY;
}

export function getDemoLesson(topic: string, grade: string): LessonContent {
  const key = `${topic.toLowerCase()}-grade${grade}`;
  const template = DEMO_LESSONS[key];
  
  if (!template) {
    // Generate generic demo lesson
    return generateGenericDemoLesson(topic, grade);
  }
  
  return {
    ...template,
    metadata: {
      difficulty: 'medium',
      mode: 'visual',
      confidence: 0.85,
      rationale: 'Demo mode: Using pre-defined lesson template'
    }
  };
}
```



## Data Models

### Core TypeScript Interfaces

```typescript
// Student and Learning
interface Student {
  id: string;
  name: string;
  grade: string;
  googleId?: string;
  preferences: StudentPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface StudentPreferences {
  learningMode: 'visual' | 'textual' | 'interactive';
  difficultyPreference: 'easy' | 'medium' | 'hard';
  notificationsEnabled: boolean;
}

interface LearningSession {
  id: string;
  studentId: string;
  topic: string;
  startTime: Date;
  endTime?: Date;
  interactions: Interaction[];
  outcomes: SessionOutcomes;
}

interface Interaction {
  timestamp: Date;
  type: 'question' | 'hint' | 'feedback' | 'encouragement';
  content: string;
  studentResponse?: string;
  correct?: boolean;
  responseTime: number; // milliseconds
}

interface SessionOutcomes {
  questionsAttempted: number;
  correctAnswers: number;
  timeToMastery: number; // seconds
  frustrationEvents: number;
  hintsUsed: number;
}

// Lesson Content
interface LessonContent {
  content: string;
  steps: string[];
  visualAids: string[];
  quiz: QuizQuestion[];
  metadata: LessonMetadata;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface LessonMetadata {
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'visual' | 'textual' | 'interactive';
  confidence: number; // 0-1
  rationale: string;
  estimatedDuration: number; // minutes
}

// Analytics
interface LearningOutcome {
  studentId: string;
  topic: string;
  timestamp: Date;
  timeToMastery: number;
  errorRecoveryRate: number;
  engagementScore: number;
  finalScore: number;
}

interface CohortMetrics {
  cohortId: string;
  period: string;
  studentCount: number;
  averageTimeToMastery: number;
  averageErrorRecoveryRate: number;
  averageEngagementScore: number;
  topicsCompleted: number;
  topicBreakdown: Record<string, TopicMetrics>;
}

interface TopicMetrics {
  topicId: string;
  attempts: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
}
```



## Error Handling

### API Error Responses

**Standard Error Format**:
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

**Error Codes**:
- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GEMINI_API_ERROR`: Gemini API call failed
- `DATABASE_ERROR`: Firestore operation failed
- `INTERNAL_ERROR`: Unexpected server error

**Error Handling Strategy**:

1. **Client Errors (4xx)**:
```typescript
if (!request.body.topic || !request.body.grade) {
  return Response.json({
    error: {
      code: 'INVALID_INPUT',
      message: 'Missing required fields: topic and grade',
      details: { required: ['topic', 'grade'] },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }, { status: 400 });
}
```

2. **External Service Errors**:
```typescript
try {
  const lesson = await generateLesson(prompt, config);
  return Response.json(lesson);
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Fallback to demo mode
    const demoLesson = getDemoLesson(prompt.topic, prompt.grade);
    return Response.json({
      ...demoLesson,
      metadata: {
        ...demoLesson.metadata,
        rationale: 'Using demo mode due to API rate limit'
      }
    });
  }
  
  // Log error for monitoring
  logger.error('Gemini API error', { error, prompt });
  
  return Response.json({
    error: {
      code: 'GEMINI_API_ERROR',
      message: 'Failed to generate lesson. Please try again.',
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }, { status: 503 });
}
```

3. **Database Errors**:
```typescript
try {
  await db.collection('students').doc(studentId).set(data);
} catch (error) {
  logger.error('Firestore write error', { error, studentId });
  
  return Response.json({
    error: {
      code: 'DATABASE_ERROR',
      message: 'Failed to save student data',
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  }, { status: 500 });
}
```



## Testing Strategy

### Unit Tests

**Scope**: Core business logic and utilities

**Test Files**:
- `src/lib/behavioral-analytics.test.ts`: Frustration detection, difficulty calculation
- `src/lib/gemini-client.test.ts`: Prompt building, caching, error handling
- `src/lib/demo-mode.test.ts`: Demo lesson retrieval, fallback logic
- `src/lib/google-classroom.test.ts`: Roster sync, grade posting

**Example Test**:
```typescript
describe('Behavioral Analytics', () => {
  describe('detectFrustration', () => {
    it('should detect high frustration with 3+ attempts and low score', () => {
      const context = {
        previousAttempts: 3,
        responseDelay: 5000,
        lastScore: 40
      };
      
      expect(detectFrustration(context)).toBe('high');
    });
    
    it('should detect medium frustration with long response delay', () => {
      const context = {
        previousAttempts: 1,
        responseDelay: 35000,
        lastScore: 70
      };
      
      expect(detectFrustration(context)).toBe('medium');
    });
  });
});
```

### Integration Tests

**Scope**: API endpoints and external service integration

**Test Scenarios**:
1. Health endpoint returns correct status with all services healthy
2. Health endpoint returns degraded status when Gemini API unavailable
3. Teach endpoint generates lesson with valid Gemini API key
4. Teach endpoint falls back to demo mode when API fails
5. Teach endpoint adapts difficulty based on student context
6. Google Classroom sync imports roster correctly
7. Firestore operations handle concurrent writes

**Example Test**:
```typescript
describe('POST /api/teach', () => {
  it('should generate adaptive lesson based on student context', async () => {
    const response = await fetch('/api/teach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'test-student',
        topic: 'fractions',
        grade: '3',
        context: {
          previousAttempts: 2,
          responseDelay: 15000,
          lastScore: 55
        }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.metadata.difficulty).toBe('easy'); // Adapted down
    expect(data.metadata.rationale).toContain('frustration');
  });
});
```

### Load Tests

**Tool**: k6 or Artillery

**Scenarios**:
1. Baseline: 100 concurrent users, 5-minute duration
2. Spike: 0 to 500 users in 30 seconds
3. Stress: Gradually increase to 1000 users
4. Soak: 200 users for 1 hour

**Acceptance Criteria**:
- P95 response time < 2 seconds under baseline load
- No errors under baseline load
- Graceful degradation under spike (demo mode fallback)
- No memory leaks during soak test



## Security Considerations

### Authentication & Authorization

**Google OAuth Implementation**:
```typescript
// next-auth configuration
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.role = profile.email?.endsWith('@school.edu') ? 'educator' : 'student';
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.role = token.role;
      return session;
    }
  }
};
```

**API Route Protection**:
```typescript
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    }, { status: 401 });
  }
  
  // Verify student can only access their own data
  const { studentId } = await request.json();
  if (session.user.id !== studentId && session.user.role !== 'educator') {
    return Response.json({
      error: { code: 'FORBIDDEN', message: 'Access denied' }
    }, { status: 403 });
  }
  
  // Process request...
}
```

### Data Privacy

**PII Handling**:
- Student names and emails stored only in Firestore (encrypted at rest)
- No PII in logs or analytics
- Anonymized IDs for aggregated metrics
- GDPR-compliant data export and deletion

**Firestore Security**:
```javascript
// Students can only access their own data
match /students/{studentId} {
  allow read, write: if request.auth.uid == studentId;
}

// Educators can read aggregated analytics only
match /analytics/aggregated/{document=**} {
  allow read: if request.auth.token.role == 'educator';
  allow write: if false; // Only server can write
}
```

### API Security

**Rate Limiting**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return Response.json({
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
    }, { status: 429 });
  }
  
  // Process request...
}
```

**Input Validation**:
```typescript
import { z } from 'zod';

const TeachRequestSchema = z.object({
  studentId: z.string().uuid(),
  topic: z.string().min(1).max(100),
  grade: z.string().regex(/^[K1-9]|1[0-2]$/),
  context: z.object({
    previousAttempts: z.number().int().min(0).max(10),
    responseDelay: z.number().int().min(0),
    lastScore: z.number().int().min(0).max(100)
  }).optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = TeachRequestSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Validation failed',
        details: result.error.issues
      }
    }, { status: 400 });
  }
  
  // Process validated data...
}
```



## Performance Optimization

### Caching Strategy

**Multi-Layer Caching**:

1. **In-Memory Cache** (for lesson content):
```typescript
import { LRUCache } from 'lru-cache';

const lessonCache = new LRUCache<string, LessonContent>({
  max: 500, // Maximum 500 lessons
  ttl: 1000 * 60 * 60, // 1 hour TTL
  updateAgeOnGet: true
});

function getCacheKey(topic: string, grade: string, difficulty: string): string {
  return `${topic}:${grade}:${difficulty}`;
}
```

2. **Cloud Storage Cache** (for static assets):
```typescript
// next.config.mjs
export default {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

3. **CDN Caching** (via Cloud Load Balancer):
```yaml
# Cloud Run service configuration
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/cdn-enabled: "true"
```

### Database Optimization

**Firestore Indexing**:
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "progress",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "masteryLevel", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Batch Operations**:
```typescript
async function saveSessionData(
  studentId: string,
  interactions: Interaction[]
): Promise<void> {
  const batch = db.batch();
  
  // Batch write all interactions
  interactions.forEach((interaction, index) => {
    const ref = db
      .collection('students')
      .doc(studentId)
      .collection('sessions')
      .doc(sessionId)
      .collection('interactions')
      .doc(`${index}`);
    
    batch.set(ref, interaction);
  });
  
  await batch.commit();
}
```

### Cold Start Optimization

**Strategies**:

1. **Minimal Dependencies**:
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "next": "15.0.0",
    "react": "^19.0.0",
    "firebase-admin": "^12.0.0"
  }
}
```

2. **Lazy Loading**:
```typescript
// Dynamic import for heavy libraries
const loadGeminiClient = async () => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
};
```

3. **Warm-up Requests**:
```typescript
// Cloud Scheduler job to keep instances warm
export async function GET() {
  // Lightweight warmup endpoint
  return Response.json({ status: 'warm' });
}
```

4. **Minimum Instances**:
```yaml
# For production, keep 1 instance always warm
annotations:
  run.googleapis.com/min-instances: "1"
```



## Monitoring & Observability

### Logging

**Structured Logging with Winston**:
```typescript
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    loggingWinston
  ]
});

// Usage
logger.info('Lesson generated', {
  studentId: 'abc123',
  topic: 'fractions',
  difficulty: 'medium',
  duration: 1250
});
```

### Metrics

**Custom Metrics with OpenTelemetry**:
```typescript
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const exporter = new PrometheusExporter({ port: 9464 });
const meterProvider = new MeterProvider();
meterProvider.addMetricReader(exporter);

const meter = meterProvider.getMeter('sunny-metrics');

// Counters
const lessonGenerationCounter = meter.createCounter('lessons_generated_total', {
  description: 'Total number of lessons generated'
});

const frustrationEventCounter = meter.createCounter('frustration_events_total', {
  description: 'Total number of frustration events detected'
});

// Histograms
const lessonGenerationDuration = meter.createHistogram('lesson_generation_duration_ms', {
  description: 'Lesson generation duration in milliseconds'
});

const apiResponseTime = meter.createHistogram('api_response_time_ms', {
  description: 'API response time in milliseconds'
});

// Usage
lessonGenerationCounter.add(1, { topic: 'fractions', grade: '3' });
lessonGenerationDuration.record(1250, { source: 'gemini' });
```

### Tracing

**Request Tracing**:
```typescript
import { trace, context } from '@opentelemetry/api';

export async function POST(request: Request) {
  const tracer = trace.getTracer('sunny-api');
  
  return tracer.startActiveSpan('teach-endpoint', async (span) => {
    const requestId = generateRequestId();
    span.setAttribute('request.id', requestId);
    span.setAttribute('request.path', '/api/teach');
    
    try {
      const body = await request.json();
      span.setAttribute('student.id', body.studentId);
      span.setAttribute('lesson.topic', body.topic);
      
      const lesson = await generateLesson(body);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return Response.json(lesson);
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Alerting

**Cloud Monitoring Alerts**:
```yaml
# alert-policies.yaml
alertPolicies:
  - displayName: "High Error Rate"
    conditions:
      - displayName: "Error rate > 5%"
        conditionThreshold:
          filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'
          comparison: COMPARISON_GT
          thresholdValue: 0.05
          duration: 300s
    notificationChannels:
      - projects/PROJECT_ID/notificationChannels/CHANNEL_ID
    
  - displayName: "Slow Response Time"
    conditions:
      - displayName: "P95 latency > 2s"
        conditionThreshold:
          filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'
          aggregations:
            - alignmentPeriod: 60s
              perSeriesAligner: ALIGN_DELTA
              crossSeriesReducer: REDUCE_PERCENTILE_95
          comparison: COMPARISON_GT
          thresholdValue: 2000
          duration: 300s
```



## Infrastructure as Code

### Terraform Configuration

**Main Infrastructure**:
```hcl
# main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run Service
resource "google_cloud_run_service" "sunny" {
  name     = "sunny-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/sunny:${var.image_tag}"
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "1Gi"
          }
        }
        
        env {
          name  = "GEMINI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.gemini_api_key.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "DEMO_MODE"
          value = var.demo_mode
        }
      }
      
      service_account_name = google_service_account.sunny.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Firestore Database
resource "google_firestore_database" "sunny" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

# Cloud Storage Bucket
resource "google_storage_bucket" "sunny_assets" {
  name          = "${var.project_id}-sunny-assets"
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Service Account
resource "google_service_account" "sunny" {
  account_id   = "sunny-${var.environment}"
  display_name = "Sunny Service Account"
}

# IAM Bindings
resource "google_project_iam_member" "sunny_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.sunny.email}"
}

resource "google_project_iam_member" "sunny_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.sunny.email}"
}

# Secret Manager
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key-${var.environment}"
  
  replication {
    automatic = true
  }
}
```

**Variables**:
```hcl
# variables.tf
variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "demo_mode" {
  description = "Enable demo mode"
  type        = string
  default     = "false"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = string
  default     = "0"
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = string
  default     = "100"
}

variable "domain" {
  description = "Custom domain for the application"
  type        = string
}
```



## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  SERVICE_NAME: sunny

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DEMO_MODE: true

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker
      
      - name: Build Docker image
        run: |
          docker build \
            --build-arg NODE_ENV=production \
            --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
            .
      
      - name: Push Docker image
        run: |
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars DEMO_MODE=false \
            --set-secrets GEMINI_API_KEY=gemini-api-key-prod:latest \
            --min-instances 1 \
            --max-instances 100 \
            --cpu 2 \
            --memory 1Gi \
            --timeout 60s \
            --concurrency 80
      
      - name: Get service URL
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
            --region $REGION \
            --format 'value(status.url)')
          echo "Service deployed to: $SERVICE_URL"
      
      - name: Run smoke tests
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
            --region $REGION \
            --format 'value(status.url)')
          
          # Test health endpoint
          curl -f $SERVICE_URL/api/health || exit 1
          
          # Test teach endpoint
          curl -f -X POST $SERVICE_URL/api/teach \
            -H "Content-Type: application/json" \
            -d '{"studentId":"test","topic":"fractions","grade":"3"}' \
            || exit 1
```



## Cost Optimization

### Cost Estimation

**Monthly Cost Breakdown** (estimated for 1000 active students):

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run | 2M requests, 100 GB-hours | $50 |
| Gemini API | 500K requests (with caching) | $150 |
| Firestore | 10M reads, 2M writes, 50GB storage | $75 |
| Cloud Storage | 100GB storage, 1TB egress | $30 |
| Cloud Load Balancer | 1TB egress | $20 |
| **Total** | | **~$325/month** |

**Per-Student Cost**: ~$0.33/month

### Cost Optimization Strategies

1. **Aggressive Caching**:
```typescript
// Cache lesson content for 1 hour
const CACHE_TTL = 60 * 60 * 1000;

// Cache hit rate target: 70%
// Reduces Gemini API calls by 70%
// Savings: ~$105/month
```

2. **Batch Operations**:
```typescript
// Batch Firestore writes to reduce operations
// 10 interactions per batch instead of 10 separate writes
// Reduces write operations by 90%
// Savings: ~$60/month
```

3. **Smart Scaling**:
```yaml
# Scale to zero during off-hours (8pm - 6am)
# Reduces Cloud Run costs by 40%
# Savings: ~$20/month
```

4. **CDN Caching**:
```typescript
// Cache static assets at edge
// Reduces Cloud Run requests by 30%
// Savings: ~$15/month
```

**Total Potential Savings**: ~$200/month (62% reduction)
**Optimized Monthly Cost**: ~$125/month (~$0.13/student)

### Budget Alerts

```hcl
# budget-alert.tf
resource "google_billing_budget" "sunny_budget" {
  billing_account = var.billing_account
  display_name    = "Sunny ${var.environment} Budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "500"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.75
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.email.id
    ]
  }
}
```



## Documentation Structure

### README Updates

**New Sections**:

1. **Cloud Deployment**:
```markdown
## Deploying to Google Cloud Run

### Prerequisites
- Google Cloud account with billing enabled
- gcloud CLI installed
- Docker installed

### Quick Deploy
```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy sunny \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# Set environment variables
gcloud run services update sunny \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### Infrastructure as Code
```bash
cd terraform
terraform init
terraform plan -var="project_id=YOUR_PROJECT_ID"
terraform apply
```
```

2. **Environment Variables**:
```markdown
## Environment Variables

### Required
- `GEMINI_API_KEY`: Google AI Studio API key

### Optional
- `DEMO_MODE`: Set to 'true' for deterministic demo output (default: 'false')
- `GOOGLE_CLIENT_ID`: For Google OAuth integration
- `GOOGLE_CLIENT_SECRET`: For Google OAuth integration
- `NEXT_PUBLIC_FIREBASE_CONFIG`: Firebase configuration JSON

### Production
All secrets should be stored in Google Secret Manager and referenced in Cloud Run configuration.
```

3. **Architecture**:
```markdown
## Architecture

Sunny is built as a cloud-native application on Google Cloud Platform:

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes on Cloud Run
- **AI**: Google Gemini API for adaptive lesson generation
- **Database**: Firestore for student data and progress tracking
- **Storage**: Cloud Storage for static assets
- **Auth**: Google OAuth via next-auth
- **Monitoring**: Cloud Logging, Cloud Monitoring, OpenTelemetry

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.
```

### API Documentation

**File**: `docs/API.md`

**Contents**:
- OpenAPI 3.0 specification
- Authentication requirements
- Request/response examples
- Error codes and handling
- Rate limiting details
- Webhook documentation (if applicable)

### Deployment Guide

**File**: `docs/DEPLOYMENT.md`

**Contents**:
- Step-by-step deployment instructions
- Environment setup
- Secret management
- Domain configuration
- SSL certificate setup
- Monitoring setup
- Backup and disaster recovery

