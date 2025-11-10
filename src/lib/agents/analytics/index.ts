/**
 * Analytics Module - Main Export
 * Unified exports for data persistence and real-time analytics
 */

// Main integration API
export { analyticsIntegration, AnalyticsIntegrationService } from '../analytics-integration';

// Data persistence
export { dataPersistenceManager, DataPersistenceManager } from '../data-persistence';

// Real-time analytics
export { realTimeAnalyticsProcessor, RealTimeAnalyticsProcessor } from '../real-time-analytics';

// ML predictions
export { mlPredictionService, MLPredictionService } from '../ml-predictions';

// Type exports
export type {
  // Analytics Integration types
  DashboardMetrics,
  AlertEvent,
  AnalyticsStreamEvent,
  LearningOutcomePrediction,
  EngagementPrediction,
  RiskPrediction
} from '../analytics-integration';

export type {
  // Real-time analytics types
  AlertConfig
} from '../real-time-analytics';

export type {
  // ML prediction types
  PredictionResult,
  MLModel
} from '../ml-predictions';

export type {
  // Data persistence types
  StudentProfileEnhancedRow,
  ResponsePatternRow,
  EngagementPatternRow,
  ActivityPreferenceRow,
  ConceptRow,
  ConceptMasteryRow,
  KnowledgeGapRow,
  InteractionHistoryRow,
  ProgressEventRow,
  InterventionEventRow,
  LearningAnalyticsRow,
  PerformanceMetricsRow,
  EngagementMetricsRow
} from '../data-persistence';

// Re-export common types from student-profile
export type {
  LearningAnalytics,
  PerformanceMetrics,
  EngagementMetrics,
  TimeWindow,
  ErrorPattern,
  DifficultyPoint,
  RiskFactor,
  AnalyticsRecommendation
} from '../student-profile';
