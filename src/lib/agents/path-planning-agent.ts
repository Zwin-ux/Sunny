/**
 * Path Planning Agent
 * Autonomous learning journey creation and dynamic path adaptation
 * 
 * Implements Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.2, 9.3, 9.5
 */

import { BaseAgent } from './base-agent';
import {
  AgentMessage,
  AgentResponse,
  AgentEvent,
  LearningState,
  EnhancedStudentProfile,
  LearningObjective,
  PathNode,
  Activity,
  ConceptMap,
  Concept,
  DifficultyLevel,
  Priority,
  ActivityType,
  Recommendation,
  AdaptationRule
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class PathPlanningAgent extends BaseAgent {
  private pathCache: Map<string, LearningPath> = new Map();
  private adaptationHistory: Map<string, PathAdaptation[]> = new Map();

  constructor() {
    super('pathPlanning');
  }

  async initialize(): Promise<void> {
    console.log('Initializing Path Planning Agent...');
    this.setupEventHandlers();
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { payload } = message;
    const action = payload.action;

    try {
      switch (action) {
        case 'generatePath':
          return await this.handleGeneratePath(message);
        
        case 'adaptPath':
          return await this.handleAdaptPath(message);
        
        case 'recommend':
          return await this.handleRecommend(message);
        
        case 'getNextActivity':
          return await this.handleGetNextActivity(message);
        
        case 'updateProgress':
          return await this.handleUpdateProgress(message);
        
        default:
          return {
            messageId: message.id,
            success: false,
            error: `Unknown action: ${action}`
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

  async shutdown(): Promise<void> {
    console.log('Shutting down Path Planning Agent...');
    this.pathCache.clear();
    this.adaptationHistory.clear();
  }

  /**
   * Generate a personalized learning path
   * Requirement 2.1: AI-driven learning sequence creation based on student profiles
   */
  private async handleGeneratePath(message: AgentMessage): Promise<AgentResponse> {
    const { studentProfile, learningState, objectives } = message.payload;

    const path = await this.generatePersonalizedPath(
      studentProfile,
      learningState,
      objectives || []
    );

    // Cache the generated path
    this.pathCache.set(learningState.studentId, path);

    return {
      messageId: message.id,
      success: true,
      data: { path },
      recommendations: this.createPathRecommendations(path, learningState)
    };
  }

  /**
   * Adapt an existing learning path based on progress
   * Requirement 2.3: Real-time learning path restructuring
   */
  private async handleAdaptPath(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState, progressData } = message.payload;

    const currentPath = this.pathCache.get(studentId);
    if (!currentPath) {
      return {
        messageId: message.id,
        success: false,
        error: 'No existing path found for student'
      };
    }

    const adaptedPath = await this.adaptPathDynamically(
      currentPath,
      learningState,
      progressData
    );

    // Update cache
    this.pathCache.set(studentId, adaptedPath);

    // Record adaptation
    this.recordAdaptation(studentId, {
      timestamp: Date.now(),
      trigger: progressData.trigger || 'manual',
      changes: adaptedPath.adaptations,
      reason: progressData.reason || 'progress update'
    });

    return {
      messageId: message.id,
      success: true,
      data: { adaptedPath },
      recommendations: this.createAdaptationRecommendations(adaptedPath, learningState)
    };
  }

  /**
   * Provide recommendations for next learning steps
   */
  private async handleRecommend(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, context } = message.payload;
    const learningState = context.learningState || context.assessmentResult?.learningState;

    if (!learningState) {
      return {
        messageId: message.id,
        success: false,
        error: 'No learning state provided'
      };
    }

    const recommendations = await this.generateRecommendations(studentId, learningState);

    return {
      messageId: message.id,
      success: true,
      recommendations
    };
  }

  /**
   * Get the next optimal activity in the learning path
   */
  private async handleGetNextActivity(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, learningState } = message.payload;

    const path = this.pathCache.get(studentId);
    if (!path) {
      return {
        messageId: message.id,
        success: false,
        error: 'No learning path found'
      };
    }

    const nextActivity = this.selectNextActivity(path, learningState);

    return {
      messageId: message.id,
      success: true,
      data: { nextActivity }
    };
  }

  /**
   * Update progress on the learning path
   */
  private async handleUpdateProgress(message: AgentMessage): Promise<AgentResponse> {
    const { studentId, nodeId, completed, performance } = message.payload;

    const path = this.pathCache.get(studentId);
    if (!path) {
      return {
        messageId: message.id,
        success: false,
        error: 'No learning path found'
      };
    }

    this.updatePathProgress(path, nodeId, completed, performance);

    return {
      messageId: message.id,
      success: true,
      data: { updatedPath: path }
    };
  }

  /**
   * Generate a personalized learning path based on student profile and objectives
   * Implements: Requirement 2.1 - AI-driven learning sequence creation
   */
  private async generatePersonalizedPath(
    studentProfile: EnhancedStudentProfile,
    learningState: LearningState,
    objectives: LearningObjective[]
  ): Promise<LearningPath> {
    const pathId = uuidv4();
    const nodes: PathNode[] = [];

    // 1. Analyze current knowledge state
    const knowledgeGaps = this.identifyKnowledgeGaps(learningState.knowledgeMap);

    // 2. Insert prerequisite knowledge if needed (Requirement 2.1)
    const prerequisiteNodes = this.createPrerequisiteNodes(knowledgeGaps, learningState.knowledgeMap);
    nodes.push(...prerequisiteNodes);

    // 3. Create nodes for primary objectives
    const objectiveNodes = this.createObjectiveNodes(objectives, studentProfile, learningState);
    nodes.push(...objectiveNodes);

    // 4. Optimize path based on multiple objectives (Requirement 2.1)
    const optimizedNodes = this.optimizePathSequence(nodes, studentProfile, learningState);

    // 5. Add interest-based customization (Requirement 2.4)
    const customizedNodes = this.customizeForInterests(optimizedNodes, studentProfile, learningState);

    // 6. Add engagement optimization (Requirement 2.4)
    const finalNodes = this.optimizeForEngagement(customizedNodes, studentProfile);

    return {
      id: pathId,
      studentId: learningState.studentId,
      objectives,
      nodes: finalNodes,
      currentNodeIndex: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      adaptations: [],
      metadata: {
        generationStrategy: 'ai-driven',
        optimizationFactors: ['prerequisites', 'interests', 'engagement'],
        estimatedDuration: this.calculateTotalDuration(finalNodes)
      }
    };
  }

  /**
   * Dynamically adapt learning path based on progress
   * Implements: Requirement 2.3 - Real-time learning path restructuring
   */
  private async adaptPathDynamically(
    currentPath: LearningPath,
    learningState: LearningState,
    progressData: ProgressData
  ): Promise<LearningPath> {
    const adaptations: string[] = [];

    // 1. Detect obstacles (Requirement 2.3)
    const obstacles = this.detectObstacles(currentPath, learningState, progressData);

    if (obstacles.length > 0) {
      // 2. Generate alternative routes (Requirement 2.3)
      const alternativeNodes = this.generateAlternativeRoutes(obstacles, learningState);
      
      // Insert alternative nodes
      currentPath.nodes = this.insertAlternativeNodes(
        currentPath.nodes,
        currentPath.currentNodeIndex,
        alternativeNodes
      );
      
      adaptations.push(`Generated ${alternativeNodes.length} alternative learning activities`);
    }

    // 3. Balance goal priorities (Requirement 2.3)
    const rebalancedObjectives = this.balanceGoalPriorities(
      currentPath.objectives,
      learningState,
      progressData
    );

    if (rebalancedObjectives.changed) {
      currentPath.objectives = rebalancedObjectives.objectives;
      adaptations.push('Rebalanced learning objective priorities');
    }

    // 4. Adjust for engagement changes
    if (learningState.engagementMetrics.currentLevel < 0.5) {
      const engagementBoost = this.addEngagementBoostActivities(
        currentPath.nodes,
        currentPath.currentNodeIndex,
        learningState
      );
      
      if (engagementBoost.added) {
        currentPath.nodes = engagementBoost.nodes;
        adaptations.push('Added engagement boost activities');
      }
    }

    // 5. Optimize transitions (Requirement 2.3 - seamless transition management)
    currentPath.nodes = this.optimizeTransitions(currentPath.nodes, learningState);
    adaptations.push('Optimized activity transitions');

    currentPath.adaptations = adaptations;
    currentPath.lastUpdated = Date.now();

    return currentPath;
  }

  /**
   * Identify knowledge gaps that need to be addressed
   */
  private identifyKnowledgeGaps(knowledgeMap: ConceptMap): KnowledgeGapAnalysis[] {
    const gaps: KnowledgeGapAnalysis[] = [];

    // Check existing knowledge gaps
    for (const gap of knowledgeMap.knowledgeGaps) {
      gaps.push({
        conceptId: gap.conceptId,
        severity: typeof gap.severity === 'string' ? this.severityToNumber(gap.severity) : gap.severity,
        prerequisites: this.findPrerequisites(gap.conceptId, knowledgeMap),
        suggestedActivities: gap.suggestedActions
      });
    }

    // Check for concepts with low mastery
    for (const [conceptId, mastery] of knowledgeMap.masteryLevels) {
      if (mastery.level === 'introduced' || mastery.level === 'developing') {
        const concept = knowledgeMap.concepts[conceptId];
        if (concept) {
          gaps.push({
            conceptId,
            severity: 0.6,
            prerequisites: concept.prerequisites,
            suggestedActivities: [`Practice ${concept.name}`, `Review ${concept.name} fundamentals`]
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Create prerequisite nodes for knowledge gaps
   * Implements: Requirement 2.1 - Prerequisite knowledge insertion
   */
  private createPrerequisiteNodes(
    gaps: KnowledgeGapAnalysis[],
    knowledgeMap: ConceptMap
  ): PathNode[] {
    const nodes: PathNode[] = [];

    // Sort gaps by severity (highest first)
    const sortedGaps = gaps.sort((a, b) => b.severity - a.severity);

    for (const gap of sortedGaps) {
      const concept = knowledgeMap.concepts[gap.conceptId];
      if (!concept) continue;

      // Create a learning node for this prerequisite
      nodes.push({
        id: uuidv4(),
        type: 'concept',
        content: {
          conceptId: gap.conceptId,
          conceptName: concept.name,
          description: concept.description,
          difficulty: concept.difficulty,
          activities: gap.suggestedActivities
        },
        prerequisites: gap.prerequisites,
        estimatedDuration: 15, // 15 minutes per prerequisite
        adaptationRules: this.createAdaptationRules(concept),
        completed: false
      });
    }

    return nodes;
  }

  /**
   * Create nodes for learning objectives
   */
  private createObjectiveNodes(
    objectives: LearningObjective[],
    studentProfile: EnhancedStudentProfile,
    learningState: LearningState
  ): PathNode[] {
    const nodes: PathNode[] = [];

    // Sort objectives by priority
    const sortedObjectives = objectives.sort((a, b) => 
      this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
    );

    for (const objective of sortedObjectives) {
      // Create multiple activity nodes for each objective
      const activityTypes = this.selectActivityTypes(objective, studentProfile);

      for (const activityType of activityTypes) {
        nodes.push({
          id: uuidv4(),
          type: 'activity',
          content: {
            objectiveId: objective.id,
            objectiveTitle: objective.title,
            activityType,
            difficulty: objective.targetLevel,
            description: objective.description
          },
          prerequisites: objective.prerequisites,
          estimatedDuration: Math.ceil(objective.estimatedDuration / activityTypes.length),
          adaptationRules: this.createObjectiveAdaptationRules(objective),
          completed: false
        });
      }

      // Add assessment node after activities
      nodes.push({
        id: uuidv4(),
        type: 'assessment',
        content: {
          objectiveId: objective.id,
          assessmentType: 'formative',
          difficulty: objective.targetLevel
        },
        prerequisites: [objective.id],
        estimatedDuration: 10,
        adaptationRules: [],
        completed: false
      });
    }

    return nodes;
  }

  /**
   * Optimize path sequence for multiple objectives
   * Implements: Requirement 2.1 - Multi-objective learning path optimization
   */
  private optimizePathSequence(
    nodes: PathNode[],
    studentProfile: EnhancedStudentProfile,
    learningState: LearningState
  ): PathNode[] {
    // 1. Topological sort based on prerequisites
    const sorted = this.topologicalSort(nodes);

    // 2. Optimize for cognitive load
    const cognitiveOptimized = this.optimizeForCognitiveLoad(sorted, studentProfile);

    // 3. Balance difficulty progression
    const difficultyBalanced = this.balanceDifficultyProgression(cognitiveOptimized);

    // 4. Interleave activity types for variety
    const varietyOptimized = this.interleaveActivityTypes(difficultyBalanced);

    return varietyOptimized;
  }

  /**
   * Customize path based on student interests
   * Implements: Requirement 2.4 - Interest-based path customization
   */
  private customizeForInterests(
    nodes: PathNode[],
    studentProfile: EnhancedStudentProfile,
    learningState: LearningState
  ): PathNode[] {
    // Extract interests from profile and context
    const interests = this.extractStudentInterests(studentProfile, learningState);

    return nodes.map(node => {
      if (node.type === 'activity' || node.type === 'concept') {
        // Add interest-based theming to content
        node.content = {
          ...node.content,
          theme: this.selectThemeForInterests(interests),
          examples: this.generateInterestBasedExamples(node.content, interests)
        };
      }
      return node;
    });
  }

  /**
   * Optimize path for engagement
   * Implements: Requirement 2.4 - Engagement optimization
   */
  private optimizeForEngagement(
    nodes: PathNode[],
    studentProfile: EnhancedStudentProfile
  ): PathNode[] {
    const optimized: PathNode[] = [];
    const preferredActivities = studentProfile.preferredActivityTypes || [];

    for (let i = 0; i < nodes.length; i++) {
      optimized.push(nodes[i]);

      // Insert breaks based on attention span
      const attentionSpan = studentProfile.attentionSpanData?.averageSpan || 20;
      const cumulativeDuration = this.calculateCumulativeDuration(optimized);

      if (cumulativeDuration >= attentionSpan && i < nodes.length - 1) {
        optimized.push({
          id: uuidv4(),
          type: 'break',
          content: {
            type: 'micro-break',
            duration: 2,
            activity: 'stretch or quick game'
          },
          prerequisites: [],
          estimatedDuration: 2,
          adaptationRules: [],
          completed: false
        });
      }

      // Add high-engagement activities periodically
      if ((i + 1) % 5 === 0 && i < nodes.length - 1) {
        const preferredType = this.getMostPreferredActivityType(preferredActivities);
        if (preferredType) {
          optimized.push(this.createEngagementBoostNode(preferredType));
        }
      }
    }

    return optimized;
  }

  /**
   * Detect obstacles in learning progress
   * Implements: Requirement 2.3 - Obstacle detection
   */
  private detectObstacles(
    path: LearningPath,
    learningState: LearningState,
    progressData: ProgressData
  ): Obstacle[] {
    const obstacles: Obstacle[] = [];

    // 1. Check for repeated failures
    if (progressData.consecutiveFailures >= 2) {
      obstacles.push({
        type: 'difficulty',
        severity: 'high',
        location: path.currentNodeIndex,
        description: 'Student struggling with current difficulty level',
        suggestedAction: 'reduce_difficulty'
      });
    }

    // 2. Check for engagement drops
    if (learningState.engagementMetrics.currentLevel < 0.4) {
      obstacles.push({
        type: 'engagement',
        severity: 'high',
        location: path.currentNodeIndex,
        description: 'Low engagement detected',
        suggestedAction: 'change_activity_type'
      });
    }

    // 3. Check for knowledge gaps
    if (learningState.knowledgeMap.knowledgeGaps.length > 0) {
      obstacles.push({
        type: 'knowledge_gap',
        severity: 'medium',
        location: path.currentNodeIndex,
        description: 'Missing prerequisite knowledge',
        suggestedAction: 'insert_prerequisites'
      });
    }

    // 4. Check for pacing issues
    if (progressData.averageTimePerNode > path.nodes[path.currentNodeIndex]?.estimatedDuration * 1.5) {
      obstacles.push({
        type: 'pacing',
        severity: 'medium',
        location: path.currentNodeIndex,
        description: 'Student taking longer than expected',
        suggestedAction: 'adjust_pacing'
      });
    }

    return obstacles;
  }

  /**
   * Generate alternative routes around obstacles
   * Implements: Requirement 2.3 - Alternative route generation
   */
  private generateAlternativeRoutes(
    obstacles: Obstacle[],
    learningState: LearningState
  ): PathNode[] {
    const alternativeNodes: PathNode[] = [];

    for (const obstacle of obstacles) {
      switch (obstacle.suggestedAction) {
        case 'reduce_difficulty':
          alternativeNodes.push(this.createScaffoldingNode(obstacle, learningState));
          break;

        case 'change_activity_type':
          alternativeNodes.push(this.createAlternativeActivityNode(obstacle, learningState));
          break;

        case 'insert_prerequisites':
          alternativeNodes.push(...this.createPrerequisiteReviewNodes(obstacle, learningState));
          break;

        case 'adjust_pacing':
          alternativeNodes.push(this.createPacingAdjustmentNode(obstacle, learningState));
          break;
      }
    }

    return alternativeNodes;
  }

  /**
   * Balance goal priorities based on progress
   * Implements: Requirement 2.3 - Goal priority balancing
   */
  private balanceGoalPriorities(
    objectives: LearningObjective[],
    learningState: LearningState,
    progressData: ProgressData
  ): { objectives: LearningObjective[]; changed: boolean } {
    let changed = false;
    const rebalanced = objectives.map(obj => {
      const currentProgress = obj.progress;

      // Increase priority if behind schedule
      if (currentProgress < 0.3 && obj.priority !== 'urgent') {
        changed = true;
        return { ...obj, priority: 'high' as Priority };
      }

      // Decrease priority if ahead of schedule
      if (currentProgress > 0.8 && obj.priority === 'urgent') {
        changed = true;
        return { ...obj, priority: 'medium' as Priority };
      }

      return obj;
    });

    return { objectives: rebalanced, changed };
  }

  /**
   * Optimize transitions between activities
   * Implements: Requirement 2.3 - Seamless transition management
   */
  private optimizeTransitions(nodes: PathNode[], learningState: LearningState): PathNode[] {
    return nodes.map((node, index) => {
      if (index === 0) return node;

      const previousNode = nodes[index - 1];
      
      // Add transition hints
      node.content = {
        ...node.content,
        transitionFrom: previousNode.id,
        transitionHint: this.generateTransitionHint(previousNode, node, learningState)
      };

      return node;
    });
  }

  /**
   * Generate recommendations for path planning
   */
  private async generateRecommendations(
    studentId: string,
    learningState: LearningState
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const path = this.pathCache.get(studentId);

    // Recommend next learning steps
    if (path && path.currentNodeIndex < path.nodes.length) {
      const nextNode = path.nodes[path.currentNodeIndex];
      recommendations.push(
        this.createRecommendation(
          'action',
          `Continue with ${nextNode.type}: ${nextNode.content.title || nextNode.content.conceptName || 'next activity'}`,
          { nodeId: nextNode.id, node: nextNode },
          0.9,
          'high',
          'Following personalized learning path'
        )
      );
    }

    // Recommend path adaptations if needed
    if (learningState.engagementMetrics.currentLevel < 0.5) {
      recommendations.push(
        this.createRecommendation(
          'strategy',
          'Adapt learning path to boost engagement',
          { action: 'adaptPath', reason: 'low_engagement' },
          0.8,
          'high',
          'Engagement level below optimal threshold'
        )
      );
    }

    // Recommend addressing knowledge gaps
    if (learningState.knowledgeMap.knowledgeGaps.length > 0) {
      recommendations.push(
        this.createRecommendation(
          'content',
          'Address identified knowledge gaps',
          { gaps: learningState.knowledgeMap.knowledgeGaps },
          0.85,
          'medium',
          'Knowledge gaps detected that may hinder progress'
        )
      );
    }

    return recommendations;
  }

  // Helper methods

  private selectNextActivity(path: LearningPath, learningState: LearningState): PathNode | null {
    if (path.currentNodeIndex >= path.nodes.length) {
      return null;
    }

    return path.nodes[path.currentNodeIndex];
  }

  private updatePathProgress(
    path: LearningPath,
    nodeId: string,
    completed: boolean,
    performance?: number
  ): void {
    const nodeIndex = path.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex >= 0) {
      path.nodes[nodeIndex].completed = completed;
      if (completed) {
        path.nodes[nodeIndex].completedAt = Date.now();
        path.currentNodeIndex = Math.max(path.currentNodeIndex, nodeIndex + 1);
      }
    }
  }

  private createPathRecommendations(
    path: LearningPath,
    learningState: LearningState
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (path.nodes.length > 0) {
      recommendations.push(
        this.createRecommendation(
          'action',
          `Start personalized learning path with ${path.nodes.length} activities`,
          { pathId: path.id, firstNode: path.nodes[0] },
          0.9,
          'high',
          'Generated optimal learning sequence based on student profile'
        )
      );
    }

    return recommendations;
  }

  private createAdaptationRecommendations(
    path: LearningPath,
    learningState: LearningState
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (path.adaptations.length > 0) {
      recommendations.push(
        this.createRecommendation(
          'strategy',
          `Path adapted: ${path.adaptations.join(', ')}`,
          { adaptations: path.adaptations },
          0.85,
          'medium',
          'Learning path dynamically adjusted based on progress'
        )
      );
    }

    return recommendations;
  }

  private recordAdaptation(studentId: string, adaptation: PathAdaptation): void {
    if (!this.adaptationHistory.has(studentId)) {
      this.adaptationHistory.set(studentId, []);
    }
    this.adaptationHistory.get(studentId)!.push(adaptation);
  }

  private findPrerequisites(conceptId: string, knowledgeMap: ConceptMap): string[] {
    const concept = knowledgeMap.concepts[conceptId];
    return concept ? concept.prerequisites : [];
  }

  private severityToNumber(severity: string): number {
    const map: Record<string, number> = {
      minor: 0.3,
      moderate: 0.5,
      major: 0.7,
      critical: 0.9
    };
    return map[severity] || 0.5;
  }

  private createAdaptationRules(concept: Concept): AdaptationRule[] {
    return [
      {
        condition: 'performance < 0.6',
        action: 'provide_additional_practice',
        priority: 'high'
      },
      {
        condition: 'engagement < 0.5',
        action: 'change_presentation_style',
        priority: 'medium'
      }
    ];
  }

  private createObjectiveAdaptationRules(objective: LearningObjective): AdaptationRule[] {
    return [
      {
        condition: 'time_exceeded',
        action: 'break_into_smaller_steps',
        priority: 'high'
      },
      {
        condition: 'mastery_achieved',
        action: 'advance_to_next_objective',
        priority: 'high'
      }
    ];
  }

  private selectActivityTypes(
    objective: LearningObjective,
    studentProfile: EnhancedStudentProfile
  ): ActivityType[] {
    const preferred = studentProfile.preferredActivityTypes || [];
    const types: ActivityType[] = [];

    // Always include a lesson
    types.push('lesson');

    // Add practice
    types.push('practice');

    // Add preferred activity type if available
    if (preferred.length > 0) {
      const topPreferred = preferred.sort((a, b) => b.preference - a.preference)[0];
      if (!types.includes(topPreferred.activityType)) {
        types.push(topPreferred.activityType);
      }
    }

    return types;
  }

  private getPriorityValue(priority: Priority): number {
    const map = { low: 1, medium: 2, high: 3, urgent: 4 };
    return map[priority];
  }

  private topologicalSort(nodes: PathNode[]): PathNode[] {
    // Simple topological sort based on prerequisites
    const sorted: PathNode[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const visit = (node: PathNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      // Visit prerequisites first
      for (const prereqId of node.prerequisites) {
        const prereqNode = nodeMap.get(prereqId);
        if (prereqNode) visit(prereqNode);
      }

      sorted.push(node);
    };

    nodes.forEach(visit);
    return sorted;
  }

  private optimizeForCognitiveLoad(
    nodes: PathNode[],
    studentProfile: EnhancedStudentProfile
  ): PathNode[] {
    // Adjust based on cognitive profile
    const processingSpeed = studentProfile.cognitiveProfile?.processingSpeed || 0.5;
    
    return nodes.map(node => ({
      ...node,
      estimatedDuration: Math.ceil(node.estimatedDuration / processingSpeed)
    }));
  }

  private balanceDifficultyProgression(nodes: PathNode[]): PathNode[] {
    // Ensure gradual difficulty increase
    return nodes.sort((a, b) => {
      const diffA = this.getDifficultyValue(a.content.difficulty);
      const diffB = this.getDifficultyValue(b.content.difficulty);
      return diffA - diffB;
    });
  }

  private getDifficultyValue(difficulty: DifficultyLevel | undefined): number {
    if (!difficulty) return 2;
    const map: Record<DifficultyLevel, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };
    return map[difficulty] || 2;
  }

  private interleaveActivityTypes(nodes: PathNode[]): PathNode[] {
    // Ensure variety by avoiding consecutive same-type activities
    const result: PathNode[] = [];
    const remaining = [...nodes];

    while (remaining.length > 0) {
      const lastType = result.length > 0 ? result[result.length - 1].type : null;
      
      // Find a node with different type
      const differentIndex = remaining.findIndex(n => n.type !== lastType);
      const index = differentIndex >= 0 ? differentIndex : 0;
      
      result.push(remaining[index]);
      remaining.splice(index, 1);
    }

    return result;
  }

  private extractStudentInterests(
    studentProfile: EnhancedStudentProfile,
    learningState: LearningState
  ): string[] {
    const interests: string[] = [];
    
    // Extract from profile interests if available
    if (studentProfile.interests) {
      interests.push(...studentProfile.interests);
    }

    // Extract from context history
    for (const context of learningState.contextHistory) {
      if (context.tags.includes('interest')) {
        interests.push(context.content);
      }
    }

    return [...new Set(interests)]; // Remove duplicates
  }

  private selectThemeForInterests(interests: string[]): string {
    if (interests.length === 0) return 'general';
    return interests[Math.floor(Math.random() * interests.length)];
  }

  private generateInterestBasedExamples(content: any, interests: string[]): string[] {
    // Generate examples related to student interests
    return interests.slice(0, 2).map(interest => 
      `Example related to ${interest}`
    );
  }

  private calculateCumulativeDuration(nodes: PathNode[]): number {
    return nodes.reduce((sum, node) => sum + node.estimatedDuration, 0);
  }

  private calculateTotalDuration(nodes: PathNode[]): number {
    return this.calculateCumulativeDuration(nodes);
  }

  private getMostPreferredActivityType(
    preferences: Array<{ activityType: ActivityType; preference: number }>
  ): ActivityType | null {
    if (preferences.length === 0) return null;
    const sorted = preferences.sort((a, b) => b.preference - a.preference);
    return sorted[0].activityType;
  }

  private createEngagementBoostNode(activityType: ActivityType): PathNode {
    return {
      id: uuidv4(),
      type: 'activity',
      content: {
        activityType,
        title: 'Engagement Boost Activity',
        description: 'Fun activity to maintain engagement',
        difficulty: 'beginner' as DifficultyLevel
      },
      prerequisites: [],
      estimatedDuration: 5,
      adaptationRules: [],
      completed: false
    };
  }

  private insertAlternativeNodes(
    nodes: PathNode[],
    currentIndex: number,
    alternativeNodes: PathNode[]
  ): PathNode[] {
    const result = [...nodes];
    result.splice(currentIndex + 1, 0, ...alternativeNodes);
    return result;
  }

  private addEngagementBoostActivities(
    nodes: PathNode[],
    currentIndex: number,
    learningState: LearningState
  ): { nodes: PathNode[]; added: boolean } {
    const boostNode: PathNode = {
      id: uuidv4(),
      type: 'activity',
      content: {
        activityType: 'game',
        title: 'Quick Engagement Activity',
        description: 'A fun activity to re-energize learning',
        difficulty: 'beginner' as DifficultyLevel
      },
      prerequisites: [],
      estimatedDuration: 5,
      adaptationRules: [],
      completed: false
    };

    const result = [...nodes];
    result.splice(currentIndex + 1, 0, boostNode);
    
    return { nodes: result, added: true };
  }

  private createScaffoldingNode(obstacle: Obstacle, learningState: LearningState): PathNode {
    return {
      id: uuidv4(),
      type: 'activity',
      content: {
        activityType: 'lesson',
        title: 'Scaffolding Support',
        description: 'Additional support to overcome difficulty',
        difficulty: 'beginner' as DifficultyLevel,
        scaffolding: true
      },
      prerequisites: [],
      estimatedDuration: 10,
      adaptationRules: [],
      completed: false
    };
  }

  private createAlternativeActivityNode(obstacle: Obstacle, learningState: LearningState): PathNode {
    return {
      id: uuidv4(),
      type: 'activity',
      content: {
        activityType: 'game',
        title: 'Alternative Learning Activity',
        description: 'Different approach to the same concept',
        difficulty: 'intermediate' as DifficultyLevel
      },
      prerequisites: [],
      estimatedDuration: 15,
      adaptationRules: [],
      completed: false
    };
  }

  private createPrerequisiteReviewNodes(obstacle: Obstacle, learningState: LearningState): PathNode[] {
    const gaps = learningState.knowledgeMap.knowledgeGaps;
    return gaps.slice(0, 2).map(gap => ({
      id: uuidv4(),
      type: 'concept' as const,
      content: {
        conceptId: gap.conceptId,
        conceptName: gap.concept || 'Prerequisite Concept',
        description: 'Review of prerequisite knowledge',
        difficulty: 'beginner' as DifficultyLevel
      },
      prerequisites: [],
      estimatedDuration: 10,
      adaptationRules: [],
      completed: false
    }));
  }

  private createPacingAdjustmentNode(obstacle: Obstacle, learningState: LearningState): PathNode {
    return {
      id: uuidv4(),
      type: 'break',
      content: {
        type: 'pacing-adjustment',
        duration: 3,
        activity: 'Take a moment to reflect on what you\'ve learned'
      },
      prerequisites: [],
      estimatedDuration: 3,
      adaptationRules: [],
      completed: false
    };
  }

  private generateTransitionHint(
    previousNode: PathNode,
    currentNode: PathNode,
    learningState: LearningState
  ): string {
    return `Building on ${previousNode.type}, now we'll explore ${currentNode.type}`;
  }

  protected setupEventHandlers(): void {
    this.registerEventHandler('learning:progress', {
      eventType: 'learning:progress',
      handler: async (event: AgentEvent) => {
        // Handle progress events to trigger path adaptations
        const { studentId, progress } = event.data;
        
        if (progress.needsAdaptation) {
          this.emitEvent('path:adaptation:needed', {
            studentId,
            reason: progress.reason
          }, 'high');
        }
      },
      priority: 'medium'
    });

    this.registerEventHandler('engagement:change', {
      eventType: 'engagement:change',
      handler: async (event: AgentEvent) => {
        // Handle engagement changes
        const { studentId, engagementLevel } = event.data;
        
        if (engagementLevel < 0.5) {
          this.emitEvent('path:engagement:low', {
            studentId,
            level: engagementLevel
          }, 'high');
        }
      },
      priority: 'high'
    });
  }
}

// Supporting interfaces

export interface LearningPath {
  id: string;
  studentId: string;
  objectives: LearningObjective[];
  nodes: PathNode[];
  currentNodeIndex: number;
  createdAt: number;
  lastUpdated: number;
  adaptations: string[];
  metadata: {
    generationStrategy: string;
    optimizationFactors: string[];
    estimatedDuration: number;
  };
}

export interface ProgressData {
  consecutiveFailures: number;
  averageTimePerNode: number;
  trigger?: string;
  reason?: string;
}

export interface KnowledgeGapAnalysis {
  conceptId: string;
  severity: number;
  prerequisites: string[];
  suggestedActivities: string[];
}

export interface Obstacle {
  type: 'difficulty' | 'engagement' | 'knowledge_gap' | 'pacing';
  severity: 'low' | 'medium' | 'high';
  location: number;
  description: string;
  suggestedAction: string;
}

export interface PathAdaptation {
  timestamp: number;
  trigger: string;
  changes: string[];
  reason: string;
}
