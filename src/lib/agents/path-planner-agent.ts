/**
 * Path Planner Agent - Adaptive learning path generation
 * Creates personalized learning sequences that adapt to student progress
 */

import { BaseAgent } from './base-agent';
import { LearningState, LearningObjective } from './types';
import { DifficultyLevel } from '@/types/chat';

interface LearningPathNode {
  id: string;
  concept: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // minutes
  prerequisites: string[];
  activities: string[];
  assessments: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface LearningPath {
  id: string;
  studentId: string;
  goal: string;
  nodes: LearningPathNode[];
  currentNodeIndex: number;
  createdAt: number;
  lastUpdated: number;
  adaptationCount: number;
}

export class PathPlannerAgent extends BaseAgent {
  private activePaths: Map<string, LearningPath> = new Map();

  constructor() {
    super('pathPlanning');
  }

  async initialize(): Promise<void> {
    console.log('Path Planner Agent initialized');
    this.status = 'active';
  }

  async processMessage(message: any): Promise<any> {
    const { studentId, action, data } = message;

    let result: any;

    switch (action) {
      case 'generate_path':
        result = await this.generateLearningPath(studentId, data.goal, data.learningState);
        break;
      case 'adapt_path':
        result = await this.adaptPath(studentId, data.progress, data.learningState);
        break;
      case 'get_next_step':
        result = await this.getNextStep(studentId);
        break;
      case 'complete_node':
        result = await this.completeNode(studentId, data.nodeId, data.performance);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      messageId: message.id,
      success: true,
      data: result,
      recommendations: []
    };
  }

  async shutdown(): Promise<void> {
    console.log('Path Planner Agent shutting down');
    this.status = 'idle';
  }

  /**
   * Generate a complete learning path for a goal
   */
  private async generateLearningPath(
    studentId: string,
    goal: string,
    learningState: LearningState
  ): Promise<LearningPath> {
    // Decompose goal into concepts
    const concepts = this.decomposeGoal(goal);

    // Order concepts by prerequisites
    const orderedConcepts = this.orderByPrerequisites(concepts, learningState);

    // Create learning nodes
    const nodes = orderedConcepts.map((concept, index) =>
      this.createLearningNode(concept, index, learningState)
    );

    // Create path
    const path: LearningPath = {
      id: `path-${Date.now()}`,
      studentId,
      goal,
      nodes,
      currentNodeIndex: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      adaptationCount: 0
    };

    this.activePaths.set(studentId, path);

    return path;
  }

  /**
   * Adapt existing path based on student progress
   */
  private async adaptPath(
    studentId: string,
    progress: any,
    learningState: LearningState
  ): Promise<{ adapted: boolean; changes: string[]; newPath: LearningPath }> {
    const path = this.activePaths.get(studentId);
    if (!path) {
      throw new Error('No active learning path found');
    }

    const changes: string[] = [];
    let adapted = false;

    // Check if student is ahead of expectations
    if (this.isAheadOfExpectations(progress, path)) {
      // Skip easier nodes or add more challenging content
      this.skipRedundantNodes(path, learningState);
      changes.push('Skipped basic concepts - you are progressing faster than expected!');
      adapted = true;
    }

    // Check if student is struggling
    if (this.isStrugglingWithCurrent(progress, learningState)) {
      // Add remedial nodes or easier alternatives
      this.addRemedialSupport(path, learningState);
      changes.push('Added extra practice to build confidence');
      adapted = true;
    }

    // Check for knowledge gaps
    const gaps = learningState.knowledgeMap.knowledgeGaps;
    if (gaps.length > 0) {
      // Insert prerequisite learning
      this.insertPrerequisites(path, gaps);
      changes.push('Added foundational concepts to fill gaps');
      adapted = true;
    }

    // Adjust difficulty based on performance
    if (this.needsDifficultyAdjustment(progress, learningState)) {
      this.adjustDifficulty(path, learningState);
      changes.push('Adjusted difficulty level to match your abilities');
      adapted = true;
    }

    if (adapted) {
      path.adaptationCount++;
      path.lastUpdated = Date.now();
      this.activePaths.set(studentId, path);
    }

    return { adapted, changes, newPath: path };
  }

  /**
   * Get the next step in the learning path
   */
  private async getNextStep(studentId: string): Promise<{
    node: LearningPathNode;
    context: string;
    estimatedTime: number;
  }> {
    const path = this.activePaths.get(studentId);
    if (!path) {
      throw new Error('No active learning path found');
    }

    const currentNode = path.nodes[path.currentNodeIndex];

    if (!currentNode) {
      throw new Error('Learning path completed');
    }

    // Generate contextual message
    const context = this.generateStepContext(currentNode, path);

    return {
      node: currentNode,
      context,
      estimatedTime: currentNode.estimatedDuration
    };
  }

