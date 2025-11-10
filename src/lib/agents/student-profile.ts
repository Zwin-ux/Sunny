/**
 * Enhanced Student Profiling System
 * Comprehensive data models for student profiles, learning analytics, and behavioral tracking
 */

import { 
  EnhancedStudentProfile, 
  CognitiveProfile, 
  MotivationProfile,
  LearningVelocityData,
  ResponsePattern,
  EngagementPattern,
  ActivityPreference,
  TimePreference,
  AttentionSpanData,
  LearningSession,
  ProgressEvent,
  InterventionEvent,
  ConceptMap,
  Concept,
  ConceptRelationship,
  MasteryLevel,
  Gap,
  AssessmentEvidence,
  ActivityType
} from './types';
import { StudentProfile, LearningStyle, DifficultyLevel } from '@/types/chat';

/**
 * Student Profile Manager
 * Manages creation, updates, and queries for enhanced student profiles
 */
export class StudentProfileManager {
  private profiles: Map<string, EnhancedStudentProfile> = new Map();

  /**
   * Create a new enhanced student profile from a basic profile
   */
  createEnhancedProfile(basicProfile: StudentProfile, studentId: string): EnhancedStudentProfile {
    const enhancedProfile: EnhancedStudentProfile = {
      ...basicProfile,
      
      // Cognitive Profile - initialized with neutral values
      cognitiveProfile: this.initializeCognitiveProfile(),
      
      // Motivation Profile - initialized with neutral values
      motivationFactors: this.initializeMotivationProfile(),
      
      // Learning Velocity - initialized with baseline values
      learningVelocity: this.initializeLearningVelocity(),
      
      // Patterns - empty initially, populated through observation
      responsePatterns: [],
      engagementPatterns: [],
      
      // Preferences - initialized with defaults
      preferredActivityTypes: this.initializeActivityPreferences(),
      optimalLearningTimes: [],
      attentionSpanData: this.initializeAttentionSpanData(),
      
      // Historical Data - empty initially
      sessionHistory: [],
      progressTimeline: [],
      interventionHistory: []
    };

    this.profiles.set(studentId, enhancedProfile);
    return enhancedProfile;
  }

  /**
   * Get an enhanced profile by student ID
   */
  getProfile(studentId: string): EnhancedStudentProfile | undefined {
    return this.profiles.get(studentId);
  }

  /**
   * Update cognitive profile based on observed behavior
   */
  updateCognitiveProfile(
    studentId: string, 
    updates: Partial<CognitiveProfile>
  ): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.cognitiveProfile = {
      ...profile.cognitiveProfile,
      ...updates
    };
  }

  /**
   * Update motivation profile based on engagement patterns
   */
  updateMotivationProfile(
    studentId: string,
    updates: Partial<MotivationProfile>
  ): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.motivationFactors = {
      ...profile.motivationFactors,
      ...updates
    };
  }

  /**
   * Add a response pattern observation
   */
  addResponsePattern(studentId: string, pattern: ResponsePattern): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    // Check if pattern already exists and update, or add new
    const existingIndex = profile.responsePatterns.findIndex(p => p.type === pattern.type);
    if (existingIndex >= 0) {
      profile.responsePatterns[existingIndex] = pattern;
    } else {
      profile.responsePatterns.push(pattern);
    }
  }

  /**
   * Add an engagement pattern observation
   */
  addEngagementPattern(studentId: string, pattern: EngagementPattern): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.engagementPatterns.push(pattern);
    
    // Keep only recent patterns (last 50)
    if (profile.engagementPatterns.length > 50) {
      profile.engagementPatterns = profile.engagementPatterns.slice(-50);
    }
  }

  /**
   * Update activity preferences based on effectiveness
   */
  updateActivityPreference(
    studentId: string,
    activityType: ActivityType,
    preference: number,
    effectiveness: number,
    optimalDuration: number
  ): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    const existingIndex = profile.preferredActivityTypes.findIndex(
      p => p.activityType === activityType
    );

    const updatedPreference: ActivityPreference = {
      activityType,
      preference,
      effectiveness,
      optimalDuration
    };

    if (existingIndex >= 0) {
      profile.preferredActivityTypes[existingIndex] = updatedPreference;
    } else {
      profile.preferredActivityTypes.push(updatedPreference);
    }
  }

  /**
   * Record a learning session
   */
  addLearningSession(studentId: string, session: LearningSession): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.sessionHistory.push(session);
    
    // Keep only recent sessions (last 100)
    if (profile.sessionHistory.length > 100) {
      profile.sessionHistory = profile.sessionHistory.slice(-100);
    }
  }

  /**
   * Add a progress event
   */
  addProgressEvent(studentId: string, event: ProgressEvent): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.progressTimeline.push(event);
  }

  /**
   * Record an intervention event
   */
  addInterventionEvent(studentId: string, event: InterventionEvent): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.interventionHistory.push(event);
    
    // Keep only recent interventions (last 100)
    if (profile.interventionHistory.length > 100) {
      profile.interventionHistory = profile.interventionHistory.slice(-100);
    }
  }

  /**
   * Update learning velocity metrics
   */
  updateLearningVelocity(
    studentId: string,
    updates: Partial<LearningVelocityData>
  ): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.learningVelocity = {
      ...profile.learningVelocity,
      ...updates
    };
  }

  /**
   * Update attention span data
   */
  updateAttentionSpan(
    studentId: string,
    updates: Partial<AttentionSpanData>
  ): void {
    const profile = this.profiles.get(studentId);
    if (!profile) return;

    profile.attentionSpanData = {
      ...profile.attentionSpanData,
      ...updates
    };
  }

  // Private initialization methods

  private initializeCognitiveProfile(): CognitiveProfile {
    return {
      processingSpeed: 0.5,
      workingMemoryCapacity: 0.5,
      attentionControl: 0.5,
      metacognition: 0.5
    };
  }

  private initializeMotivationProfile(): MotivationProfile {
    return {
      intrinsicMotivation: 0.5,
      extrinsicMotivation: 0.5,
      competitiveSpirit: 0.5,
      collaborativePreference: 0.5,
      autonomyPreference: 0.5
    };
  }

  private initializeLearningVelocity(): LearningVelocityData {
    return {
      conceptAcquisitionRate: 1.0,
      skillDevelopmentRate: 1.0,
      retentionRate: 0.7,
      transferRate: 0.5
    };
  }

  private initializeActivityPreferences(): ActivityPreference[] {
    const activityTypes: ActivityType[] = [
      'quiz', 'lesson', 'game', 'discussion', 'creative', 'practice', 'assessment', 'exploration'
    ];

    return activityTypes.map(type => ({
      activityType: type,
      preference: 0.5,
      effectiveness: 0.5,
      optimalDuration: 15
    }));
  }

  private initializeAttentionSpanData(): AttentionSpanData {
    return {
      averageSpan: 20,
      peakSpan: 30,
      declinePattern: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5],
      recoveryTime: 5
    };
  }
}

