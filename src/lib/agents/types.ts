// Core types for the Agentic Learning Engine
import { LearningStyle, DifficultyLevel, StudentProfile } from '@/types/chat';

export type AgentType = 
  | 'assessment' 
  | 'contentGeneration' 
  | 'pathPlanning' 
  | 'intervention' 
  | 'communication' 
  | 'orchestrator';

export type MessageType = 
  | 'request' 
  | 'response' 
  | 'event' 
  | 'notification' 
  | 'error';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | 'orchestrator';
  type: MessageType;
  payload: any;
  timestamp: number;
  priority: Priority;
  correlationId?: string; // For tracking related messages
}

export interface AgentResponse {
  messageId: string;
  success: boolean;
  data?: any;
  error?: string;
  recommendations?: Recommendation[];
  metadata?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  type: 'action' | 'content' | 'strategy' | 'intervention';
  priority: Priority;
  description: string;
  data: any;
  confidence: number; // 0-1 confidence score
  reasoning?: string;
}

// Learning State Management
export interface LearningState {
  studentId: string;
  sessionId: string;
  currentObjectives: LearningObjective[];
  knowledgeMap: ConceptMap;
  engagementMetrics: EngagementData;
  learningPath: PathNode[];
  currentActivity?: Activity;
  contextHistory: ContextEntry[];
  lastUpdated: number;
  lastActivityTimestamp?: number;
  currentDifficulty?: DifficultyLevel;
  sessionStartTime?: number;
  recentAchievements?: string[];
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  targetLevel: DifficultyLevel;
  prerequisites: string[]; // IDs of prerequisite objectives
  estimatedDuration: number; // in minutes
  priority: Priority;
  progress: number; // 0-1 completion percentage
}

export interface ConceptMap {
  concepts: Record<string, Concept>; // Maps concept ID to Concept object
  relationships: ConceptRelationship[];
  masteryLevels: Map<string, MasteryLevel>;
  knowledgeGaps: Gap[];
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: DifficultyLevel;
  prerequisites: string[];
  relatedConcepts: string[];
  interactions?: any[];
  masteryLevel?: number;
  lastReviewed?: number;
}

export interface ConceptRelationship {
  fromConcept: string;
  toConcept: string;
  type: 'prerequisite' | 'related' | 'builds-on' | 'applies-to';
  strength: number; // 0-1 relationship strength
}

export interface MasteryLevel {
  conceptId: string;
  level: 'unknown' | 'introduced' | 'developing' | 'proficient' | 'mastered';
  confidence: number; // 0-1 confidence in assessment
  lastAssessed: number;
  evidence: AssessmentEvidence[];
}

export interface Gap {
  conceptId: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical' | number;
  description?: string;
  suggestedActions: string[];
  detectedAt: number;
  concept?: string;
  relatedConcepts?: string[];
}

// Alias for backwards compatibility
export type KnowledgeGap = Gap;

export interface AssessmentEvidence {
  type: 'response' | 'time' | 'pattern' | 'behavior';
  value: any;
  timestamp: number;
  weight: number; // How much this evidence should influence assessment
}

// Engagement and Analytics
export interface EngagementData {
  currentLevel: number; // 0-1 engagement score
  attentionSpan: number; // in minutes
  interactionFrequency: number; // interactions per minute
  responseTime: number; // average response time in seconds
  frustrationLevel: number; // 0-1 frustration indicator
  motivationLevel: number; // 0-1 motivation indicator
  preferredActivityTypes: ActivityType[];
  engagementHistory: EngagementPoint[];
  interactionRate?: number;
  responseQuality?: number;
  focusLevel?: number;
}

export interface EngagementPoint {
  timestamp: number;
  level: number;
  activity: string;
  factors: string[]; // What influenced engagement at this point
}

// Learning Path and Activities
export interface PathNode {
  id: string;
  type: 'concept' | 'activity' | 'assessment' | 'break';
  content: any;
  prerequisites: string[];
  estimatedDuration: number;
  adaptationRules: AdaptationRule[];
  completed: boolean;
  startedAt?: number;
  completedAt?: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  content: any;
  difficulty: DifficultyLevel;
  learningStyles: LearningStyle[];
  estimatedDuration: number;
  objectives: string[]; // Learning objective IDs
  metadata: ActivityMetadata;
}

export type ActivityType = 
  | 'quiz' 
  | 'lesson' 
  | 'game' 
  | 'discussion' 
  | 'creative' 
  | 'practice' 
  | 'assessment' 
  | 'exploration';

