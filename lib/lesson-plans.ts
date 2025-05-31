// Structured lesson plan system for Sunny AI
// This file provides the core structure for customizable lesson plans

export type ActivityType = 'multiple-choice' | 'creative' | 'discussion' | 'pattern' | 'matching';

export interface LearningActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  content: any; // Specific content based on activity type
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes: number;
  ageRange: {
    min: number;
    max: number;
  };
  imageUrl?: string;
}

export interface LessonContent {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  learningOutcomes: string[];
  activities: LearningActivity[];
  relatedTopics: string[];
  additionalResources?: {
    title: string;
    url: string;
    type: 'video' | 'article' | 'game' | 'worksheet';
  }[];
}

export interface LessonPlan {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  gradeLevel: string[];
  author: {
    name: string;
    id?: string;
  };
  isPublic: boolean;
  dateCreated: string;
  dateModified: string;
  content: LessonContent;
  tags: string[];
}

// Sample lesson plans to get started
export const sampleLessonPlans: LessonPlan[] = [
  {
    id: 'math-patterns-001',
    title: 'Exploring Patterns in Numbers',
    category: 'math',
    gradeLevel: ['K-2', '3-5'],
    author: {
      name: 'Sunny AI',
      id: 'system'
    },
    isPublic: true,
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    content: {
      id: 'math-patterns-001-content',
      title: 'Finding Patterns All Around Us',
      description: 'Learn to identify, create, and extend patterns using numbers, shapes, and objects',
      keywords: ['patterns', 'sequence', 'math', 'numbers'],
      learningOutcomes: [
        'Identify patterns in numbers and shapes',
        'Create simple patterns using objects',
        'Extend existing patterns',
        'Understand pattern rules'
      ],
      activities: [
        {
          id: 'pattern-recognition',
          type: 'multiple-choice',
          title: 'Pattern Recognition',
          description: 'Identify the next item in the pattern',
          difficulty: 'beginner',
          estimatedTimeMinutes: 5,
          ageRange: { min: 5, max: 8 },
          content: {
            question: 'What comes next in the pattern: 🔴, 🔵, 🔴, 🔵, ❓',
            options: ['🔴', '🔵', '🟢', '🟡'],
            correctAnswer: '🔴'
          }
        },
        {
          id: 'create-pattern',
          type: 'creative',
          title: 'Create Your Own Pattern',
          description: 'Make a pattern using emojis or drawings',
          difficulty: 'beginner',
          estimatedTimeMinutes: 10,
          ageRange: { min: 5, max: 10 },
          content: {
            instructions: 'Create your own pattern using at least 3 different items. Make it repeat at least twice.',
            examples: ['🐶🐱🐭🐶🐱🐭', '🔺⭐🔸🔺⭐🔸'],
            submissionType: 'text-or-image'
          }
        }
      ],
      relatedTopics: ['counting', 'shapes', 'sequences']
    },
    tags: ['patterns', 'beginner', 'interactive']
  },
  {
    id: 'robots-intro-001',
    title: 'Introduction to Robots',
    category: 'robots',
    gradeLevel: ['3-5', '6-8'],
    author: {
      name: 'Sunny AI',
      id: 'system'
    },
    isPublic: true,
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    content: {
      id: 'robots-intro-001-content',
      title: 'What Are Robots?',
      description: 'Learn about robots, their parts, and how they help humans',
      keywords: ['robots', 'technology', 'programming', 'sensors'],
      learningOutcomes: [
        'Understand what makes something a robot',
        'Identify the main parts of a robot',
        'Explain how robots help humans',
        'Describe how robots are programmed'
      ],
      activities: [
        {
          id: 'robot-parts',
          type: 'matching',
          title: 'Robot Parts Matching',
          description: 'Match each robot part with its function',
          difficulty: 'intermediate',
          estimatedTimeMinutes: 8,
          ageRange: { min: 8, max: 12 },
          content: {
            pairs: [
              { item: 'Camera', match: 'Helps the robot see' },
              { item: 'Speaker', match: 'Allows the robot to make sounds' },
              { item: 'Wheel', match: 'Helps the robot move around' },
              { item: 'Sensor', match: 'Detects changes in the environment' }
            ]
          }
        },
        {
          id: 'robot-discussion',
          type: 'discussion',
          title: 'Robot Helper',
          description: 'Design a robot to help with a problem',
          difficulty: 'intermediate',
          estimatedTimeMinutes: 15,
          ageRange: { min: 8, max: 14 },
          content: {
            prompt: 'If you could design a robot to help solve a problem at your school, what would it do? What parts would it need?',
            thinkingPoints: [
              'What problems need solving?',
              'How would your robot move?',
              'How would it sense things?',
              'What would it look like?'
            ]
          }
        }
      ],
      relatedTopics: ['programming', 'engineering', 'technology'],
      additionalResources: [
        {
          title: 'Simple Cardboard Robot Craft',
          url: 'https://example.com/robot-craft',
          type: 'worksheet'
        }
      ]
    },
    tags: ['robots', 'technology', 'STEM']
  }
];

// Utility functions for lesson plan management
export function getLessonPlansByCategory(category: string): LessonPlan[] {
  return sampleLessonPlans.filter(plan => plan.category === category);
}

export function getLessonPlanById(id: string): LessonPlan | undefined {
  // First, try to find in sample lesson plans
  const samplePlan = sampleLessonPlans.find(plan => plan.id === id);
  if (samplePlan) {
    return samplePlan;
  }

  // If not found in samples, try localStorage
  // This check ensures localStorage is only accessed on the client-side
  if (typeof window !== 'undefined') {
    try {
      const storedPlansJSON = localStorage.getItem("sunnyLessonPlans");
      if (storedPlansJSON) {
        const localStoragePlans = JSON.parse(storedPlansJSON) as LessonPlan[];
        if (Array.isArray(localStoragePlans)) {
          const foundPlan = localStoragePlans.find(plan => plan.id === id);
          if (foundPlan) {
            return foundPlan;
          }
        } else {
          console.warn("Stored 'sunnyLessonPlans' is not an array.");
        }
      }
    } catch (error) {
      console.error("Error reading or parsing lesson plans from localStorage:", error);
      // Fall through to return undefined if an error occurs
    }
  }

  return undefined; // Not found in samples or localStorage
}

export function getActivitiesByAgeRange(min: number, max: number): LearningActivity[] {
  const activities: LearningActivity[] = [];
  
  sampleLessonPlans.forEach(plan => {
    const filteredActivities = plan.content.activities.filter(
      activity => activity.ageRange.min <= max && activity.ageRange.max >= min
    );
    activities.push(...filteredActivities);
  });
  
  return activities;
}

// In a full implementation, these functions would interact with a database
// to save and load lesson plans dynamically
