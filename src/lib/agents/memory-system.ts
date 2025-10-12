/**
 * Contextual Memory System - Remembers and builds on past conversations
 * Maintains conversation continuity and learning context across sessions
 */

export interface MemoryEntry {
  id: string;
  studentId: string;
  timestamp: number;
  type: 'conversation' | 'achievement' | 'struggle' | 'insight' | 'preference';
  content: any;
  importance: number; // 0-1, for memory prioritization
  emotionalValence: 'positive' | 'negative' | 'neutral';
  concepts: string[];
  context: Record<string, any>;
}

export interface ConversationContext {
  recentTopics: string[];
  currentFocus: string | null;
  learningGoals: string[];
  referencedConcepts: Map<string, number>; // concept -> mention count
  emotionalState: string;
  sessionTheme: string | null;
}

export class MemorySystem {
  private memories: Map<string, MemoryEntry[]> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_MEMORIES_PER_STUDENT = 1000;
  private readonly MEMORY_DECAY_RATE = 0.95; // Per day

  /**
   * Store a new memory
   */
  async storeMemory(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
    const id = `memory-${Date.now()}-${Math.random()}`;
    const memory: MemoryEntry = { ...entry, id };

    const studentMemories = this.memories.get(entry.studentId) || [];
    studentMemories.push(memory);

    // Prune old memories if needed
    if (studentMemories.length > this.MAX_MEMORIES_PER_STUDENT) {
      this.pruneMemories(entry.studentId);
    }

    this.memories.set(entry.studentId, studentMemories);

    return id;
  }

  /**
   * Retrieve relevant memories for current context
   */
  async retrieveRelevantMemories(
    studentId: string,
    context: {
      currentTopic?: string;
      recentMessages?: any[];
      timeRange?: { start: number; end: number };
    }
  ): Promise<MemoryEntry[]> {
    const allMemories = this.memories.get(studentId) || [];

    // Filter by time range
    let relevant = context.timeRange
      ? allMemories.filter(m =>
          m.timestamp >= context.timeRange!.start &&
          m.timestamp <= context.timeRange!.end
        )
      : allMemories;

    // Filter by topic relevance
    if (context.currentTopic) {
      relevant = relevant.filter(m =>
        m.concepts.includes(context.currentTopic!) ||
        this.isTopicRelated(m.content, context.currentTopic!)
      );
    }

    // Apply importance decay
    relevant = relevant.map(m => ({
      ...m,
      importance: this.calculateDecayedImportance(m)
    }));

    // Sort by importance and recency
    relevant.sort((a, b) => {
      const aScore = a.importance * 0.7 + (a.timestamp / Date.now()) * 0.3;
      const bScore = b.importance * 0.7 + (b.timestamp / Date.now()) * 0.3;
      return bScore - aScore;
    });

    return relevant.slice(0, 20); // Return top 20 most relevant memories
  }

  /**
   * Get conversation context for a student
   */
  getConversationContext(studentId: string): ConversationContext {
    if (!this.conversationContexts.has(studentId)) {
      this.conversationContexts.set(studentId, {
        recentTopics: [],
        currentFocus: null,
        learningGoals: [],
        referencedConcepts: new Map(),
        emotionalState: 'neutral',
        sessionTheme: null
      });
    }

    return this.conversationContexts.get(studentId)!;
  }

  /**
   * Update conversation context with new interaction
   */
  async updateContext(
    studentId: string,
    interaction: {
      message: string;
      topic?: string;
      concepts?: string[];
      emotion?: string;
    }
  ): Promise<void> {
    const context = this.getConversationContext(studentId);

    // Update current focus
    if (interaction.topic) {
      context.currentFocus = interaction.topic;

      // Add to recent topics (keep last 5)
      if (!context.recentTopics.includes(interaction.topic)) {
        context.recentTopics.unshift(interaction.topic);
        context.recentTopics = context.recentTopics.slice(0, 5);
      }
    }

    // Update concept references
    if (interaction.concepts) {
      for (const concept of interaction.concepts) {
        const count = context.referencedConcepts.get(concept) || 0;
        context.referencedConcepts.set(concept, count + 1);
      }
    }

    // Update emotional state
    if (interaction.emotion) {
      context.emotionalState = interaction.emotion;
    }

    // Detect session theme
    context.sessionTheme = this.detectSessionTheme(context);

    this.conversationContexts.set(studentId, context);
  }

