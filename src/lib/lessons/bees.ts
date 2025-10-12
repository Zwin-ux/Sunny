import { Lesson, ContentType, MediaContent, QuizQuestion } from '../../types/lesson';

const beeMedia: MediaContent[] = [
  {
    type: 'image',
    url: 'https://example.com/bee-honeycomb.jpg',
    altText: 'Honeycomb structure made by bees',
    caption: 'Bees create perfect hexagonal honeycombs to store honey and raise their young.'
  },
  {
    type: 'video',
    url: 'https://example.com/bee-dance.mp4',
    altText: 'Honeybee waggle dance',
    caption: 'Honeybees perform a waggle dance to communicate the location of food sources.'
  }
] as MediaContent[];

const beeQuiz: QuizQuestion[] = [
  {
    id: 'bee-1',
    type: 'multiple-choice',
    question: 'What is the primary purpose of a honeybee\'s waggle dance?',
    options: [
      'To attract a mate',
      'To communicate the location of food',
      'To warn of danger',
      'To establish dominance'
    ],
    correctAnswer: 'To communicate the location of food',
    explanation: 'The waggle dance is a sophisticated form of communication that tells other bees the direction and distance to a food source.',
    points: 10
  },
  {
    id: 'bee-2',
    type: 'true-false',
    question: 'All bees can sting multiple times.',
    correctAnswer: 'False',
    explanation: 'Honeybees can only sting once as their stinger gets stuck in the skin, but bumblebees can sting multiple times.',
    points: 5
  }
];

const beeLesson: Lesson = {
  id: 'bees-101',
  title: 'The Amazing World of Bees',
  description: 'Learn about the fascinating life of bees, their importance to our ecosystem, and how they communicate.',
  topics: ['insects', 'pollination', 'honey production', 'bee behavior'],
  difficulty: 'beginner',
  targetAgeRange: {
    min: 6,
    max: 12
  },
  learningObjectives: [
    'Understand the role of bees in pollination',
    'Learn about different types of bees and their roles in the hive',
    'Discover how bees communicate',
    'Appreciate the importance of bees to our ecosystem'
  ],
  keywords: ['bees', 'honey', 'pollination', 'hive', 'honeycomb', 'beekeeping'],
  content: [
    {
      id: 'intro',
      type: ContentType.Text,
      title: 'Introduction to Bees',
      content: 'Bees are flying insects closely related to wasps and ants, known for their role in pollination and, in the case of the best-known bee species, the western honey bee, for producing honey.',
      difficulty: 'beginner',
      estimatedDuration: 5,
      media: beeMedia && beeMedia[0] ? [beeMedia[0]] : []
    },
    {
      id: 'types',
      type: ContentType.Text,
      title: 'Types of Bees',
      content: 'There are over 16,000 known species of bees in seven recognized biological families. Some species – including honey bees, bumblebees, and stingless bees – live socially in colonies while most species are solitary.',
      difficulty: 'beginner',
      estimatedDuration: 5,
      media: beeMedia && beeMedia[1] ? [beeMedia[1]] : []
    },
    {
      id: 'hive-life',
      type: ContentType.Text,
      title: 'Life in the Hive',
      content: 'A typical honeybee hive contains one queen, hundreds of male drones, and thousands of female worker bees. Each has specific roles in maintaining the hive and ensuring the survival of the colony.',
      difficulty: 'intermediate',
      estimatedDuration: 10,
      media: beeMedia && beeMedia[0] ? [beeMedia[0]] : []
    },
    {
      id: 'quiz',
      type: ContentType.Quiz,
      title: 'Test Your Knowledge',
      content: beeQuiz[0],
      difficulty: 'beginner',
      estimatedDuration: 5
    },
    {
      id: 'fun-fact',
      type: ContentType.Text,
      title: 'Did You Know?',
      content: 'A single honeybee typically visits 50-100 flowers during a single collection trip and can make about 1/12 of a teaspoon of honey in its lifetime!',
      difficulty: 'beginner',
      estimatedDuration: 3,
      media: beeMedia && beeMedia[1] ? [beeMedia[1]] : []
    }
  ],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

export default beeLesson;