/**
 * Stage Storage
 *
 * localStorage functions for saving, loading, and managing custom stages
 */

import type { CustomStageDefinition } from '@/types/creator';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'sunny_custom_stages';
const MAX_STAGES = 50; // Maximum stages to store

/**
 * Save a stage to localStorage
 */
export function saveStage(stage: CustomStageDefinition): void {
  if (typeof window === 'undefined') return;

  try {
    const stages = listStages();

    // Check if stage exists
    const existingIndex = stages.findIndex(s => s.id === stage.id);

    if (existingIndex >= 0) {
      // Update existing stage
      stages[existingIndex] = {
        ...stage,
        creator: {
          ...stage.creator,
          lastModified: Date.now(),
          version: stage.creator.version + 1,
        },
      };
    } else {
      // Add new stage
      stages.unshift(stage);

      // Limit total stages
      if (stages.length > MAX_STAGES) {
        stages.splice(MAX_STAGES);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
    logger.info(`Stage saved: ${stage.id}`);
  } catch (error) {
    logger.error('Error saving stage:', error);
    throw new Error('Failed to save stage');
  }
}

/**
 * Load a stage by ID
 */
export function loadStage(id: string): CustomStageDefinition | null {
  if (typeof window === 'undefined') return null;

  try {
    const stages = listStages();
    const stage = stages.find(s => s.id === id);
    return stage || null;
  } catch (error) {
    logger.error(`Error loading stage ${id}:`, error);
    return null;
  }
}

/**
 * List all stages
 */
export function listStages(): CustomStageDefinition[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const stages: CustomStageDefinition[] = JSON.parse(stored);
    return stages;
  } catch (error) {
    logger.error('Error listing stages:', error);
    return [];
  }
}

/**
 * Delete a stage
 */
export function deleteStage(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stages = listStages();
    const filtered = stages.filter(s => s.id !== id);

    if (filtered.length === stages.length) {
      // Stage not found
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    logger.info(`Stage deleted: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting stage ${id}:`, error);
    return false;
  }
}

/**
 * Duplicate a stage
 */
export function duplicateStage(id: string): CustomStageDefinition | null {
  if (typeof window === 'undefined') return null;

  try {
    const original = loadStage(id);
    if (!original) return null;

    const duplicate: CustomStageDefinition = {
      ...original,
      id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      creator: {
        ...original.creator,
        createdAt: Date.now(),
        lastModified: Date.now(),
        version: 1,
        timesPlayed: 0,
        avgCompletionRate: 0,
      },
    };

    saveStage(duplicate);
    return duplicate;
  } catch (error) {
    logger.error(`Error duplicating stage ${id}:`, error);
    return null;
  }
}

/**
 * Export stage as JSON
 */
export function exportStage(id: string): string | null {
  const stage = loadStage(id);
  if (!stage) return null;

  try {
    return JSON.stringify(stage, null, 2);
  } catch (error) {
    logger.error(`Error exporting stage ${id}:`, error);
    return null;
  }
}

/**
 * Import stage from JSON
 */
export function importStage(json: string): CustomStageDefinition | null {
  try {
    const stage: CustomStageDefinition = JSON.parse(json);

    // Generate new ID to avoid conflicts
    stage.id = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    stage.creator.createdAt = Date.now();
    stage.creator.lastModified = Date.now();
    stage.creator.version = 1;

    saveStage(stage);
    return stage;
  } catch (error) {
    logger.error('Error importing stage:', error);
    return null;
  }
}

/**
 * Get storage stats
 */
export function getStorageStats() {
  if (typeof window === 'undefined') {
    return {
      totalStages: 0,
      totalSize: 0,
      maxStages: MAX_STAGES,
    };
  }

  const stages = listStages();
  const stored = localStorage.getItem(STORAGE_KEY) || '';

  return {
    totalStages: stages.length,
    totalSize: new Blob([stored]).size,
    maxStages: MAX_STAGES,
  };
}

/**
 * Clear all stages (use with caution!)
 */
export function clearAllStages(): void {
  if (typeof window === 'undefined') return;

  if (confirm('Are you sure you want to delete ALL custom stages? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('All stages cleared');
  }
}
