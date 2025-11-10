/**
 * Communication Agent
 *
 * Specialized agent responsible for:
 * - Tone adaptation based on student emotion and performance
 * - Language simplification for age-appropriateness (6-10 years)
 * - Encouragement and praise generation
 * - Response personalization based on learning style
 * - Emotional intelligence and empathy
 * - Cultural context and reference incorporation
 * - Cross-session conversation context preservation
 * - Automatic connection-making to previous learning experiences
 * - Seamless activity transition communication
 * - Historical learning reference and reinforcement
 */

import { BaseAgent } from './base-agent';
import {
  AgentMessage,
  AgentResponse,
  LearningState,
  EnhancedStudentProfile,
  Recommendation,
  ContextEntry,
  Activity,
  LearningObjective,
  CognitiveProfile,
  MotivationProfile,
} from './types';
import { getOpenAIClient } from '../sunny-ai';
import { LearningStyle } from '@/types/chat';

/**
 * Conversation context for cross-session continuity
 */
interface ConversationContext {
  studentId: string;
  sessionId: string;
  recentTopics: string[];
  keyMoments: ContextEntry[];
  learningConnections: LearningConnection[];
  culturalPreferences: CulturalContext;
  lastInteractionTimestamp: number;
}

/**
 * Learning connections for making references to past experiences
 */
interface LearningConnection {
  id: string;
  fromConcept: string;
  toConcept: string;
  connectionType: 'builds-on' | 'similar-to' | 'contrasts-with' | 'applies-to';
  sessionId: string;
  timestamp: number;
  strength: number; // 0-1, how strong the connection is
}

/**
 * Cultural context for personalized references
 */
interface CulturalContext {
  language: string;
  region?: string;
  culturalReferences: string[]; // Topics/themes that resonate
  avoidTopics: string[]; // Topics to avoid
  preferredExamples: string[]; // Types of examples that work well
}

/**
 * Activity transition context
 */
interface ActivityTransition {
  fromActivity?: Activity;
  toActivity: Activity;
  reason: string;
  continuityPoints: string[]; // What to reference from previous activity
}

export class CommunicationAgent extends BaseAgent {
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Contextual memory storage
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private learningConnections: Map<string, LearningConnection[]> = new Map();
  private culturalContexts: Map<string, CulturalContext> = new Map();
  
  // Context retention settings
  private readonly MAX_CONTEXT_ENTRIES = 50;
  private readonly CONTEXT_RETENTION_DAYS = 30;

  constructor() {
    super('communication');
  }

  async initialize(): Promise<void> {
    console.log('[CommunicationAgent] Initializing...');
    
    // Load persisted conversation contexts (in production, load from database)
    this.loadPersistedContexts();
    
    // Setup event handlers for context tracking
    this.setupContextTracking();
    
    this.emit('agent:initialized', { agentType: this.agentType });
  }

  async shutdown(): Promise<void> {
    console.log('[CommunicationAgent] Shutting down...');
    
    // Persist conversation contexts before shutdown
    await this.persistContexts();
    
    this.responseCache.clear();
    this.conversationContexts.clear();
    this.learningConnections.clear();
    this.culturalContexts.clear();
  }
  
  /**
   * Setup event handlers for automatic context tracking
   */
  private setupContextTracking(): void {
    // Listen for learning events to build connections
    this.on('learning:concept-mastered', (data) => {
      this.recordLearningConnection(data);
    });
    
    this.on('learning:activity-completed', (data) => {
      this.updateConversationContext(data);
    });
  }
  
  /**
   * Load persisted contexts (placeholder for database integration)
   */
  private loadPersistedContexts(): void {
    // In production, load from database
    // For now, start with empty contexts
    console.log('[CommunicationAgent] Context storage initialized');
  }
  
