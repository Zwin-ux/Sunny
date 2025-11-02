// Game Agent - Specialized agent for managing educational games

import { BaseAgent } from './base-agent';
import { AgentMessage, AgentResponse, LearningState, EnhancedStudentProfile } from './types';
import { gameEngine } from '../games/game-engine';
import { gameGenerator } from '../games/game-generator';
import { GamePerformance, GameType, DifficultyLevel } from '@/types/game';

export class GameAgent extends BaseAgent {
  constructor() {
    super('game', 'Game Management Agent');
  }

  async processMessage(message: AgentMessage, context: LearningState): Promise<AgentResponse> {
    const { content, studentId } = message;
    
    // Analyze if a game would be beneficial
    const shouldStartGame = this.shouldRecommendGame(context);
    
    if (shouldStartGame) {
      const gameRecommendation = await this.recommendGame(context);
      
      return {
        agentId: this.id,
        agentType: this.type,
        timestamp: Date.now(),
        confidence: 0.85,
        priority: 'high',
        recommendations: [
          {
            type: 'activity',
            description: `Start ${gameRecommendation.gameType} game on ${gameRecommendation.topic}`,
            priority: 'high',
            confidence: 0.85,
            data: gameRecommendation
          }
        ],
        reasoning: `Student would benefit from interactive practice. ${gameRecommendation.reason}`,
        suggestedActions: ['start_game', 'track_performance', 'adapt_difficulty'],
        metadata: {
          gameType: gameRecommendation.gameType,
          difficulty: gameRecommendation.difficulty,
          topic: gameRecommendation.topic
        }
      };
    }
    
    // Check if we need to analyze recent game performance
    const recentPerformance = this.getRecentGamePerformance(studentId);
    if (recentPerformance) {
      return this.analyzeGamePerformance(recentPerformance, context);
    }
    
    return {
      agentId: this.id,
      agentType: this.type,
      timestamp: Date.now(),
      confidence: 0.3,
      priority: 'low',
      recommendations: [],
      reasoning: 'No immediate game recommendations',
      suggestedActions: [],
      metadata: {}
    };
  }

  /**
   * Determine if a game would be beneficial right now
   */
  private shouldRecommendGame(context: LearningState): boolean {
    const { engagementMetrics, contextHistory } = context;
    
    // Recommend game if:
    // 1. Engagement is dropping
    if (engagementMetrics.currentLevel < 0.6) return true;
    
    // 2. Student has been passive for a while (reading/listening only)
    const recentInteractions = contextHistory.slice(-5);
    const hasActiveInteraction = recentInteractions.some(
      entry => entry.type === 'activity' || entry.type === 'quiz'
    );
    if (!hasActiveInteraction) return true;
    
    // 3. Frustration is building (game can break the tension)
    if (engagementMetrics.frustrationLevel > 0.6) return true;
    
    // 4. Student is doing well and ready for a challenge
    if (engagementMetrics.motivationLevel > 0.7 && engagementMetrics.currentLevel > 0.7) {
      return true;
    }
    
    return false;
  }

  /**
   * Recommend optimal game type and configuration
   */
  private async recommendGame(context: LearningState): Promise<{
    gameType: GameType;
    difficulty: DifficultyLevel;
    topic: string;
    reason: string;
  }> {
    const { currentObjectives, knowledgeMap, engagementMetrics } = context;
    
    // Determine topic from current objectives
    const topic = currentObjectives[0]?.targetConcept || 'general learning';
    
    // Determine difficulty based on current performance
    const difficulty = this.determineDifficulty(context);
    
    // Select game type based on engagement and learning style
    const gameType = this.selectGameType(context);
    
    // Generate reason
    let reason = '';
    if (engagementMetrics.frustrationLevel > 0.6) {
      reason = 'A fun game will help reduce frustration and rebuild confidence.';
    } else if (engagementMetrics.currentLevel < 0.6) {
      reason = 'An interactive game will boost engagement and make learning more fun.';
    } else if (engagementMetrics.motivationLevel > 0.7) {
      reason = 'You\'re doing great! Time for a fun challenge to test your skills.';
    } else {
      reason = 'Hands-on practice will help reinforce what you\'ve learned.';
    }
    
    return { gameType, difficulty, topic, reason };
  }

  /**
   * Determine appropriate difficulty level
   */
  private determineDifficulty(context: LearningState): DifficultyLevel {
    const { knowledgeMap, currentDifficulty } = context;
    
    // Calculate average mastery across concepts
    const masteryLevels = Array.from(knowledgeMap.masteryLevels.values());
    const avgMastery = masteryLevels.length > 0
      ? masteryLevels.reduce((sum, level) => sum + this.masteryToNumber(level), 0) / masteryLevels.length
      : 0.5;
    
    // Map mastery to difficulty
    if (avgMastery >= 0.8) return 'hard';
    if (avgMastery >= 0.6) return 'medium';
    return 'easy';
  }

