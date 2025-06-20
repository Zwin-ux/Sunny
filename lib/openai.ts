import OpenAI from 'openai';
import { LessonPlan } from './lesson-plans';

type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar' | 'hi' | 'zh';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  language: SupportedLanguage;
}

export class OpenAIService {
  private openai: OpenAI;
  private model: string = 'gpt-4';

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false, // This should be false in production
    });
  }

  async generateQuizQuestion(
    lesson: LessonPlan,
    language: SupportedLanguage = 'en',
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  ): Promise<QuizQuestion> {
    const prompt = this.buildPrompt(lesson, language, difficulty);
    
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
      throw error;
    }
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

  // Add more methods for other AI functionalities as needed
}

// Singleton instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(apiKey?: string): OpenAIService {
  if (!openAIService) {
    if (!apiKey && typeof window === 'undefined') {
      throw new Error('OpenAI API key is required for server-side usage');
    }
    openAIService = new OpenAIService(apiKey || '');
  }
  return openAIService;
}
