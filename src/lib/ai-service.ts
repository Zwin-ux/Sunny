/**
 * Enhanced AI Service for Sunny AI Platform
 * 
 * This service provides production-ready AI functionality with:
 * - Intelligent caching and rate limiting
 * - Graceful error handling and fallbacks
 * - Token optimization
 * - Response streaming
 * - Multi-model support
 * - Cost tracking
 */

import OpenAI from 'openai';
import { isDemoMode } from './demo-mode';
import { logger } from './logger';
import { StudentProfile } from '@/types/chat';

// ============================================================================
// Configuration
// ============================================================================

const AI_CONFIG = {
  // Model selection (can be overridden via env)
  defaultModel: process.env.OPENAI_MODEL || 'gpt-4-turbo',
  fallbackModel: 'gpt-3.5-turbo',
  
  // Token limits
  maxTokens: {
    chat: 200,
    challenge: 500,
    feedback: 150,
    plan: 800,
  },
  
  // Temperature settings
  temperature: {
    creative: 0.9,
    balanced: 0.7,
    precise: 0.3,
  },
  
  // Timeout settings (ms)
  timeout: 30000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
};

// ============================================================================
// Types
// ============================================================================

interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  cached: boolean;
}

interface CacheEntry {
  response: string;
  timestamp: number;
  tokensUsed: number;
}

// ============================================================================
// In-Memory Cache (use Redis in production for multi-instance deployments)
// ============================================================================

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, response: string, tokensUsed: number): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      tokensUsed,
    });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs = 60 * 1000; // 1 minute
  private readonly maxRequests = 20; // 20 requests per minute per user

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }

  reset(userId: string): void {
    this.requests.delete(userId);
  }
}

// ============================================================================
// Enhanced AI Service
// ============================================================================

export class EnhancedAIService {
  private client: OpenAI | null = null;
  private cache = new ResponseCache();
  private rateLimiter = new RateLimiter();
  private totalTokensUsed = 0;
  private requestCount = 0;

  constructor() {
    // Initialize OpenAI client if not in demo mode
    if (!isDemoMode() && process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: AI_CONFIG.timeout,
        maxRetries: AI_CONFIG.maxRetries,
      });
      
