import { ActivityPayload, ActivityStep } from '@/types/activity';
import LessonRepo from './lessons/LessonRepository';
import { ContentType, Lesson, QuizQuestion } from '@/types/lesson';
import { isDemoMode } from './runtimeMode';

export interface PlanNextActivityInput {
  ageBracket: string;
  goal: string;
  previousAnswer?: string;
  previousCorrect?: boolean;
}

export interface PlannedActivity {
  introMessage: string;
  activity: ActivityPayload;
}

const demoActivities: Record<string, { intro: string; activity: ActivityPayload; retry?: { intro: string; activity: ActivityPayload } }> = {
  fractions: {
    intro: 'Let\'s play a quick fraction game! 🍕',
    activity: {
      type: 'quiz',
      topic: 'Fractions: halves vs quarters',
      goal: 'Tell which fraction is bigger',
      steps: [
        {
          prompt: 'Imagine a pizza cut into 2 slices. Which slice is bigger: 1/2 or 1/4?',
          choices: ['1/2', '1/4'],
          correctAnswer: '1/2',
          hint: 'Fewer slices means bigger pieces.'
        },
        {
          prompt: 'If you share a brownie with 3 friends, what fraction of the brownie do you get?',
          choices: ['1/2', '1/3', '1/4'],
          correctAnswer: '1/4',
          hint: 'Four equal friends means four equal parts!'
        }
      ]
    },
    retry: {
      intro: 'No worries! Let\'s look at one more tasty fraction together. 🍰',
      activity: {
        type: 'quiz',
        topic: 'Fractions warm-up',
        goal: 'Match the bigger piece',
        steps: [
          {
            prompt: 'Which is larger: 1/3 of a pie or 1/6 of the same pie?',
            choices: ['1/3', '1/6'],
            correctAnswer: '1/3',
            hint: 'Think about how many pieces the pie is split into.'
          },
          {
            prompt: 'If you cut a sandwich into 4 equal parts and eat 2, what fraction did you eat?',
            choices: ['1/2', '1/4', '2/4'],
            correctAnswer: '1/2',
            hint: '2 pieces out of 4 equal pieces.'
          }
        ]
      }
    }
  },
  reading: {
    intro: 'Story time! Let\'s spot the main idea together. 📚',
    activity: {
      type: 'story',
      topic: 'Finding the main idea',
      goal: 'Choose the sentence that matches the big idea',
      steps: [
        {
          prompt: 'Sunny lost a library book. They followed glitter on the floor to find it in the art corner. What is the main idea?',
          choices: [
            'Sunny painted a sparkly picture.',
            'Sunny followed clues to solve the problem.',
            'Sunny took a nap in the art corner.'
          ],
          correctAnswer: 'Sunny followed clues to solve the problem.',
          hint: 'The story keeps talking about clues!'
        },
        {
          prompt: 'Which detail supports that main idea?',
          choices: [
            'Sunny checked the classroom pet cage.',
            'Sunny saw glitter leading to the art corner.',
            'Sunny brought the book to music class.'
          ],
          correctAnswer: 'Sunny saw glitter leading to the art corner.',
          hint: 'Look for a clue that helps find the book.'
        }
      ]
    },
    retry: {
      intro: 'Great effort! Let\'s use another story clue. 🔍',
      activity: {
        type: 'story',
        topic: 'Main idea detective',
        goal: 'Use clues to describe the main idea',
        steps: [
          {
            prompt: 'Sunny was nervous about the class play, so they practiced lines, tried costumes, and smiled big on stage. What\'s the main idea?',
            choices: [
              'Sunny forgot the lines.',
              'Sunny practiced and felt ready.',
              'Sunny built the stage set.'
            ],
            correctAnswer: 'Sunny practiced and felt ready.',
            hint: 'Most sentences are about getting ready.'
          }
        ]
      }
    }
  },
  space: {
    intro: 'Blast off! Ready for a planet mission? 🚀',
    activity: {
      type: 'puzzle',
      topic: 'Planets and space facts',
      goal: 'Match planets with their fun facts',
      steps: [
        {
          prompt: 'Which planet has a giant red spot storm?',
          choices: ['Mars', 'Earth', 'Jupiter'],
          correctAnswer: 'Jupiter',
          hint: 'It\'s the largest planet!'
        },
        {
          prompt: 'Which planet do we live on that has the right air and water for us?',
          choices: ['Mercury', 'Earth', 'Neptune'],
          correctAnswer: 'Earth',
          hint: 'It\'s called the Goldilocks planet.'
        }
      ]
    },
    retry: {
      intro: 'Space is tricky, but you\'ve got this! Let\'s review the planets. 🪐',
      activity: {
        type: 'puzzle',
        topic: 'Planets review',
        goal: 'Remember special planet features',
        steps: [
          {
            prompt: 'Which planet is closest to the sun?',
            choices: ['Mercury', 'Venus', 'Earth'],
            correctAnswer: 'Mercury',
            hint: 'It zooms fastest around the sun.'
          }
        ]
      }
    }
  }
};

