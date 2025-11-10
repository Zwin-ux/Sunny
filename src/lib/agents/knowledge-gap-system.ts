/**
 * Knowledge Gap Identification System
 * Advanced system for detecting and analyzing knowledge gaps
 * Implements Requirements: 1.2, 1.5, 2.5
 */

import {
  ConceptMap,
  Concept,
  ConceptRelationship,
  MasteryLevel,
  Gap,
  EnhancedStudentProfile,
  LearningState,
  AssessmentEvidence
} from './types';
import { conceptMapManager } from './student-profile';
import { DifficultyLevel } from '@/types/chat';

/**
 * Concept Dependency Graph
 * Represents the prerequisite relationships between concepts
 */
export interface ConceptDependencyGraph {
  nodes: Map<string, ConceptNode>;
  edges: DependencyEdge[];
  levels: Map<string, number>; // Topological level of each concept
}

export interface ConceptNode {
  conceptId: string;
  concept: Concept;
  mastery: MasteryLevel;
  dependencies: string[]; // Prerequisite concept IDs
  dependents: string[]; // Concepts that depend on this one
  criticalPath: boolean; // Is this concept on the critical learning path?
}

export interface DependencyEdge {
  from: string; // Prerequisite concept
  to: string; // Dependent concept
  strength: number; // How critical is this prerequisite (0-1)
  type: 'hard' | 'soft'; // Hard = must master, Soft = helpful but not required
}

/**
 * Skill Domain Assessment
 * Tracks mastery across different skill domains
 */
export interface SkillDomainAssessment {
  domain: string;
  subDomains: string[];
  overallLevel: number; // 0-1 mastery level
  conceptCoverage: number; // Percentage of concepts in domain
  strengths: string[]; // Well-mastered concepts
  weaknesses: string[]; // Concepts needing work
  gaps: Gap[];
  recommendedFocus: string[];
}

/**
 * Learning Velocity Metrics
 * Tracks how quickly student is progressing
 */
export interface LearningVelocityMetrics {
  studentId: string;
  timeWindow: number; // Time period in milliseconds
  conceptsMastered: number;
  conceptsIntroduced: number;
  averageTimeToMastery: number; // Average time to master a concept (ms)
  masteryRate: number; // Concepts mastered per hour
  progressionRate: number; // Rate of moving through difficulty levels
  retentionScore: number; // How well concepts are retained (0-1)
  adaptationNeeded: 'accelerate' | 'maintain' | 'decelerate';
  projectedCompletion: number; // Estimated time to complete current objectives (ms)
}

/**
 * Foundational Knowledge Analysis
 * Identifies missing foundational concepts
 */
export interface FoundationalKnowledgeAnalysis {
  missingFoundations: string[]; // Concept IDs of missing foundational knowledge
  impactedConcepts: Map<string, string[]>; // Which concepts are blocked by each gap
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedSequence: string[]; // Optimal order to address gaps
  estimatedRemediationTime: number; // Time needed to fill gaps (minutes)
  blockedObjectives: string[]; // Learning objectives that can't proceed
}

/**
 * Knowledge Gap Identification System
 * Core system for analyzing and identifying knowledge gaps
 */
export class KnowledgeGapIdentificationSystem {
  /**
   * Build a concept dependency graph from a concept map
   * Requirement 1.2: Implement concept dependency mapping
   */
  buildDependencyGraph(conceptMap: ConceptMap): ConceptDependencyGraph {
    const nodes = new Map<string, ConceptNode>();
    const edges: DependencyEdge[] = [];

    // Create nodes for all concepts
    for (const conceptId in conceptMap.concepts) {
      const concept = conceptMap.concepts[conceptId];
      const mastery = conceptMap.masteryLevels.get(conceptId) || {
        conceptId,
        level: 'unknown',
        confidence: 0,
        lastAssessed: Date.now(),
        evidence: []
      };

      nodes.set(conceptId, {
        conceptId,
        concept,
        mastery,
        dependencies: [...concept.prerequisites],
        dependents: [],
        criticalPath: false
      });
    }

    // Build edges and populate dependents
    for (const conceptId in conceptMap.concepts) {
      const concept = conceptMap.concepts[conceptId];
      
      for (const prereqId of concept.prerequisites) {
        // Create edge
        const relationship = conceptMap.relationships.find(
          r => r.fromConcept === prereqId && r.toConcept === conceptId
        );

        edges.push({
          from: prereqId,
          to: conceptId,
          strength: relationship?.strength || 0.8,
          type: relationship?.strength && relationship.strength > 0.7 ? 'hard' : 'soft'
        });

        // Add to dependents
        const prereqNode = nodes.get(prereqId);
        if (prereqNode && !prereqNode.dependents.includes(conceptId)) {
          prereqNode.dependents.push(conceptId);
        }
      }
    }

    // Calculate topological levels
    const levels = this.calculateTopologicalLevels(nodes, edges);

    // Mark critical path concepts
    this.markCriticalPath(nodes, edges);

    return { nodes, edges, levels };
  }

