/**
 * Communication Agent
 *
 * Specialized agent responsible for:
 * - Tone adaptation based on student emotion and performance
 * - Language simplification for age-appropriateness (6-10 years)
 * - Encouragement and praise generation
 * - Response personalization based on learning style
 * - Emotional intelligence and empathy
 */

import { BaseAgent } from './base-agent';
import {
  AgentMessage,
  AgentResponse,
  LearningState,
  EnhancedStudentProfile,
  Recommendation,
} from './types';
import { getOpenAIClient } from '../sunny-ai';

export class CommunicationAgent extends BaseAgent {
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super('communication');
  }

  async initialize(): Promise<void> {
    console.log('[CommunicationAgent] Initializing...');
    // Load any configuration or presets
    this.emit('agent:initialized', { agentType: this.agentType });
  }

  async shutdown(): Promise<void> {
    console.log('[CommunicationAgent] Shutting down...');
    this.responseCache.clear();
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { type, payload } = message;

    try {
      if (type === 'conversation') {
        // Main use case: adapt tone/language for conversation
        const { studentMessage, studentProfile, conversationHistory } = payload;

        const adaptedResponse = await this.adaptCommunication(
          studentMessage,
          studentProfile,
          conversationHistory
        );

        return {
          success: true,
          confidence: 0.88,
          priority: 'high',
          data: {
            adaptedResponse,
            communicationStrategy: adaptedResponse.strategy,
          },
          recommendations: [
            {
              id: `comm-${Date.now()}`,
              type: 'content',
              priority: 'high',
              description: 'Use adapted communication style',
              data: adaptedResponse,
              confidence: 0.88,
            },
          ],
        };
      }

      if (type === 'encouragement') {
        // Generate personalized encouragement
        const encouragement = await this.generateEncouragement(payload.context);

        return {
          success: true,
          confidence: 0.92,
          priority: 'medium',
          data: { encouragement },
          recommendations: [
            {
              id: `enc-${Date.now()}`,
              type: 'content',
              priority: 'medium',
              description: 'Provide encouragement',
              data: { message: encouragement },
              confidence: 0.92,
            },
          ],
        };
      }

      // Default response for unhandled message types
      return {
        success: false,
        confidence: 0.1,
        priority: 'low',
        data: {},
        recommendations: [],
      };
    } catch (error) {
      console.error('[CommunicationAgent] Error processing message:', error);
      return {
        success: false,
        error: (error as Error).message,
        confidence: 0,
        priority: 'low',
        data: {},
        recommendations: [],
      };
    }
  }

  /**
   * Adapt communication style based on student profile and context
   */
  private async adaptCommunication(
    studentMessage: string,
    studentProfile: EnhancedStudentProfile,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{
    tone: string;
    vocabulary_level: string;
    response_suggestions: string[];
    strategy: string;
  }> {
    const { cognitiveProfile, motivationFactors, behavioralPatterns } = studentProfile;

    // Determine tone based on recent engagement and frustration
    const tone = this.selectTone(studentProfile);

    // Determine vocabulary complexity
    const vocabularyLevel = this.selectVocabularyLevel(cognitiveProfile);

    // Generate strategy
    const strategy = this.selectCommunicationStrategy(studentProfile);

    // Use AI to generate response suggestions
    const responseSuggestions = await this.generateResponseSuggestions(
      studentMessage,
      tone,
      vocabularyLevel,
      strategy,
      conversationHistory
    );

    return {
      tone,
      vocabulary_level: vocabularyLevel,
      response_suggestions: responseSuggestions,
      strategy,
    };
  }

  /**
   * Select appropriate tone based on student state
   */
  private selectTone(profile: EnhancedStudentProfile): string {
    const { motivationFactors, behavioralPatterns } = profile;

    // High frustration → supportive, gentle
    const frustrationPattern = behavioralPatterns.find(
      (p) => p.pattern === 'high_frustration'
    );
    if (frustrationPattern && frustrationPattern.confidence > 0.7) {
      return 'supportive';
    }

    // Low engagement → energetic, exciting
    const engagementPattern = behavioralPatterns.find(
      (p) => p.pattern === 'low_engagement'
    );
    if (engagementPattern && engagementPattern.confidence > 0.6) {
      return 'energetic';
    }

    // High intrinsic motivation → encouraging, collaborative
    if (motivationFactors.intrinsic > 0.7) {
      return 'encouraging';
    }

    // High competitive → challenging, playful
    if (motivationFactors.competitive > 0.7) {
      return 'playful';
    }

    // Default: warm, balanced
    return 'warm';
  }

  /**
   * Select vocabulary level based on cognitive profile
   */
  private selectVocabularyLevel(cognitiveProfile: {
    processingSpeed: number;
    workingMemory: number;
    attentionSpan: number;
    metacognition: number;
  }): string {
    const avgCognitive =
      (cognitiveProfile.processingSpeed +
        cognitiveProfile.workingMemory +
        cognitiveProfile.metacognition) /
      3;

    if (avgCognitive > 0.8) {
      return 'advanced'; // Can handle more complex language
    } else if (avgCognitive > 0.5) {
      return 'intermediate'; // Grade-appropriate
    } else {
      return 'simple'; // Very simple, short sentences
    }
  }

  /**
   * Select communication strategy
   */
  private selectCommunicationStrategy(profile: EnhancedStudentProfile): string {
    const { learningVelocity, motivationFactors } = profile;

    // Fast learner + high intrinsic motivation → discovery-based
    if (learningVelocity > 0.7 && motivationFactors.intrinsic > 0.6) {
      return 'discovery';
    }

    // Struggling + needs support → scaffolding
    if (learningVelocity < 0.3) {
      return 'scaffolding';
    }

    // Collaborative preference → social learning language
    if (motivationFactors.collaborative > 0.7) {
      return 'collaborative';
    }

    // Default: balanced direct instruction
    return 'direct';
  }

  /**
   * Generate response suggestions using AI
   */
  private async generateResponseSuggestions(
    studentMessage: string,
    tone: string,
    vocabularyLevel: string,
    strategy: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string[]> {
    // Check cache
    const cacheKey = `${studentMessage}-${tone}-${vocabularyLevel}`;
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return [cached.response];
    }

    try {
      const client = getOpenAIClient();

      const systemPrompt = `You are Sunny, a communication expert for an AI tutor for children aged 6-10.

Your task: Generate 3 response options for Sunny to say to the student.

Communication Parameters:
- Tone: ${tone}
- Vocabulary Level: ${vocabularyLevel} (keep language age-appropriate for 6-10 year olds)
- Strategy: ${strategy}

Tone Guidelines:
- supportive: Gentle, patient, reassuring, emphasize that mistakes are okay
- energetic: Exciting, enthusiastic, lots of emojis, upbeat language
- encouraging: Positive, motivational, praise effort, focus on growth
- playful: Fun, lighthearted, use humor, make learning a game
- warm: Friendly, caring, balanced, natural

Vocabulary Level Guidelines:
- simple: Very short sentences (5-8 words), common words only, concrete examples
- intermediate: Normal sentences (8-12 words), grade-appropriate vocabulary
- advanced: Longer sentences okay, can introduce some complex words with context

Strategy Guidelines:
- discovery: Ask questions, encourage exploration, "What do you think?", "Let's find out together"
- scaffolding: Break things down, provide hints, step-by-step guidance
- collaborative: Use "we" language, emphasize teamwork, "Let's work on this together"
- direct: Clear explanations, straightforward teaching

Recent conversation context:
${conversationHistory.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n')}

Student's message: "${studentMessage}"

Generate 3 different response options that Sunny could say. Each should:
1. Match the specified tone, vocabulary level, and strategy
2. Be age-appropriate for 6-10 year olds
3. Include appropriate emojis (but not excessive)
4. Be engaging and maintain the student's interest
5. Vary in approach (e.g., one could be more question-based, one more direct)

Return as JSON array of strings:
["response 1", "response 2", "response 3"]`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.85,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const suggestions = Array.isArray(parsed)
        ? parsed
        : parsed.responses || [];

      // Cache the first suggestion
      if (suggestions.length > 0) {
        this.responseCache.set(cacheKey, {
          response: suggestions[0],
          timestamp: Date.now(),
        });
      }

      // Cleanup old cache entries
      this.cleanupCache();

      return suggestions;
    } catch (error) {
      console.error('[CommunicationAgent] Error generating suggestions:', error);

      // Fallback responses
      return this.getFallbackResponses(tone);
    }
  }

  /**
   * Generate personalized encouragement
   */
  private async generateEncouragement(context: {
    recentPerformance: 'struggling' | 'improving' | 'excelling';
    currentEmotion?: string;
    specificAchievement?: string;
  }): Promise<string> {
    const { recentPerformance, currentEmotion, specificAchievement } = context;

    const templates = {
      struggling: [
        "You're doing great by keeping trying! 💪 Every mistake helps you learn!",
        "I can see you're working hard! 🌟 Let's figure this out together!",
        "You're making progress, even if it doesn't feel like it! Keep going! 🚀",
      ],
      improving: [
        "Wow, look at that progress! 📈 You're really getting the hang of this!",
        "Amazing improvement! 🎉 Your hard work is paying off!",
        "You're on fire! 🔥 Keep up the awesome work!",
      ],
      excelling: [
        "Incredible! 🌟 You're absolutely crushing this!",
        "Outstanding work! 🏆 You're a learning superstar!",
        "You're making this look easy! 💎 Phenomenal job!",
      ],
    };

    const options = templates[recentPerformance] || templates.improving;
    let encouragement = options[Math.floor(Math.random() * options.length)];

    // Add specific achievement if provided
    if (specificAchievement) {
      encouragement += ` ${specificAchievement}`;
    }

    return encouragement;
  }

  /**
   * Get fallback responses when AI is unavailable
   */
  private getFallbackResponses(tone: string): string[] {
    const fallbacks: Record<string, string[]> = {
      supportive: [
        "That's okay! Let's try looking at it a different way. 🤗",
        "I'm here to help you figure this out! 💙",
        "You're doing great by asking questions! Let's explore this together. 🌟",
      ],
      energetic: [
        "Woohoo! Let's dive into this exciting topic! 🚀",
        "This is going to be so much fun! Ready to explore? 🎉",
        "Get ready for an awesome learning adventure! ✨",
      ],
      encouraging: [
        "You're making amazing progress! Keep it up! 🌈",
        "I love your enthusiasm for learning! 💫",
        "You're doing fantastic! Let's keep going! 🎯",
      ],
      playful: [
        "Ooh, interesting question! Let's play detective and find out! 🔍",
        "Time for a learning adventure! Buckle up! 🎢",
        "Let's make this super fun! Ready? 🎨",
      ],
      warm: [
        "That's a great question! Let me explain. 😊",
        "I'm happy to help you with that! 🌟",
        "Let's explore this together! I think you'll love it. 💙",
      ],
    };

    return fallbacks[tone] || fallbacks.warm;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.responseCache.delete(key);
      }
    }

    // Limit cache size
    if (this.responseCache.size > 100) {
      // Remove oldest 20% of entries
      const entries = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));
      toRemove.forEach(([key]) => this.responseCache.delete(key));
    }
  }

  /**
   * Simplify language for younger/struggling students
   */
  public simplifyLanguage(text: string, targetLevel: 'simple' | 'intermediate' | 'advanced'): string {
    // This is a simplified version - in production, use NLP library

    if (targetLevel === 'advanced') {
      return text; // No simplification needed
    }

    if (targetLevel === 'simple') {
      // Break into shorter sentences
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());
      const simplified = sentences.map(s => {
        // Limit to ~8 words per sentence
        const words = s.trim().split(/\s+/);
        if (words.length <= 8) return s.trim() + '.';

        // Split long sentences
        const mid = Math.floor(words.length / 2);
        const first = words.slice(0, mid).join(' ');
        const second = words.slice(mid).join(' ');
        return `${first}. ${second}.`;
      });

      return simplified.join(' ');
    }

    // Intermediate - minimal changes
    return text;
  }
}
