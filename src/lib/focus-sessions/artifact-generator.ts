// Artifact Generator - Generates flashcards, quizzes, and micro-games using AI
// Uses GPT-4 to create personalized learning artifacts

import OpenAI from 'openai';
import {
  ArtifactRequest,
  FlashcardSet,
  Flashcard,
  Quiz,
  QuizItem,
  MicroGameSpec,
  MicroGameQuestion,
  ConceptMap,
  DEFAULT_SESSION_CONFIG,
} from '@/types/focus-session';
import { DifficultyLevel } from '@/types/chat';
import { GameType } from '@/types/game';
import { difficultyAdapter } from './difficulty-adapter';
import { logger } from '@/lib/logger';

export class ArtifactGenerator {
  private openai: OpenAI | null = null;
  private config = DEFAULT_SESSION_CONFIG;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate an artifact based on request
   */
  async generateArtifact(request: ArtifactRequest): Promise<FlashcardSet | Quiz | MicroGameSpec> {
    switch (request.modality) {
      case 'flashcards':
        return this.generateFlashcards(request);
      case 'quiz':
        return this.generateQuiz(request);
      case 'micro_game':
        return this.generateMicroGame(request);
      default:
        throw new Error(`Unknown artifact modality: ${request.modality}`);
    }
  }

  // ========================================================================
  // Flashcard Generation
  // ========================================================================

  async generateFlashcards(request: ArtifactRequest): Promise<FlashcardSet> {
    if (!this.openai) {
      return this.getFallbackFlashcards(request);
    }

    try {
      const prompt = this.buildFlashcardPrompt(request);
      const difficultyParams = difficultyAdapter.getDifficultyParameters(request.difficulty);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const flashcardData = JSON.parse(responseText);
      return this.normalizeFlashcards(flashcardData, request.difficulty, difficultyParams);
    } catch (error) {
      logger.error('Error generating flashcards:', error);
      return this.getFallbackFlashcards(request);
    }
  }

  private buildFlashcardPrompt(request: ArtifactRequest): string {
    const { conceptMap, targetSubtopics, difficulty, constraints } = request;

    let prompt = `Generate ${this.config.flashcardSetSize} educational flashcards for children aged 6-10.\n\n`;
    prompt += `Topic: ${conceptMap.topic}\n`;
    prompt += `Focus Areas: ${targetSubtopics.join(', ')}\n`;
    prompt += `Difficulty: ${difficulty}\n\n`;

    if (conceptMap.examples.length > 0) {
      prompt += `Examples to reference:\n${conceptMap.examples.slice(0, 3).join('\n')}\n\n`;
    }

    prompt += `Create flashcards that:\n`;
    prompt += `- Are age-appropriate and engaging\n`;
    prompt += `- Use simple, clear language\n`;
    prompt += `- Include concrete examples\n`;
    prompt += `- Build on each other (easier → harder)\n`;
    prompt += `- Use emojis to make them fun 🌟\n\n`;

    prompt += `Return JSON:\n`;
    prompt += `{\n`;
    prompt += `  "cards": [\n`;
    prompt += `    {\n`;
    prompt += `      "front": "Question or term",\n`;
    prompt += `      "back": "Answer or definition (2-3 sentences max)",\n`;
    prompt += `      "tags": ["concept1", "concept2"],\n`;
    prompt += `      "imageUrl": "optional emoji or simple description"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n\n`;

    prompt += `Make ${this.config.flashcardSetSize} cards covering: ${targetSubtopics.join(', ')}`;

    return prompt;
  }

  private normalizeFlashcards(
    data: any,
    difficulty: DifficultyLevel,
    difficultyParams: any
  ): FlashcardSet {
    const cards: Flashcard[] = (data.cards || []).map((card: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      front: card.front || '',
      back: card.back || '',
      tags: card.tags || [],
      difficulty,
      imageUrl: card.imageUrl,
      easeFactor: 2.5,
      interval: 1,
      timesReviewed: 0,
      timesCorrect: 0,
    }));

