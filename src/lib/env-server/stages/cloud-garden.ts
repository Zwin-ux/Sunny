/**
 * Cloud Garden Stage
 *
 * Teaches anxiety management through thought sorting.
 * Players learn to distinguish between "real" concerns and "worry" thoughts,
 * then practice self-care activities.
 */

import type { StageDefinition } from '@/types/env-server';

export const cloudGardenStage: StageDefinition = {
  id: 'cloud-garden-001',
  theme: 'cloud-garden',
  name: 'The Cloud Garden',
  description:
    'Learn to calm your thoughts by sorting them and watering your garden of self-care.',
  emotionalFocus: 'anxiety',
  gameMechanic: 'sorting',

  visual: {
    backgroundColor: '#87CEEB', // Sky blue
    backgroundImage: '/images/stages/cloud-garden-bg.png',
    musicTrack: '/audio/peaceful-garden.mp3',
    mascotPosition: 'left',
  },

  lessonPlan: {
    id: 'cloud-garden-lesson-001',
    title: 'Sorting Thoughts, Calming Minds',
    description:
      'Explore the Cloud Garden and learn how to calm anxious thoughts through thought sorting and self-care activities.',

    states: [
      // ======================================================================
      // State 1: Intro
      // ======================================================================
      {
        id: 'intro',
        type: 'intro',
        name: 'Welcome to the Cloud Garden',
        dialogue: [
          {
            speaker: 'sunny',
            text: "Hi! Welcome to the Cloud Garden! I'm so glad you're here.",
            emotion: 'happy',
            pauseAfter: 1500,
          },
          {
            speaker: 'sunny',
            text: 'Sometimes our minds fill up with thoughts like clouds in the sky. Some clouds are just little worries, and some are real things we need to think about.',
            emotion: 'thoughtful',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: "Today, we're going to learn how to sort our thoughts and make our sky bright and clear again!",
            emotion: 'excited',
            pauseAfter: 1500,
          },
          {
            speaker: 'sunny',
            text: 'Are you ready to start? 🌤️',
            emotion: 'encouraging',
          },
        ],
        nextState: 'instruction-sorting',
      },

      // ======================================================================
      // State 2: Instruction for Thought Sorting
      // ======================================================================
      {
        id: 'instruction-sorting',
        type: 'instruction',
        name: 'How to Sort Thoughts',
        dialogue: [
          {
            speaker: 'sunny',
            text: "Look at all these thought bubbles floating around! Let's sort them together.",
            emotion: 'encouraging',
            pauseAfter: 1500,
          },
          {
            speaker: 'sunny',
            text: '🌱 Some thoughts are TRUE FACTS - things that are real and happening right now.',
            emotion: 'thoughtful',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: '☁️ Some thoughts are WORRIES - "what if" thoughts about things that might not happen.',
            emotion: 'thoughtful',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: 'Drag the TRUE thoughts into the green basket. Drag the WORRY thoughts into the recycling bin - we can let those float away!',
            emotion: 'encouraging',
          },
        ],
        nextState: 'activity-sorting',
      },

      // ======================================================================
      // State 3: Thought Sorting Activity
      // ======================================================================
      {
        id: 'activity-sorting',
        type: 'activity',
        name: 'Sort Your Thoughts',
        task: {
          type: 'sorting',
          instructions:
            'Drag each thought bubble to the correct place: True Facts go in the green basket, Worries go in the recycling bin.',
          items: [
            // TRUE FACTS
            {
              id: 'thought-1',
              type: 'true',
              content: 'I have homework due tomorrow',
              correctTarget: 'true-basket',
            },
            {
              id: 'thought-2',
              type: 'true',
              content: 'My friend is coming over this weekend',
              correctTarget: 'true-basket',
            },
            {
              id: 'thought-3',
              type: 'true',
              content: 'I am sitting in my room right now',
              correctTarget: 'true-basket',
            },
            {
              id: 'thought-4',
              type: 'true',
              content: 'I have a test next week',
              correctTarget: 'true-basket',
            },
            // WORRIES
            {
              id: 'thought-5',
              type: 'worry',
              content: 'What if I fail the test?',
              correctTarget: 'worry-bin',
            },
            {
              id: 'thought-6',
              type: 'worry',
              content: 'What if nobody likes me?',
              correctTarget: 'worry-bin',
            },
            {
              id: 'thought-7',
              type: 'worry',
              content: 'What if something bad happens?',
              correctTarget: 'worry-bin',
            },
            {
              id: 'thought-8',
              type: 'worry',
              content: 'What if I make a mistake?',
              correctTarget: 'worry-bin',
            },
          ],
          targets: [
            {
              id: 'true-basket',
              label: 'True Facts',
              acceptsTypes: ['true'],
              visual: {
                icon: '🌱',
                color: '#4CAF50',
              },
            },
            {
              id: 'worry-bin',
              label: 'Worries',
              acceptsTypes: ['worry'],
              visual: {
                icon: '♻️',
                color: '#2196F3',
              },
            },
          ],
          pointsPerCorrect: 10,
          pointsPerIncorrect: -2,
          hintsAvailable: 3,
          hintText: [
            'True facts are things happening right now or that will definitely happen.',
            '"What if" questions are usually worries about things that might not happen.',
            'If a thought makes you feel nervous about the future, it might be a worry.',
          ],
        },
        completionCriteria: {
          type: 'all-correct',
        },
        effects: [
          {
            type: 'brighten',
            target: 'background',
            duration: 500,
          },
        ],
        nextState: 'instruction-growth',
      },

      // ======================================================================
      // State 4: Instruction for Growth Phase
      // ======================================================================
      {
        id: 'instruction-growth',
        type: 'instruction',
        name: 'Time to Grow',
        dialogue: [
          {
            speaker: 'sunny',
            text: 'Great job sorting those thoughts! Look how much clearer the sky is! ☀️',
            emotion: 'excited',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: 'Now that we sorted our thoughts, let\'s take care of ourselves! See these plants? Each one represents something we can do to feel calm and happy.',
            emotion: 'encouraging',
            pauseAfter: 2500,
          },
          {
            speaker: 'sunny',
            text: 'Click on each plant to water it and watch it grow! 🌿',
            emotion: 'happy',
          },
        ],
        nextState: 'activity-growth',
      },

      // ======================================================================
      // State 5: Growth Activity (Self-Care)
      // ======================================================================
      {
        id: 'activity-growth',
        type: 'activity',
        name: 'Water Your Self-Care Garden',
        task: {
          type: 'collection',
          instructions: 'Click on each plant to water it and help it grow!',
          items: [
            {
              id: 'plant-1',
              type: 'plant',
              content: 'Take deep breaths',
              metadata: { icon: '🌱', growthStages: 3 },
            },
            {
              id: 'plant-2',
              type: 'plant',
              content: 'Drink water',
              metadata: { icon: '🌿', growthStages: 3 },
            },
            {
              id: 'plant-3',
              type: 'plant',
              content: 'Take a break',
              metadata: { icon: '🌸', growthStages: 3 },
            },
            {
              id: 'plant-4',
              type: 'plant',
              content: 'Talk to a friend',
              metadata: { icon: '🌺', growthStages: 3 },
            },
            {
              id: 'plant-5',
              type: 'plant',
              content: 'Move your body',
              metadata: { icon: '🌻', growthStages: 3 },
            },
          ],
          pointsPerCorrect: 5,
        },
        completionCriteria: {
          type: 'threshold',
          threshold: 1.0, // All plants watered
        },
        effects: [
          {
            type: 'grow',
            target: 'all',
            duration: 1000,
          },
        ],
        nextState: 'reflection',
      },

      // ======================================================================
      // State 6: Reflection
      // ======================================================================
      {
        id: 'reflection',
        type: 'reflection',
        name: 'Let\'s Think Together',
        dialogue: [
          {
            speaker: 'sunny',
            text: 'Your garden looks beautiful! You did such a great job! 🌈',
            emotion: 'excited',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: "Let's talk about what we learned today. I'll ask you some questions, and you can share what you think!",
            emotion: 'thoughtful',
          },
        ],
        nextState: 'reward',
      },

      // ======================================================================
      // State 7: Reward
      // ======================================================================
      {
        id: 'reward',
        type: 'reward',
        name: 'You Did It!',
        dialogue: [
          {
            speaker: 'sunny',
            text: 'You learned something really special today! 🎉',
            emotion: 'excited',
            pauseAfter: 1500,
          },
          {
            speaker: 'sunny',
            text: 'Now you know how to sort your thoughts and take care of yourself when you feel worried.',
            emotion: 'encouraging',
            pauseAfter: 2000,
          },
          {
            speaker: 'sunny',
            text: 'Remember: worries are just clouds. They come and go, but YOU are always here, strong and bright like the sun! ☀️',
            emotion: 'happy',
          },
        ],
        effects: [
          {
            type: 'particle',
            target: 'all',
            duration: 3000,
          },
        ],
      },
    ],

    reflectionQuestions: [
      {
        id: 'reflection-1',
        question: 'What was one thing that made you feel calmer today?',
        purpose: 'Identify effective calming strategies',
        followUps: [
          'That sounds like a great way to feel calm! When else could you use that?',
          'I love that idea! How did it make your body feel?',
        ],
      },
      {
        id: 'reflection-2',
        question: 'If a worry cloud comes back tomorrow, what could you do?',
        purpose: 'Build future coping strategies',
        followUps: [
          'That\'s a smart plan! You\'re learning how to take care of your mind.',
          'What a great idea! Would you like to share that with someone you trust?',
        ],
      },
      {
        id: 'reflection-3',
        question:
          'How did it feel to know that some thoughts are just worries, not facts?',
        purpose: 'Emotional awareness and cognitive reframing',
        followUps: [
          'It\'s okay to have worries - everyone does! The important thing is knowing they don\'t control us.',
          'You\'re right! Understanding our thoughts helps us feel more in control.',
        ],
      },
    ],

    rewards: [
      {
        type: 'badge',
        name: 'Cloud Sorter',
        description:
          'You learned to tell the difference between real thoughts and worry thoughts!',
        icon: '🌤️',
      },
      {
        type: 'badge',
        name: 'Garden Grower',
        description: 'You practiced self-care by growing your own calm garden!',
        icon: '🌻',
      },
      {
        type: 'points',
        name: 'Calm Points',
        description: 'Points earned for completing the Cloud Garden!',
        value: 50,
      },
    ],
  },

  difficulty: 'easy',
  recommendedAge: [6, 10],
  estimatedDuration: 10, // 10 minutes

  tags: ['anxiety', 'mindfulness', 'self-care', 'emotional-regulation'],
  learningOutcomes: [
    'Distinguish between factual thoughts and worry thoughts',
    'Practice cognitive reframing for anxious thoughts',
    'Identify and engage in self-care activities',
    'Build emotional awareness and coping strategies',
  ],
};
