/**
 * Data Persistence Layer for Agentic Learning Engine
 * Provides interfaces to store and retrieve learning data from the database
 * 
 * Requirements: 5.1, 8.1, 8.4
 */

import {
  EnhancedStudentProfile,
  LearningSession,
  ProgressEvent,
  InterventionEvent,
  ResponsePattern,
  EngagementPattern,
  ActivityPreference,
  ConceptMap,
  Concept,
  ConceptRelationship,
  MasteryLevel,
  Gap,
  AssessmentEvidence,
  AgentType
} from './types';
import {
  LearningAnalytics,
  PerformanceMetrics,
  EngagementMetrics
} from './student-profile';

/**
 * Database row types matching the schema
 */

export interface StudentProfileEnhancedRow {
  id: string;
  user_id: string;
  processing_speed: number;
  working_memory_capacity: number;
  attention_control: number;
  metacognition: number;
  intrinsic_motivation: number;
  extrinsic_motivation: number;
  competitive_spirit: number;
  collaborative_preference: number;
  autonomy_preference: number;
  concept_acquisition_rate: number;
  skill_development_rate: number;
  retention_rate: number;
  transfer_rate: number;
  average_attention_span: number;
  peak_attention_span: number;
  attention_decline_pattern: number[];
  attention_recovery_time: number;
  created_at: string;
  updated_at: string;
  last_analyzed: string;
}

export interface ResponsePatternRow {
  id: string;
  user_id: string;
  pattern_type: 'quick' | 'thoughtful' | 'impulsive' | 'hesitant';
  frequency: number;
  effectiveness: number;
  contexts: string[];
  first_observed: string;
  last_observed: string;
  observation_count: number;
}

export interface EngagementPatternRow {
  id: string;
  user_id: string;
  trigger: string;
  duration: number;
  intensity: number;
  recovery_time: number | null;
  activity_type: string | null;
  difficulty_level: string | null;
  observed_at: string;
}

