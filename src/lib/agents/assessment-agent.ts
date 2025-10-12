/**
 * Assessment Agent - Autonomous learning assessment and gap detection
 * This agent continuously analyzes student performance to identify knowledge gaps
 * and adjust difficulty levels automatically
 */

import { BaseAgent } from './base-agent';
import { AgentEvent, LearningState, KnowledgeGap } from './types';
import { DifficultyLevel } from '@/types/chat';

interface AssessmentMetrics {
  responseTime: number;
  accuracy: number;
  confidence: number;
  engagementLevel: number;
  strugglingIndicators: string[];
}

interface ConceptMastery {
  concept: string;
  masteryLevel: number; // 0-1
  lastAssessed: number;
  attempts: number;
  successRate: number;
}

export class AssessmentAgent extends BaseAgent {
  private readonly MASTERY_THRESHOLD = 0.8;
  private readonly STRUGGLE_THRESHOLD = 0.4;
  private readonly MIN_ATTEMPTS_FOR_ASSESSMENT = 3;

  constructor() {
    super('assessment');
  }

  async initialize(): Promise<void> {
    console.log('Assessment Agent initialized');
    this.status = 'active';
  }

  async processMessage(message: any): Promise<any> {
    const { studentId, interaction, learningState } = message;

    // Analyze the interaction
    const assessment = await this.assessInteraction(interaction, learningState);

    // Detect knowledge gaps
    const gaps = this.detectKnowledgeGaps(learningState, assessment);

    // Determine if difficulty adjustment is needed
    const difficultyAdjustment = this.determineDifficultyAdjustment(assessment, learningState);

    // Generate recommendations
    const recommendations = this.generateRecommendations(assessment, gaps, difficultyAdjustment);

    return {
      messageId: message.id,
      success: true,
      data: {
        assessment,
        knowledgeGaps: gaps,
        difficultyAdjustment,
        recommendations
      },
      recommendations
    };
  }

  async shutdown(): Promise<void> {
    console.log('Assessment Agent shutting down');
    this.status = 'idle';
  }

  /**
   * Assess a single learning interaction
   */
  private async assessInteraction(
    interaction: any,
    learningState: LearningState
  ): Promise<AssessmentMetrics> {
    const metrics: AssessmentMetrics = {
      responseTime: interaction.responseTime || 0,
      accuracy: this.calculateAccuracy(interaction),
      confidence: this.estimateConfidence(interaction),
      engagementLevel: this.measureEngagement(interaction, learningState),
      strugglingIndicators: this.identifyStruggleIndicators(interaction)
    };

    return metrics;
  }

  /**
   * Calculate accuracy from interaction
   */
  private calculateAccuracy(interaction: any): number {
    if (interaction.type === 'quiz' || interaction.type === 'challenge') {
      return interaction.correct ? 1.0 : 0.0;
    }

    // For open-ended responses, use heuristics
    if (interaction.type === 'response') {
      // Check for uncertainty markers
      const uncertaintyMarkers = ['maybe', 'i think', 'not sure', 'guess'];
      const hasUncertainty = uncertaintyMarkers.some(marker =>
        interaction.content?.toLowerCase().includes(marker)
      );

      return hasUncertainty ? 0.5 : 0.7;
    }

    return 0.5; // Default neutral
  }

  /**
   * Estimate student confidence from interaction patterns
   */
  private estimateConfidence(interaction: any): number {
    let confidence = 0.5;

    // Quick responses with correct answers indicate high confidence
    if (interaction.responseTime < 5000 && interaction.correct) {
      confidence = 0.9;
    }

    // Long response times might indicate uncertainty
    if (interaction.responseTime > 30000) {
      confidence = 0.3;
    }

    // Multiple attempts on same question
    if (interaction.attempts > 1) {
      confidence = Math.max(0.2, confidence - (interaction.attempts * 0.1));
    }

    return confidence;
  }

