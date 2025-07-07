import { NextResponse } from 'next/server';
import { getOpenAIService } from '@/lib/openai';
import { getUserById } from '@/lib/db';
import { LessonPlan } from '@/lib/lesson-plans'; // Assuming LessonPlan is defined here

export async function POST(request: Request) {
  try {
    const { userId, type, topic, lesson, chatHistory, emotion } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'User ID and type are required' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const openAIService = getOpenAIService();

    if (type === 'plan') {
      // Generate a learning plan based on user interests and topic
      const promptMessages = [
        { role: 'system', content: 'You are an AI tutor that creates personalized learning plans. Focus on teaching topics gradually, like a patient teacher, breaking down complex subjects into digestible parts.' },
        { role: 'user', content: `Create a learning plan for ${user.learningInterests.join(', ')}. Focus on the topic: ${topic || 'general overview'}.` }
      ];
      const learningPlanContent = await openAIService.generateChatCompletion(promptMessages);
      return NextResponse.json({ plan: learningPlanContent });
    } else if (type === 'quiz') {
      if (!lesson) {
        return NextResponse.json({ error: 'Lesson is required for quiz generation' }, { status: 400 });
      }
      // Determine difficulty based on quiz progress
      const userQuizProgress = user.quizProgress[lesson.title] || { correct: 0, total: 0 };
      let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (userQuizProgress.total > 0) {
        const accuracy = userQuizProgress.correct / userQuizProgress.total;
        if (accuracy > 0.8) difficulty = 'advanced';
        else if (accuracy > 0.5) difficulty = 'intermediate';
      }

      // Generate a quiz question based on a provided lesson and adaptive difficulty
      const quizQuestion = await openAIService.generateQuizQuestion(lesson as LessonPlan, 'en', difficulty);
      return NextResponse.json({ quiz: quizQuestion });
    } else if (type === 'chat') {
      if (!chatHistory) {
        return NextResponse.json({ error: 'Chat history is required for chat type' }, { status: 400 });
      }
      // Use chat history to maintain context and teach gradually
      const systemMessage = { role: 'system', content: `You are Sunny, an AI tutor. Teach the user about their requested topic gradually, maintaining context from previous messages. Break down complex ideas into simple, understandable parts. Current user emotion: ${emotion || 'neutral'}. Adjust your tone accordingly.` };
      const messages = [systemMessage, ...chatHistory];
      const chatResponse = await openAIService.generateChatCompletion(messages);
      return NextResponse.json({ response: chatResponse });
    } else {
      return NextResponse.json({ error: "Invalid type specified. Must be 'plan', 'quiz', or 'chat'" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating learning content:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