  /**
   * Generate contextual response intro that references past learning
   */
  generateContextualIntro(
    studentId: string,
    currentTopic: string
  ): string | null {
    const memories = this.memories.get(studentId) || [];
    const context = this.getConversationContext(studentId);

    // Find relevant past learning
    const pastLearning = memories.filter(m =>
      m.type === 'achievement' &&
      (m.concepts.includes(currentTopic) || context.recentTopics.includes(currentTopic))
    );

    if (pastLearning.length > 0) {
      const recent = pastLearning[pastLearning.length - 1];
      return `I remember we worked on ${currentTopic} before! You did great with ${recent.content.detail}. Let's build on that! 🌟`;
    }

    // Reference recent struggles that were overcome
    const pastStruggles = memories.filter(m =>
      m.type === 'struggle' &&
      m.concepts.includes(currentTopic) &&
      this.wasStruggleOvercome(studentId, m)
    );

    if (pastStruggles.length > 0) {
      return `${currentTopic} was tricky last time, but you didn't give up and figured it out! That shows real growth! 💪`;
    }

    // Reference continuity from previous session
    if (context.recentTopics.includes(currentTopic)) {
      return `Welcome back! Let's continue where we left off with ${currentTopic}! 🚀`;
    }

    return null;
  }

  /**
   * Get learning insights from memory
   */
  async getLearningInsights(studentId: string): Promise<{
    strengths: string[];
    growthAreas: string[];
    patterns: string[];
    recommendations: string[];
  }> {
    const memories = this.memories.get(studentId) || [];

    const achievements = memories.filter(m => m.type === 'achievement');
    const struggles = memories.filter(m => m.type === 'struggle');
    const preferences = memories.filter(m => m.type === 'preference');

    // Identify strengths
    const strengths = this.identifyStrengths(achievements);

    // Identify growth areas
    const growthAreas = this.identifyGrowthAreas(struggles);

    // Detect learning patterns
    const patterns = this.detectLearningPatterns(memories);

    // Generate recommendations
    const recommendations = this.generateRecommendations(strengths, growthAreas, patterns);

    return { strengths, growthAreas, patterns, recommendations };
  }

  /**
   * Clear old memories (privacy/data management)
   */
  async clearOldMemories(studentId: string, olderThan: number): Promise<number> {
    const memories = this.memories.get(studentId) || [];
    const filtered = memories.filter(m => m.timestamp >= olderThan);
    const removed = memories.length - filtered.length;

    this.memories.set(studentId, filtered);

    return removed;
  }

  /**
   * Export student memories (for data portability)
   */
  async exportMemories(studentId: string): Promise<MemoryEntry[]> {
    return this.memories.get(studentId) || [];
  }

  /**
   * Import memories (for data restoration)
   */
  async importMemories(studentId: string, memories: MemoryEntry[]): Promise<void> {
    const existing = this.memories.get(studentId) || [];
    const combined = [...existing, ...memories];

    // Remove duplicates
    const uniqueMemories = Array.from(
      new Map(combined.map(m => [m.id, m])).values()
    );

    this.memories.set(studentId, uniqueMemories);
  }

  // Private helper methods