  /**
   * Convert mastery level to number
   */
  private masteryToNumber(mastery: any): number {
    if (typeof mastery === 'number') return mastery;
    
    const levels: Record<string, number> = {
      'novice': 0.2,
      'beginner': 0.4,
      'intermediate': 0.6,
      'advanced': 0.8,
      'expert': 1.0
    };
    
    return levels[mastery as string] || 0.5;
  }

  /**
   * Select optimal game type
   */
  private selectGameType(context: LearningState): GameType {
    const { engagementMetrics, currentObjectives } = context;
    
    // If frustrated, use creative or memory games (less pressure)
    if (engagementMetrics.frustrationLevel > 0.6) {
      return Math.random() > 0.5 ? 'creative-challenge' : 'memory-match';
    }
    
    // Match game type to preferred activity types
    const preferredTypes = engagementMetrics.preferredActivityTypes || [];
    
    if (preferredTypes.includes('visual')) return 'pattern-recognition';
    if (preferredTypes.includes('logical')) return 'math-challenge';
    if (preferredTypes.includes('creative')) return 'creative-challenge';
    if (preferredTypes.includes('verbal')) return 'word-builder';
    
    // Check topic for hints
    const topic = currentObjectives[0]?.targetConcept?.toLowerCase() || '';
    if (topic.includes('math') || topic.includes('number')) return 'math-challenge';
    if (topic.includes('word') || topic.includes('language')) return 'word-builder';
    if (topic.includes('science')) return 'science-experiment';
    
    // Default to pattern recognition (good for general learning)
    return 'pattern-recognition';
  }

  /**
   * Get recent game performance for a student
   */
  private getRecentGamePerformance(studentId: string): GamePerformance | null {
    // This would integrate with gameEngine to get recent performance
    // For now, return null (would be implemented with proper session management)
    return null;
  }

  /**
   * Analyze game performance and provide recommendations
   */
  private analyzeGamePerformance(
    performance: GamePerformance,
    context: LearningState
  ): AgentResponse {
    const { accuracy, frustrationLevel, teachingStrategy, knowledgeGaps } = performance;
    
    const recommendations = [];
    const actions = [];
    
    // High performance - advance
    if (accuracy >= 0.85 && teachingStrategy === 'advance') {
      recommendations.push({
        type: 'difficulty',
        description: 'Increase difficulty - student is excelling',
        priority: 'high',
        confidence: 0.9,
        data: { newDifficulty: performance.suggestedDifficulty }
      });
      actions.push('increase_difficulty', 'introduce_advanced_concepts');
    }
    
    // Struggling - provide support
    if (accuracy < 0.5 || teachingStrategy === 'remediate') {
      recommendations.push({
        type: 'intervention',
        description: 'Provide additional support and scaffolding',
        priority: 'high',
        confidence: 0.85,
        data: { knowledgeGaps }
      });
      actions.push('decrease_difficulty', 'provide_scaffolding', 'review_concepts');
    }
    
    // High frustration - change approach
    if (frustrationLevel > 0.6) {
      recommendations.push({
        type: 'engagement',
        description: 'Switch to different activity type to reduce frustration',
        priority: 'high',
        confidence: 0.8,
        data: { suggestedGameType: performance.suggestedNextGame }
      });
      actions.push('change_activity_type', 'provide_encouragement');
    }
    
    // Knowledge gaps identified
    if (knowledgeGaps.length > 0) {
      recommendations.push({
        type: 'content',
        description: `Review concepts: ${knowledgeGaps.join(', ')}`,
        priority: 'medium',
        confidence: 0.75,
        data: { concepts: knowledgeGaps }
      });
      actions.push('generate_review_content');
    }
    
    return {
      agentId: this.id,
      agentType: this.type,
      timestamp: Date.now(),
      confidence: 0.85,
      priority: 'high',
      recommendations,
      reasoning: `Game performance analysis: ${accuracy.toFixed(2)} accuracy, ${teachingStrategy} strategy recommended`,
      suggestedActions: actions,
      metadata: {
        performance,
        teachingStrategy
      }
    };
  }

  async initialize(): Promise<void> {
    console.log(`[${this.type}] Game Agent initialized`);
  }

  async shutdown(): Promise<void> {
    console.log(`[${this.type}] Game Agent shutting down`);
  }
}
