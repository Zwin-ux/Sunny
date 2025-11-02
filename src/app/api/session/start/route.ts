import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { planNextActivity } from '@/lib/activityPlanner';
import { rateLimit } from '@/lib/rate-limit';
import { checkSafety } from '@/lib/safety';

interface StartSessionRequest {
  ageBracket?: string;
  goal?: string;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip, 'session-start', 60, 20);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = (await request.json()) as StartSessionRequest;
  const ageBracket = body.ageBracket?.trim();
  const goal = body.goal?.trim();

  if (!ageBracket || !goal) {
    return NextResponse.json({ error: 'ageBracket and goal are required' }, { status: 400 });
  }

  const safety = checkSafety(goal);

  let plannerGoal = goal;
  let introOverride: string | undefined;

  if (!safety.safe) {
    plannerGoal = 'space adventure';
    introOverride = safety.replacementMessage;
  }

  const plan = await planNextActivity({ ageBracket, goal: plannerGoal });

  return NextResponse.json({
    sessionId: randomUUID(),
    introMessage: introOverride ? `${introOverride} ${plan.introMessage}`.trim() : plan.introMessage,
    activity: plan.activity,
    goal: plannerGoal,
    ageBracket,
  });
}
