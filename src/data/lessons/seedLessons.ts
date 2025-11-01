import { ContentType, Lesson } from '@/types/lesson';

const timestamp = '2024-01-01T00:00:00.000Z';

export const seedLessons: Lesson[] = [
  {
    id: 'fractions-basics',
    title: 'Fractions: Halves and Quarters',
    description: 'Explore how halves and quarters compare using visual models and quick challenges.',
    topics: ['fractions', 'math'],
    content: [
      {
        id: 'fractions-intro-text',
        type: ContentType.Text,
        title: "Sunny's Fraction Picnic",
        content:
          'Sunny and friends are sharing sandwiches. When you split a sandwich into two equal pieces you get halves. Split it into four equal pieces to get quarters!',
        difficulty: 'easy',
        estimatedDuration: 3
      },
      {
        id: 'fractions-quiz',
        type: ContentType.Quiz,
        title: 'Which Piece is Bigger?',
        content: {
          id: 'fractions-quiz-q1',
          type: 'multiple-choice',
          question: 'Which is larger?',
          options: ['One-half', 'One-quarter'],
          correctAnswer: 'One-half',
          explanation: 'Two pieces are bigger than four pieces when the whole stays the same.',
          points: 10
        },
        difficulty: 'easy',
        estimatedDuration: 4
      }
    ],
    difficulty: 'beginner',
    targetAgeRange: { min: 6, max: 9 },
    learningObjectives: [
      'Understand that fractions describe equal parts of a whole',
      'Compare one-half and one-quarter using pictures',
      'Explain why one-half is larger than one-quarter'
    ],
    keywords: ['fractions', 'half', 'quarter', 'math basics'],
    createdAt: timestamp,
    updatedAt: timestamp
  },
  {
    id: 'reading-focus-story',
    title: 'Reading Focus: Finding Main Ideas',
    description: 'Practice spotting the main idea in short, playful stories.',
    topics: ['reading', 'comprehension'],
    content: [
      {
        id: 'reading-story',
        type: ContentType.Text,
        title: 'The Lost Library Book',
        content:
          "Sunny misplaced a library book and searches the classroom. The clues show the book is in the art corner because that's where the glitter trail leads! The big idea is that looking for clues helps solve the problem.",
        difficulty: 'medium',
        estimatedDuration: 5
      },
      {
        id: 'reading-question',
        type: ContentType.Quiz,
        title: "What's the Story About?",
        content: {
          id: 'reading-question-1',
          type: 'multiple-choice',
          question: 'What is the main idea of the story?',
          options: [
            'Sunny painted a picture',
            'Sunny used clues to find a book',
            'The library closed early'
          ],
          correctAnswer: 'Sunny used clues to find a book',
          explanation: 'Sunny solved the problem by following clues, which is the main idea.',
          points: 10
        },
        difficulty: 'medium',
        estimatedDuration: 4
      }
    ],
    difficulty: 'intermediate',
    targetAgeRange: { min: 7, max: 11 },
    learningObjectives: [
      'Identify the main idea of a short paragraph',
      'Use supporting details to explain the main idea',
      'Ask clarifying questions while reading'
    ],
    keywords: ['reading', 'main idea', 'literacy'],
    createdAt: timestamp,
    updatedAt: timestamp
  },
  {
    id: 'space-planets-tour',
    title: 'Space Adventure: Tour of the Planets',
    description: 'Learn fun facts about the planets in our solar system with Sunny the space guide.',
    topics: ['space', 'science', 'planets'],
    content: [
      {
        id: 'space-facts',
        type: ContentType.Text,
        title: 'Zooming Through Space',
        content:
          "Sunny zooms from Mercury to Neptune sharing quick facts. Earth is just right for life, and Jupiter is the biggest planet with a giant red spot storm!",
        difficulty: 'easy',
        estimatedDuration: 4
      },
      {
        id: 'space-quiz',
        type: ContentType.Quiz,
        title: 'Pick the Planet Fact',
        content: {
          id: 'space-quiz-1',
          type: 'multiple-choice',
          question: 'Which planet is known for its giant red spot?',
          options: ['Mars', 'Earth', 'Jupiter'],
          correctAnswer: 'Jupiter',
          explanation: "Jupiter's red spot is a giant storm bigger than Earth.",
          points: 10
        },
        difficulty: 'easy',
        estimatedDuration: 4
      }
    ],
    difficulty: 'beginner',
    targetAgeRange: { min: 6, max: 10 },
    learningObjectives: [
      'Name the inner and outer planets',
      'Describe what makes Earth special',
      'Compare sizes of Jupiter and Earth'
    ],
    keywords: ['space', 'planets', 'science'],
    createdAt: timestamp,
    updatedAt: timestamp
  }
];
