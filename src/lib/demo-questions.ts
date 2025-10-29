import { Question, DifficultyLevel } from '@/types/demo';
import { englishQuestions, logicQuestions } from './demo-questions-expanded';

/**
 * Question bank for demo experience
 * Organized by difficulty level and topic
 * Now includes Math, English, and Critical Thinking/Programming
 */

// Original Math Questions
const mathQuestions: Record<DifficultyLevel, Question[]> = {
  beginner: [
    {
      id: 'beg-add-1',
      text: 'What is 2 + 2?',
      answers: ['3', '4', '5', '6'],
      correctIndex: 1,
      difficulty: 'beginner',
      topic: 'addition',
      voiceText: 'What is 2 plus 2?',
      hint: 'Count on your fingers: 2... 3, 4!',
    },
    {
      id: 'beg-add-2',
      text: 'What is 3 + 1?',
      answers: ['2', '3', '4', '5'],
      correctIndex: 2,
      difficulty: 'beginner',
      topic: 'addition',
      voiceText: 'What is 3 plus 1?',
      hint: 'Start at 3, then count 1 more!',
    },
    {
      id: 'beg-sub-1',
      text: 'What is 5 - 2?',
      answers: ['2', '3', '4', '5'],
      correctIndex: 1,
      difficulty: 'beginner',
      topic: 'subtraction',
      voiceText: 'What is 5 minus 2?',
      hint: 'Start at 5, count back 2: 4, 3!',
    },
    {
      id: 'beg-sub-2',
      text: 'What is 10 - 5?',
      answers: ['3', '4', '5', '6'],
      correctIndex: 2,
      difficulty: 'beginner',
      topic: 'subtraction',
      voiceText: 'What is 10 minus 5?',
      hint: 'Half of 10 is...',
    },
    {
      id: 'beg-add-3',
      text: 'What is 1 + 1?',
      answers: ['1', '2', '3', '4'],
      correctIndex: 1,
      difficulty: 'beginner',
      topic: 'addition',
      voiceText: 'What is 1 plus 1?',
      hint: 'The easiest one!',
    },
  ],

  easy: [
    {
      id: 'easy-add-1',
      text: 'What is 5 + 3?',
      answers: ['7', '8', '9', '10'],
      correctIndex: 1,
      difficulty: 'easy',
      topic: 'addition',
      voiceText: 'What is 5 plus 3?',
      hint: 'Start at 5, count up 3 more!',
    },
    {
      id: 'easy-add-2',
      text: 'What is 6 + 6?',
      answers: ['10', '11', '12', '13'],
      correctIndex: 2,
      difficulty: 'easy',
      topic: 'addition',
      voiceText: 'What is 6 plus 6?',
      hint: 'Double 6 is...',
    },
    {
      id: 'easy-sub-1',
      text: 'What is 12 - 7?',
      answers: ['4', '5', '6', '7'],
      correctIndex: 1,
      difficulty: 'easy',
      topic: 'subtraction',
      voiceText: 'What is 12 minus 7?',
      hint: 'Count back from 12: 11, 10, 9...',
    },
    {
      id: 'easy-sub-2',
      text: 'What is 15 - 8?',
      answers: ['5', '6', '7', '8'],
      correctIndex: 2,
      difficulty: 'easy',
      topic: 'subtraction',
      voiceText: 'What is 15 minus 8?',
      hint: 'Think: 8 + ? = 15',
    },
    {
      id: 'easy-add-3',
      text: 'What is 7 + 4?',
      answers: ['10', '11', '12', '13'],
      correctIndex: 1,
      difficulty: 'easy',
      topic: 'addition',
      voiceText: 'What is 7 plus 4?',
      hint: '7 + 3 = 10, then add 1 more!',
    },
  ],

  medium: [
    {
      id: 'med-mult-1',
      text: 'What is 7 × 3?',
      answers: ['18', '21', '24', '27'],
      correctIndex: 1,
      difficulty: 'medium',
      topic: 'multiplication',
      voiceText: 'What is 7 times 3?',
      hint: 'Think: 7 + 7 + 7',
    },
    {
      id: 'med-div-1',
      text: 'What is 15 ÷ 3?',
      answers: ['3', '4', '5', '6'],
      correctIndex: 2,
      difficulty: 'medium',
      topic: 'division',
      voiceText: 'What is 15 divided by 3?',
      hint: 'How many 3s fit into 15?',
    },
    {
      id: 'med-sub-1',
      text: 'What is 25 - 13?',
      answers: ['10', '11', '12', '13'],
      correctIndex: 2,
      difficulty: 'medium',
      topic: 'subtraction',
      voiceText: 'What is 25 minus 13?',
      hint: 'Break it down: 25 - 10 = 15, then 15 - 3',
    },
    {
      id: 'med-mult-2',
      text: 'What is 6 × 4?',
      answers: ['20', '22', '24', '26'],
      correctIndex: 2,
      difficulty: 'medium',
      topic: 'multiplication',
      voiceText: 'What is 6 times 4?',
      hint: 'Think: 6 + 6 + 6 + 6',
    },
    {
      id: 'med-add-1',
      text: 'What is 18 + 17?',
      answers: ['33', '34', '35', '36'],
      correctIndex: 2,
      difficulty: 'medium',
      topic: 'addition',
      voiceText: 'What is 18 plus 17?',
      hint: '18 + 18 = 36, minus 1',
    },
  ],

  hard: [
    {
      id: 'hard-mult-1',
      text: 'What is 12 × 8?',
      answers: ['84', '88', '92', '96'],
      correctIndex: 3,
      difficulty: 'hard',
      topic: 'multiplication',
      voiceText: 'What is 12 times 8?',
      hint: 'Think: 10 × 8 = 80, then add 2 × 8',
    },
    {
      id: 'hard-div-1',
      text: 'What is 72 ÷ 9?',
      answers: ['6', '7', '8', '9'],
      correctIndex: 2,
      difficulty: 'hard',
      topic: 'division',
      voiceText: 'What is 72 divided by 9?',
      hint: 'Think: 9 × ? = 72',
    },
    {
      id: 'hard-sub-1',
      text: 'What is 100 - 37?',
      answers: ['61', '62', '63', '64'],
      correctIndex: 2,
      difficulty: 'hard',
      topic: 'subtraction',
      voiceText: 'What is 100 minus 37?',
      hint: '100 - 40 = 60, then add 3',
    },
    {
      id: 'hard-mult-2',
      text: 'What is 15 × 6?',
      answers: ['80', '85', '90', '95'],
      correctIndex: 2,
      difficulty: 'hard',
      topic: 'multiplication',
      voiceText: 'What is 15 times 6?',
      hint: 'Think: 10 × 6 = 60, then 5 × 6 = 30',
    },
    {
      id: 'hard-add-1',
      text: 'What is 47 + 58?',
      answers: ['103', '104', '105', '106'],
      correctIndex: 2,
      difficulty: 'hard',
      topic: 'addition',
      voiceText: 'What is 47 plus 58?',
      hint: '47 + 50 = 97, then add 8 more',
    },
  ],
};