export interface ActivityMetadata {
  generatedBy: AgentType;
  generatedAt: number;
  adaptationHistory: AdaptationEvent[];
  effectivenessScore?: number;
  studentFeedback?: string;
}

export interface AdaptationRule {
  condition: string; // Condition that triggers adaptation
  action: string; // What to do when condition is met
  priority: Priority;
}

export interface AdaptationEvent {
  timestamp: number;
  trigger: string;
  action: string;
  result: string;
  effectiveness?: number;
}

// Context and Memory
export interface ContextEntry {
  id: string;
  type: 'conversation' | 'activity' | 'assessment' | 'event';
  content: any;
  timestamp: number;
  importance: number; // 0-1 importance for future reference
  tags: string[];
}

// Enhanced Student Profile for Agents
export interface EnhancedStudentProfile extends StudentProfile {
  // Cognitive Profile
  cognitiveProfile: CognitiveProfile;
  motivationFactors: MotivationProfile;
  
  // Learning Patterns
  learningVelocity: LearningVelocityData;
  responsePatterns: ResponsePattern[];
  engagementPatterns: EngagementPattern[];
  
  // Behavioral Data
  preferredActivityTypes: ActivityPreference[];
  optimalLearningTimes: TimePreference[];
  attentionSpanData: AttentionSpanData;
  
  // Historical Performance
  sessionHistory: LearningSession[];
  progressTimeline: ProgressEvent[];
  interventionHistory: InterventionEvent[];
}

export interface CognitiveProfile {
  processingSpeed: number; // 0-1 relative processing speed
  workingMemoryCapacity: number; // 0-1 working memory strength
  attentionControl: number; // 0-1 attention control ability
  metacognition: number; // 0-1 self-awareness of learning
}

export interface MotivationProfile {
  intrinsicMotivation: number; // 0-1 internal motivation level
  extrinsicMotivation: number; // 0-1 external motivation responsiveness
  competitiveSpirit: number; // 0-1 competitiveness
  collaborativePreference: number; // 0-1 preference for group work
  autonomyPreference: number; // 0-1 preference for self-directed learning
}

export interface LearningVelocityData {
  conceptAcquisitionRate: number; // concepts per hour
  skillDevelopmentRate: number; // skill points per hour
  retentionRate: number; // 0-1 retention after 24 hours
  transferRate: number; // 0-1 ability to apply learning to new contexts
}

export interface ResponsePattern {
  type: 'quick' | 'thoughtful' | 'impulsive' | 'hesitant';
  frequency: number; // 0-1 how often this pattern occurs
  contexts: string[]; // When this pattern typically appears
  effectiveness: number; // 0-1 how effective this pattern is for learning
}

export interface EngagementPattern {
  trigger: string; // What causes this engagement pattern
  duration: number; // How long the pattern typically lasts
  intensity: number; // 0-1 intensity of engagement
  recovery: number; // How quickly engagement recovers
}

export interface ActivityPreference {
  activityType: ActivityType;
  preference: number; // 0-1 preference score
  effectiveness: number; // 0-1 learning effectiveness
  optimalDuration: number; // Optimal duration in minutes
}

export interface TimePreference {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  effectiveness: number; // 0-1 learning effectiveness at this time
}

export interface AttentionSpanData {
  averageSpan: number; // Average attention span in minutes
  peakSpan: number; // Maximum observed attention span
  declinePattern: number[]; // How attention declines over time
  recoveryTime: number; // Time needed to recover attention
}

export interface LearningSession {
  id: string;
  startTime: number;
  endTime: number;
  activities: Activity[];
  objectives: LearningObjective[];
  outcomes: SessionOutcome[];
  engagementData: EngagementData;
  interventions: InterventionEvent[];
}

export interface SessionOutcome {
  objectiveId: string;
  achieved: boolean;
  progress: number; // 0-1 progress made
  evidence: AssessmentEvidence[];
}

export interface ProgressEvent {
  timestamp: number;
  type: 'concept_mastered' | 'skill_developed' | 'objective_completed' | 'level_advanced';
  description: string;
  data: any;
}

export interface InterventionEvent {
  timestamp: number;
  trigger: string;
  intervention: string;
  agent: AgentType;
  effectiveness?: number; // 0-1 effectiveness rating
  studentResponse?: string;
}

// Event System
export interface AgentEvent {
  id: string;
  type: string;
  source: AgentType;
  data: any;
  timestamp: number;
  priority: Priority;
}

export interface EventHandler {
  eventType: string;
  handler: (event: AgentEvent) => Promise<void>;
  priority: Priority;
}