  /**
   * Measure engagement level
   */
  private measureEngagement(interaction: any, learningState: LearningState): number {
    const engagement = learningState.engagementMetrics;

    // Recent activity increases engagement score
    const timeSinceLastActivity = Date.now() - (learningState.lastActivityTimestamp || Date.now());
    const activityBonus = Math.max(0, 1 - (timeSinceLastActivity / (1000 * 60 * 60))); // Decay over 1 hour

    // Response length indicates engagement
    const responseLength = interaction.content?.length || 0;
    const lengthBonus = Math.min(1, responseLength / 100);

    // Combine metrics
    return Math.min(1, (
      engagement.interactionRate * 0.3 +
      engagement.responseQuality * 0.3 +
      activityBonus * 0.2 +
      lengthBonus * 0.2
    ));
  }

  /**
   * Identify indicators that student is struggling
   */
  private identifyStruggleIndicators(interaction: any): string[] {
    const indicators: string[] = [];

    // Long response times
    if (interaction.responseTime > 45000) {
      indicators.push('slow_response');
    }

    // Multiple incorrect attempts
    if (interaction.attempts > 2) {
      indicators.push('multiple_attempts');
    }

    // Uncertainty language
    const uncertaintyMarkers = ['i dont know', 'confused', 'help', 'dont understand'];
    if (uncertaintyMarkers.some(marker => interaction.content?.toLowerCase().includes(marker))) {
      indicators.push('expressed_confusion');
    }

    // Short, incomplete answers
    if (interaction.content?.length < 10 && interaction.type === 'response') {
      indicators.push('incomplete_response');
    }

    // Declining accuracy over time
    if (interaction.recentAccuracy && interaction.recentAccuracy < 0.4) {
      indicators.push('declining_performance');
    }

    return indicators;
  }

  /**
   * Detect knowledge gaps from learning state and assessment
   */
  private detectKnowledgeGaps(
    learningState: LearningState,
    assessment: AssessmentMetrics
  ): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Analyze concept mastery
    const conceptMastery = this.analyzeConceptMastery(learningState);

    for (const [concept, mastery] of Object.entries(conceptMastery)) {
      if (mastery.masteryLevel < this.STRUGGLE_THRESHOLD &&
          mastery.attempts >= this.MIN_ATTEMPTS_FOR_ASSESSMENT) {

        gaps.push({
          concept,
          severity: this.calculateGapSeverity(mastery.masteryLevel),
          detectedAt: Date.now(),
          relatedConcepts: this.findRelatedConcepts(concept, learningState),
          suggestedActions: this.suggestRemediation(concept, mastery)
        });
      }
    }

    // Check for prerequisite gaps
    const prerequisiteGaps = this.detectPrerequisiteGaps(learningState);
    gaps.push(...prerequisiteGaps);