/**
 * Concept Map Manager
 * Manages knowledge graphs and concept relationships
 */
export class ConceptMapManager {
  /**
   * Create an empty concept map
   */
  createConceptMap(): ConceptMap {
    return {
      concepts: {},
      relationships: [],
      masteryLevels: new Map(),
      knowledgeGaps: []
    };
  }

  /**
   * Add a concept to the map
   */
  addConcept(conceptMap: ConceptMap, concept: Concept): void {
    conceptMap.concepts[concept.id] = concept;
    
    // Initialize mastery level if not exists
    if (!conceptMap.masteryLevels.has(concept.id)) {
      conceptMap.masteryLevels.set(concept.id, {
        conceptId: concept.id,
        level: 'unknown',
        confidence: 0,
        lastAssessed: Date.now(),
        evidence: []
      });
    }
  }

  /**
   * Add a relationship between concepts
   */
  addRelationship(conceptMap: ConceptMap, relationship: ConceptRelationship): void {
    // Check if relationship already exists
    const exists = conceptMap.relationships.some(
      r => r.fromConcept === relationship.fromConcept && 
           r.toConcept === relationship.toConcept &&
           r.type === relationship.type
    );

    if (!exists) {
      conceptMap.relationships.push(relationship);
    }
  }

  /**
   * Update mastery level for a concept
   */
  updateMasteryLevel(
    conceptMap: ConceptMap,
    conceptId: string,
    level: MasteryLevel['level'],
    confidence: number,
    evidence: AssessmentEvidence
  ): void {
    const existing = conceptMap.masteryLevels.get(conceptId);
    
    const updatedMastery: MasteryLevel = {
      conceptId,
      level,
      confidence,
      lastAssessed: Date.now(),
      evidence: existing ? [...existing.evidence, evidence] : [evidence]
    };

    // Keep only recent evidence (last 20)
    if (updatedMastery.evidence.length > 20) {
      updatedMastery.evidence = updatedMastery.evidence.slice(-20);
    }

    conceptMap.masteryLevels.set(conceptId, updatedMastery);
  }