      // Start cache cleanup interval
      setInterval(() => this.cache.cleanup(), 60000); // Every minute
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.client !== null && !isDemoMode();
  }

  /**
   * Generate chat completion with caching and error handling
   */
  async generateCompletion(
    request: AIRequest,
    userId?: string,
    cacheKey?: string
  ): Promise<AIResponse> {
    // Check rate limit
    if (userId && !this.rateLimiter.canMakeRequest(userId)) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    // Check cache
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for AI request', { cacheKey });
        return {
          content: cached,
          tokensUsed: 0,
          model: request.model || AI_CONFIG.defaultModel,
          cached: true,
        };
      }
    }

    // Ensure client is available
    if (!this.client) {
      throw new Error('AI service not available in demo mode');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || AI_CONFIG.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? AI_CONFIG.temperature.balanced,
        max_tokens: request.maxTokens ?? AI_CONFIG.maxTokens.chat,
        stream: false, // Ensure non-streaming for this method
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Update metrics
      this.totalTokensUsed += tokensUsed;
      this.requestCount++;

      // Cache response
      if (cacheKey && content) {
        this.cache.set(cacheKey, content, tokensUsed);
      }

      logger.info('AI completion generated', {
        model: request.model || AI_CONFIG.defaultModel,
        tokensUsed,
        cached: false,
      });

      return {
        content,
        tokensUsed,
        model: request.model || AI_CONFIG.defaultModel,
        cached: false,
      };
    } catch (error: any) {
      logger.error('AI completion failed', error);

      // Try fallback model if primary fails
      if (request.model === AI_CONFIG.defaultModel) {
        logger.info('Retrying with fallback model');
        return this.generateCompletion(
          { ...request, model: AI_CONFIG.fallbackModel },
          userId,
          cacheKey
        );
      }

      throw error;
    }
  }

  /**
   * Generate streaming chat response
   */
  async generateStreamingResponse(
    request: AIRequest,
    userId?: string
  ): Promise<ReadableStream> {
    // Check rate limit
    if (userId && !this.rateLimiter.canMakeRequest(userId)) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }

    if (!this.client) {
      throw new Error('AI service not available in demo mode');
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || AI_CONFIG.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? AI_CONFIG.temperature.balanced,
        max_tokens: request.maxTokens ?? AI_CONFIG.maxTokens.chat,
        stream: true,
      });

      this.requestCount++;

      return stream.toReadableStream();
    } catch (error: any) {
      logger.error('Streaming response failed', error);
      throw error;
    }
  }

  /**
   * Generate Sunny chat response with personality
   */
  async generateSunnyResponse(
    userMessage: string,
    studentProfile: StudentProfile,
    studentId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const systemPrompt = this.buildSunnySystemPrompt(studentProfile);
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const cacheKey = `sunny:${studentId}:${userMessage.slice(0, 50)}`;

    const response = await this.generateCompletion(
      {
        messages,
        temperature: AI_CONFIG.temperature.creative,
        maxTokens: AI_CONFIG.maxTokens.chat,
      },
      studentId,
      cacheKey
    );

    return response.content;
  }

  /**
   * Generate educational challenge
   */
  async generateChallenge(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    learningStyle: string,
    studentId?: string
  ): Promise<any> {
    const systemPrompt = `You are Sunny, an AI tutor creating educational challenges for kids aged 6-10.

Create a ${difficulty} challenge about "${topic}" for a ${learningStyle} learner.

Return ONLY valid JSON with this structure:
{
  "type": "multiple-choice" | "pattern" | "open-ended" | "matching",
  "question": "Clear, engaging question",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Correct option",
  "explanation": "Simple explanation why",
  "points": 10-30,
  "hint": "Optional helpful hint",
  "realWorldExample": "How this applies in real life"
}`;

    const cacheKey = `challenge:${topic}:${difficulty}:${learningStyle}`;

    const response = await this.generateCompletion(
      {
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: AI_CONFIG.temperature.creative,
        maxTokens: AI_CONFIG.maxTokens.challenge,
      },
      studentId,
      cacheKey
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse challenge JSON', error as Error);
      // Return fallback challenge
      return this.getFallbackChallenge(topic, difficulty);
    }
  }

  /**
   * Generate personalized feedback
   */
  async generateFeedback(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    isCorrect: boolean,
    studentProfile: StudentProfile,
    studentId: string
  ): Promise<string> {
    const systemPrompt = `You are Sunny, giving encouraging feedback to ${studentProfile.name}.

Question: "${question}"
Their answer: "${userAnswer}"
Correct answer: "${correctAnswer}"
Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

Provide 2-3 sentences of:
- Positive encouragement
- Brief explanation
- Next step suggestion
Use emojis! ✨`;

    const response = await this.generateCompletion(
      {
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: AI_CONFIG.temperature.balanced,
        maxTokens: AI_CONFIG.maxTokens.feedback,
      },
      studentId
    );

    return response.content;
  }

  /**
   * Build Sunny's system prompt based on student profile
   */
  private buildSunnySystemPrompt(profile: StudentProfile): string {
    return `You are Sunny, a cheerful AI tutor for kids aged 6-10. You're talking to ${profile.name}.

PERSONALITY:
- Friendly, patient, curious robot friend 🤖
- Use simple words, short sentences
- Add emojis for fun ✨🌟🎉

STUDENT PROFILE:
- Name: ${profile.name}
- Emotion: ${profile.emotion || 'neutral'}
- Learning Style: ${profile.learningStyle || 'visual'}
- Level: ${profile.level || 1}

TEACHING APPROACH:
1. Always encourage (praise effort, not just results)
2. Adapt to their learning style
3. Keep it interactive (ask questions)
4. One concept at a time
5. Check understanding before advancing

RESPONSE RULES:
- Maximum 2-3 sentences
- Use age-appropriate language
- Make it fun and engaging
- Offer mini-challenges when appropriate`;
  }

  /**
   * Fallback challenge when AI fails
   */
  private getFallbackChallenge(topic: string, difficulty: string): any {
    return {
      type: 'multiple-choice',
      question: `Let's learn about ${topic}! What do you already know?`,
      options: [
        'I know a lot!',
        'I know a little',
        'I want to learn more',
        'This is new to me',
      ],
      correctAnswer: 'All answers are great!',
      explanation: 'Every learner starts somewhere, and curiosity is the first step!',
      points: 10,
      hint: 'There\'s no wrong answer here!',
      realWorldExample: 'Learning is a journey we all take together.',
    };
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      totalTokensUsed: this.totalTokensUsed,
      requestCount: this.requestCount,
      averageTokensPerRequest:
        this.requestCount > 0 ? this.totalTokensUsed / this.requestCount : 0,
      isAvailable: this.isAvailable(),
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.totalTokensUsed = 0;
    this.requestCount = 0;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let aiServiceInstance: EnhancedAIService | null = null;

export function getAIService(): EnhancedAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new EnhancedAIService();
  }
  return aiServiceInstance;
}

// Export for testing
export { ResponseCache, RateLimiter, AI_CONFIG };
