// AI-Powered Game Generator - Creates dynamic educational games

import { getOpenAIClient, isDemoMode } from '../sunny-ai';
import { 
  GameType, 
  GameQuestion, 
  GameConfig, 
  DifficultyLevel,
  GameGenerationRequest 
} from '@/types/game';

export class GameGenerator {
  
  /**
   * Generate a complete game based on request
   */
  async generateGame(request: GameGenerationRequest): Promise<{
    config: GameConfig;
    questions: GameQuestion[];
  }> {
    // Select game type if not specified
    const gameType = request.gameType || this.selectOptimalGameType(request);
    
    // Generate game configuration
    const config: GameConfig = {
      id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: gameType,
      difficulty: request.difficulty,
      topic: request.topic,
      timeLimit: request.timeAvailable ? request.timeAvailable * 60 : undefined,
      targetAccuracy: this.getTargetAccuracy(request.difficulty),
      hintsAvailable: this.getHintsForDifficulty(request.difficulty),
      adaptiveScaling: true
    };
    
    // Generate questions using AI
    const questions = await this.generateQuestions(config, request);
    
    return { config, questions };
  }
  
  /**
   * Select optimal game type based on student profile and previous performance
   */
  private selectOptimalGameType(request: GameGenerationRequest): GameType {
    const { previousPerformance, topic } = request;
    
    // If student is frustrated, try a different game type
    if (previousPerformance && previousPerformance.frustrationLevel > 0.6) {
      const currentType = previousPerformance.gameType;
      const alternatives: GameType[] = ['pattern-recognition', 'memory-match', 'creative-challenge'];
      return alternatives.find(t => t !== currentType) || 'creative-challenge';
    }
    
    // Match game type to topic
    if (topic.toLowerCase().includes('math') || topic.toLowerCase().includes('number')) {
      return 'math-challenge';
    }
    if (topic.toLowerCase().includes('word') || topic.toLowerCase().includes('language')) {
      return 'word-builder';
    }
    if (topic.toLowerCase().includes('science')) {
      return 'science-experiment';
    }
    
    // Default to pattern recognition (good for logic and critical thinking)
    return 'pattern-recognition';
  }
  
