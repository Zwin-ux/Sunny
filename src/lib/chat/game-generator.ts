import {
  GAME_MECHANICS,
  GAME_OBJECTIVES,
  GAME_THEMES,
  GAME_TWISTS,
  POWER_UPS,
  MATERIAL_SUGGESTIONS,
  DIFFICULTY_TIME_ESTIMATES,
} from '@/data/game-templates';

export interface GeneratedGame {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  theme: string;
  overview: string;
  objective: string;
  setup: string[];
  gameplay: string[];
  scoring: string;
  powerUps: string[];
  remix: string;
  estimatedTime: string;
  materials: string[];
}

const DEFAULT_DIFFICULTY = 'easy';

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createDeterministicRandom(seed: string) {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

function pick<T>(items: T[], rng: () => number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  const index = Math.floor(rng() * items.length);
  return items[index];
}

function titleCase(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildSetup(topic: string, theme: string, difficulty: string): string[] {
  return [
    `Gather a small team or play solo as the lead ${theme} expert.`,
    `Review your knowledge about ${topic} with two quick warm-up questions.`,
    `Lay out the mission map with three zones that get trickier (${difficulty} difficulty).`,
  ];
}

function buildGameplay(theme: string, mechanic: string, twist: string, topic: string): string[] {
  return [
    `Round 1: ${mechanic} to unlock the first checkpoint in the ${theme} world.`,
    `Round 2: Mix in quick creativity — draw or act out a clue connected to ${topic}.`,
    `Round 3: Final challenge with the twist — ${twist}.`,
  ];
}

function deriveTitle(theme: string, mechanic: string, topic: string, rng: () => number) {
  const sparkWords = ['Dash', 'Quest', 'Sprint', 'Saga', 'Circuit', 'Voyage', 'Challenge', 'Arena'];
  const themeWord = titleCase(theme.split(' ')[0]);
  const topicWord = titleCase(topic.split(' ')[0] || 'Learning');
  const spark = sparkWords[Math.floor(rng() * sparkWords.length)];
  return `${themeWord} ${topicWord} ${spark}`;
}

export interface GenerateGameOptions {
  topic?: string;
  difficulty?: string;
  emotion?: string | null;
  seed?: string;
}

export function generateGameIdea(options: GenerateGameOptions = {}) {
  const topic = options.topic?.trim().length ? options.topic.trim().toLowerCase() : 'learning super skills';
  const difficulty = options.difficulty || DEFAULT_DIFFICULTY;
  const seedBase = `${topic}|${difficulty}|${options.emotion || 'neutral'}|${options.seed || Date.now()}`;
  const rng = createDeterministicRandom(seedBase);

  const theme = pick(GAME_THEMES, rng);
  const mechanic = pick(GAME_MECHANICS, rng);
  const objective = pick(GAME_OBJECTIVES, rng);
  const twist = pick(GAME_TWISTS, rng);
  const powerUps = Array.from({ length: 2 }, () => pick(POWER_UPS, rng));
  const materials = Array.from({ length: 3 }, () => pick(MATERIAL_SUGGESTIONS, rng));

  const id = `${theme.replace(/\s+/g, '-')}-${mechanic.replace(/\s+/g, '-')}-${Math.floor(rng() * 9999)}`.toLowerCase();
  const title = deriveTitle(theme, mechanic, topic, rng);

  const overview = `Players dive into a ${theme} challenge where they use ${mechanic} to ${objective}.`;
  const scoring = `Earn 3 points for a spot-on answer, 2 points for a creative attempt, and bonus points for teamwork moments.`;
  const remix = `Flip the script: let the players design a new rule using anything they learned about ${topic}.`;
  const estimatedTime = DIFFICULTY_TIME_ESTIMATES[difficulty] || DIFFICULTY_TIME_ESTIMATES[DEFAULT_DIFFICULTY];

  const game: GeneratedGame = {
    id,
    title,
    topic,
    difficulty,
    theme,
    overview,
    objective,
    setup: buildSetup(topic, theme, difficulty),
    gameplay: buildGameplay(theme, mechanic, twist, topic),
    scoring,
    powerUps,
    remix,
    estimatedTime,
    materials,
  };

  return {
    game,
    summary: `Let's play **${title}**! ${overview} Expect ${estimatedTime} of energetic learning fun.`,
  };
}