// Combine all question banks (Math, English, Logic/Programming)
export const questionBank: Record<DifficultyLevel, Question[]> = {
  beginner: [
    ...mathQuestions.beginner,
    ...englishQuestions.beginner,
    ...logicQuestions.beginner,
  ],
  easy: [
    ...mathQuestions.easy,
    ...englishQuestions.easy,
    ...logicQuestions.easy,
  ],
  medium: [
    ...mathQuestions.medium,
    ...englishQuestions.medium,
    ...logicQuestions.medium,
  ],
  hard: [
    ...mathQuestions.hard,
    ...englishQuestions.hard,
    ...logicQuestions.hard,
  ],
};

/**
 * Get a random question for a given difficulty level
 */
export function getRandomQuestion(difficulty: DifficultyLevel, exclude: string[] = []): Question {
  const questions = questionBank[difficulty].filter((q: Question) => !exclude.includes(q.id));
  
  if (questions.length === 0) {
    // Fallback to any question from that difficulty
    return questionBank[difficulty][0];
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

/**
 * Get the next difficulty level
 */
export function getNextDifficulty(current: DifficultyLevel, increase: boolean): DifficultyLevel {
  const levels: DifficultyLevel[] = ['beginner', 'easy', 'medium', 'hard'];
  const currentIndex = levels.indexOf(current);
  
  if (increase) {
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  } else {
    return levels[Math.max(currentIndex - 1, 0)];
  }
}

/**
 * Determine initial level based on quick check results
 */
export function determineInitialLevel(correctCount: number, totalQuestions: number): DifficultyLevel {
  const accuracy = correctCount / totalQuestions;
  
  if (accuracy >= 1.0) return 'medium';  // Perfect score
  if (accuracy >= 0.67) return 'easy';   // 2/3 correct
  if (accuracy >= 0.33) return 'beginner'; // 1/3 correct
  return 'beginner';
}
