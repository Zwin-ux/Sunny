/**
 * Assessment Agent
 * Autonomous evaluation system that continuously assesses student learning
 * Implements Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { BaseAgent } from './base-agent';
import { 
  AgentMessage, 
  AgentResponse, 
  LearningState,
  EnhancedStudentProfile,
  MasteryLevel,
  AssessmentEvidence,
  Gap,
  Concept,
  ConceptMap,
  Recommendation
} from './types';
import { 
  learningAnalyticsEngine, 
  accuracyTracker,
  ConversationAnalysis,
  EmotionalState
} from './analytics-engine';
import { conceptMapManager } from './student-profile';
import { knowledgeGapSystem } from './knowledge-gap-system';

/**
 * Continuous Assessment Result
 */
export interface ContinuousAssessmentResult {
  studentId: string;
  timestamp: number;
  comprehensionLevel: number;
  masteryUpdates: Map<string, MasteryLevel>;
  knowledgeGaps: Gap[];
  emotionalState: EmotionalState;
  progressionRecommendation: 'advance' | 'maintain' | 'review' | 'remediate';
  confidence: number;
  evidence: AssessmentEvidence[];
}

/**
 * Knowledge Gap Detection Result
 */
export interface KnowledgeGapAnalysis {
  gaps: Gap[];
  missingPrerequisites: string[];
  weakConcepts: string[];
  recommendedReview: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Mastery Determination Result
 */
export interface MasteryDetermination {
  conceptId: string;
  previousLevel: MasteryLevel['level'];
  newLevel: MasteryLevel['level'];
  confidence: number;
  evidence: AssessmentEvidence[];
  readyForAdvancement: boolean;
  recommendedNextSteps: string[];
}

/**
 * Assessment Agent
 * Continuously evaluates student understanding and provides autonomous assessments
 */
export class AssessmentAgent extends BaseAgent {
  private assessmentHistory: Map<string, ContinuousAssessmentResult[]> = new Map();
  private conversationBuffer: Map<string, Array<{ role: string; content: string; timestamp: number }>> = new Map();
  private responseTimeBuffer: Map<string, number[]> = new Map();
  
  constructor() {
    super('assessment');
  }

  async initialize(): Promise<void> {
    console.log('Initializing Assessment Agent...');
    this.setupEventHandlers();
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Assessment Agent...');
    this.assessmentHistory.clear();
    this.conversationBuffer.clear();
    this.responseTimeBuffer.clear();
  }