  /**
   * Mark a node as completed
   */
  private async completeNode(
    studentId: string,
    nodeId: string,
    performance: {
      accuracy: number;
      timeSpent: number;
      engagement: number;
    }
  ): Promise<{ nextNode?: LearningPathNode; pathProgress: number }> {
    const path = this.activePaths.get(studentId);
    if (!path) {
      throw new Error('No active learning path found');
    }

    // Find and mark node as completed
    const nodeIndex = path.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      throw new Error('Node not found');
    }

    path.nodes[nodeIndex].status = 'completed';

    // Determine next node based on performance
    if (this.shouldAdvance(performance)) {
      path.currentNodeIndex = Math.min(nodeIndex + 1, path.nodes.length - 1);
    } else {
      // May need to repeat or provide alternative
      path.nodes[nodeIndex].status = 'in_progress';
    }

    // Calculate progress
    const completedCount = path.nodes.filter(n => n.status === 'completed').length;
    const pathProgress = (completedCount / path.nodes.length) * 100;

    const nextNode = path.nodes[path.currentNodeIndex];

    this.activePaths.set(studentId, path);

    return { nextNode, pathProgress };
  }

  // Private helper methods

  /**
   * Decompose a learning goal into constituent concepts
   */
  private decomposeGoal(goal: string): string[] {
    // Simplified decomposition - would use more sophisticated NLP in production
    const conceptMap: Record<string, string[]> = {
      'learn_math': ['numbers', 'counting', 'addition', 'subtraction', 'patterns'],
      'learn_reading': ['letters', 'phonics', 'words', 'sentences', 'stories'],
      'learn_science': ['observation', 'experiments', 'nature', 'animals', 'plants'],
      'learn_coding': ['sequences', 'loops', 'conditions', 'debugging', 'problem_solving']
    };

    const goalLower = goal.toLowerCase().replace(/\s+/g, '_');
    for (const [key, concepts] of Object.entries(conceptMap)) {
      if (goalLower.includes(key) || key.includes(goalLower)) {
        return concepts;
      }
    }

    // Default decomposition
    return [goal, goal + '_practice', goal + '_mastery'];
  }

  /**
   * Order concepts based on prerequisites
   */
  private orderByPrerequisites(
    concepts: string[],
    learningState: LearningState
  ): string[] {
    // Simple prerequisite ordering - would use dependency graph in production
    const ordered: string[] = [];
    const remaining = [...concepts];

    // Check which concepts student already knows
    const knownConcepts = new Set(
      Object.entries(learningState.knowledgeMap.concepts)
        .filter(([_, knowledge]) => knowledge.masteryLevel > 0.7)
        .map(([concept]) => concept)
    );

    // Put unknown concepts first, in logical order
    while (remaining.length > 0) {
      const concept = remaining.shift()!;
      if (!knownConcepts.has(concept)) {
        ordered.push(concept);
      }
    }

    return ordered;
  }

  /**
   * Create a learning node for a concept
   */
  private createLearningNode(
    concept: string,
    index: number,
    learningState: LearningState
  ): LearningPathNode {
    const difficulty = this.determineDifficulty(concept, learningState);

    return {
      id: `node-${Date.now()}-${index}`,
      concept,
      difficulty,
      estimatedDuration: this.estimateDuration(difficulty),
      prerequisites: this.identifyPrerequisites(concept),
      activities: this.selectActivities(concept, difficulty),
      assessments: this.selectAssessments(concept, difficulty),
      status: index === 0 ? 'in_progress' : 'pending'
    };
  }

