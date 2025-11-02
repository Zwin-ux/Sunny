/**
 * Comprehensive Curriculum Library
 * Real educational topics aligned with standards
 */

export interface CurriculumTopic {
  id: string;
  name: string;
  displayName: string;
  subject: 'math' | 'reading' | 'science' | 'logic' | 'social-studies';
  gradeLevel: number[]; // Array of grades (1-12)
  prerequisites: string[];
  unlocks: string[];
  description: string;
  estimatedTime: number; // minutes to master
}

/**
 * MATHEMATICS CURRICULUM
 */
export const MATH_TOPICS: Record<string, CurriculumTopic> = {
  // GRADE 1-2 (Ages 6-8)
  countingTo100: {
    id: 'counting-to-100',
    name: 'counting-to-100',
    displayName: 'Counting to 100',
    subject: 'math',
    gradeLevel: [1],
    prerequisites: [],
    unlocks: ['number-recognition', 'skip-counting-2s'],
    description: 'Learn to count from 1 to 100',
    estimatedTime: 120
  },

  numberRecognition: {
    id: 'number-recognition',
    name: 'number-recognition',
    displayName: 'Number Recognition',
    subject: 'math',
    gradeLevel: [1],
    prerequisites: ['counting-to-100'],
    unlocks: ['single-digit-addition'],
    description: 'Recognize and write numbers 1-100',
    estimatedTime: 90
  },

  singleDigitAddition: {
    id: 'single-digit-addition',
    name: 'single-digit-addition',
    displayName: 'Single-Digit Addition',
    subject: 'math',
    gradeLevel: [1, 2],
    prerequisites: ['number-recognition'],
    unlocks: ['double-digit-addition', 'single-digit-subtraction'],
    description: 'Add numbers 0-9',
    estimatedTime: 180
  },

  singleDigitSubtraction: {
    id: 'single-digit-subtraction',
    name: 'single-digit-subtraction',
    displayName: 'Single-Digit Subtraction',
    subject: 'math',
    gradeLevel: [1, 2],
    prerequisites: ['single-digit-addition'],
    unlocks: ['double-digit-subtraction'],
    description: 'Subtract numbers 0-9',
    estimatedTime: 180
  },

  skipCounting: {
    id: 'skip-counting',
    name: 'skip-counting',
    displayName: 'Skip Counting (2s, 5s, 10s)',
    subject: 'math',
    gradeLevel: [1, 2],
    prerequisites: ['counting-to-100'],
    unlocks: ['multiplication-tables'],
    description: 'Count by 2s, 5s, and 10s',
    estimatedTime: 120
  },

  // GRADE 3-4 (Ages 8-10)
  multiplicationTables: {
    id: 'multiplication-tables',
    name: 'multiplication-tables',
    displayName: 'Multiplication Tables (1-12)',
    subject: 'math',
    gradeLevel: [3, 4],
    prerequisites: ['skip-counting', 'single-digit-addition'],
    unlocks: ['division-basics', 'multi-digit-multiplication'],
    description: 'Master multiplication tables 1-12',
    estimatedTime: 300
  },

  divisionBasics: {
    id: 'division-basics',
    name: 'division-basics',
    displayName: 'Division Basics',
    subject: 'math',
    gradeLevel: [3, 4],
    prerequisites: ['multiplication-tables'],
    unlocks: ['long-division', 'fractions-basics'],
    description: 'Understand division as inverse of multiplication',
    estimatedTime: 240
  },

  fractionsBasics: {
    id: 'fractions-basics',
    name: 'fractions-basics',
    displayName: 'Fractions (Halves, Quarters, Thirds)',
    subject: 'math',
    gradeLevel: [3, 4],
    prerequisites: ['division-basics'],
    unlocks: ['fractions-add-subtract', 'decimals-basics'],
    description: 'Understand basic fractions and visual models',
    estimatedTime: 240
  },

  wordProblems: {
    id: 'word-problems',
    name: 'word-problems',
    displayName: 'Word Problems',
    subject: 'math',
    gradeLevel: [3, 4, 5],
    prerequisites: ['single-digit-addition', 'single-digit-subtraction'],
    unlocks: ['multi-step-word-problems'],
    description: 'Solve real-world math problems',
    estimatedTime: 180
  },

  // GRADE 5-6 (Ages 10-12)
  multiDigitMultiplication: {
    id: 'multi-digit-multiplication',
    name: 'multi-digit-multiplication',
    displayName: 'Multi-Digit Multiplication',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['multiplication-tables'],
    unlocks: ['long-division'],
    description: 'Multiply numbers with 2+ digits',
    estimatedTime: 240
  },

  longDivision: {
    id: 'long-division',
    name: 'long-division',
    displayName: 'Long Division',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['division-basics', 'multi-digit-multiplication'],
    unlocks: ['decimals-division'],
    description: 'Divide large numbers step by step',
    estimatedTime: 300
  },

  fractionsAddSubtract: {
    id: 'fractions-add-subtract',
    name: 'fractions-add-subtract',
    displayName: 'Adding & Subtracting Fractions',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['fractions-basics'],
    unlocks: ['fractions-multiply-divide'],
    description: 'Add and subtract fractions with common denominators',
    estimatedTime: 240
  },

  decimalsBasics: {
    id: 'decimals-basics',
    name: 'decimals-basics',
    displayName: 'Decimals & Place Value',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['fractions-basics'],
    unlocks: ['percentages-basics', 'decimals-operations'],
    description: 'Understand decimal place value',
    estimatedTime: 180
  },

  percentagesBasics: {
    id: 'percentages-basics',
    name: 'percentages-basics',
    displayName: 'Percentages',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['decimals-basics', 'fractions-basics'],
    unlocks: ['ratios-proportions'],
    description: 'Convert between fractions, decimals, and percentages',
    estimatedTime: 180
  },

  ratiosProportions: {
    id: 'ratios-proportions',
    name: 'ratios-proportions',
    displayName: 'Ratios & Proportions',
    subject: 'math',
    gradeLevel: [6, 7],
    prerequisites: ['percentages-basics'],
    unlocks: ['pre-algebra'],
    description: 'Understand ratios and solve proportions',
    estimatedTime: 240
  },

  // GEOMETRY
  basicShapes: {
    id: 'basic-shapes',
    name: 'basic-shapes',
    displayName: 'Basic Shapes',
    subject: 'math',
    gradeLevel: [1, 2],
    prerequisites: [],
    unlocks: ['area-perimeter'],
    description: 'Identify circles, squares, triangles, rectangles',
    estimatedTime: 90
  },

  areaPerimeter: {
    id: 'area-perimeter',
    name: 'area-perimeter',
    displayName: 'Area & Perimeter',
    subject: 'math',
    gradeLevel: [3, 4, 5],
    prerequisites: ['basic-shapes', 'multiplication-tables'],
    unlocks: ['geometry-angles'],
    description: 'Calculate area and perimeter of shapes',
    estimatedTime: 180
  },

  geometryAngles: {
    id: 'geometry-angles',
    name: 'geometry-angles',
    displayName: 'Angles & Triangles',
    subject: 'math',
    gradeLevel: [5, 6],
    prerequisites: ['area-perimeter'],
    unlocks: ['pythagorean-theorem'],
    description: 'Understand angles, triangles, and their properties',
    estimatedTime: 240
  },

  // ALGEBRA
  preAlgebra: {
    id: 'pre-algebra',
    name: 'pre-algebra',
    displayName: 'Pre-Algebra (Variables & Expressions)',
    subject: 'math',
    gradeLevel: [6, 7],
    prerequisites: ['ratios-proportions'],
    unlocks: ['solving-equations'],
    description: 'Introduction to variables and algebraic expressions',
    estimatedTime: 300
  },

  solvingEquations: {
    id: 'solving-equations',
    name: 'solving-equations',
    displayName: 'Solving Equations',
    subject: 'math',
    gradeLevel: [7, 8],
    prerequisites: ['pre-algebra'],
    unlocks: ['graphing-coordinates'],
    description: 'Solve one and two-step equations',
    estimatedTime: 300
  }
};