  /**
   * Identify knowledge gaps based on concept relationships
   */
  identifyKnowledgeGaps(conceptMap: ConceptMap): Gap[] {
    const gaps: Gap[] = [];

    // Check for missing prerequisites
    for (const conceptId in conceptMap.concepts) {
      const concept = conceptMap.concepts[conceptId];
      const mastery = conceptMap.masteryLevels.get(conceptId);

      if (mastery && mastery.level !== 'unknown' && mastery.level !== 'mastered') {
        // Check if prerequisites are mastered
        for (const prereqId of concept.prerequisites) {
          const prereqMastery = conceptMap.masteryLevels.get(prereqId);
          
          if (!prereqMastery || prereqMastery.level === 'unknown' || prereqMastery.level === 'introduced') {
            gaps.push({
              conceptId: prereqId,
              severity: 'major',
              description: `Prerequisite for ${concept.name} not mastered`,
              suggestedActions: [`Review ${prereqId}`, `Practice ${prereqId} exercises`],
              detectedAt: Date.now(),
              concept: prereqId,
              relatedConcepts: [conceptId]
            });
          }
        }
      }
    }

    conceptMap.knowledgeGaps = gaps;
    return gaps;
  }

  /**
   * Get concepts by mastery level
   */
  getConceptsByMastery(
    conceptMap: ConceptMap,
    level: MasteryLevel['level']
  ): Concept[] {
    const concepts: Concept[] = [];

    for (const [conceptId, mastery] of conceptMap.masteryLevels) {
      if (mastery.level === level && conceptMap.concepts[conceptId]) {
        concepts.push(conceptMap.concepts[conceptId]);
      }
    }

    return concepts;
  }

  /**
   * Get prerequisite chain for a concept
   */
  getPrerequisiteChain(conceptMap: ConceptMap, conceptId: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const concept = conceptMap.concepts[id];
      if (!concept) return;

      for (const prereqId of concept.prerequisites) {
        traverse(prereqId);
        chain.push(prereqId);
      }
    };

    traverse(conceptId);
    return chain;
  }

  /**
   * Get related concepts
   */
  getRelatedConcepts(conceptMap: ConceptMap, conceptId: string): Concept[] {
    const related: Concept[] = [];
    const relatedIds = new Set<string>();

    // Find relationships
    for (const rel of conceptMap.relationships) {
      if (rel.fromConcept === conceptId && rel.type === 'related') {
        relatedIds.add(rel.toConcept);
      } else if (rel.toConcept === conceptId && rel.type === 'related') {
        relatedIds.add(rel.fromConcept);
      }
    }

    // Get concept objects
    for (const id of relatedIds) {
      if (conceptMap.concepts[id]) {
        related.push(conceptMap.concepts[id]);
      }
    }

    return related;
  }
}

/**
 * Learning Analytics Data Models
 * Interfaces for tracking and analyzing learning metrics
 */

export interface LearningAnalytics {
  studentId: string;
  timeWindow: TimeWindow;
  
  // Performance Metrics
  comprehensionRate: number;
  retentionRate: number;
  transferRate: number;
  
  // Engagement Metrics
  attentionSpan: number;
  interactionFrequency: number;
  motivationLevel: number;
  
  // Learning Efficiency
  conceptAcquisitionRate: number;
  errorPatterns: ErrorPattern[];
  optimalDifficultyCurve: DifficultyPoint[];
  
  // Predictive Insights
  riskFactors: RiskFactor[];
  recommendations: AnalyticsRecommendation[];
  nextOptimalActivities: string[];
}

export interface TimeWindow {
  start: number;
  end: number;
  duration: number;
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  contexts: string[];
  suggestedInterventions: string[];
}

export interface DifficultyPoint {
  timestamp: number;
  difficulty: DifficultyLevel;
  performance: number;
  engagement: number;
}

export interface RiskFactor {
  type: 'disengagement' | 'frustration' | 'knowledge_gap' | 'pacing';
  severity: number;
  description: string;
  indicators: string[];
  recommendedActions: string[];
}

export interface AnalyticsRecommendation {
  type: 'content' | 'pacing' | 'intervention' | 'strategy';
  priority: 'low' | 'medium' | 'high';
  description: string;
  rationale: string;
  expectedImpact: number;
}

/**
 * Performance Tracking Models
 */

export interface PerformanceMetrics {
  studentId: string;
  sessionId: string;
  
  // Accuracy Metrics
  correctResponses: number;
  totalResponses: number;
  accuracyRate: number;
  
  // Speed Metrics
  averageResponseTime: number;
  responseTimeVariance: number;
  
  // Progress Metrics
  conceptsMastered: number;
  skillsAcquired: number;
  objectivesCompleted: number;
  
  // Quality Metrics
  responseQuality: number;
  explanationDepth: number;
  criticalThinking: number;
}

export interface EngagementMetrics {
  studentId: string;
  sessionId: string;
  
  // Interaction Metrics
  messageCount: number;
  averageMessageLength: number;
  questionAsked: number;
  
  // Attention Metrics
  focusDuration: number;
  distractionEvents: number;
  reengagementTime: number;
  
  // Emotional Metrics
  positiveIndicators: number;
  negativeIndicators: number;
  frustrationLevel: number;
  enthusiasmLevel: number;
}

/**
 * Singleton instance for global access
 */
export const studentProfileManager = new StudentProfileManager();
export const conceptMapManager = new ConceptMapManager();