  /**
   * Detect missing prerequisites for current learning objectives
   * Requirement 1.2, 2.5: Prerequisite detection and insertion
   */
  detectMissingPrerequisites(
    conceptMap: ConceptMap,
    targetConcepts: string[]
  ): string[] {
    const missingPrereqs = new Set<string>();
    const visited = new Set<string>();

    const checkPrerequisites = (conceptId: string) => {
      if (visited.has(conceptId)) return;
      visited.add(conceptId);

      const concept = conceptMap.concepts[conceptId];
      if (!concept) return;

      for (const prereqId of concept.prerequisites) {
        const prereqMastery = conceptMap.masteryLevels.get(prereqId);
        
        // Check if prerequisite is not adequately mastered
        if (!prereqMastery || 
            prereqMastery.level === 'unknown' || 
            prereqMastery.level === 'introduced') {
          missingPrereqs.add(prereqId);
          
          // Recursively check prerequisites of prerequisites
          checkPrerequisites(prereqId);
        }
      }
    };

    // Check all target concepts
    for (const conceptId of targetConcepts) {
      checkPrerequisites(conceptId);
    }

    return Array.from(missingPrereqs);
  }

  /**
   * Identify missing foundational knowledge
   * Requirement 1.5: Automated identification of missing foundational knowledge
   */
  identifyMissingFoundations(
    conceptMap: ConceptMap,
    learningState: LearningState
  ): FoundationalKnowledgeAnalysis {
    const dependencyGraph = this.buildDependencyGraph(conceptMap);
    const missingFoundations: string[] = [];
    const impactedConcepts = new Map<string, string[]>();

    // Find concepts at the lowest levels (foundational) that aren't mastered
    const foundationalLevel = Math.min(...Array.from(dependencyGraph.levels.values()));
    
    for (const [conceptId, level] of dependencyGraph.levels) {
      // Check concepts at foundational levels (0-2)
      if (level <= foundationalLevel + 2) {
        const mastery = conceptMap.masteryLevels.get(conceptId);
        
        if (!mastery || mastery.level === 'unknown' || mastery.level === 'introduced') {
          missingFoundations.push(conceptId);
          
          // Find all concepts that depend on this foundation
          const impacted = this.findDependentConcepts(conceptId, dependencyGraph);
          impactedConcepts.set(conceptId, impacted);
        }
      }
    }

    // Calculate severity based on number of impacted concepts
    const totalImpacted = Array.from(impactedConcepts.values())
      .reduce((sum, arr) => sum + arr.length, 0);
    
    let severity: FoundationalKnowledgeAnalysis['severity'];
    if (totalImpacted > 10 || missingFoundations.length > 5) {
      severity = 'critical';
    } else if (totalImpacted > 5 || missingFoundations.length > 3) {
      severity = 'high';
    } else if (totalImpacted > 2 || missingFoundations.length > 1) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    // Determine optimal sequence to address gaps
    const recommendedSequence = this.determineOptimalSequence(
      missingFoundations,
      dependencyGraph
    );

    // Estimate remediation time
    const estimatedRemediationTime = this.estimateRemediationTime(
      missingFoundations,
      conceptMap
    );

    // Find blocked objectives
    const blockedObjectives = this.findBlockedObjectives(
      missingFoundations,
      learningState,
      conceptMap
    );

    return {
      missingFoundations,
      impactedConcepts,
      severity,
      recommendedSequence,
      estimatedRemediationTime,
      blockedObjectives
    };
  }