function pickDemoActivity(goal: string, wasCorrect?: boolean): PlannedActivity {
  const normalizedGoal = goal.toLowerCase();
  const key = normalizedGoal.includes('fraction')
    ? 'fractions'
    : normalizedGoal.includes('space') || normalizedGoal.includes('planet')
      ? 'space'
      : 'reading';

  const catalog = demoActivities[key];
  if (wasCorrect === false && catalog.retry) {
    return {
      introMessage: catalog.retry.intro,
      activity: catalog.retry.activity
    };
  }

  return {
    introMessage: catalog.intro,
    activity: catalog.activity
  };
}

function lessonToActivity(lesson: Lesson, goal: string): ActivityPayload {
  const quizContent = lesson.content.find(item => item.type === ContentType.Quiz);

  const steps: ActivityStep[] = [];
  if (quizContent && typeof quizContent.content === 'object') {
    const quiz = quizContent.content as QuizQuestion;
    const choices = Array.isArray(quiz.options) ? quiz.options.map(option => String(option)) : undefined;
    const correct = Array.isArray(quiz.correctAnswer)
      ? String(quiz.correctAnswer[0])
      : String(quiz.correctAnswer ?? '');

    steps.push({
      prompt: quiz.question,
      choices,
      correctAnswer: correct,
      hint: typeof quiz.explanation === 'string' ? quiz.explanation : undefined
    });
  }

  lesson.learningObjectives.slice(0, 2).forEach((objective, index) => {
    steps.push({
      prompt: index === 0
        ? `How would you explain this idea: ${objective}?`
        : `Can you give an example of ${objective}?`,
      hint: 'Use your own words!'
    });
  });

  if (steps.length === 0) {
    steps.push({
      prompt: `What is one thing you remember about ${lesson.title}?`
    });
  }

  return {
    type: quizContent ? 'quiz' : 'story',
    topic: lesson.title,
    goal,
    steps: steps.slice(0, 4)
  };
}

function buildIntroMessage(ageBracket: string, goal: string, wasCorrect?: boolean): string {
  const encouragement = wasCorrect === false
    ? 'Great try! Let\'s slow down and tackle this together.'
    : 'Awesome energy! I picked something fun for you.';

  return `${encouragement} (${ageBracket} explorer working on ${goal}).`;
}

export async function planNextActivity(input: PlanNextActivityInput): Promise<PlannedActivity> {
  const { ageBracket, goal, previousCorrect } = input;

  if (isDemoMode()) {
    const demoPlan = pickDemoActivity(goal, previousCorrect ?? undefined);
    return {
      introMessage: `${buildIntroMessage(ageBracket, goal, previousCorrect)} ${demoPlan.introMessage}`.trim(),
      activity: demoPlan.activity,
    };
  }

  const lessonMatches = LessonRepo.findLessonsByTopic(goal);
  const lesson = lessonMatches[0] ?? LessonRepo.findLessonsByTopic('general')[0];

  if (!lesson) {
    return {
      introMessage: buildIntroMessage(ageBracket, goal, previousCorrect),
      activity: pickDemoActivity(goal, previousCorrect).activity
    };
  }

  return {
    introMessage: buildIntroMessage(ageBracket, goal, previousCorrect),
    activity: lessonToActivity(lesson, goal)
  };
}