/**
 * READING & LANGUAGE ARTS CURRICULUM
 */
export const READING_TOPICS: Record<string, CurriculumTopic> = {
  phonics: {
    id: 'phonics-letter-sounds',
    name: 'phonics-letter-sounds',
    displayName: 'Phonics & Letter Sounds',
    subject: 'reading',
    gradeLevel: [1],
    prerequisites: [],
    unlocks: ['sight-words', 'reading-comprehension-basic'],
    description: 'Learn letter sounds and phonics rules',
    estimatedTime: 240
  },

  sightWords: {
    id: 'sight-words',
    name: 'sight-words',
    displayName: 'Sight Words (Dolch List)',
    subject: 'reading',
    gradeLevel: [1, 2],
    prerequisites: ['phonics-letter-sounds'],
    unlocks: ['reading-comprehension-basic'],
    description: 'Recognize common sight words instantly',
    estimatedTime: 180
  },

  readingComprehensionBasic: {
    id: 'reading-comprehension-basic',
    name: 'reading-comprehension-basic',
    displayName: 'Reading Comprehension (Basic)',
    subject: 'reading',
    gradeLevel: [2, 3],
    prerequisites: ['sight-words'],
    unlocks: ['reading-comprehension-intermediate'],
    description: 'Understand simple stories and passages',
    estimatedTime: 300
  },

  grammarBasics: {
    id: 'grammar-nouns-verbs',
    name: 'grammar-nouns-verbs',
    displayName: 'Grammar (Nouns & Verbs)',
    subject: 'reading',
    gradeLevel: [2, 3],
    prerequisites: [],
    unlocks: ['parts-of-speech'],
    description: 'Identify nouns and verbs in sentences',
    estimatedTime: 120
  },

  vocabularyBuilding: {
    id: 'vocabulary-building',
    name: 'vocabulary-building',
    displayName: 'Vocabulary Building',
    subject: 'reading',
    gradeLevel: [3, 4, 5],
    prerequisites: ['reading-comprehension-basic'],
    unlocks: ['synonyms-antonyms'],
    description: 'Expand vocabulary through context clues',
    estimatedTime: 180
  }
};