  /**
   * Assess skill levels across multiple domains
   * Requirement 1.5: Skill level assessment across multiple domains
   */
  assessSkillDomains(
    conceptMap: ConceptMap,
    domains: string[]
  ): SkillDomainAssessment[] {
    const assessments: SkillDomainAssessment[] = [];

    for (const domain of domains) {
      // Find all concepts in this domain
      const domainConcepts = Object.values(conceptMap.concepts)
        .filter(c => c.category === domain || c.category.startsWith(domain + '.'));

      if (domainConcepts.length === 0) continue;

      // Extract sub-domains
      const subDomains = new Set<string>();
      domainConcepts.forEach(c => {
        const parts = c.category.split('.');
        if (parts.length > 1) {
          subDomains.add(parts[1]);
        }
      });

      // Calculate overall mastery level
      let totalMastery = 0;
      let masteredCount = 0;
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const gaps: Gap[] = [];

      for (const concept of domainConcepts) {
        const mastery = conceptMap.masteryLevels.get(concept.id);
        
        if (mastery) {
          const masteryValue = this.masteryLevelToNumber(mastery.level);
          totalMastery += masteryValue;

          if (mastery.level === 'mastered' || mastery.level === 'proficient') {
            masteredCount++;
            strengths.push(concept.id);
          } else if (mastery.level === 'introduced' || mastery.level === 'unknown') {
            weaknesses.push(concept.id);
            
            gaps.push({
              conceptId: concept.id,
              severity: 'moderate',
              description: `${concept.name} needs improvement in ${domain}`,
              suggestedActions: [
                `Practice ${concept.name}`,
                `Review ${domain} fundamentals`,
                `Complete exercises for ${concept.name}`
              ],
              detectedAt: Date.now(),
              concept: concept.id,
              relatedConcepts: concept.relatedConcepts
            });
          }
        }
      }

      const overallLevel = domainConcepts.length > 0 
        ? totalMastery / domainConcepts.length 
        : 0;
      
      const conceptCoverage = domainConcepts.length > 0
        ? masteredCount / domainConcepts.length
        : 0;

      // Determine recommended focus areas
      const recommendedFocus = this.determineRecommendedFocus(
        weaknesses,
        conceptMap,
        domain
      );

      assessments.push({
        domain,
        subDomains: Array.from(subDomains),
        overallLevel,
        conceptCoverage,
        strengths: strengths.slice(0, 5), // Top 5 strengths
        weaknesses: weaknesses.slice(0, 5), // Top 5 weaknesses
        gaps,
        recommendedFocus
      });
    }

    return assessments;
  }

  /**
   * Track and analyze learning velocity
   * Requirement 2.5: Learning velocity tracking and adaptation
   */
  trackLearningVelocity(
    studentId: string,
    profile: EnhancedStudentProfile,
    conceptMap: ConceptMap,
    timeWindow: number = 7 * 24 * 60 * 60 * 1000 // Default: 7 days
  ): LearningVelocityMetrics {
    const cutoffTime = Date.now() - timeWindow;
    
    // Count concepts mastered in time window
    let conceptsMastered = 0;
    let conceptsIntroduced = 0;
    const masteryTimes: number[] = [];

    for (const [conceptId, mastery] of conceptMap.masteryLevels) {
      if (mastery.lastAssessed > cutoffTime) {
        if (mastery.level === 'mastered') {
          conceptsMastered++;
          
          // Estimate time to mastery from evidence
          const timeToMastery = this.estimateTimeToMastery(mastery.evidence);
          if (timeToMastery > 0) {
            masteryTimes.push(timeToMastery);
          }
        } else if (mastery.level === 'introduced') {
          conceptsIntroduced++;
        }
      }
    }

    // Calculate average time to mastery
    const averageTimeToMastery = masteryTimes.length > 0
      ? masteryTimes.reduce((a, b) => a + b, 0) / masteryTimes.length
      : 0;

    // Calculate mastery rate (concepts per hour)
    const hoursInWindow = timeWindow / (1000 * 60 * 60);
    const masteryRate = conceptsMastered / hoursInWindow;

    // Calculate progression rate from session history
    const progressionRate = this.calculateProgressionRate(profile, cutoffTime);

    // Get retention score from profile
    const retentionScore = profile.learningVelocity.retentionRate;

    // Determine if adaptation is needed
    let adaptationNeeded: LearningVelocityMetrics['adaptationNeeded'];
    if (masteryRate > 2 && retentionScore > 0.8) {
      adaptationNeeded = 'accelerate';
    } else if (masteryRate < 0.5 || retentionScore < 0.5) {
      adaptationNeeded = 'decelerate';
    } else {
      adaptationNeeded = 'maintain';
    }

    // Project completion time for current objectives
    const projectedCompletion = this.projectCompletionTime(
      conceptsIntroduced,
      masteryRate,
      averageTimeToMastery
    );

    return {
      studentId,
      timeWindow,
      conceptsMastered,
      conceptsIntroduced,
      averageTimeToMastery,
      masteryRate,
      progressionRate,
      retentionScore,
      adaptationNeeded,
      projectedCompletion
    };
  }

