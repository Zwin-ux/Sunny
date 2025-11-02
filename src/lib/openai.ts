import OpenAI from 'openai';
import { LessonPlan } from './lesson-plans';
import { isDemoMode } from './runtimeMode';

type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar' | 'hi' | 'zh';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  language: SupportedLanguage;
}

export class OpenAIService {
  private openai: OpenAI | null;
  private model: string = 'gpt-4';

  constructor() {
    if (isDemoMode()) {
      this.openai = null;
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('The OpenAI API key is not configured. Falling back to demo mode.');
      this.openai = null;
      return;
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: false,
    });
  }

  async generateQuizQuestion(
    lesson: LessonPlan,
    language: SupportedLanguage = 'en',
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<QuizQuestion> {
    const prompt = this.buildPrompt(lesson, language, difficulty);

    if (isDemoMode() || !this.openai) {
      return this.buildDemoQuiz(lesson, language);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful educational assistant that creates engaging quiz questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      return this.parseQuizResponse(content, language);
    } catch (error) {
      console.error('Error generating quiz question:', error);
      return this.buildDemoQuiz(lesson, language);
    }
  }

  private buildDemoQuiz(lesson: LessonPlan, language: SupportedLanguage): QuizQuestion {
    const defaultObjectives = lesson.content?.learningOutcomes;
    const lessonTopic = lesson.title || lesson.id || 'this topic';
    const objectivesArray = Array.isArray(defaultObjectives) && defaultObjectives.length > 0
      ? defaultObjectives
      : ['Practice makes progress!', 'Keep a growth mindset', 'Ask curious questions'];

    const primaryObjective = objectivesArray[0] || 'Learn something new';
    const decoyOptions = objectivesArray.slice(1, 4);
    while (decoyOptions.length < 3) {
      decoyOptions.push('Have fun learning');
    }

    const options = [primaryObjective, ...decoyOptions].slice(0, 4);

    return {
      question: `What is one thing you will practice in the lesson "${lessonTopic}"?`,
      options,
      correctAnswer: primaryObjective,
      explanation: 'Sunny chose this so you remember the most important goal!',
      language,
    };
  }

  private buildPrompt(
    lesson: LessonPlan,
    language: string,
    difficulty: string
  ): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      ar: 'Arabic',
      hi: 'Hindi',
      zh: 'Chinese'
    };

    return `
      Create a quiz question based on the following lesson:
      Title: ${lesson.title}
      Description: ${lesson.content.description}
      
      Requirements:
      - Language: ${languageNames[language] || 'English'}
      - Difficulty: ${difficulty}
      - Include 4 multiple choice options
      - Mark the correct answer
      - Add a brief explanation
      
      Format your response as JSON with these fields:
      {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctAnswer": "...",
        "explanation": "..."
      }`;
  }

  private parseQuizResponse(content: string, language: string): QuizQuestion {
    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        language: language as SupportedLanguage
      };
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      throw new Error('Failed to parse quiz question');
    }
  }

  async generateChatCompletion(messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[]): Promise<string | null> {
    if (isDemoMode() || !this.openai) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
      const topicHint = lastUserMessage?.content ?? 'learning today';
      return `I love your curiosity! Let\'s keep learning about ${topicHint}.`;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
      });
      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('Error generating chat completion:', error);
      return 'Sunny is thinking of a fun follow-up! Let\'s keep going while I prepare the next activity.';
    }
  }

  // Add more methods for other AI functionalities as needed
}

// Singleton instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openAIService) {
    openAIService = new OpenAIService();
  }
  return openAIService;
}
