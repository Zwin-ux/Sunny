import { getOpenAIService } from '@/lib/openai';
import { logger } from '@/lib/logger';
import { generateGameIdea } from './game-generator';

export interface ChatMessageLike {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SunnyResponse {
  kind: 'text' | 'game';
  message: string;
  game?: ReturnType<typeof generateGameIdea>['game'];
}

interface CreateSunnyResponseOptions {
  messages: ChatMessageLike[];
  emotion?: string | null;
}

const GAME_KEYWORDS = [
  'game',
  'play',
  'challenge',
  'mini game',
  'minigame',
  'activity',
  'mission',
  'bored',
  'something fun',
  'unique game',
  'learning game',
];

const DIFFICULTY_KEYWORDS: Record<string, string[]> = {
  easy: ['easy', 'simple', 'quick'],
  medium: ['medium', 'regular', 'just right'],
  hard: ['hard', 'difficult', 'tricky', 'expert'],
  beginner: ['beginner', 'starter', 'warm-up'],
  intermediate: ['intermediate', 'middle'],
  advanced: ['advanced', 'challenge me'],
};

function detectDifficulty(text: string): string | undefined {
  for (const [level, words] of Object.entries(DIFFICULTY_KEYWORDS)) {
    if (words.some((word) => text.includes(word))) {
      return level;
    }
  }
  return undefined;
}

function extractTopic(text: string) {
  const topicMatch = text.match(/(?:about|on|for|regarding|in)\s+([a-z0-9\s]{3,60})/i);
  if (topicMatch) {
    return topicMatch[1].trim();
  }
  const keywords = text
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !GAME_KEYWORDS.includes(word));
  return keywords.slice(0, 4).join(' ').trim();
}

function looksLikeGameRequest(text: string) {
  return GAME_KEYWORDS.some((keyword) => text.includes(keyword));
}

export async function createSunnyResponse({ messages, emotion }: CreateSunnyResponseOptions): Promise<SunnyResponse> {
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
  const normalized = lastUserMessage?.content.toLowerCase() || '';

  if (normalized) {
    const wantsGame = looksLikeGameRequest(normalized);
    const needsVariety = messages.filter((m) => m.role === 'assistant').length >= 3 && normalized.includes('new');

    if (wantsGame || needsVariety) {
      const difficulty = detectDifficulty(normalized);
      const topic = extractTopic(normalized) || 'curiosity skills';
      const { game, summary } = generateGameIdea({
        topic,
        difficulty,
        emotion,
        seed: `${normalized}|${messages.length}`,
      });

      return {
        kind: 'game',
        message: summary,
        game,
      };
    }
  }

  try {
    const svc = getOpenAIService();
    const systemPrompt = `You are Sunny, a cheerful AI tutor for kids. Keep answers short (2-3 sentences), upbeat, and clearly guide the next learning step. Current emotion: ${emotion || 'neutral'}.`;
    const response = await svc.generateChatCompletion([
      { role: 'system', content: systemPrompt },
      ...messages,
    ]);

    return {
      kind: 'text',
      message: response || "I'm here to help!",
    };
  } catch (error) {
    logger.error('Sunny orchestrator failed', error);
    return {
      kind: 'text',
      message: "I'm having trouble connecting right now, but I'm still here to help! Can you try asking that another way?",
    };
  }
}