    return {
      cards,
      spacedRepetition: {
        initialInterval: 1,
        easeFactorMin: 1.3,
        easeFactorMax: 2.5,
        intervalMultiplier: 2.0,
      },
      totalCards: cards.length,
      estimatedTime: cards.length * difficultyParams.timePerItem,
    };
  }

  private getFallbackFlashcards(request: ArtifactRequest): FlashcardSet {
    const cards: Flashcard[] = request.targetSubtopics.map((subtopic, index) => ({
      id: `card-fallback-${index}`,
      front: `What is ${subtopic}?`,
      back: `${subtopic} is an important concept in ${request.conceptMap.topic}. Let's learn more about it together! 🌟`,
      tags: [subtopic],
      difficulty: request.difficulty,
      easeFactor: 2.5,
      interval: 1,
      timesReviewed: 0,
      timesCorrect: 0,
    }));

    return {
      cards,
      spacedRepetition: {
        initialInterval: 1,
        easeFactorMin: 1.3,
        easeFactorMax: 2.5,
        intervalMultiplier: 2.0,
      },
      totalCards: cards.length,
      estimatedTime: 300,
    };
  }

  // ========================================================================
  // Quiz Generation
  // ========================================================================

  async generateQuiz(request: ArtifactRequest): Promise<Quiz> {
    if (!this.openai) {
      return this.getFallbackQuiz(request);
    }

    try {
      const prompt = this.buildQuizPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: QUIZ_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2500,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const quizData = JSON.parse(responseText);
      return this.normalizeQuiz(quizData, request);
    } catch (error) {
      logger.error('Error generating quiz:', error);
      return this.getFallbackQuiz(request);
    }
  }

  private buildQuizPrompt(request: ArtifactRequest): string {
    const { conceptMap, targetSubtopics, difficulty, constraints } = request;
    const difficultyParams = difficultyAdapter.getDifficultyParameters(difficulty);

    let prompt = `Generate a quiz with ${this.config.quizItemCount} questions for children aged 6-10.\n\n`;
    prompt += `Topic: ${conceptMap.topic}\n`;
    prompt += `Focus Areas: ${targetSubtopics.join(', ')}\n`;
    prompt += `Difficulty: ${difficulty}\n`;
    prompt += `Hints Available: ${difficultyParams.hintsAvailable}\n\n`;

    if (conceptMap.misconceptions.length > 0) {
      prompt += `Common Misconceptions to Address:\n${conceptMap.misconceptions.slice(0, 3).join('\n')}\n\n`;
    }

    prompt += `Question Mix:\n`;
    prompt += `- 60% Multiple Choice (4 options)\n`;
    prompt += `- 30% Short Answer (1-2 words)\n`;
    prompt += `- 10% True/False\n\n`;

    prompt += `For each question include:\n`;
    prompt += `- Clear, age-appropriate wording\n`;
    prompt += `- Correct answer\n`;
    prompt += `- Brief explanation (1-2 sentences)\n`;
    if (constraints.includeHints) {
      prompt += `- ${difficultyParams.hintsAvailable} helpful hints\n`;
    }

    prompt += `\nReturn JSON:\n`;
    prompt += `{\n`;
    prompt += `  "title": "Quiz title",\n`;
    prompt += `  "description": "Brief description",\n`;
    prompt += `  "items": [\n`;
    prompt += `    {\n`;
    prompt += `      "type": "mcq|short_answer|true_false",\n`;
    prompt += `      "question": "Question text",\n`;
    prompt += `      "choices": ["A", "B", "C", "D"] // for MCQ only\n`;
    prompt += `      "answer": "Correct answer",\n`;
    prompt += `      "explanation": "Why this is correct",\n`;
    prompt += `      "hints": ["hint1", "hint2"],\n`;
    prompt += `      "tags": ["concept"],\n`;
    prompt += `      "concept": "main concept tested"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n`;

    return prompt;
  }

  private normalizeQuiz(data: any, request: ArtifactRequest): Quiz {
    const difficultyParams = difficultyAdapter.getDifficultyParameters(request.difficulty);

    const items: QuizItem[] = (data.items || []).map((item: any, index: number) => ({
      id: `quiz-item-${Date.now()}-${index}`,
      type: item.type || 'mcq',
      question: item.question || '',
      choices: item.choices,
      answer: item.answer || '',
      explanation: item.explanation || '',
      hints: item.hints?.slice(0, difficultyParams.hintsAvailable) || [],
      tags: item.tags || [],
      difficulty: request.difficulty,
      concept: item.concept || request.targetSubtopics[0] || 'general',
      points: 1,
    }));

    return {
      id: `quiz-${Date.now()}`,
      title: data.title || `${request.conceptMap.topic} Quiz`,
      description: data.description || 'Test your knowledge!',
      items,
      scoring: {
        totalPoints: items.length,
        pointsPerCorrect: 1,
        pointsPerIncorrect: 0,
        passingThreshold: 0.7,
        partialCredit: false,
      },
      timeLimit: request.constraints.timeLimitSeconds,
      passingScore: 0.7,
    };
  }

  private getFallbackQuiz(request: ArtifactRequest): Quiz {
    const items: QuizItem[] = request.targetSubtopics.slice(0, 5).map((subtopic, index) => ({
      id: `quiz-fallback-${index}`,
      type: 'mcq' as const,
      question: `What can you tell me about ${subtopic}?`,
      choices: ['A', 'B', 'C', 'D'],
      answer: 'A',
      explanation: `Great job thinking about ${subtopic}!`,
      hints: ['Think about what we learned', 'Take your time'],
      tags: [subtopic],
      difficulty: request.difficulty,
      concept: subtopic,
      points: 1,
    }));

    return {
      id: `quiz-fallback-${Date.now()}`,
      title: `${request.conceptMap.topic} Quiz`,
      description: 'Let\'s test what you know!',
      items,
      scoring: {
        totalPoints: items.length,
        pointsPerCorrect: 1,
        pointsPerIncorrect: 0,
        passingThreshold: 0.7,
        partialCredit: false,
      },
      passingScore: 0.7,
    };
  }

  // ========================================================================
  // Micro Game Generation
  // ========================================================================

  async generateMicroGame(request: ArtifactRequest): Promise<MicroGameSpec> {
    if (!this.openai) {
      return this.getFallbackMicroGame(request);
    }

    try {
      const prompt = this.buildMicroGamePrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: MICROGAME_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const gameData = JSON.parse(responseText);
      return this.normalizeMicroGame(gameData, request);
    } catch (error) {
      logger.error('Error generating micro game:', error);
      return this.getFallbackMicroGame(request);
    }
  }

  private buildMicroGamePrompt(request: ArtifactRequest): string {
    const { conceptMap, targetSubtopics, difficulty } = request;

    let prompt = `Design a quick educational micro-game for children aged 6-10.\n\n`;
    prompt += `Topic: ${conceptMap.topic}\n`;
    prompt += `Focus: ${targetSubtopics.join(', ')}\n`;
    prompt += `Difficulty: ${difficulty}\n`;
    prompt += `Duration: ${this.config.microGameRounds} rounds\n\n`;

    prompt += `Game Types to Choose From:\n`;
    prompt += `- pattern-recognition: Find patterns in sequences\n`;
    prompt += `- memory-match: Remember and match items\n`;
    prompt += `- word-builder: Spell or build words\n`;
    prompt += `- math-challenge: Quick arithmetic or word problems\n\n`;

    prompt += `Generate:\n`;
    prompt += `- Game type selection\n`;
    prompt += `- Gameplay description (1-2 sentences)\n`;
    prompt += `- ${this.config.microGameRounds} questions/challenges\n`;
    prompt += `- Each with: prompt, correct answer, distractors, hint\n\n`;

    prompt += `Return JSON:\n`;
    prompt += `{\n`;
    prompt += `  "gameType": "pattern-recognition|memory-match|word-builder|math-challenge",\n`;
    prompt += `  "gameplayLoop": "Brief description of gameplay",\n`;
    prompt += `  "questions": [\n`;
    prompt += `    {\n`;
    prompt += `      "prompt": "What's the question/challenge?",\n`;
    prompt += `      "correctResponse": "answer",\n`;
    prompt += `      "distractors": ["wrong1", "wrong2", "wrong3"],\n`;
    prompt += `      "hint": "helpful hint",\n`;
    prompt += `      "concept": "subtopic name",\n`;
    prompt += `      "visualAid": "emoji or description"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "theme": {\n`;
    prompt += `    "primaryColor": "#hex",\n`;
    prompt += `    "secondaryColor": "#hex"\n`;
    prompt += `  }\n`;
    prompt += `}\n`;

    return prompt;
  }

  private normalizeMicroGame(data: any, request: ArtifactRequest): MicroGameSpec {
    const gameTypeMap: Record<string, GameType> = {
      'pattern-recognition': 'pattern-recognition',
      'memory-match': 'memory-match',
      'word-builder': 'word-builder',
      'math-challenge': 'math-challenge',
      'science-experiment': 'science-experiment',
      'creative-challenge': 'creative-challenge',
    };

    const questions: MicroGameQuestion[] = (data.questions || []).map((q: any, i: number) => ({
      id: `game-q-${Date.now()}-${i}`,
      prompt: q.prompt || '',
      correctResponse: q.correctResponse || '',
      distractors: q.distractors || [],
      hint: q.hint,
      concept: q.concept || request.targetSubtopics[0] || 'general',
      visualAid: q.visualAid,
    }));

    return {
      id: `microgame-${Date.now()}`,
      gameType: gameTypeMap[data.gameType] || 'pattern-recognition',
      engine: 'react-dom',
      gameplayLoop: data.gameplayLoop || 'Answer questions correctly to win!',
      rounds: this.config.microGameRounds,
      timePerRound: 60,
      questions,
      assets: [],
      theme: {
        primaryColor: data.theme?.primaryColor || '#3B82F6',
        secondaryColor: data.theme?.secondaryColor || '#10B981',
        fontFamily: 'Comic Sans MS, sans-serif',
        animations: true,
        sounds: false,
      },
      learningHooks: [
        { trigger: 'onSuccess', action: 'celebrate' },
        { trigger: 'onStreak', action: 'celebrate', threshold: 3 },
      ],
      targetConcepts: request.targetSubtopics,
      difficulty: request.difficulty,
      params: {},
    };
  }

  private getFallbackMicroGame(request: ArtifactRequest): MicroGameSpec {
    const questions: MicroGameQuestion[] = Array(this.config.microGameRounds)
      .fill(0)
      .map((_, i) => ({
        id: `game-fallback-${i}`,
        prompt: `Question ${i + 1} about ${request.conceptMap.topic}`,
        correctResponse: 'Answer',
        distractors: ['Wrong1', 'Wrong2', 'Wrong3'],
        hint: 'Think carefully!',
        concept: request.targetSubtopics[0] || 'general',
      }));

    return {
      id: `microgame-fallback-${Date.now()}`,
      gameType: 'pattern-recognition',
      engine: 'react-dom',
      gameplayLoop: 'Match the patterns!',
      rounds: this.config.microGameRounds,
      timePerRound: 60,
      questions,
      assets: [],
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        fontFamily: 'sans-serif',
        animations: true,
        sounds: false,
      },
      learningHooks: [{ trigger: 'onSuccess', action: 'celebrate' }],
      targetConcepts: request.targetSubtopics,
      difficulty: request.difficulty,
      params: {},
    };
  }
}

