/**
 * Creator-specific type definitions
 *
 * Extends env-server types for stage creation UI
 */

import type { StageDefinition } from './env-server';

/**
 * Creator metadata for tracking stage authorship and usage
 */
export interface CreatorMetadata {
  createdBy: string;
  createdAt: number;
  lastModified: number;
  version: number;
  isTemplate: boolean;
  isDraft: boolean;
  timesPlayed: number;
  avgCompletionRate: number;
}

/**
 * Custom stage definition with creator metadata
 */
export interface CustomStageDefinition extends StageDefinition {
  creator: CreatorMetadata;
}

/**
 * Template for quick stage creation
 */
export interface StageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  stage: StageDefinition;
}

/**
 * Validation result for stage definitions
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

/**
 * Creator context state
 */
export interface CreatorState {
  stage: CustomStageDefinition | null;
  undoStack: CustomStageDefinition[];
  redoStack: CustomStageDefinition[];
  isDirty: boolean;
  isPreview: boolean;
  validationResult: ValidationResult | null;
}