  protected setupEventHandlers(): void {
    // Listen for conversation events
    this.registerEventHandler('conversation:message', {
      eventType: 'conversation:message',
      handler: async (event) => {
        await this.handleConversationMessage(event.data);
      },
      priority: 'high'
    });

    // Listen for response events
    this.registerEventHandler('student:response', {
      eventType: 'student:response',
      handler: async (event) => {
        await this.handleStudentResponse(event.data);
      },
      priority: 'high'
    });

    // Listen for activity completion events
    this.registerEventHandler('activity:completed', {
      eventType: 'activity:completed',
      handler: async (event) => {
        await this.handleActivityCompletion(event.data);
      },
      priority: 'medium'
    });
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    try {
      switch (message.payload.action) {
        case 'assess_conversation':
          return await this.assessConversation(message);
        
        case 'detect_knowledge_gaps':
          return await this.detectKnowledgeGaps(message);
        
        case 'determine_mastery':
          return await this.determineMastery(message);
        
        case 'continuous_assessment':
          return await this.performContinuousAssessment(message);
        
        case 'get_assessment_history':
          return await this.getAssessmentHistory(message);
        
        case 'analyze_dependencies':
          return await this.analyzeDependencies(message);
        
        case 'assess_skill_domains':
          return await this.assessSkillDomains(message);
        
        case 'track_learning_velocity':
          return await this.trackLearningVelocity(message);
        
        case 'generate_gap_report':
          return await this.generateGapReport(message);
        
        default:
          return {
            messageId: message.id,
            success: false,
            error: `Unknown action: ${message.payload.action}`
          };
      }
    } catch (error) {
      return {
        messageId: message.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform continuous assessment of student learning
   * Requirement 1.1: Continuously analyze conversation patterns, response times, and answer accuracy
   */
  private async performContinuousAssessment(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, profile } = message.payload;

    // Get conversation history
    const conversations = this.conversationBuffer.get(studentId) || [];
    
    // Analyze conversation for comprehension
    const conversationAnalysis = learningAnalyticsEngine.analyzeConversation(
      studentId,
      conversations
    );

    // Analyze response times
    const responseTimes = this.responseTimeBuffer.get(studentId) || [];
    const responseTimeAnalysis = learningAnalyticsEngine.analyzeResponseTime(responseTimes);

    // Calculate accuracy from recent interactions
    const accuracyRate = accuracyTracker.getAccuracyRate(studentId, 3600000); // Last hour

    // Determine comprehension level (weighted combination)
    const comprehensionLevel = this.calculateComprehensionLevel(
      conversationAnalysis.comprehensionLevel,
      accuracyRate,
      responseTimeAnalysis.pattern
    );

    // Update mastery levels for active concepts
    const masteryUpdates = await this.updateMasteryLevels(
      studentId,
      learningState,
      conversationAnalysis,
      accuracyRate
    );

    // Detect knowledge gaps
    const knowledgeGaps = await this.identifyKnowledgeGaps(
      learningState.knowledgeMap,
      masteryUpdates
    );

    // Determine progression recommendation
    const progressionRecommendation = this.determineProgression(
      comprehensionLevel,
      masteryUpdates,
      knowledgeGaps,
      conversationAnalysis.emotionalState
    );

    // Create evidence
    const evidence: AssessmentEvidence[] = [
      {
        type: 'response',
        value: { accuracyRate, responsePattern: responseTimeAnalysis.pattern },
        timestamp: Date.now(),
        weight: 0.4
      },
      {
        type: 'pattern',
        value: conversationAnalysis,
        timestamp: Date.now(),
        weight: 0.3
      },
      {
        type: 'time',
        value: responseTimeAnalysis,
        timestamp: Date.now(),
        weight: 0.3
      }
    ];

    const result: ContinuousAssessmentResult = {
      studentId,
      timestamp: Date.now(),
      comprehensionLevel,
      masteryUpdates,
      knowledgeGaps,
      emotionalState: conversationAnalysis.emotionalState,
      progressionRecommendation,
      confidence: this.calculateConfidence(conversations.length, responseTimes.length),
      evidence
    };

    // Store in history
    const history = this.assessmentHistory.get(studentId) || [];
    history.push(result);
    this.assessmentHistory.set(studentId, history.slice(-50)); // Keep last 50

    // Generate recommendations
    const recommendations = this.generateAssessmentRecommendations(result);

    // Emit assessment event
    this.emitEvent('assessment:completed', result, 'high');

    return {
      messageId: message.id,
      success: true,
      data: result,
      recommendations
    };
  }

  /**
   * Assess conversation for comprehension and knowledge gaps
   * Requirement 1.2: Automatically identify specific concepts that need reinforcement
   */
  private async assessConversation(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, messages, context } = message.payload;

    // Store messages in buffer
    const buffer = this.conversationBuffer.get(studentId) || [];
    buffer.push(...messages);
    this.conversationBuffer.set(studentId, buffer.slice(-100)); // Keep last 100

    // Analyze conversation
    const analysis = learningAnalyticsEngine.analyzeConversation(
      studentId,
      messages,
      context
    );

    // Identify concepts that need reinforcement
    const conceptsNeedingReinforcement = this.identifyConceptsNeedingReinforcement(
      analysis
    );

    return {
      messageId: message.id,
      success: true,
      data: {
        analysis,
        conceptsNeedingReinforcement
      }
    };
  }

  /**
   * Detect knowledge gaps and missing prerequisites
   * Requirement 1.2, 1.5: Identify knowledge gaps and missing foundational knowledge
   */
  private async detectKnowledgeGaps(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, conceptMap, currentConcepts } = message.payload;

    const gapAnalysis = await this.analyzeKnowledgeGaps(
      conceptMap,
      currentConcepts
    );

    // Emit knowledge gap event
    if (gapAnalysis.severity === 'high' || gapAnalysis.severity === 'critical') {
      this.emitEvent('knowledge_gaps:critical', {
        studentId,
        gaps: gapAnalysis.gaps
      }, 'urgent');
    }

    return {
      messageId: message.id,
      success: true,
      data: gapAnalysis
    };
  }

