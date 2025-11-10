/**
 * Demo Setup Script
 * 
 * Populates the application with demo data for presentations.
 * Run with: npx ts-node scripts/setup-demo.ts
 */

// Demo student profile
export const demoStudent = {
  id: 'demo-student-alex',
  name: 'Alex Johnson',
  email: 'alex@demo.sunny.ai',
  level: 3,
  points: 450,
  currentStreak: 7,
  learningInterests: ['Math', 'Science', 'Reading', 'Art'],
  learningStyle: 'visual' as const,
  difficulty: 'medium' as const,
  completedLessons: [
    {
      id: 'lesson-1',
      title: 'Introduction to Fractions',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      score: 95,
    },
    {
      id: 'lesson-2',
      title: 'Adding Fractions',
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      score: 88,
    },
    {
      id: 'lesson-3',
      title: 'Subtracting Fractions',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 92,
    },
    {
      id: 'lesson-4',
      title: 'Multiplying Fractions',
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      score: 85,
    },
  ],
};

// Demo learning state
export const demoLearningState = {
  studentId: demoStudent.id,
  sessionId: 'demo-session-1',
  currentObjectives: [
    {
      id: 'obj-1',
      title: 'Master Fraction Operations',
      description: 'Complete all fraction operations with 90% accuracy',
      targetLevel: 'medium' as const,
      prerequisites: [],
      estimatedDuration: 30,
      priority: 'high' as const,
      progress: 0.75,
    },
    {
      id: 'obj-2',
      title: 'Understand Decimal Conversion',
      description: 'Convert fractions to decimals and vice versa',
      targetLevel: 'medium' as const,
      prerequisites: ['obj-1'],
      estimatedDuration: 20,
      priority: 'medium' as const,
      progress: 0.3,
    },
    {
      id: 'obj-3',
      title: 'Apply Fractions in Real World',
      description: 'Solve word problems using fractions',
      targetLevel: 'hard' as const,
      prerequisites: ['obj-1', 'obj-2'],
      estimatedDuration: 40,
      priority: 'medium' as const,
      progress: 0.1,
    },
  ],
  knowledgeMap: {
    concepts: {
      'fraction-basics': {
        id: 'fraction-basics',
        name: 'Fraction Basics',
        description: 'Understanding numerator and denominator',
        category: 'Math',
        difficulty: 'easy' as const,
        prerequisites: [],
        relatedConcepts: ['fraction-addition'],
      },
      'fraction-addition': {
        id: 'fraction-addition',
        name: 'Adding Fractions',
        description: 'Adding fractions with same and different denominators',
        category: 'Math',
        difficulty: 'medium' as const,
        prerequisites: ['fraction-basics'],
        relatedConcepts: ['fraction-subtraction'],
      },
      'fraction-subtraction': {
        id: 'fraction-subtraction',
        name: 'Subtracting Fractions',
        description: 'Subtracting fractions with same and different denominators',
        category: 'Math',
        difficulty: 'medium' as const,
        prerequisites: ['fraction-basics'],
        relatedConcepts: ['fraction-addition', 'fraction-multiplication'],
      },
      'fraction-multiplication': {
        id: 'fraction-multiplication',
        name: 'Multiplying Fractions',
        description: 'Multiplying fractions and simplifying results',
        category: 'Math',
        difficulty: 'medium' as const,
        prerequisites: ['fraction-basics'],
        relatedConcepts: ['fraction-division'],
      },
      'fraction-division': {
        id: 'fraction-division',
        name: 'Dividing Fractions',
        description: 'Dividing fractions using reciprocals',
        category: 'Math',
        difficulty: 'hard' as const,
        prerequisites: ['fraction-multiplication'],
        relatedConcepts: [],
      },
    },
    relationships: [
      {
        fromConcept: 'fraction-basics',
        toConcept: 'fraction-addition',
        type: 'prerequisite' as const,
        strength: 1.0,
      },
      {
        fromConcept: 'fraction-addition',
        toConcept: 'fraction-subtraction',
        type: 'related' as const,
        strength: 0.9,
      },
    ],
    masteryLevels: new Map([
      [
        'fraction-basics',
        {
          conceptId: 'fraction-basics',
          level: 'mastered' as const,
          confidence: 0.95,
          lastAssessed: Date.now() - 2 * 24 * 60 * 60 * 1000,
          evidence: [],
        },
      ],
      [
        'fraction-addition',
        {
          conceptId: 'fraction-addition',
          level: 'proficient' as const,
          confidence: 0.85,
          lastAssessed: Date.now() - 1 * 24 * 60 * 60 * 1000,
          evidence: [],
        },
      ],
      [
        'fraction-subtraction',
        {
          conceptId: 'fraction-subtraction',
          level: 'developing' as const,
          confidence: 0.7,
          lastAssessed: Date.now(),
          evidence: [],
        },
      ],
      [
        'fraction-multiplication',
        {
          conceptId: 'fraction-multiplication',
          level: 'introduced' as const,
          confidence: 0.5,
          lastAssessed: Date.now(),
          evidence: [],
        },
      ],
    ]),
    knowledgeGaps: [
      {
        conceptId: 'fraction-division',
        severity: 'moderate' as const,
        description: 'Not yet introduced to fraction division',
        suggestedActions: ['Introduce reciprocal concept', 'Practice with visual aids'],
        detectedAt: Date.now(),
        concept: 'Dividing Fractions',
      },
      {
        conceptId: 'fraction-multiplication',
        severity: 'minor' as const,
        description: 'Needs more practice with simplification',
        suggestedActions: ['Additional practice problems', 'Review simplification rules'],
        detectedAt: Date.now(),
        concept: 'Multiplying Fractions',
      },
    ],
  },
  engagementMetrics: {
    currentLevel: 0.85,
    attentionSpan: 18,
    interactionFrequency: 3.5,
    responseTime: 4.2,
    frustrationLevel: 0.15,
    motivationLevel: 0.9,
    preferredActivityTypes: ['quiz' as const, 'game' as const, 'practice' as const],
    engagementHistory: [],
  },
  learningPath: [
    {
      id: 'path-1',
      type: 'concept' as const,
      content: { title: 'Review Fraction Basics' },
      prerequisites: [],
      estimatedDuration: 10,
      adaptationRules: [],
      completed: true,
      completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'path-2',
      type: 'activity' as const,
      content: { title: 'Practice Adding Fractions' },
      prerequisites: ['path-1'],
      estimatedDuration: 15,
      adaptationRules: [],
      completed: true,
      completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'path-3',
      type: 'assessment' as const,
      content: { title: 'Fraction Addition Quiz' },
      prerequisites: ['path-2'],
      estimatedDuration: 10,
      adaptationRules: [],
      completed: false,
      startedAt: Date.now(),
    },
    {
      id: 'path-4',
      type: 'concept' as const,
      content: { title: 'Learn Fraction Multiplication' },
      prerequisites: ['path-3'],
      estimatedDuration: 20,
      adaptationRules: [],
      completed: false,
    },
    {
      id: 'path-5',
      type: 'activity' as const,
      content: { title: 'Multiplication Practice' },
      prerequisites: ['path-4'],
      estimatedDuration: 15,
      adaptationRules: [],
      completed: false,
    },
  ],
  contextHistory: [],
  lastUpdated: Date.now(),
  lastActivityTimestamp: Date.now() - 5 * 60 * 1000,
  currentDifficulty: 'medium' as const,
  sessionStartTime: Date.now() - 30 * 60 * 1000,
  recentAchievements: [
    'Completed 7-day streak!',
    'Mastered Fraction Basics',
    'Earned 100 XP',
  ],
};

