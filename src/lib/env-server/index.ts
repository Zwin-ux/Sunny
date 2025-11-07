/**
 * Environmental Server (Env Server) - Main Export
 *
 * Central hub for stage-based emotional learning system
 */

export { stageManager, StageManager } from './stage-manager';
export { LessonEngine, calculateEmotionalMetrics, generateSessionSummary } from './lesson-engine';

// Stages
export { cloudGardenStage } from './stages/cloud-garden';

// Re-export types
export type * from '@/types/env-server';