  /**
   * Determine appropriate difficulty for a concept
   */
  private determineDifficulty(
    concept: string,
    learningState: LearningState
  ): DifficultyLevel {
    const knowledge = learningState.knowledgeMap.concepts[concept];

    if (!knowledge || knowledge.masteryLevel < 0.3) {
      return 'easy';
    } else if (knowledge.masteryLevel < 0.7) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  /**
   * Estimate duration for a node
   */
  private estimateDuration(difficulty: DifficultyLevel): number {
    const durationMap = {
      easy: 10,
      medium: 15,
      hard: 20,
      beginner: 10,
      intermediate: 15,
      advanced: 20
    };

    return durationMap[difficulty] || 15;
  }

  /**
   * Identify prerequisites for a concept
   */
  private identifyPrerequisites(concept: string): string[] {
    // Simplified prerequisite mapping
    const prereqMap: Record<string, string[]> = {
      'addition': ['numbers', 'counting'],
      'subtraction': ['addition', 'numbers'],
      'multiplication': ['addition', 'counting'],
      'words': ['letters', 'phonics'],
      'sentences': ['words', 'grammar_basics']
    };

    return prereqMap[concept] || [];
  }

  /**
   * Select appropriate activities for a concept
   */
  private selectActivities(concept: string, difficulty: DifficultyLevel): string[] {
    return [
      'interactive_lesson',
      'practice_exercises',
      'creative_project',
      'game'
    ];
  }

  /**
   * Select assessments for a concept
   */
  private selectAssessments(concept: string, difficulty: DifficultyLevel): string[] {
    return ['quiz', 'practical_challenge'];
  }

  /**
   * Check if student is ahead of expectations
   */
  private isAheadOfExpectations(progress: any, path: LearningPath): boolean {
    return progress.averageAccuracy > 0.9 && progress.completionRate > 1.5;
  }

  /**
   * Check if student is struggling
   */
  private isStrugglingWithCurrent(progress: any, learningState: LearningState): boolean {
    return learningState.knowledgeMap.knowledgeGaps.length > 2 ||
           progress.averageAccuracy < 0.5;
  }

  /**
   * Skip redundant nodes
   */
  private skipRedundantNodes(path: LearningPath, learningState: LearningState): void {
    // Mark mastered concepts as skipped
    for (const node of path.nodes) {
      const knowledge = learningState.knowledgeMap.concepts[node.concept];
      if (knowledge && knowledge.masteryLevel > 0.8 && node.status === 'pending') {
        node.status = 'skipped';
      }
    }
  }

  /**
   * Add remedial support nodes
   */
  private addRemedialSupport(path: LearningPath, learningState: LearningState): void {
    const currentNode = path.nodes[path.currentNodeIndex];

    // Create easier version of current concept
    const remedialNode: LearningPathNode = {
      id: `remedial-${Date.now()}`,
      concept: `${currentNode.concept}_basics`,
      difficulty: 'easy',
      estimatedDuration: 10,
      prerequisites: [],
      activities: ['guided_practice', 'visual_aids'],
      assessments: ['simple_quiz'],
      status: 'in_progress'
    };

    // Insert before current node
    path.nodes.splice(path.currentNodeIndex, 0, remedialNode);
  }

  /**
   * Insert prerequisite nodes
   */
  private insertPrerequisites(path: LearningPath, gaps: any[]): void {
    for (const gap of gaps.slice(0, 2)) { // Add up to 2 prerequisite nodes
      const prereqNode: LearningPathNode = {
        id: `prereq-${Date.now()}`,
        concept: gap.concept,
        difficulty: 'easy',
        estimatedDuration: 12,
        prerequisites: [],
        activities: ['foundation_lesson', 'practice'],
        assessments: ['concept_check'],
        status: 'pending'
      };

      // Insert at beginning or before first incomplete node
      const insertIndex = path.nodes.findIndex(n => n.status === 'pending' || n.status === 'in_progress');
      path.nodes.splice(insertIndex >= 0 ? insertIndex : 0, 0, prereqNode);
    }
  }

  /**
   * Check if difficulty adjustment is needed
   */
  private needsDifficultyAdjustment(progress: any, learningState: LearningState): boolean {
    return progress.averageAccuracy < 0.4 || progress.averageAccuracy > 0.95;
  }

  /**
   * Adjust difficulty of upcoming nodes
   */
  private adjustDifficulty(path: LearningPath, learningState: LearningState): void {
    const currentPerformance = learningState.engagementMetrics.responseQuality;

    for (const node of path.nodes) {
      if (node.status === 'pending') {
        if (currentPerformance < 0.5 && node.difficulty !== 'easy') {
          node.difficulty = this.decreaseDifficulty(node.difficulty);
        } else if (currentPerformance > 0.9 && node.difficulty !== 'hard') {
          node.difficulty = this.increaseDifficulty(node.difficulty);
        }
      }
    }
  }

  /**
   * Decrease difficulty level
   */
  private decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    const index = levels.indexOf(current);
    return index > 0 ? levels[index - 1] : current;
  }

  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : current;
  }

  /**
   * Generate contextual message for current step
   */
  private generateStepContext(node: LearningPathNode, path: LearningPath): string {
    const progress = (path.currentNodeIndex / path.nodes.length) * 100;

    return `Let's explore ${node.concept}! You're ${Math.round(progress)}% through your learning journey to ${path.goal}. This should take about ${node.estimatedDuration} minutes. Ready? 🚀`;
  }

  /**
   * Determine if student should advance
   */
  private shouldAdvance(performance: { accuracy: number; timeSpent: number; engagement: number }): boolean {
    return performance.accuracy >= 0.7 && performance.engagement >= 0.5;
  }
}

// Export singleton instance
export const pathPlannerAgent = new PathPlannerAgent();