  /**
   * Determine mastery level for concepts
   * Requirement 1.3, 1.4: Demonstrate mastery and advance, or identify confusion
   */
  private async determineMastery(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, conceptId, conceptMap, recentEvidence } = message.payload;

    const determination = await this.determineMasteryLevel(
      conceptId,
      conceptMap,
      recentEvidence
    );

    // Emit mastery event if achieved
    if (determination.newLevel === 'mastered' && determination.previousLevel !== 'mastered') {
      this.emitEvent('concept:mastered', {
        studentId,
        conceptId,
        determination
      }, 'high');
    }

    return {
      messageId: message.id,
      success: true,
      data: determination
    };
  }

  /**
   * Get assessment history for a student
   */
  private async getAssessmentHistory(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, limit } = message.payload;
    
    const history = this.assessmentHistory.get(studentId) || [];
    const limitedHistory = limit ? history.slice(-limit) : history;

    return {
      messageId: message.id,
      success: true,
      data: { history: limitedHistory }
    };
  }

  /**
   * Analyze concept dependencies and build dependency graph
   * Requirement 1.2: Concept dependency mapping and prerequisite detection
   */
  private async analyzeDependencies(message: AgentMessage): Promise<AgentResponse> {
    const { conceptMap, targetConcepts } = message.payload;

    // Build dependency graph
    const dependencyGraph = knowledgeGapSystem.buildDependencyGraph(conceptMap);

    // Detect missing prerequisites
    const missingPrerequisites = knowledgeGapSystem.detectMissingPrerequisites(
      conceptMap,
      targetConcepts || []
    );

    // Emit event if critical prerequisites are missing
    if (missingPrerequisites.length > 3) {
      this.emitEvent('prerequisites:missing', {
        count: missingPrerequisites.length,
        concepts: missingPrerequisites
      }, 'high');
    }

    return {
      messageId: message.id,
      success: true,
      data: {
        dependencyGraph,
        missingPrerequisites
      }
    };
  }

  /**
   * Assess skill levels across multiple domains
   * Requirement 1.5: Skill level assessment across multiple domains
   */
  private async assessSkillDomains(message: AgentMessage): Promise<AgentResponse> {
    const { conceptMap, domains } = message.payload;

    const skillAssessments = knowledgeGapSystem.assessSkillDomains(
      conceptMap,
      domains
    );

    // Identify domains needing attention
    const weakDomains = skillAssessments.filter(
      assessment => assessment.overallLevel < 0.5
    );

    if (weakDomains.length > 0) {
      this.emitEvent('skill_domains:weak', {
        domains: weakDomains.map(d => d.domain),
        assessments: weakDomains
      }, 'medium');
    }

    return {
      messageId: message.id,
      success: true,
      data: { skillAssessments }
    };
  }

  /**
   * Track learning velocity and recommend adaptations
   * Requirement 2.5: Learning velocity tracking and adaptation
   */
  private async trackLearningVelocity(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, profile, conceptMap, timeWindow } = message.payload;

    const velocityMetrics = knowledgeGapSystem.trackLearningVelocity(
      studentId,
      profile,
      conceptMap,
      timeWindow
    );

    // Generate recommendations based on velocity
    const recommendations: Recommendation[] = [];

    if (velocityMetrics.adaptationNeeded === 'accelerate') {
      recommendations.push(this.createRecommendation(
        'strategy',
        'Accelerate learning pace',
        {
          action: 'increase_pace',
          reason: 'Student progressing faster than expected',
          metrics: velocityMetrics
        },
        0.8,
        'medium',
        `Mastery rate of ${velocityMetrics.masteryRate.toFixed(2)} concepts/hour indicates readiness for acceleration`
      ));
    } else if (velocityMetrics.adaptationNeeded === 'decelerate') {
      recommendations.push(this.createRecommendation(
        'strategy',
        'Slow down and consolidate learning',
        {
          action: 'decrease_pace',
          reason: 'Student needs more time to master concepts',
          metrics: velocityMetrics
        },
        0.9,
        'high',
        `Low mastery rate and retention indicate need for slower pace`
      ));
    }

    // Emit velocity event
    this.emitEvent('learning_velocity:tracked', {
      studentId,
      metrics: velocityMetrics,
      adaptationNeeded: velocityMetrics.adaptationNeeded
    }, 'medium');

    return {
      messageId: message.id,
      success: true,
      data: { velocityMetrics },
      recommendations
    };
  }

  /**
   * Generate comprehensive knowledge gap report
   * Requirement 1.2, 1.5, 2.5: Complete gap analysis with all components
   */
  private async generateGapReport(message: AgentMessage): Promise<AgentResponse> {
    const { conceptMap, learningState, profile } = message.payload;

    const report = knowledgeGapSystem.generateKnowledgeGapReport(
      conceptMap,
      learningState,
      profile
    );

    // Generate recommendations based on report
    const recommendations: Recommendation[] = [];

    // Foundational knowledge recommendations
    if (report.foundationalAnalysis.severity === 'critical' || 
        report.foundationalAnalysis.severity === 'high') {
      recommendations.push(this.createRecommendation(
        'intervention',
        'Address critical foundational gaps',
        {
          action: 'remediate_foundations',
          gaps: report.foundationalAnalysis.missingFoundations,
          sequence: report.foundationalAnalysis.recommendedSequence
        },
        0.95,
        'urgent',
        `${report.foundationalAnalysis.missingFoundations.length} foundational concepts missing`
      ));
    }

    // Skill domain recommendations
    for (const assessment of report.skillAssessments) {
      if (assessment.overallLevel < 0.4) {
        recommendations.push(this.createRecommendation(
          'content',
          `Focus on ${assessment.domain} domain`,
          {
            action: 'focus_domain',
            domain: assessment.domain,
            recommendedFocus: assessment.recommendedFocus
          },
          0.7,
          'high',
          `${assessment.domain} domain shows low mastery (${(assessment.overallLevel * 100).toFixed(0)}%)`
        ));
      }
    }

    // Velocity-based recommendations
    if (report.velocityMetrics.adaptationNeeded !== 'maintain') {
      recommendations.push(this.createRecommendation(
        'strategy',
        `${report.velocityMetrics.adaptationNeeded === 'accelerate' ? 'Increase' : 'Decrease'} learning pace`,
        {
          action: 'adjust_pace',
          direction: report.velocityMetrics.adaptationNeeded,
          metrics: report.velocityMetrics
        },
        0.75,
        'medium',
        `Learning velocity analysis suggests pace adjustment`
      ));
    }

    // Emit comprehensive gap report event
    this.emitEvent('knowledge_gaps:report_generated', {
      studentId: learningState.studentId,
      gapCount: report.prioritizedGaps.length,
      severity: report.foundationalAnalysis.severity,
      actionPlan: report.actionPlan
    }, 'high');

    return {
      messageId: message.id,
      success: true,
      data: report,
      recommendations
    };
  }

  // Private helper methods

  /**
   * Handle conversation message event
   */
  private async handleConversationMessage(data: any): Promise<void> {
    const { studentId, role, content, timestamp, responseTime } = data;

    // Add to conversation buffer
    const buffer = this.conversationBuffer.get(studentId) || [];
    buffer.push({ role, content, timestamp });
    this.conversationBuffer.set(studentId, buffer.slice(-100));

    // Track response time if it's a student message
    if (role === 'user' && responseTime) {
      const timeBuffer = this.responseTimeBuffer.get(studentId) || [];
      timeBuffer.push(responseTime);
      this.responseTimeBuffer.set(studentId, timeBuffer.slice(-50));
    }
  }

  /**
   * Handle student response event
   */
  private async handleStudentResponse(data: any): Promise<void> {
    const { studentId, correct, topic, difficulty } = data;

    // Track accuracy
    accuracyTracker.recordResponse(studentId, correct, topic, difficulty);
  }

  /**
   * Handle activity completion event
   */
  private async handleActivityCompletion(data: any): Promise<void> {
    const { studentId, activityId, performance, concepts } = data;

    // Update mastery based on activity performance
    // This would trigger a continuous assessment
    this.emitEvent('trigger:assessment', {
      studentId,
      reason: 'activity_completed',
      context: { activityId, performance, concepts }
    }, 'medium');
  }

  /**
   * Calculate overall comprehension level
   */
  private calculateComprehensionLevel(
    conversationComprehension: number,
    accuracyRate: number,
    responsePattern: string
  ): number {
    // Weight different factors
    let comprehension = conversationComprehension * 0.4 + accuracyRate * 0.5;

    // Adjust based on response pattern
    if (responsePattern === 'struggling') {
      comprehension *= 0.8;
    } else if (responsePattern === 'quick' && accuracyRate > 0.8) {
      comprehension *= 1.1;
    }

    return Math.max(0, Math.min(1, comprehension));
  }

  /**
   * Update mastery levels for concepts
   */
  private async updateMasteryLevels(
    studentId: string,
    learningState: LearningState,
    analysis: ConversationAnalysis,
    accuracyRate: number
  ): Promise<Map<string, MasteryLevel>> {
    const updates = new Map<string, MasteryLevel>();

    // Get concepts from conversation
    const activeConcepts = analysis.detectedConcepts;

    for (const conceptId of activeConcepts) {
      const currentMastery = learningState.knowledgeMap.masteryLevels.get(conceptId);
      
      if (!currentMastery) continue;

      // Determine new mastery level
      const newLevel = this.calculateMasteryLevel(
        currentMastery.level,
        analysis.comprehensionLevel,
        accuracyRate,
        analysis.responseQuality
      );

      // Create evidence
      const evidence: AssessmentEvidence = {
        type: 'behavior',
        value: {
          comprehension: analysis.comprehensionLevel,
          accuracy: accuracyRate,
          quality: analysis.responseQuality
        },
        timestamp: Date.now(),
        weight: 0.8
      };

      const updatedMastery: MasteryLevel = {
        conceptId,
        level: newLevel,
        confidence: Math.min(currentMastery.confidence + 0.1, 1),
        lastAssessed: Date.now(),
        evidence: [...currentMastery.evidence, evidence].slice(-20)
      };

      updates.set(conceptId, updatedMastery);
    }

    return updates;
  }

  /**
   * Calculate mastery level based on performance indicators
   */
  private calculateMasteryLevel(
    currentLevel: MasteryLevel['level'],
    comprehension: number,
    accuracy: number,
    quality: number
  ): MasteryLevel['level'] {
    const score = (comprehension + accuracy + quality) / 3;

    // Progression thresholds
    if (score >= 0.9 && currentLevel === 'proficient') {
      return 'mastered';
    } else if (score >= 0.75 && currentLevel === 'developing') {
      return 'proficient';
    } else if (score >= 0.6 && currentLevel === 'introduced') {
      return 'developing';
    } else if (score >= 0.4 && currentLevel === 'unknown') {
      return 'introduced';
    }

    // Regression check
    if (score < 0.4 && currentLevel !== 'unknown') {
      return 'introduced';
    }

    return currentLevel;
  }

  /**
   * Identify knowledge gaps
   */
  private async identifyKnowledgeGaps(
    conceptMap: ConceptMap,
    masteryUpdates: Map<string, MasteryLevel>
  ): Promise<Gap[]> {
    // Update concept map with new mastery levels
    for (const [conceptId, mastery] of masteryUpdates) {
      conceptMap.masteryLevels.set(conceptId, mastery);
    }

    // Use concept map manager to identify gaps
    const gaps = conceptMapManager.identifyKnowledgeGaps(conceptMap);

    return gaps;
  }

  /**
   * Determine progression recommendation
   * Requirement 1.3, 1.4: Advance to challenging material or offer alternative explanations
   */
  private determineProgression(
    comprehensionLevel: number,
    masteryUpdates: Map<string, MasteryLevel>,
    knowledgeGaps: Gap[],
    emotionalState: EmotionalState
  ): 'advance' | 'maintain' | 'review' | 'remediate' {
    // Check for critical gaps
    const criticalGaps = knowledgeGaps.filter(g => 
      g.severity === 'critical' || g.severity === 'major'
    );

    if (criticalGaps.length > 0) {
      return 'remediate';
    }

    // Check emotional state
    if (emotionalState.primary === 'frustrated' || emotionalState.primary === 'confused') {
      return 'review';
    }

    // Check mastery levels
    const masteryLevels = Array.from(masteryUpdates.values());
    const masteredCount = masteryLevels.filter(m => m.level === 'mastered').length;
    const proficientCount = masteryLevels.filter(m => m.level === 'proficient').length;

    // Advance if high comprehension and mastery
    if (comprehensionLevel >= 0.8 && masteredCount >= masteryLevels.length * 0.7) {
      return 'advance';
    }

    // Maintain if moderate comprehension
    if (comprehensionLevel >= 0.6 && (masteredCount + proficientCount) >= masteryLevels.length * 0.6) {
      return 'maintain';
    }

    // Review if low comprehension
    if (comprehensionLevel < 0.5) {
      return 'review';
    }

    return 'maintain';
  }

  /**
   * Calculate confidence in assessment
   */
  private calculateConfidence(conversationCount: number, responseCount: number): number {
    const dataPoints = conversationCount + responseCount;
    
    // Confidence increases with more data points
    if (dataPoints >= 20) return 0.9;
    if (dataPoints >= 10) return 0.7;
    if (dataPoints >= 5) return 0.5;
    return 0.3;
  }

  /**
   * Generate recommendations based on assessment
   */
  private generateAssessmentRecommendations(
    result: ContinuousAssessmentResult
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommendation based on progression
    if (result.progressionRecommendation === 'advance') {
      recommendations.push(this.createRecommendation(
        'strategy',
        'Advance to more challenging material',
        {
          action: 'increase_difficulty',
          reason: 'Student demonstrating mastery',
          comprehensionLevel: result.comprehensionLevel
        },
        0.8,
        'high',
        'High comprehension and mastery levels indicate readiness for advancement'
      ));
    } else if (result.progressionRecommendation === 'remediate') {
      recommendations.push(this.createRecommendation(
        'intervention',
        'Provide remediation and review',
        {
          action: 'remediate',
          gaps: result.knowledgeGaps,
          reason: 'Critical knowledge gaps detected'
        },
        0.9,
        'urgent',
        'Critical knowledge gaps require immediate attention'
      ));
    }

    // Emotional state recommendations
    if (result.emotionalState.primary === 'frustrated') {
      recommendations.push(this.createRecommendation(
        'intervention',
        'Provide encouragement and adjust difficulty',
        {
          action: 'reduce_frustration',
          emotionalState: result.emotionalState
        },
        0.7,
        'high',
        'Student showing signs of frustration'
      ));
    }

    // Knowledge gap recommendations
    if (result.knowledgeGaps.length > 0) {
      recommendations.push(this.createRecommendation(
        'content',
        'Address identified knowledge gaps',
        {
          action: 'fill_gaps',
          gaps: result.knowledgeGaps
        },
        0.8,
        'high',
        `${result.knowledgeGaps.length} knowledge gaps identified`
      ));
    }

    return recommendations;
  }

  /**
   * Identify concepts needing reinforcement from conversation analysis
   */
  private identifyConceptsNeedingReinforcement(
    analysis: ConversationAnalysis
  ): string[] {
    const needsReinforcement: string[] = [];

    // Low comprehension indicates need for reinforcement
    if (analysis.comprehensionLevel < 0.6) {
      needsReinforcement.push(...analysis.detectedConcepts);
    }

    // Knowledge gaps indicate specific concepts
    needsReinforcement.push(...analysis.knowledgeGaps);

    return [...new Set(needsReinforcement)]; // Remove duplicates
  }

  /**
   * Analyze knowledge gaps in detail
   */
  private async analyzeKnowledgeGaps(
    conceptMap: ConceptMap,
    currentConcepts: string[]
  ): Promise<KnowledgeGapAnalysis> {
    const gaps: Gap[] = [];
    const missingPrerequisites: string[] = [];
    const weakConcepts: string[] = [];
    const recommendedReview: string[] = [];

    // Check each current concept
    for (const conceptId of currentConcepts) {
      const concept = conceptMap.concepts[conceptId];
      if (!concept) continue;

      const mastery = conceptMap.masteryLevels.get(conceptId);

      // Check if concept is weak
      if (mastery && (mastery.level === 'introduced' || mastery.level === 'unknown')) {
        weakConcepts.push(conceptId);
        recommendedReview.push(conceptId);
      }

      // Check prerequisites
      for (const prereqId of concept.prerequisites) {
        const prereqMastery = conceptMap.masteryLevels.get(prereqId);
        
        if (!prereqMastery || prereqMastery.level === 'unknown' || prereqMastery.level === 'introduced') {
          missingPrerequisites.push(prereqId);
          
          gaps.push({
            conceptId: prereqId,
            severity: 'major',
            description: `Missing prerequisite for ${concept.name}`,
            suggestedActions: [
              `Review ${prereqId}`,
              `Complete prerequisite exercises`,
              `Build foundational understanding`
            ],
            detectedAt: Date.now(),
            concept: prereqId,
            relatedConcepts: [conceptId]
          });
        }
      }
    }

    // Determine overall severity
    let severity: KnowledgeGapAnalysis['severity'] = 'low';
    if (missingPrerequisites.length > 5 || weakConcepts.length > 7) {
      severity = 'critical';
    } else if (missingPrerequisites.length > 3 || weakConcepts.length > 5) {
      severity = 'high';
    } else if (missingPrerequisites.length > 1 || weakConcepts.length > 3) {
      severity = 'medium';
    }

    return {
      gaps,
      missingPrerequisites: [...new Set(missingPrerequisites)],
      weakConcepts: [...new Set(weakConcepts)],
      recommendedReview: [...new Set(recommendedReview)],
      severity
    };
  }

  /**
   * Determine mastery level for a specific concept
   */
  private async determineMasteryLevel(
    conceptId: string,
    conceptMap: ConceptMap,
    recentEvidence: AssessmentEvidence[]
  ): Promise<MasteryDetermination> {
    const currentMastery = conceptMap.masteryLevels.get(conceptId);
    
    if (!currentMastery) {
      throw new Error(`No mastery data found for concept: ${conceptId}`);
    }

    // Analyze evidence
    const evidenceScore = this.analyzeEvidence(recentEvidence);

    // Determine new level
    const newLevel = this.calculateMasteryLevel(
      currentMastery.level,
      evidenceScore.comprehension,
      evidenceScore.accuracy,
      evidenceScore.quality
    );

    // Check if ready for advancement
    const readyForAdvancement = newLevel === 'mastered' || 
      (newLevel === 'proficient' && evidenceScore.overall >= 0.8);

    // Generate next steps
    const recommendedNextSteps = this.generateNextSteps(
      newLevel,
      readyForAdvancement,
      conceptMap.concepts[conceptId]
    );

    return {
      conceptId,
      previousLevel: currentMastery.level,
      newLevel,
      confidence: Math.min(currentMastery.confidence + 0.15, 1),
      evidence: recentEvidence,
      readyForAdvancement,
      recommendedNextSteps
    };
  }

  /**
   * Analyze evidence to calculate scores
   */
  private analyzeEvidence(evidence: AssessmentEvidence[]): {
    comprehension: number;
    accuracy: number;
    quality: number;
    overall: number;
  } {
    let comprehension = 0.5;
    let accuracy = 0.5;
    let quality = 0.5;
    let totalWeight = 0;

    for (const ev of evidence) {
      const weight = ev.weight;
      totalWeight += weight;

      if (ev.type === 'response' && typeof ev.value === 'object') {
        accuracy += (ev.value.accuracyRate || 0.5) * weight;
      } else if (ev.type === 'pattern' && typeof ev.value === 'object') {
        comprehension += (ev.value.comprehensionLevel || 0.5) * weight;
        quality += (ev.value.responseQuality || 0.5) * weight;
      } else if (ev.type === 'behavior' && typeof ev.value === 'object') {
        comprehension += (ev.value.comprehension || 0.5) * weight;
        accuracy += (ev.value.accuracy || 0.5) * weight;
        quality += (ev.value.quality || 0.5) * weight;
      }
    }

    if (totalWeight > 0) {
      comprehension /= totalWeight;
      accuracy /= totalWeight;
      quality /= totalWeight;
    }

    const overall = (comprehension + accuracy + quality) / 3;

    return { comprehension, accuracy, quality, overall };
  }

  /**
   * Generate next steps based on mastery level
   */
  private generateNextSteps(
    masteryLevel: MasteryLevel['level'],
    readyForAdvancement: boolean,
    concept?: Concept
  ): string[] {
    const steps: string[] = [];

    if (readyForAdvancement) {
      steps.push('Advance to next concept');
      steps.push('Explore advanced applications');
      if (concept?.relatedConcepts) {
        steps.push('Connect to related concepts');
      }
    } else if (masteryLevel === 'proficient') {
      steps.push('Continue practice to achieve mastery');
      steps.push('Apply concept in different contexts');
      steps.push('Solve challenging problems');
    } else if (masteryLevel === 'developing') {
      steps.push('Practice fundamental skills');
      steps.push('Review key concepts');
      steps.push('Complete guided exercises');
    } else {
      steps.push('Review foundational material');
      steps.push('Start with basic examples');
      steps.push('Build understanding step by step');
    }

    return steps;
  }
}

// Export singleton instance
export const assessmentAgent = new AssessmentAgent();