// Demo generated content
export const demoGeneratedContent = [
  {
    id: 'content-1',
    type: 'lesson' as const,
    title: 'Introduction to Multiplying Fractions',
    description: 'Learn how to multiply fractions step by step with visual examples',
    content: {
      sections: [
        {
          title: 'What is Fraction Multiplication?',
          text: 'When we multiply fractions, we multiply the numerators together and the denominators together.',
        },
        {
          title: 'Example',
          text: '1/2 × 3/4 = (1×3)/(2×4) = 3/8',
        },
      ],
    },
    generatedBy: 'Content Generation Agent',
    generatedAt: new Date(),
    status: 'pending' as const,
    studentId: demoStudent.id,
    metadata: {
      difficulty: 'medium',
      topic: 'Mathematics - Fractions',
      learningObjectives: [
        'Understand the concept of fraction multiplication',
        'Multiply numerators and denominators correctly',
        'Simplify the resulting fraction',
      ],
    },
  },
  {
    id: 'content-2',
    type: 'quiz' as const,
    title: 'Fraction Multiplication Practice',
    description: 'Test your understanding of multiplying fractions',
    content: {
      questions: [
        {
          question: 'What is 1/2 × 2/3?',
          options: ['1/3', '2/6', '1/6', '3/6'],
          correctAnswer: '1/3',
          explanation: '1/2 × 2/3 = 2/6 = 1/3 (simplified)',
        },
      ],
    },
    generatedBy: 'Content Generation Agent',
    generatedAt: new Date(),
    status: 'approved' as const,
    studentId: demoStudent.id,
    metadata: {
      difficulty: 'medium',
      topic: 'Mathematics - Fractions',
    },
  },
  {
    id: 'content-3',
    type: 'activity' as const,
    title: 'Fraction Pizza Party',
    description: 'Interactive game to practice fraction operations',
    content: {
      type: 'game',
      description: 'Help serve pizza slices by solving fraction problems!',
    },
    generatedBy: 'Content Generation Agent',
    generatedAt: new Date(),
    status: 'pending' as const,
    studentId: demoStudent.id,
    metadata: {
      difficulty: 'easy',
      topic: 'Mathematics - Fractions',
    },
  },
];

// Function to populate demo data
export function setupDemoData() {
  if (typeof window === 'undefined') return;

  console.log('🎬 Setting up demo data...');

  // Store demo student
  localStorage.setItem('demo_student', JSON.stringify(demoStudent));

  // Store demo learning state
  localStorage.setItem('demo_learning_state', JSON.stringify(demoLearningState));

  // Store demo content
  localStorage.setItem('demo_generated_content', JSON.stringify(demoGeneratedContent));

  // Enable demo mode
  localStorage.setItem('DEMO_MODE', 'true');
  localStorage.setItem('SHOW_AGENT_ACTIVITY', 'true');

  console.log('✅ Demo data loaded successfully!');
  console.log('📊 Student:', demoStudent.name);
  console.log('🎯 Objectives:', demoLearningState.currentObjectives.length);
  console.log('🧠 Concepts:', Object.keys(demoLearningState.knowledgeMap.concepts).length);
  console.log('📝 Content Items:', demoGeneratedContent.length);
}

// Auto-run if in browser
if (typeof window !== 'undefined' && localStorage.getItem('POPULATE_DEMO_DATA') === 'true') {
  setupDemoData();
  localStorage.removeItem('POPULATE_DEMO_DATA');
  window.location.reload();
}

export default setupDemoData;