  private pruneMemories(studentId: string): void {
    const memories = this.memories.get(studentId) || [];

    // Calculate importance scores with decay
    const scored = memories.map(m => ({
      memory: m,
      score: this.calculateDecayedImportance(m)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Keep top memories
    const pruned = scored
      .slice(0, this.MAX_MEMORIES_PER_STUDENT * 0.8)
      .map(s => s.memory);

    this.memories.set(studentId, pruned);
  }

  private calculateDecayedImportance(memory: MemoryEntry): number {
    const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    const decay = Math.pow(this.MEMORY_DECAY_RATE, daysSince);
    return memory.importance * decay;
  }

  private isTopicRelated(content: any, topic: string): boolean {
    const contentStr = JSON.stringify(content).toLowerCase();
    return contentStr.includes(topic.toLowerCase());
  }

  private detectSessionTheme(context: ConversationContext): string | null {
    // Detect if there's a clear theme to this session
    const topicCounts = new Map<string, number>();

    for (const topic of context.recentTopics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }

    // Find most common topic
    let maxCount = 0;
    let theme: string | null = null;

    for (const [topic, count] of topicCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        theme = topic;
      }
    }

    return theme;
  }

  private wasStruggleOvercome(studentId: string, struggle: MemoryEntry): boolean {
    const laterMemories = (this.memories.get(studentId) || [])
      .filter(m => m.timestamp > struggle.timestamp);

    return laterMemories.some(m =>
      m.type === 'achievement' &&
      m.concepts.some(c => struggle.concepts.includes(c))
    );
  }

  private identifyStrengths(achievements: MemoryEntry[]): string[] {
    const conceptCounts = new Map<string, number>();

    for (const achievement of achievements) {
      for (const concept of achievement.concepts) {
        conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
      }
    }

    return Array.from(conceptCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([concept]) => concept)
      .slice(0, 5);
  }

  private identifyGrowthAreas(struggles: MemoryEntry[]): string[] {
    const recentStruggles = struggles
      .filter(m => Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000) // Last week
      .slice(-10);

    const conceptCounts = new Map<string, number>();

    for (const struggle of recentStruggles) {
      for (const concept of struggle.concepts) {
        conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
      }
    }

    return Array.from(conceptCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([concept]) => concept)
      .slice(0, 3);
  }

  private detectLearningPatterns(memories: MemoryEntry[]): string[] {
    const patterns: string[] = [];

    // Time of day preferences
    const hourCounts = new Map<number, number>();
    for (const memory of memories) {
      const hour = new Date(memory.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const peakHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (peakHour && peakHour[1] > memories.length * 0.3) {
      const timeOfDay = peakHour[0] < 12 ? 'morning' : peakHour[0] < 17 ? 'afternoon' : 'evening';
      patterns.push(`most_active_${timeOfDay}`);
    }

    // Learning velocity
    const recentAchievements = memories
      .filter(m => m.type === 'achievement' && Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000)
      .length;

    if (recentAchievements > 10) {
      patterns.push('fast_learner');
    } else if (recentAchievements > 5) {
      patterns.push('steady_progress');
    }

    // Preferred learning style
    const preferences = memories.filter(m => m.type === 'preference');
    if (preferences.length > 0) {
      const latest = preferences[preferences.length - 1];
      patterns.push(`prefers_${latest.content.style}`);
    }

    return patterns;
  }

  private generateRecommendations(
    strengths: string[],
    growthAreas: string[],
    patterns: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Leverage strengths
    if (strengths.length > 0) {
      recommendations.push(`Build on your strength in ${strengths[0]} to learn related topics`);
    }

    // Address growth areas
    if (growthAreas.length > 0) {
      recommendations.push(`Focus extra practice on ${growthAreas[0]}`);
    }

    // Time optimization
    if (patterns.some(p => p.includes('most_active'))) {
      const timeOfDay = patterns.find(p => p.includes('most_active'))?.split('_').pop();
      recommendations.push(`Schedule challenging topics during ${timeOfDay} when you're most engaged`);
    }

    return recommendations;
  }
}

// Export singleton instance
export const memorySystem = new MemorySystem();