  /**
   * Generate comprehensive knowledge gap report
   */
  generateKnowledgeGapReport(
    conceptMap: ConceptMap,
    learningState: LearningState,
    profile: EnhancedStudentProfile
  ): {
    dependencyGraph: ConceptDependencyGraph;
    foundationalAnalysis: FoundationalKnowledgeAnalysis;
    skillAssessments: SkillDomainAssessment[];
    velocityMetrics: LearningVelocityMetrics;
    prioritizedGaps: Gap[];
    actionPlan: string[];
  } {
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(conceptMap);

    // Analyze foundational knowledge
    const foundationalAnalysis = this.identifyMissingFoundations(
      conceptMap,
      learningState
    );

    // Assess skill domains
    const domains = this.extractDomains(conceptMap);
    const skillAssessments = this.assessSkillDomains(conceptMap, domains);

    // Track learning velocity
    const velocityMetrics = this.trackLearningVelocity(
      learningState.studentId,
      profile,
      conceptMap
    );

    // Prioritize gaps
    const prioritizedGaps = this.prioritizeGaps(
      conceptMap.knowledgeGaps,
      foundationalAnalysis,
      skillAssessments
    );

    // Generate action plan
    const actionPlan = this.generateActionPlan(
      foundationalAnalysis,
      prioritizedGaps,
      velocityMetrics
    );

    return {
      dependencyGraph,
      foundationalAnalysis,
      skillAssessments,
      velocityMetrics,
      prioritizedGaps,
      actionPlan
    };
  }

  // Private helper methods

  private calculateTopologicalLevels(
    nodes: Map<string, ConceptNode>,
    edges: DependencyEdge[]
  ): Map<string, number> {
    const levels = new Map<string, number>();
    const inDegree = new Map<string, number>();

    // Initialize in-degrees
    for (const [conceptId] of nodes) {
      inDegree.set(conceptId, 0);
    }

    for (const edge of edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    // Find nodes with no dependencies (level 0)
    const queue: string[] = [];
    for (const [conceptId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(conceptId);
        levels.set(conceptId, 0);
      }
    }

    // Process nodes level by level
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;

      const node = nodes.get(current);
      if (!node) continue;

      for (const dependent of node.dependents) {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);

        const existingLevel = levels.get(dependent) || 0;
        levels.set(dependent, Math.max(existingLevel, currentLevel + 1));

        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    return levels;
  }

  private markCriticalPath(
    nodes: Map<string, ConceptNode>,
    edges: DependencyEdge[]
  ): void {
    // Mark concepts that are hard prerequisites for many other concepts
    for (const edge of edges) {
      if (edge.type === 'hard') {
        const fromNode = nodes.get(edge.from);
        if (fromNode && fromNode.dependents.length >= 3) {
          fromNode.criticalPath = true;
        }
      }
    }
  }

  private findDependentConcepts(
    conceptId: string,
    graph: ConceptDependencyGraph
  ): string[] {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const dependent of node.dependents) {
        dependents.add(dependent);
        traverse(dependent);
      }
    };

