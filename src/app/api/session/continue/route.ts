import { NextResponse } from 'next/server';
import { planNextActivity } from '@/lib/activityPlanner';
import { rateLimit } from '@/lib/rate-limit';
import { checkSafety } from '@/lib/safety';
import { ActivityPayload } from '@/types/activity';

interface ContinueSessionRequest {
  sessionId?: string;
  ageBracket?: string;
  goal?: string;
  previousAnswer?: string;
  activity?: ActivityPayload;
}

function determineCorrectness(activity: ActivityPayload | undefined, answer: string | undefined): boolean | null {
  if (!activity || !answer) {
    return null;
  }

  const stepWithAnswer = activity.steps.find(step => typeof step.correctAnswer === 'string');
  if (!stepWithAnswer || !stepWithAnswer.correctAnswer) {
    return null;
  }

  return stepWithAnswer.correctAnswer.trim().toLowerCase() === answer.trim().toLowerCase();
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip, 'session-continue', 60, 30);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = (await request.json()) as ContinueSessionRequest;
  const { sessionId, ageBracket, goal, previousAnswer, activity } = body;

  if (!sessionId || !ageBracket || !goal || !activity) {
    return NextResponse.json({ error: 'sessionId, ageBracket, goal, and activity are required' }, { status: 400 });
  }

  const safety = checkSafety(previousAnswer ?? '');
  if (!safety.safe) {
    const plan = await planNextActivity({ ageBracket, goal: 'space adventure' });
    return NextResponse.json({
      feedbackMessage: safety.replacementMessage,
      activity: plan.activity,
      previousCorrect: false,
    });
  }

  const wasCorrect = determineCorrectness(activity, previousAnswer ?? undefined);
  const plan = await planNextActivity({ ageBracket, goal, previousCorrect: wasCorrect ?? undefined });

  let feedbackMessage = "Let's keep going!";
  if (wasCorrect === true) {
    feedbackMessage = 'Nice work, let\'s go a little harder! 🌟';
  } else if (wasCorrect === false) {
    feedbackMessage = "That\'s okay, let\'s practice with another example together. 💪";
  }

  return NextResponse.json({
    feedbackMessage,
    activity: plan.activity,
    previousCorrect: wasCorrect,
  });
}