  /**
   * Get target accuracy for difficulty level
   */
  private getTargetAccuracy(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 0.80;
      case 'medium': return 0.70;
      case 'hard': return 0.60;
      case 'expert': return 0.50;
    }
  }
  
  /**
   * Get number of hints based on difficulty
   */
  private getHintsForDifficulty(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 3;
      case 'medium': return 2;
      case 'hard': return 1;
      case 'expert': return 0;
    }
  }
  
  /**
   * Generate questions using OpenAI
   */
  private async generateQuestions(
    config: GameConfig, 
    request: GameGenerationRequest
  ): Promise<GameQuestion[]> {
    if (isDemoMode()) {
      return this.generateDemoQuestions(config);
    }
    
    try {
      const openai = getOpenAIClient();
      
      const prompt = this.buildGamePrompt(config, request);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational game designer. Create engaging, age-appropriate educational games that adapt to student performance. Return responses in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });
      
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      const parsed = JSON.parse(content);
      return this.parseAIQuestions(parsed, config);
      
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      return this.generateDemoQuestions(config);
    }
  }
  
  /**
   * Build prompt for AI game generation
   */
  private buildGamePrompt(config: GameConfig, request: GameGenerationRequest): string {
    const { type, difficulty, topic } = config;
    const { learningObjectives, previousPerformance } = request;
    
    let prompt = `Create an educational ${type} game about "${topic}" at ${difficulty} difficulty level.\n\n`;
    
    prompt += `Learning Objectives:\n${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}\n\n`;
    
    if (previousPerformance) {
      prompt += `Student Context:\n`;
      prompt += `- Previous accuracy: ${(previousPerformance.accuracy * 100).toFixed(0)}%\n`;
      prompt += `- Teaching strategy: ${previousPerformance.teachingStrategy}\n`;
      if (previousPerformance.knowledgeGaps.length > 0) {
        prompt += `- Knowledge gaps: ${previousPerformance.knowledgeGaps.join(', ')}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `Generate 10 questions in this format:\n`;
    prompt += `{\n`;
    prompt += `  "questions": [\n`;
    prompt += `    {\n`;
    prompt += `      "id": "q1",\n`;
    prompt += `      "question": "Question text",\n`;
    prompt += `      "options": ["Option A", "Option B", "Option C", "Option D"],\n`;
    prompt += `      "correctAnswer": "Option A",\n`;
    prompt += `      "explanation": "Why this is correct",\n`;
    prompt += `      "hints": ["Hint 1", "Hint 2", "Hint 3"],\n`;
    prompt += `      "concept": "Concept being tested"\n`;
    prompt += `    }\n`;
    prompt += `  ]\n`;
    prompt += `}\n\n`;
    
    // Game-specific instructions
    switch (type) {
      case 'pattern-recognition':
        prompt += `Create visual or logical pattern questions. Use emojis or symbols for visual patterns.\n`;
        break;
      case 'math-challenge':
        prompt += `Create math problems appropriate for the difficulty level. Include word problems and calculations.\n`;
        break;
      case 'memory-match':
        prompt += `Create memory-based questions with items to remember and recall.\n`;
        break;
      case 'word-builder':
        prompt += `Create word-based challenges like spelling, vocabulary, or sentence building.\n`;
        break;
      case 'science-experiment':
        prompt += `Create science questions that involve observation, prediction, or experimentation.\n`;
        break;
      case 'creative-challenge':
        prompt += `Create open-ended creative prompts that encourage imagination and expression.\n`;
        break;
    }
    
    prompt += `\nMake questions engaging, age-appropriate, and progressively challenging.`;
    
    return prompt;
  }
  
  /**
   * Parse AI-generated questions into GameQuestion format
   */
  private parseAIQuestions(parsed: any, config: GameConfig): GameQuestion[] {
    const questions: GameQuestion[] = [];
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid AI response format');
    }
    
    for (const q of parsed.questions) {
      questions.push({
        id: `${config.id}-${q.id || questions.length}`,
        type: config.type,
        difficulty: config.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hints: q.hints || [],
        concept: q.concept || config.topic,
        timeLimit: config.timeLimit
      });
    }
    
    return questions;
  }
  
  /**
   * Generate demo questions (fallback when no API key)
   */
  private generateDemoQuestions(config: GameConfig): GameQuestion[] {
    const questions: GameQuestion[] = [];
    
    switch (config.type) {
      case 'pattern-recognition':
        questions.push(
          {
            id: `${config.id}-1`,
            type: 'pattern-recognition',
            difficulty: config.difficulty,
            question: 'What comes next in this pattern? 🔴 🔵 🔴 🔵 🔴 ?',
            options: ['🔴', '🔵', '🟢', '🟡'],
            correctAnswer: '🔵',
            explanation: 'The pattern alternates between red and blue circles.',
            hints: ['Look at the colors', 'It repeats every 2 items', 'Red, blue, red, blue...'],
            concept: 'Basic patterns'
          },
          {
            id: `${config.id}-2`,
            type: 'pattern-recognition',
            difficulty: config.difficulty,
            question: 'Complete the pattern: ⭐ ⭐ 🌙 ⭐ ⭐ 🌙 ⭐ ⭐ ?',
            options: ['⭐', '🌙', '☀️', '🌟'],
            correctAnswer: '🌙',
            explanation: 'The pattern is two stars, then a moon, repeating.',
            hints: ['Count the stars', 'What comes after two stars?', 'Look for the repeating group'],
            concept: 'Repeating patterns'
          }
        );
        break;
        
      case 'math-challenge':
        questions.push(
          {
            id: `${config.id}-1`,
            type: 'math-challenge',
            difficulty: config.difficulty,
            question: 'If you have 5 apples and get 3 more, how many apples do you have?',
            options: ['6', '7', '8', '9'],
            correctAnswer: '8',
            explanation: '5 + 3 = 8 apples total',
            hints: ['Start with 5', 'Add 3 more', 'Count them all together'],
            concept: 'Addition'
          },
          {
            id: `${config.id}-2`,
            type: 'math-challenge',
            difficulty: config.difficulty,
            question: 'What is 12 - 7?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '5',
            explanation: '12 minus 7 equals 5',
            hints: ['Start at 12', 'Count back 7', 'Use your fingers if needed'],
            concept: 'Subtraction'
          }
        );
        break;
        
      case 'word-builder':
        questions.push(
          {
            id: `${config.id}-1`,
            type: 'word-builder',
            difficulty: config.difficulty,
            question: 'Which word rhymes with "cat"?',
            options: ['dog', 'hat', 'bird', 'fish'],
            correctAnswer: 'hat',
            explanation: 'Cat and hat both end with "-at" sound',
            hints: ['Say the words out loud', 'Listen to the ending sounds', 'Both end with "at"'],
            concept: 'Rhyming'
          }
        );
        break;
        
      default:
        // Generic questions
        questions.push({
          id: `${config.id}-1`,
          type: config.type,
          difficulty: config.difficulty,
          question: `Demo question about ${config.topic}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is a demo explanation',
          hints: ['Hint 1', 'Hint 2', 'Hint 3'],
          concept: config.topic
        });
    }
    
    return questions;
  }
  
  /**
   * Generate adaptive follow-up question based on performance
   */
  async generateAdaptiveFollowUp(
    previousQuestion: GameQuestion,
    wasCorrect: boolean,
    studentId: string
  ): Promise<GameQuestion> {
    // If correct, increase difficulty slightly
    // If incorrect, provide similar question with more scaffolding
    
    const newDifficulty = wasCorrect 
      ? this.increaseDifficulty(previousQuestion.difficulty)
      : previousQuestion.difficulty;
    
    const request: GameGenerationRequest = {
      studentId,
      topic: previousQuestion.concept,
      difficulty: newDifficulty,
      gameType: previousQuestion.type,
      learningObjectives: [
        wasCorrect 
          ? `Build on ${previousQuestion.concept} understanding`
          : `Reinforce ${previousQuestion.concept} with more support`
      ]
    };
    
    const game = await this.generateGame(request);
    return game.questions[0];
  }
  
  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : current;
  }
}

// Singleton instance
export const gameGenerator = new GameGenerator();