// ============================================================================
// System Prompts
// ============================================================================

const FLASHCARD_SYSTEM_PROMPT = `You are an expert educational content creator specializing in flashcards for children aged 6-10.

Create engaging, memorable flashcards that:
- Use simple, clear language
- Include concrete examples and analogies
- Build progressively in difficulty
- Use emojis and visual aids
- Are fun and encouraging

Keep answers concise (2-3 sentences max).
Make questions thought-provoking but age-appropriate.
Always return valid JSON.`;

const QUIZ_SYSTEM_PROMPT = `You are an expert educational assessment designer for children aged 6-10.

Create engaging quizzes that:
- Test understanding, not just memorization
- Use age-appropriate language
- Include helpful explanations
- Address common misconceptions
- Mix question types (MCQ, short answer, true/false)
- Are encouraging and fun

For multiple choice:
- 4 options (A, B, C, D)
- Distractors should be plausible
- One clearly correct answer

Always return valid JSON.`;

const MICROGAME_SYSTEM_PROMPT = `You are an expert educational game designer for children aged 6-10.

Design quick, engaging micro-games that:
- Are simple and intuitive
- Take 3-5 minutes to play
- Test understanding through play
- Are visually appealing
- Provide immediate feedback

Choose game types that match the content:
- Patterns: pattern-recognition, memory-match
- Language: word-builder
- Math: math-challenge
- Science: science-experiment

Always return valid JSON.`;

// Singleton instance
export const artifactGenerator = new ArtifactGenerator();