    traverse(conceptId);
    return Array.from(dependents);
  }

  private determineOptimalSequence(
    concepts: string[],
    graph: ConceptDependencyGraph
  ): string[] {
    // Sort by topological level (foundational first)
    return concepts.sort((a, b) => {
      const levelA = graph.levels.get(a) || 0;
      const levelB = graph.levels.get(b) || 0;
      return levelA - levelB;
    });
  }

  private estimateRemediationTime(
    concepts: string[],
    conceptMap: ConceptMap
  ): number {
    let totalTime = 0;

    for (const conceptId of concepts) {
      const concept = conceptMap.concepts[conceptId];
      if (!concept) continue;

      // Estimate based on difficulty
      const baseTime = this.difficultyToMinutes(concept.difficulty);
      totalTime += baseTime;
    }

    return totalTime;
  }

  private difficultyToMinutes(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'beginner': return 15;
      case 'easy': return 20;
      case 'intermediate': return 30;
      case 'medium': return 30;
      case 'hard': return 40;
      case 'advanced': return 45;
      default: return 25;
    }
  }

  private findBlockedObjectives(
    missingConcepts: string[],
    learningState: LearningState,
    conceptMap: ConceptMap
  ): string[] {
    const blocked: string[] = [];

    for (const objective of learningState.currentObjectives) {
      // Check if any missing concept is a prerequisite for this objective
      const objectiveConcepts = this.extractConceptsFromObjective(objective.id, conceptMap);
      
      for (const conceptId of objectiveConcepts) {
        const concept = conceptMap.concepts[conceptId];
        if (!concept) continue;

        const hasBlockedPrereq = concept.prerequisites.some(
          prereq => missingConcepts.includes(prereq)
        );

        if (hasBlockedPrereq) {
          blocked.push(objective.id);
          break;
        }
      }
    }

    return blocked;
  }

  private extractConceptsFromObjective(
    objectiveId: string,
    conceptMap: ConceptMap
  ): string[] {
    // Simple implementation - in production, would have explicit mapping
    const concepts: string[] = [];
    
    for (const conceptId in conceptMap.concepts) {
      // Match concepts that might relate to this objective
      if (conceptId.includes(objectiveId) || objectiveId.includes(conceptId)) {
        concepts.push(conceptId);
      }
    }

    return concepts;
  }

  private masteryLevelToNumber(level: MasteryLevel['level']): number {
    switch (level) {
      case 'mastered': return 1.0;
      case 'proficient': return 0.75;
      case 'developing': return 0.5;
      case 'introduced': return 0.25;
      case 'unknown': return 0;
      default: return 0;
    }
  }

  private determineRecommendedFocus(
    weaknesses: string[],
    conceptMap: ConceptMap,
    domain: string
  ): string[] {
    const focus: string[] = [];

    // Prioritize foundational concepts
    for (const conceptId of weaknesses.slice(0, 3)) {
      const concept = conceptMap.concepts[conceptId];
      if (concept && concept.prerequisites.length === 0) {
        focus.push(conceptId);
      }
    }

    // Add concepts with most dependents
    const remaining = weaknesses.filter(w => !focus.includes(w));
    for (const conceptId of remaining.slice(0, 2)) {
      focus.push(conceptId);
    }

    return focus;
  }

  private estimateTimeToMastery(evidence: AssessmentEvidence[]): number {
    if (evidence.length < 2) return 0;

    const firstEvidence = evidence[0];
    const lastEvidence = evidence[evidence.length - 1];

    return lastEvidence.timestamp - firstEvidence.timestamp;
  }

  private calculateProgressionRate(
    profile: EnhancedStudentProfile,
    cutoffTime: number
  ): number {
    const recentSessions = profile.sessionHistory.filter(
      s => s.startTime > cutoffTime
    );

    if (recentSessions.length === 0) return 0;

    let progressionCount = 0;
    for (const session of recentSessions) {
      // Count difficulty increases
      for (let i = 1; i < session.activities.length; i++) {
        const prev = session.activities[i - 1];
        const curr = session.activities[i];
        
        if (this.difficultyToNumber(curr.difficulty) > this.difficultyToNumber(prev.difficulty)) {
          progressionCount++;
        }
      }
    }

    const totalActivities = recentSessions.reduce(
      (sum, s) => sum + s.activities.length, 0
    );

    return totalActivities > 0 ? progressionCount / totalActivities : 0;
  }

  private difficultyToNumber(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'easy': return 1.5;
      case 'intermediate': return 2;
      case 'medium': return 2.5;
      case 'hard': return 3;
      case 'advanced': return 3.5;
      default: return 1;
    }
  }

  private projectCompletionTime(
    remainingConcepts: number,
    masteryRate: number,
    averageTimeToMastery: number
  ): number {
    if (masteryRate === 0) {
      return averageTimeToMastery * remainingConcepts;
    }

    const hoursNeeded = remainingConcepts / masteryRate;
    return hoursNeeded * 60 * 60 * 1000; // Convert to milliseconds
  }

  private extractDomains(conceptMap: ConceptMap): string[] {
    const domains = new Set<string>();

    for (const conceptId in conceptMap.concepts) {
      const concept = conceptMap.concepts[conceptId];
      const domain = concept.category.split('.')[0];
      domains.add(domain);
    }

    return Array.from(domains);
  }

  private prioritizeGaps(
    gaps: Gap[],
    foundationalAnalysis: FoundationalKnowledgeAnalysis,
    skillAssessments: SkillDomainAssessment[]
  ): Gap[] {
    // Create priority scores for each gap
    const scoredGaps = gaps.map(gap => {
      let score = 0;

      // Higher priority for foundational gaps
      if (foundationalAnalysis.missingFoundations.includes(gap.conceptId)) {
        score += 10;
      }

      // Higher priority based on severity
      if (typeof gap.severity === 'string') {
        switch (gap.severity) {
          case 'critical': score += 8; break;
          case 'major': score += 6; break;
          case 'moderate': score += 4; break;
          case 'minor': score += 2; break;
        }
      } else {
        score += gap.severity * 8;
      }

      // Higher priority if it blocks many concepts
      const impactedCount = foundationalAnalysis.impactedConcepts.get(gap.conceptId)?.length || 0;
      score += Math.min(impactedCount, 5);

      return { gap, score };
    });

    // Sort by score (highest first)
    scoredGaps.sort((a, b) => b.score - a.score);

    return scoredGaps.map(sg => sg.gap);
  }

  private generateActionPlan(
    foundationalAnalysis: FoundationalKnowledgeAnalysis,
    prioritizedGaps: Gap[],
    velocityMetrics: LearningVelocityMetrics
  ): string[] {
    const plan: string[] = [];

    // Address foundational gaps first
    if (foundationalAnalysis.missingFoundations.length > 0) {
      plan.push('Phase 1: Address Foundational Knowledge');
      for (const conceptId of foundationalAnalysis.recommendedSequence.slice(0, 3)) {
        plan.push(`  - Review and practice: ${conceptId}`);
      }
    }

    // Address high-priority gaps
    if (prioritizedGaps.length > 0) {
      plan.push('Phase 2: Fill Critical Knowledge Gaps');
      for (const gap of prioritizedGaps.slice(0, 3)) {
        plan.push(`  - ${gap.suggestedActions[0]}`);
      }
    }

    // Adjust pacing based on velocity
    if (velocityMetrics.adaptationNeeded === 'accelerate') {
      plan.push('Phase 3: Accelerate Learning');
      plan.push('  - Increase difficulty level');
      plan.push('  - Introduce advanced concepts');
    } else if (velocityMetrics.adaptationNeeded === 'decelerate') {
      plan.push('Phase 3: Consolidate Learning');
      plan.push('  - Provide additional practice');
      plan.push('  - Review recent concepts');
    } else {
      plan.push('Phase 3: Continue Current Pace');
      plan.push('  - Maintain current difficulty progression');
    }

    return plan;
  }
}

/**
 * Singleton instance for global access
 */
export const knowledgeGapSystem = new KnowledgeGapIdentificationSystem();