    return gaps;
  }

  /**
   * Analyze mastery level for each concept
   */
  private analyzeConceptMastery(learningState: LearningState): Record<string, ConceptMastery> {
    const mastery: Record<string, ConceptMastery> = {};

    // Analyze knowledge map
    for (const [concept, knowledge] of Object.entries(learningState.knowledgeMap.concepts)) {
      const attempts = knowledge.interactions?.length || 0;
      const successRate = this.calculateSuccessRate(knowledge.interactions || []);

      mastery[concept] = {
        concept,
        masteryLevel: knowledge.masteryLevel,
        lastAssessed: knowledge.lastReviewed || Date.now(),
        attempts,
        successRate
      };
    }

    return mastery;
  }

  /**
   * Calculate success rate from interactions
   */
  private calculateSuccessRate(interactions: any[]): number {
    if (interactions.length === 0) return 0;

    const successful = interactions.filter(i => i.successful).length;
    return successful / interactions.length;
  }

  /**
   * Calculate gap severity (0-1, where 1 is most severe)
   */
  private calculateGapSeverity(masteryLevel: number): number {
    return 1 - masteryLevel;
  }

  /**
   * Find concepts related to the gap
   */
  private findRelatedConcepts(concept: string, learningState: LearningState): string[] {
    // Simple implementation - would use semantic similarity in production
    const related: string[] = [];

    for (const [otherConcept, knowledge] of Object.entries(learningState.knowledgeMap.concepts)) {
      if (otherConcept !== concept && knowledge.masteryLevel < this.MASTERY_THRESHOLD) {
        related.push(otherConcept);
      }
    }

    return related.slice(0, 3); // Return top 3 related concepts
  }

  /**
   * Suggest remediation actions for a gap
   */
  private suggestRemediation(concept: string, mastery: ConceptMastery): string[] {
    const actions: string[] = [];

    if (mastery.masteryLevel < 0.3) {
      actions.push('review_fundamentals');
      actions.push('use_visual_aids');
      actions.push('provide_examples');
    } else if (mastery.masteryLevel < 0.6) {
      actions.push('additional_practice');
      actions.push('alternative_explanation');
    } else {
      actions.push('targeted_practice');
    }

    return actions;
  }

  /**
   * Detect gaps in prerequisite knowledge
   */
  private detectPrerequisiteGaps(learningState: LearningState): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Check if student is struggling with current topic but hasn't mastered prerequisites
    for (const gap of learningState.knowledgeMap.knowledgeGaps) {
      if (gap.severity > 0.7) {
        gaps.push({
          concept: `prerequisite_for_${gap.concept}`,
          severity: gap.severity * 0.8,
          detectedAt: Date.now(),
          relatedConcepts: [gap.concept],
          suggestedActions: ['review_prerequisites', 'scaffolding']
        });
      }
    }

    return gaps;
  }

  /**
   * Determine if difficulty adjustment is needed
   */
  private determineDifficultyAdjustment(
    assessment: AssessmentMetrics,
    learningState: LearningState
  ): { recommended: boolean; newDifficulty?: DifficultyLevel; reason: string } {
    const currentDifficulty = learningState.currentDifficulty || 'medium';

    // Check if student is consistently excelling
    if (assessment.accuracy > 0.9 &&
        assessment.confidence > 0.8 &&
        assessment.strugglingIndicators.length === 0) {

      const nextDifficulty = this.getNextDifficulty(currentDifficulty, 'increase');
      if (nextDifficulty !== currentDifficulty) {
        return {
          recommended: true,
          newDifficulty: nextDifficulty,
          reason: 'Student showing mastery, ready for more challenge'
        };
      }
    }

    // Check if student is struggling
    if (assessment.accuracy < 0.4 || assessment.strugglingIndicators.length >= 2) {
      const previousDifficulty = this.getNextDifficulty(currentDifficulty, 'decrease');
      if (previousDifficulty !== currentDifficulty) {
        return {
          recommended: true,
          newDifficulty: previousDifficulty,
          reason: 'Student struggling, adjusting to appropriate level'
        };
      }
    }

    return {
      recommended: false,
      reason: 'Current difficulty level is appropriate'
    };
  }

  /**
   * Get next difficulty level
   */
  private getNextDifficulty(
    current: string,
    direction: 'increase' | 'decrease'
  ): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(current as DifficultyLevel);

    if (direction === 'increase' && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    } else if (direction === 'decrease' && currentIndex > 0) {
      return levels[currentIndex - 1];
    }

    return current as DifficultyLevel;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    assessment: AssessmentMetrics,
    gaps: KnowledgeGap[],
    difficultyAdjustment: any
  ): string[] {
    const recommendations: string[] = [];

    // Difficulty recommendations
    if (difficultyAdjustment.recommended) {
      recommendations.push(`adjust_difficulty:${difficultyAdjustment.newDifficulty}`);
    }

    // Gap remediation
    for (const gap of gaps) {
      if (gap.severity > 0.7) {
        recommendations.push(`address_gap:${gap.concept}`);
      }
    }

    // Engagement recommendations
    if (assessment.engagementLevel < 0.4) {
      recommendations.push('increase_engagement');
      recommendations.push('switch_activity_type');
    }

    // Confidence building
    if (assessment.confidence < 0.5) {
      recommendations.push('provide_encouragement');
      recommendations.push('offer_easier_problems');
    }

    // Struggle interventions
    if (assessment.strugglingIndicators.length > 0) {
      recommendations.push('provide_hints');
      recommendations.push('break_down_concept');
    }

    return recommendations;
  }
}

// Export singleton instance
export const assessmentAgent = new AssessmentAgent();
