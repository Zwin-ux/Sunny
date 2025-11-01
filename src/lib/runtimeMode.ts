import { logger } from './logger';

let cachedDemoMode: boolean | null = null;

function hasUsableOpenAIKey(): boolean {
  const rawKey = process.env.OPENAI_API_KEY;
  if (!rawKey) {
    return false;
  }

  const trimmed = rawKey.trim();
  if (!trimmed) {
    return false;
  }

  const lowered = trimmed.toLowerCase();
  if (lowered === 'demo' || lowered.includes('dummy') || lowered.includes('placeholder')) {
    return false;
  }

  // OpenAI keys typically start with "sk-"
  if (!trimmed.startsWith('sk-')) {
    return false;
  }

  return true;
}

export function isDemoMode(): boolean {
  if (cachedDemoMode !== null) {
    return cachedDemoMode;
  }

  const explicit = process.env.SUNNY_DEMO_MODE === 'true';
  const demoBecauseNoKey = !hasUsableOpenAIKey();
  cachedDemoMode = explicit || demoBecauseNoKey;

  if (cachedDemoMode) {
    logger.info('Sunny is running in demo mode. Remote AI calls will be mocked.');
  }

  return cachedDemoMode;
}

export function resetRuntimeModeCache() {
  cachedDemoMode = null;
}

export const runtimeMode = {
  isDemoMode,
};
