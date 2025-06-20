import { NextResponse } from 'next/server';
import { getOpenAIService } from '@/lib/openai';
import { getLessonPlanById } from '@/lib/lesson-plans';

// This route handles POST requests to /api/quiz
export async function POST(request: Request) {
  try {
    const { lessonId, language = 'en', difficulty = 'beginner' } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { error: 'lessonId is required' },
        { status: 400 }
      );
    }

    // Get the lesson plan
    const lesson = getLessonPlanById(lessonId);
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Initialize OpenAI service
    const openai = getOpenAIService(process.env.OPENAI_API_KEY);
    
    // Generate quiz question
    const quizQuestion = await openai.generateQuizQuestion(lesson, language, difficulty);
    
    return NextResponse.json(quizQuestion);
    
  } catch (error) {
    console.error('Error in quiz generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz question' },
      { status: 500 }
    );
  }
}