export interface ActivityPreferenceRow {
  id: string;
  user_id: string;
  activity_type: string;
  preference_score: number;
  effectiveness_score: number;
  optimal_duration_minutes: number;
  total_sessions: number;
  total_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ConceptRow {
  id: string;
  concept_id: string;
  name: string;
  description: string | null;
  category: string;
  difficulty_level: string | null;
  prerequisites: string[];
  related_concepts: string[];
  created_at: string;
  updated_at: string;
}

export interface ConceptMasteryRow {
  id: string;
  user_id: string;
  concept_id: string;
  mastery_level: 'unknown' | 'introduced' | 'developing' | 'proficient' | 'mastered';
  confidence: number;
  last_assessed: string;
  assessment_count: number;
  evidence: any[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGapRow {
  id: string;
  user_id: string;
  concept_id: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string | null;
  suggested_actions: string[];
  related_concepts: string[];
  status: 'active' | 'addressing' | 'resolved';
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface InteractionHistoryRow {
  id: string;
  user_id: string;
  session_id: string;
  interaction_type: string;
  content: string | null;
  metadata: any;
  response_time_seconds: number | null;
  timestamp: string;
  comprehension_level: number | null;
  engagement_level: number | null;
  emotional_state: string | null;
  created_at: string;
}

export interface ProgressEventRow {
  id: string;
  user_id: string;
  event_type: 'concept_mastered' | 'skill_developed' | 'objective_completed' | 'level_advanced';
  description: string;
  data: any;
  timestamp: string;
  created_at: string;
}

export interface InterventionEventRow {
  id: string;
  user_id: string;
  session_id: string;
  trigger: string;
  intervention_type: string;
  agent_type: AgentType;
  effectiveness: number | null;
  student_response: string | null;
  timestamp: string;
  created_at: string;
}

export interface LearningAnalyticsRow {
  id: string;
  user_id: string;
  time_window_start: string;
  time_window_end: string;
  comprehension_rate: number | null;
  retention_rate: number | null;
  transfer_rate: number | null;
  attention_span_minutes: number | null;
  interaction_frequency: number | null;
  motivation_level: number | null;
  concept_acquisition_rate: number | null;
  error_patterns: any[];
  risk_factors: any[];
  recommendations: any[];
  optimal_activities: string[];
  created_at: string;
}

export interface PerformanceMetricsRow {
  id: string;
  user_id: string;
  session_id: string;
  correct_responses: number;
  total_responses: number;
  accuracy_rate: number | null;
  average_response_time: number | null;
  response_time_variance: number | null;
  concepts_mastered: number;
  skills_acquired: number;
  objectives_completed: number;
  response_quality: number | null;
  explanation_depth: number | null;
  critical_thinking: number | null;
  created_at: string;
}

export interface EngagementMetricsRow {
  id: string;
  user_id: string;
  session_id: string;
  message_count: number;
  average_message_length: number | null;
  questions_asked: number;
  focus_duration_seconds: number | null;
  distraction_events: number;
  reengagement_time_seconds: number | null;
  positive_indicators: number;
  negative_indicators: number;
  frustration_level: number | null;
  enthusiasm_level: number | null;
  created_at: string;
}

/**
 * Data Persistence Manager
 * Handles all database operations for the agentic learning engine
 */
export class DataPersistenceManager {
  private dbClient: any; // In production, this would be a Supabase client

  constructor(dbClient?: any) {
    this.dbClient = dbClient;
  }

  // ============================================================================
  // STUDENT PROFILE OPERATIONS
  // ============================================================================

  /**
   * Create or update enhanced student profile
   */
  async upsertStudentProfile(
    userId: string,
    profile: Partial<EnhancedStudentProfile>
  ): Promise<void> {
    const data: Partial<StudentProfileEnhancedRow> = {
      user_id: userId,
      processing_speed: profile.cognitiveProfile?.processingSpeed,
      working_memory_capacity: profile.cognitiveProfile?.workingMemoryCapacity,
      attention_control: profile.cognitiveProfile?.attentionControl,
      metacognition: profile.cognitiveProfile?.metacognition,
      intrinsic_motivation: profile.motivationFactors?.intrinsicMotivation,
      extrinsic_motivation: profile.motivationFactors?.extrinsicMotivation,
      competitive_spirit: profile.motivationFactors?.competitiveSpirit,
      collaborative_preference: profile.motivationFactors?.collaborativePreference,
      autonomy_preference: profile.motivationFactors?.autonomyPreference,
      concept_acquisition_rate: profile.learningVelocity?.conceptAcquisitionRate,
      skill_development_rate: profile.learningVelocity?.skillDevelopmentRate,
      retention_rate: profile.learningVelocity?.retentionRate,
      transfer_rate: profile.learningVelocity?.transferRate,
      average_attention_span: profile.attentionSpanData?.averageSpan,
      peak_attention_span: profile.attentionSpanData?.peakSpan,
      attention_decline_pattern: profile.attentionSpanData?.declinePattern,
      attention_recovery_time: profile.attentionSpanData?.recoveryTime,
      last_analyzed: new Date().toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('student_profiles_enhanced')
        .upsert(data, { onConflict: 'user_id' });
    }
  }

  /**
   * Get enhanced student profile
   */
  async getStudentProfile(userId: string): Promise<StudentProfileEnhancedRow | null> {
    if (!this.dbClient) return null;

    const { data, error } = await this.dbClient
      .from('student_profiles_enhanced')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }

    return data;
  }

  // ============================================================================
  // RESPONSE PATTERN OPERATIONS
  // ============================================================================

  /**
   * Upsert response pattern
   */
  async upsertResponsePattern(
    userId: string,
    pattern: ResponsePattern
  ): Promise<void> {
    const data: Partial<ResponsePatternRow> = {
      user_id: userId,
      pattern_type: pattern.type,
      frequency: pattern.frequency,
      effectiveness: pattern.effectiveness,
      contexts: pattern.contexts,
      last_observed: new Date().toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('response_patterns')
        .upsert(data, { onConflict: 'user_id,pattern_type' });
    }
  }

  /**
   * Get response patterns for a user
   */
  async getResponsePatterns(userId: string): Promise<ResponsePatternRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('response_patterns')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching response patterns:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // ENGAGEMENT PATTERN OPERATIONS
  // ============================================================================

  /**
   * Insert engagement pattern
   */
  async insertEngagementPattern(
    userId: string,
    pattern: EngagementPattern
  ): Promise<void> {
    const data: Partial<EngagementPatternRow> = {
      user_id: userId,
      trigger: pattern.trigger,
      duration: pattern.duration,
      intensity: pattern.intensity,
      recovery_time: pattern.recovery,
      observed_at: new Date().toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('engagement_patterns')
        .insert(data);
    }
  }

  /**
   * Get recent engagement patterns
   */
  async getRecentEngagementPatterns(
    userId: string,
    limit: number = 50
  ): Promise<EngagementPatternRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('engagement_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('observed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching engagement patterns:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // ACTIVITY PREFERENCE OPERATIONS
  // ============================================================================

  /**
   * Upsert activity preference
   */
  async upsertActivityPreference(
    userId: string,
    preference: ActivityPreference
  ): Promise<void> {
    const data: Partial<ActivityPreferenceRow> = {
      user_id: userId,
      activity_type: preference.activityType,
      preference_score: preference.preference,
      effectiveness_score: preference.effectiveness,
      optimal_duration_minutes: preference.optimalDuration
    };

    if (this.dbClient) {
      await this.dbClient
        .from('activity_preferences')
        .upsert(data, { onConflict: 'user_id,activity_type' });
    }
  }

  /**
   * Get activity preferences
   */
  async getActivityPreferences(userId: string): Promise<ActivityPreferenceRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('activity_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('effectiveness_score', { ascending: false });

    if (error) {
      console.error('Error fetching activity preferences:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // CONCEPT OPERATIONS
  // ============================================================================

  /**
   * Insert or update concept
   */
  async upsertConcept(concept: Concept): Promise<void> {
    const data: Partial<ConceptRow> = {
      concept_id: concept.id,
      name: concept.name,
      description: concept.description,
      category: concept.category,
      difficulty_level: concept.difficulty,
      prerequisites: concept.prerequisites,
      related_concepts: concept.relatedConcepts
    };

    if (this.dbClient) {
      await this.dbClient
        .from('concepts')
        .upsert(data, { onConflict: 'concept_id' });
    }
  }

  /**
   * Get concept by ID
   */
  async getConcept(conceptId: string): Promise<ConceptRow | null> {
    if (!this.dbClient) return null;

    const { data, error } = await this.dbClient
      .from('concepts')
      .select('*')
      .eq('concept_id', conceptId)
      .single();

    if (error) {
      console.error('Error fetching concept:', error);
      return null;
    }

    return data;
  }

  /**
   * Get concepts by category
   */
  async getConceptsByCategory(category: string): Promise<ConceptRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('concepts')
      .select('*')
      .eq('category', category);

    if (error) {
      console.error('Error fetching concepts:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // CONCEPT MASTERY OPERATIONS
  // ============================================================================

  /**
   * Upsert concept mastery
   */
  async upsertConceptMastery(
    userId: string,
    conceptId: string,
    mastery: MasteryLevel
  ): Promise<void> {
    const data: Partial<ConceptMasteryRow> = {
      user_id: userId,
      concept_id: conceptId,
      mastery_level: mastery.level,
      confidence: mastery.confidence,
      last_assessed: new Date(mastery.lastAssessed).toISOString(),
      evidence: mastery.evidence
    };

    if (this.dbClient) {
      const { data: existing } = await this.dbClient
        .from('concept_mastery')
        .select('assessment_count')
        .eq('user_id', userId)
        .eq('concept_id', conceptId)
        .single();

      if (existing) {
        data.assessment_count = (existing.assessment_count || 0) + 1;
      }

      await this.dbClient
        .from('concept_mastery')
        .upsert(data, { onConflict: 'user_id,concept_id' });
    }
  }

  /**
   * Get concept mastery for user
   */
  async getConceptMastery(
    userId: string,
    conceptId?: string
  ): Promise<ConceptMasteryRow[]> {
    if (!this.dbClient) return [];

    let query = this.dbClient
      .from('concept_mastery')
      .select('*')
      .eq('user_id', userId);

    if (conceptId) {
      query = query.eq('concept_id', conceptId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching concept mastery:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // KNOWLEDGE GAP OPERATIONS
  // ============================================================================

  /**
   * Insert knowledge gap
   */
  async insertKnowledgeGap(userId: string, gap: Gap): Promise<void> {
    const data: Partial<KnowledgeGapRow> = {
      user_id: userId,
      concept_id: gap.conceptId,
      severity: typeof gap.severity === 'string' ? gap.severity : 'moderate',
      description: gap.description,
      suggested_actions: gap.suggestedActions,
      related_concepts: gap.relatedConcepts || [],
      status: 'active',
      detected_at: new Date(gap.detectedAt).toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('knowledge_gaps')
        .insert(data);
    }
  }

  /**
   * Get active knowledge gaps
   */
  async getActiveKnowledgeGaps(userId: string): Promise<KnowledgeGapRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('knowledge_gaps')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge gaps:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update knowledge gap status
   */
  async updateKnowledgeGapStatus(
    gapId: string,
    status: 'active' | 'addressing' | 'resolved'
  ): Promise<void> {
    if (!this.dbClient) return;

    const updates: any = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    await this.dbClient
      .from('knowledge_gaps')
      .update(updates)
      .eq('id', gapId);
  }

  // ============================================================================
  // INTERACTION HISTORY OPERATIONS
  // ============================================================================

  /**
   * Insert interaction
   */
  async insertInteraction(
    userId: string,
    sessionId: string,
    interaction: {
      type: string;
      content?: string;
      metadata?: any;
      responseTime?: number;
      comprehensionLevel?: number;
      engagementLevel?: number;
      emotionalState?: string;
    }
  ): Promise<void> {
    const data: Partial<InteractionHistoryRow> = {
      user_id: userId,
      session_id: sessionId,
      interaction_type: interaction.type,
      content: interaction.content,
      metadata: interaction.metadata || {},
      response_time_seconds: interaction.responseTime,
      comprehension_level: interaction.comprehensionLevel,
      engagement_level: interaction.engagementLevel,
      emotional_state: interaction.emotionalState,
      timestamp: new Date().toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('interaction_history')
        .insert(data);
    }
  }

  /**
   * Get interaction history
   */
  async getInteractionHistory(
    userId: string,
    sessionId?: string,
    limit: number = 100
  ): Promise<InteractionHistoryRow[]> {
    if (!this.dbClient) return [];

    let query = this.dbClient
      .from('interaction_history')
      .select('*')
      .eq('user_id', userId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    query = query
      .order('timestamp', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interaction history:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // PROGRESS EVENT OPERATIONS
  // ============================================================================

  /**
   * Insert progress event
   */
  async insertProgressEvent(userId: string, event: ProgressEvent): Promise<void> {
    const data: Partial<ProgressEventRow> = {
      user_id: userId,
      event_type: event.type,
      description: event.description,
      data: event.data,
      timestamp: new Date(event.timestamp).toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('progress_events')
        .insert(data);
    }
  }

  /**
   * Get progress timeline
   */
  async getProgressTimeline(
    userId: string,
    limit: number = 100
  ): Promise<ProgressEventRow[]> {
    if (!this.dbClient) return [];

    const { data, error } = await this.dbClient
      .from('progress_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching progress timeline:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // INTERVENTION EVENT OPERATIONS
  // ============================================================================

  /**
   * Insert intervention event
   */
  async insertInterventionEvent(
    userId: string,
    sessionId: string,
    event: InterventionEvent
  ): Promise<void> {
    const data: Partial<InterventionEventRow> = {
      user_id: userId,
      session_id: sessionId,
      trigger: event.trigger,
      intervention_type: event.intervention,
      agent_type: event.agent,
      effectiveness: event.effectiveness,
      student_response: event.studentResponse,
      timestamp: new Date(event.timestamp).toISOString()
    };

    if (this.dbClient) {
      await this.dbClient
        .from('intervention_events')
        .insert(data);
    }
  }

  /**
   * Get intervention history
   */
  async getInterventionHistory(
    userId: string,
    sessionId?: string,
    limit: number = 100
  ): Promise<InterventionEventRow[]> {
    if (!this.dbClient) return [];

    let query = this.dbClient
      .from('intervention_events')
      .select('*')
      .eq('user_id', userId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    query = query
      .order('timestamp', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching intervention history:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // ANALYTICS OPERATIONS
  // ============================================================================

  /**
   * Insert learning analytics
   */
  async insertLearningAnalytics(
    userId: string,
    analytics: LearningAnalytics
  ): Promise<void> {
    const data: Partial<LearningAnalyticsRow> = {
      user_id: userId,
      time_window_start: new Date(analytics.timeWindow.start).toISOString(),
      time_window_end: new Date(analytics.timeWindow.end).toISOString(),
      comprehension_rate: analytics.comprehensionRate,
      retention_rate: analytics.retentionRate,
      transfer_rate: analytics.transferRate,
      attention_span_minutes: analytics.attentionSpan,
      interaction_frequency: analytics.interactionFrequency,
      motivation_level: analytics.motivationLevel,
      concept_acquisition_rate: analytics.conceptAcquisitionRate,
      error_patterns: analytics.errorPatterns,
      risk_factors: analytics.riskFactors,
      recommendations: analytics.recommendations,
      optimal_activities: analytics.nextOptimalActivities
    };

    if (this.dbClient) {
      await this.dbClient
        .from('learning_analytics')
        .insert(data);
    }
  }

  /**
   * Get recent analytics
   */
  async getRecentAnalytics(
    userId: string,
    days: number = 30
  ): Promise<LearningAnalyticsRow[]> {
    if (!this.dbClient) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await this.dbClient
      .from('learning_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('time_window_end', cutoff.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // PERFORMANCE METRICS OPERATIONS
  // ============================================================================

  /**
   * Insert performance metrics
   */
  async insertPerformanceMetrics(
    userId: string,
    sessionId: string,
    metrics: PerformanceMetrics
  ): Promise<void> {
    const data: Partial<PerformanceMetricsRow> = {
      user_id: userId,
      session_id: sessionId,
      correct_responses: metrics.correctResponses,
      total_responses: metrics.totalResponses,
      accuracy_rate: metrics.accuracyRate,
      average_response_time: metrics.averageResponseTime,
      response_time_variance: metrics.responseTimeVariance,
      concepts_mastered: metrics.conceptsMastered,
      skills_acquired: metrics.skillsAcquired,
      objectives_completed: metrics.objectivesCompleted,
      response_quality: metrics.responseQuality,
      explanation_depth: metrics.explanationDepth,
      critical_thinking: metrics.criticalThinking
    };

    if (this.dbClient) {
      await this.dbClient
        .from('performance_metrics')
        .insert(data);
    }
  }

  // ============================================================================
  // ENGAGEMENT METRICS OPERATIONS
  // ============================================================================

  /**
   * Insert engagement metrics
   */
  async insertEngagementMetrics(
    userId: string,
    sessionId: string,
    metrics: EngagementMetrics
  ): Promise<void> {
    const data: Partial<EngagementMetricsRow> = {
      user_id: userId,
      session_id: sessionId,
      message_count: metrics.messageCount,
      average_message_length: metrics.averageMessageLength,
      questions_asked: metrics.questionAsked,
      focus_duration_seconds: metrics.focusDuration,
      distraction_events: metrics.distractionEvents,
      reengagement_time_seconds: metrics.reengagementTime,
      positive_indicators: metrics.positiveIndicators,
      negative_indicators: metrics.negativeIndicators,
      frustration_level: metrics.frustrationLevel,
      enthusiasm_level: metrics.enthusiasmLevel
    };

    if (this.dbClient) {
      await this.dbClient
        .from('engagement_metrics')
        .insert(data);
    }
  }
}

/**
 * Singleton instance for global access
 */
export const dataPersistenceManager = new DataPersistenceManager();