  /**
   * Persist contexts to storage (placeholder for database integration)
   */
  private async persistContexts(): Promise<void> {
    // In production, save to database
    console.log('[CommunicationAgent] Persisting conversation contexts');
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { type, payload } = message;

    try {
      if (type === 'request' && payload.action === 'adapt-communication') {
        // Main use case: adapt tone/language for conversation with full context
        const { studentMessage, studentProfile, conversationHistory, learningState } = payload;

        const adaptedResponse = await this.adaptCommunicationWithContext(
          studentMessage,
          studentProfile,
          conversationHistory,
          learningState
        );

        return {
          messageId: message.id,
          success: true,
          data: {
            adaptedResponse,
            communicationStrategy: adaptedResponse.strategy,
            contextualReferences: adaptedResponse.contextualReferences,
          },
          recommendations: [
            this.createRecommendation(
              'content',
              'Use adapted communication style with contextual continuity',
              adaptedResponse,
              0.88,
              'high',
              'Communication adapted based on student profile, learning history, and cultural context'
            ),
          ],
        };
      }

      if (type === 'request' && payload.action === 'activity-transition') {
        // Handle activity transitions with continuity
        const transition = await this.generateActivityTransition(payload.transition);

        return {
          messageId: message.id,
          success: true,
          data: { transition },
          recommendations: [
            this.createRecommendation(
              'content',
              'Use seamless activity transition',
              transition,
              0.90,
              'high',
              'Transition maintains learning continuity and references previous activity'
            ),
          ],
        };
      }

      if (type === 'request' && payload.action === 'learning-reference') {
        // Generate reference to past learning
        const reference = await this.generateLearningReference(
          payload.studentId,
          payload.currentConcept,
          payload.context
        );

        return {
          messageId: message.id,
          success: true,
          data: { reference },
          recommendations: [
            this.createRecommendation(
              'content',
              'Reference past learning experience',
              reference,
              0.85,
              'medium',
              'Connects current learning to previous experiences'
            ),
          ],
        };
      }

      if (type === 'request' && payload.action === 'update-cultural-context') {
        // Update cultural context for a student
        this.updateCulturalContext(payload.studentId, payload.culturalData);

        return {
          messageId: message.id,
          success: true,
          data: { updated: true },
        };
      }

      if (type === 'request' && payload.action === 'get-conversation-context') {
        // Retrieve conversation context for a student
        const context = this.getConversationContext(payload.studentId);

        return {
          messageId: message.id,
          success: true,
          data: { context },
        };
      }

      // Legacy support for notification messages
      if (type === 'notification' && payload.subtype === 'conversation') {
        const { studentMessage, studentProfile, conversationHistory } = payload;
        const adaptedResponse = await this.adaptCommunication(
          studentMessage,
          studentProfile,
          conversationHistory
        );

        return {
          messageId: message.id,
          success: true,
          data: {
            adaptedResponse,
            communicationStrategy: adaptedResponse.strategy,
          },
          recommendations: [
            this.createRecommendation(
              'content',
              'Use adapted communication style',
              adaptedResponse,
              0.88,
              'high'
            ),
          ],
        };
      }

      if (type === 'notification' && payload.subtype === 'encouragement') {
        const encouragement = await this.generateEncouragement(payload.context);

        return {
          messageId: message.id,
          success: true,
          data: { encouragement },
          recommendations: [
            this.createRecommendation(
              'content',
              'Provide encouragement',
              { message: encouragement },
              0.92,
              'medium'
            ),
          ],
        };
      }

      // Default response for unhandled message types
      return {
        messageId: message.id,
        success: false,
        error: 'Unhandled message type or action',
      };
    } catch (error) {
      console.error('[CommunicationAgent] Error processing message:', error);
      return {
        messageId: message.id,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Adapt communication style with full contextual awareness
   */
  private async adaptCommunicationWithContext(
    studentMessage: string,
    studentProfile: EnhancedStudentProfile,
    conversationHistory: Array<{ role: string; content: string }>,
    learningState?: LearningState
  ): Promise<{
    tone: string;
    vocabulary_level: string;
    response_suggestions: string[];
    strategy: string;
    contextualReferences: string[];
    culturalAdaptations: string[];
  }> {
    // Use studentId from profile name or learning state
    const studentId = learningState?.studentId || studentProfile.name || 'default';
    
    // Get or create conversation context
    let context = this.conversationContexts.get(studentId);
    if (!context) {
      context = this.initializeConversationContext(studentId, learningState?.sessionId || 'default');
      this.conversationContexts.set(studentId, context);
    }
    
    // Update context with current interaction
    this.updateContextWithMessage(context, studentMessage, learningState);
    
    // Get cultural context
    const culturalContext = this.culturalContexts.get(studentId) || this.getDefaultCulturalContext();
    
    // Determine communication parameters
    const tone = this.selectTone(studentProfile);
    const vocabularyLevel = this.selectVocabularyLevel(studentProfile.cognitiveProfile);
    const strategy = this.selectCommunicationStrategy(studentProfile);
    
    // Generate contextual references from past learning
    const contextualReferences = this.generateContextualReferences(context, learningState);
    
    // Apply cultural adaptations
    const culturalAdaptations = this.applyCulturalContext(culturalContext, learningState);
    
    // Generate response suggestions with full context
    const learningStyles = Array.isArray(studentProfile.learningStyle) 
      ? studentProfile.learningStyle 
      : [studentProfile.learningStyle];
    
    const responseSuggestions = await this.generateContextualResponseSuggestions(
      studentMessage,
      tone,
      vocabularyLevel,
      strategy,
      conversationHistory,
      contextualReferences,
      culturalAdaptations,
      learningStyles
    );

    return {
      tone,
      vocabulary_level: vocabularyLevel,
      response_suggestions: responseSuggestions,
      strategy,
      contextualReferences,
      culturalAdaptations,
    };
  }

  /**
   * Adapt communication style based on student profile and context (legacy method)
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
    const { cognitiveProfile, motivationFactors } = studentProfile;

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

  // ============================================================================
  // CONTEXTUAL MEMORY AND CONTINUITY METHODS (Task 7.2)
  // ============================================================================

  /**
   * Initialize conversation context for a new student or session
   */
  private initializeConversationContext(studentId: string, sessionId: string): ConversationContext {
    return {
      studentId,
      sessionId,
      recentTopics: [],
      keyMoments: [],
      learningConnections: [],
      culturalPreferences: this.getDefaultCulturalContext(),
      lastInteractionTimestamp: Date.now(),
    };
  }

  /**
   * Update conversation context with new message
   */
  private updateContextWithMessage(
    context: ConversationContext,
    message: string,
    learningState?: LearningState
  ): void {
    context.lastInteractionTimestamp = Date.now();
    
    // Extract topics from message (simple keyword extraction)
    const topics = this.extractTopics(message);
    context.recentTopics = [...new Set([...topics, ...context.recentTopics])].slice(0, 10);
    
    // Add to context history if learning state is available
    if (learningState) {
      const contextEntry: ContextEntry = {
        id: `ctx-${Date.now()}`,
        type: 'conversation',
        content: { message, topics },
        timestamp: Date.now(),
        importance: 0.5,
        tags: topics,
      };
      
      context.keyMoments.push(contextEntry);
      
      // Keep only recent key moments
      if (context.keyMoments.length > this.MAX_CONTEXT_ENTRIES) {
        context.keyMoments = context.keyMoments.slice(-this.MAX_CONTEXT_ENTRIES);
      }
    }
  }

  /**
   * Record a learning connection for future reference
   */
  private recordLearningConnection(data: any): void {
    const { studentId, fromConcept, toConcept, connectionType, sessionId } = data;
    
    if (!this.learningConnections.has(studentId)) {
      this.learningConnections.set(studentId, []);
    }
    
    const connection: LearningConnection = {
      id: `conn-${Date.now()}`,
      fromConcept,
      toConcept,
      connectionType: connectionType || 'builds-on',
      sessionId,
      timestamp: Date.now(),
      strength: 0.8,
    };
    
    this.learningConnections.get(studentId)!.push(connection);
  }

  /**
   * Update conversation context with activity completion
   */
  private updateConversationContext(data: any): void {
    const { studentId, activity, sessionId } = data;
    
    const context = this.conversationContexts.get(studentId);
    if (!context) return;
    
    const contextEntry: ContextEntry = {
      id: `ctx-${Date.now()}`,
      type: 'activity',
      content: { activity },
      timestamp: Date.now(),
      importance: 0.7,
      tags: [activity.type, ...activity.objectives],
    };
    
    context.keyMoments.push(contextEntry);
  }

  /**
   * Generate contextual references to past learning
   */
  private generateContextualReferences(
    context: ConversationContext,
    learningState?: LearningState
  ): string[] {
    const references: string[] = [];
    
    // Reference recent topics
    if (context.recentTopics.length > 0) {
      const recentTopic = context.recentTopics[0];
      references.push(`Remember when we talked about ${recentTopic}?`);
    }
    
    // Reference learning connections
    if (learningState && context.learningConnections.length > 0) {
      const relevantConnections = context.learningConnections
        .filter(conn => {
          // Find connections related to current objectives
          return learningState.currentObjectives.some(obj => 
            obj.title.toLowerCase().includes(conn.toConcept.toLowerCase())
          );
        })
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 2);
      
      relevantConnections.forEach(conn => {
        references.push(`This builds on what you learned about ${conn.fromConcept}!`);
      });
    }
    
    // Reference key moments
    const recentKeyMoments = context.keyMoments
      .filter(moment => moment.importance > 0.6)
      .slice(-3);
    
    if (recentKeyMoments.length > 0) {
      const moment = recentKeyMoments[recentKeyMoments.length - 1];
      if (moment.type === 'activity') {
        references.push(`Just like in our last activity!`);
      }
    }
    
    return references;
  }

  /**
   * Generate seamless activity transition
   */
  private async generateActivityTransition(transition: ActivityTransition): Promise<{
    message: string;
    continuityPoints: string[];
    tone: string;
  }> {
    const { fromActivity, toActivity, reason, continuityPoints } = transition;
    
    let message = '';
    
    if (fromActivity) {
      // Acknowledge previous activity
      message = `Great work on that ${fromActivity.type}! `;
      
      // Create bridge to new activity
      if (continuityPoints.length > 0) {
        message += `Now let's use what you learned to ${toActivity.description}. `;
      } else {
        message += `Now we're going to try something new: ${toActivity.description}. `;
      }
    } else {
      // Starting fresh
      message = `Let's start with ${toActivity.description}! `;
    }
    
    // Add reason if provided
    if (reason) {
      message += `${reason} `;
    }
    
    // Add excitement
    message += `Ready? 🚀`;
    
    return {
      message,
      continuityPoints,
      tone: 'energetic',
    };
  }

  /**
   * Generate reference to past learning experience
   */
  private async generateLearningReference(
    studentId: string,
    currentConcept: string,
    context: string
  ): Promise<{
    reference: string;
    connections: LearningConnection[];
    confidence: number;
  }> {
    const connections = this.learningConnections.get(studentId) || [];
    
    // Find relevant connections
    const relevantConnections = connections
      .filter(conn => 
        conn.toConcept.toLowerCase().includes(currentConcept.toLowerCase()) ||
        conn.fromConcept.toLowerCase().includes(currentConcept.toLowerCase())
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
    
    if (relevantConnections.length === 0) {
      return {
        reference: '',
        connections: [],
        confidence: 0,
      };
    }
    
    // Generate reference message
    const mostRecent = relevantConnections[0];
    let reference = '';
    
    switch (mostRecent.connectionType) {
      case 'builds-on':
        reference = `This builds on ${mostRecent.fromConcept} that you learned before!`;
        break;
      case 'similar-to':
        reference = `This is similar to ${mostRecent.fromConcept}. See the connection?`;
        break;
      case 'contrasts-with':
        reference = `This is different from ${mostRecent.fromConcept}. Can you spot the difference?`;
        break;
      case 'applies-to':
        reference = `You can use what you learned about ${mostRecent.fromConcept} here!`;
        break;
    }
    
    return {
      reference,
      connections: relevantConnections,
      confidence: mostRecent.strength,
    };
  }

  /**
   * Get conversation context for a student
   */
  private getConversationContext(studentId: string): ConversationContext | null {
    return this.conversationContexts.get(studentId) || null;
  }

  /**
   * Extract topics from message (simple keyword extraction)
   */
  private extractTopics(message: string): string[] {
    // Simple topic extraction - in production, use NLP
    const words = message.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 4 && !stopWords.has(word))
      .slice(0, 5);
  }

  // ============================================================================
  // CULTURAL CONTEXT AND ADAPTATION METHODS (Task 7.1)
  // ============================================================================

  /**
   * Get default cultural context
   */
  private getDefaultCulturalContext(): CulturalContext {
    return {
      language: 'en',
      culturalReferences: ['animals', 'nature', 'sports', 'space', 'art'],
      avoidTopics: [],
      preferredExamples: ['everyday situations', 'games', 'stories'],
    };
  }

  /**
   * Update cultural context for a student
   */
  private updateCulturalContext(studentId: string, culturalData: Partial<CulturalContext>): void {
    const existing = this.culturalContexts.get(studentId) || this.getDefaultCulturalContext();
    
    this.culturalContexts.set(studentId, {
      ...existing,
      ...culturalData,
    });
  }

  /**
   * Apply cultural context to generate culturally relevant examples
   */
  private applyCulturalContext(
    culturalContext: CulturalContext,
    learningState?: LearningState
  ): string[] {
    const adaptations: string[] = [];
    
    // Suggest culturally relevant examples
    if (culturalContext.preferredExamples.length > 0) {
      const example = culturalContext.preferredExamples[0];
      adaptations.push(`Use ${example} as examples`);
    }
    
    // Suggest culturally relevant references
    if (culturalContext.culturalReferences.length > 0) {
      const references = culturalContext.culturalReferences.slice(0, 2).join(' or ');
      adaptations.push(`Reference ${references} when possible`);
    }
    
    // Note topics to avoid
    if (culturalContext.avoidTopics.length > 0) {
      adaptations.push(`Avoid topics: ${culturalContext.avoidTopics.join(', ')}`);
    }
    
    return adaptations;
  }

  /**
   * Generate response suggestions with full contextual awareness
   */
  private async generateContextualResponseSuggestions(
    studentMessage: string,
    tone: string,
    vocabularyLevel: string,
    strategy: string,
    conversationHistory: Array<{ role: string; content: string }>,
    contextualReferences: string[],
    culturalAdaptations: string[],
    learningStyle?: LearningStyle[]
  ): Promise<string[]> {
    try {
      const client = getOpenAIClient();

      const systemPrompt = `You are Sunny, an AI tutor for children aged 6-10 with advanced contextual awareness.

Your task: Generate 3 response options that incorporate contextual continuity and cultural relevance.

Communication Parameters:
- Tone: ${tone}
- Vocabulary Level: ${vocabularyLevel}
- Strategy: ${strategy}
- Learning Style: ${learningStyle?.join(', ') || 'mixed'}

Contextual References (use these to connect to past learning):
${contextualReferences.length > 0 ? contextualReferences.map(ref => `- ${ref}`).join('\n') : '- No specific references'}

Cultural Adaptations:
${culturalAdaptations.length > 0 ? culturalAdaptations.map(adapt => `- ${adapt}`).join('\n') : '- Use general examples'}

Recent conversation:
${conversationHistory.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n')}

Student's message: "${studentMessage}"

Generate 3 response options that:
1. Match the specified tone, vocabulary, and strategy
2. Incorporate at least one contextual reference when relevant
3. Use culturally appropriate examples and references
4. Adapt to the student's learning style
5. Maintain conversation continuity from previous interactions
6. Are age-appropriate and engaging

Return as JSON array:
["response 1", "response 2", "response 3"]`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.85,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      const suggestions = Array.isArray(parsed) ? parsed : parsed.responses || [];

      return suggestions;
    } catch (error) {
      console.error('[CommunicationAgent] Error generating contextual suggestions:', error);
      return this.getFallbackResponses(tone);
    }
  }

  // ============================================================================
  // EXISTING HELPER METHODS
  // ============================================================================

  /**
   * Select appropriate tone based on student state
   */
  private selectTone(profile: EnhancedStudentProfile): string {
    const { motivationFactors, engagementPatterns } = profile;

    // Check engagement patterns for frustration or low engagement
    if (engagementPatterns && engagementPatterns.length > 0) {
      const recentPattern = engagementPatterns[engagementPatterns.length - 1];
      
      if (recentPattern.trigger.includes('frustration') && recentPattern.intensity < 0.3) {
        return 'supportive';
      }
      
      if (recentPattern.intensity < 0.4) {
        return 'energetic';
      }
    }

    // High intrinsic motivation → encouraging, collaborative
    if (motivationFactors.intrinsicMotivation > 0.7) {
      return 'encouraging';
    }

    // High competitive → challenging, playful
    if (motivationFactors.competitiveSpirit > 0.7) {
      return 'playful';
    }

    // Default: warm, balanced
    return 'warm';
  }

  /**
   * Select vocabulary level based on cognitive profile
   */
  private selectVocabularyLevel(cognitiveProfile: CognitiveProfile): string {
    const avgCognitive =
      (cognitiveProfile.processingSpeed +
        cognitiveProfile.workingMemoryCapacity +
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
    if (learningVelocity.conceptAcquisitionRate > 0.7 && motivationFactors.intrinsicMotivation > 0.6) {
      return 'discovery';
    }

    // Struggling + needs support → scaffolding
    if (learningVelocity.conceptAcquisitionRate < 0.3) {
      return 'scaffolding';
    }

    // Collaborative preference → social learning language
    if (motivationFactors.collaborativePreference > 0.7) {
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