/**
 * SCIENCE CURRICULUM
 */
export const SCIENCE_TOPICS: Record<string, CurriculumTopic> = {
  lifeCycles: {
    id: 'life-cycles',
    name: 'life-cycles',
    displayName: 'Life Cycles (Plants & Animals)',
    subject: 'science',
    gradeLevel: [2, 3],
    prerequisites: [],
    unlocks: ['food-chains'],
    description: 'Learn how plants and animals grow and change',
    estimatedTime: 120
  },

  statesOfMatter: {
    id: 'states-of-matter',
    name: 'states-of-matter',
    displayName: 'States of Matter',
    subject: 'science',
    gradeLevel: [3, 4],
    prerequisites: [],
    unlocks: ['simple-machines'],
    description: 'Understand solids, liquids, and gases',
    estimatedTime: 150
  },

  solarSystem: {
    id: 'solar-system',
    name: 'solar-system',
    displayName: 'Solar System & Planets',
    subject: 'science',
    gradeLevel: [4, 5],
    prerequisites: [],
    unlocks: [],
    description: 'Explore our solar system and the planets',
    estimatedTime: 180
  }
};

/**
 * LOGIC & CRITICAL THINKING CURRICULUM
 */
export const LOGIC_TOPICS: Record<string, CurriculumTopic> = {
  patternRecognition: {
    id: 'pattern-recognition',
    name: 'pattern-recognition',
    displayName: 'Pattern Recognition',
    subject: 'logic',
    gradeLevel: [1, 2, 3],
    prerequisites: [],
    unlocks: ['sequencing', 'coding-sequences'],
    description: 'Identify and continue patterns',
    estimatedTime: 90
  },

  problemSolving: {
    id: 'problem-solving-strategies',
    name: 'problem-solving-strategies',
    displayName: 'Problem-Solving Strategies',
    subject: 'logic',
    gradeLevel: [3, 4, 5],
    prerequisites: ['pattern-recognition'],
    unlocks: ['logical-reasoning'],
    description: 'Learn strategies to solve complex problems',
    estimatedTime: 180
  },

  codingBasics: {
    id: 'coding-sequences',
    name: 'coding-sequences',
    displayName: 'Coding Basics (Sequences)',
    subject: 'logic',
    gradeLevel: [4, 5, 6],
    prerequisites: ['pattern-recognition'],
    unlocks: ['coding-loops'],
    description: 'Introduction to coding with sequences',
    estimatedTime: 240
  }
};

/**
 * Get all topics across all subjects
 */
export function getAllTopics(): CurriculumTopic[] {
  return [
    ...Object.values(MATH_TOPICS),
    ...Object.values(READING_TOPICS),
    ...Object.values(SCIENCE_TOPICS),
    ...Object.values(LOGIC_TOPICS)
  ];
}

/**
 * Get topics by subject
 */
export function getTopicsBySubject(subject: CurriculumTopic['subject']): CurriculumTopic[] {
  return getAllTopics().filter(topic => topic.subject === subject);
}

/**
 * Get topics by grade level
 */
export function getTopicsByGrade(grade: number): CurriculumTopic[] {
  return getAllTopics().filter(topic => topic.gradeLevel.includes(grade));
}

/**
 * Get topic by ID
 */
export function getTopicById(id: string): CurriculumTopic | undefined {
  return getAllTopics().find(topic => topic.id === id);
}

/**
 * Get prerequisites for a topic
 */
export function getPrerequisites(topicId: string): CurriculumTopic[] {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  
  return topic.prerequisites
    .map(prereqId => getTopicById(prereqId))
    .filter((t): t is CurriculumTopic => t !== undefined);
}

/**
 * Get what a topic unlocks
 */
export function getUnlocks(topicId: string): CurriculumTopic[] {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  
  return topic.unlocks
    .map(unlockId => getTopicById(unlockId))
    .filter((t): t is CurriculumTopic => t !== undefined);
}

/**
 * Check if student is ready for a topic (has completed prerequisites)
 */
export function isReadyForTopic(topicId: string, completedTopics: string[]): boolean {
  const topic = getTopicById(topicId);
  if (!topic) return false;
  
  return topic.prerequisites.every(prereq => completedTopics.includes(prereq));
}
