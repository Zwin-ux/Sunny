// Data consistency and integrity management for the Agentic Learning Engine
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  LearningState,
  EnhancedStudentProfile,
  ConceptMap,
  EngagementData,
  AgentType
} from './types';

// ============================================================================
// Data Consistency and Integrity Management System
// ============================================================================

export interface DataConsistencyConfig {
  validationEnabled: boolean;
  autoRepairEnabled: boolean;
  backupEnabled: boolean;
  backupInterval: number; // milliseconds
  maxBackups: number;
  conflictResolutionStrategy: 'latest' | 'merge' | 'manual';
  corruptionDetectionEnabled: boolean;
  checksumValidation: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface DataConflict {
  id: string;
  field: string;
  source1: DataSource;
  source2: DataSource;
  timestamp: number;
  resolved: boolean;
  resolution?: any;
}

export interface DataSource {
  agentType: AgentType;
  value: any;
  timestamp: number;
  confidence: number;
}

export interface BackupEntry {
  id: string;
  studentId: string;
  data: LearningState;
  timestamp: number;
  checksum: string;
}

export interface CorruptionReport {
  id: string;
  dataType: string;
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: number;
  repaired: boolean;
  repairAction?: string;
}

export class DataConsistencyManager extends EventEmitter {
  private config: DataConsistencyConfig;
  private backups: Map<string, BackupEntry[]> = new Map(); // studentId -> backups
  private conflicts: DataConflict[] = [];
  private corruptionReports: CorruptionReport[] = [];
  private backupInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private maxConflictHistory: number = 500;
  private maxCorruptionHistory: number = 500;

  constructor(config: Partial<DataConsistencyConfig> = {}) {
    super();
    this.config = {
      validationEnabled: true,
      autoRepairEnabled: true,
      backupEnabled: true,
      backupInterval: 60000, // 1 minute
      maxBackups: 10,
      conflictResolutionStrategy: 'merge',
      corruptionDetectionEnabled: true,
      checksumValidation: true,
      ...config
    };
  }

  // Start the consistency manager
  start(): void {
    if (this.isRunning) {
      throw new Error('Data consistency manager is already running');
    }

    this.isRunning = true;

    // Start automatic backup if enabled
    if (this.config.backupEnabled) {
      this.startAutomaticBackup();
    }

    this.emit('consistency:started');
    console.log('Data consistency manager started');
  }

  // Stop the consistency manager
  stop(): void {
    if (!this.isRunning) return;

    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = undefined;
    }

    this.isRunning = false;
    this.emit('consistency:stopped');
    console.log('Data consistency manager stopped');
  }

  // ============================================================================
  // Data Validation
  // ============================================================================

  validateLearningState(state: LearningState): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.config.validationEnabled) {
      return { valid: true, errors, warnings, timestamp: Date.now() };
    }

    // Validate required fields
    if (!state.studentId) {
      errors.push({
        field: 'studentId',
        message: 'Student ID is required',
        severity: 'critical'
      });
    }

    if (!state.sessionId) {
      errors.push({
        field: 'sessionId',
        message: 'Session ID is required',
        severity: 'critical'
      });
    }

    // Validate knowledge map
    const knowledgeMapValidation = this.validateKnowledgeMap(state.knowledgeMap);
    errors.push(...knowledgeMapValidation.errors);
    warnings.push(...knowledgeMapValidation.warnings);

    // Validate engagement metrics
    const engagementValidation = this.validateEngagementData(state.engagementMetrics);
    errors.push(...engagementValidation.errors);
    warnings.push(...engagementValidation.warnings);

    // Validate learning path
    if (state.learningPath) {
      const pathValidation = this.validateLearningPath(state.learningPath);
      errors.push(...pathValidation.errors);
      warnings.push(...pathValidation.warnings);
    }

    // Validate timestamps
    if (state.lastUpdated && state.lastUpdated > Date.now()) {
      errors.push({
        field: 'lastUpdated',
        message: 'Last updated timestamp is in the future',
        severity: 'high',
        value: state.lastUpdated
      });
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: Date.now()
    };

    if (!result.valid) {
      this.emit('validation:failed', { state, result });
    }

    return result;
  }

  private validateKnowledgeMap(knowledgeMap: ConceptMap): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!knowledgeMap) {
      errors.push({
        field: 'knowledgeMap',
        message: 'Knowledge map is required',
        severity: 'high'
      });
      return { errors, warnings };
    }

    // Validate concepts
    if (!knowledgeMap.concepts) {
      errors.push({
        field: 'knowledgeMap.concepts',
        message: 'Concepts object is required',
        severity: 'medium'
      });
    }

    // Validate relationships
    if (knowledgeMap.relationships) {
      for (const rel of knowledgeMap.relationships) {
        if (!rel.fromConcept || !rel.toConcept) {
          errors.push({
            field: 'knowledgeMap.relationships',
            message: 'Relationship missing from or to concept',
            severity: 'medium'
          });
        }

        if (rel.strength < 0 || rel.strength > 1) {
          errors.push({
            field: 'knowledgeMap.relationships.strength',
            message: 'Relationship strength must be between 0 and 1',
            severity: 'low',
            value: rel.strength
          });
        }
      }
    }

    // Validate knowledge gaps
    if (knowledgeMap.knowledgeGaps) {
      for (const gap of knowledgeMap.knowledgeGaps) {
        if (!gap.conceptId) {
          errors.push({
            field: 'knowledgeMap.knowledgeGaps',
            message: 'Knowledge gap missing concept ID',
            severity: 'medium'
          });
        }
      }
    }

    return { errors, warnings };
  }

  private validateEngagementData(engagement: EngagementData): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!engagement) {
      errors.push({
        field: 'engagementMetrics',
        message: 'Engagement data is required',
        severity: 'high'
      });
      return { errors, warnings };
    }

    // Validate engagement level (0-1)
    if (engagement.currentLevel < 0 || engagement.currentLevel > 1) {
      errors.push({
        field: 'engagementMetrics.currentLevel',
        message: 'Engagement level must be between 0 and 1',
        severity: 'medium',
        value: engagement.currentLevel
      });
    }

    // Validate frustration level (0-1)
    if (engagement.frustrationLevel < 0 || engagement.frustrationLevel > 1) {
      errors.push({
        field: 'engagementMetrics.frustrationLevel',
        message: 'Frustration level must be between 0 and 1',
        severity: 'medium',
        value: engagement.frustrationLevel
      });
    }

    // Validate motivation level (0-1)
    if (engagement.motivationLevel < 0 || engagement.motivationLevel > 1) {
      errors.push({
        field: 'engagementMetrics.motivationLevel',
        message: 'Motivation level must be between 0 and 1',
        severity: 'medium',
        value: engagement.motivationLevel
      });
    }

    // Warn if attention span is unusually low or high
    if (engagement.attentionSpan < 1) {
      warnings.push({
        field: 'engagementMetrics.attentionSpan',
        message: 'Attention span is unusually low',
        suggestion: 'Consider reviewing engagement data'
      });
    } else if (engagement.attentionSpan > 120) {
      warnings.push({
        field: 'engagementMetrics.attentionSpan',
        message: 'Attention span is unusually high',
        suggestion: 'Verify data accuracy'
      });
    }

    return { errors, warnings };
  }

  private validateLearningPath(path: any[]): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!Array.isArray(path)) {
      errors.push({
        field: 'learningPath',
        message: 'Learning path must be an array',
        severity: 'high'
      });
      return { errors, warnings };
    }

    // Validate each path node
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      
      if (!node.id) {
        errors.push({
          field: `learningPath[${i}].id`,
          message: 'Path node missing ID',
          severity: 'medium'
        });
      }

      if (!node.type) {
        errors.push({
          field: `learningPath[${i}].type`,
          message: 'Path node missing type',
          severity: 'medium'
        });
      }
    }

    return { errors, warnings };
  }

  validateStudentProfile(profile: EnhancedStudentProfile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.config.validationEnabled) {
      return { valid: true, errors, warnings, timestamp: Date.now() };
    }

    // Validate required fields
    if (!profile.name) {
      errors.push({
        field: 'name',
        message: 'Profile name is required',
        severity: 'high'
      });
    }

    // Validate level
    if (profile.level === undefined || profile.level < 0) {
      errors.push({
        field: 'level',
        message: 'Profile level must be a non-negative number',
        severity: 'medium'
      });
    }

    // Validate cognitive profile if present
    if (profile.cognitiveProfile) {
      const cogProfile = profile.cognitiveProfile;
      if (cogProfile.processingSpeed < 0 || cogProfile.processingSpeed > 1) {
        errors.push({
          field: 'cognitiveProfile.processingSpeed',
          message: 'Processing speed must be between 0 and 1',
          severity: 'low'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: Date.now()
    };
  }

  // ============================================================================
  // Conflict Resolution
  // ============================================================================

  async resolveConflicts(conflicts: DataConflict[]): Promise<Map<string, any>> {
    const resolutions = new Map<string, any>();

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      if (resolution !== undefined) {
        resolutions.set(conflict.field, resolution);
        conflict.resolved = true;
        conflict.resolution = resolution;
      }
    }

    // Store conflicts for history
    this.conflicts.push(...conflicts);
    this.maintainConflictHistory();

    return resolutions;
  }

  private async resolveConflict(conflict: DataConflict): Promise<any> {
    switch (this.config.conflictResolutionStrategy) {
      case 'latest':
        return this.resolveByLatest(conflict);
      case 'merge':
        return this.resolveByMerge(conflict);
      case 'manual':
        return this.resolveManually(conflict);
      default:
        return this.resolveByLatest(conflict);
    }
  }

  private resolveByLatest(conflict: DataConflict): any {
    // Use the most recent value
    if (conflict.source1.timestamp > conflict.source2.timestamp) {
      return conflict.source1.value;
    }
    return conflict.source2.value;
  }

  private resolveByMerge(conflict: DataConflict): any {
    // Merge values based on confidence
    const totalConfidence = conflict.source1.confidence + conflict.source2.confidence;
    
    // If one source has significantly higher confidence, use it
    if (conflict.source1.confidence / totalConfidence > 0.8) {
      return conflict.source1.value;
    }
    if (conflict.source2.confidence / totalConfidence > 0.8) {
      return conflict.source2.value;
    }

    // For numeric values, use weighted average
    if (typeof conflict.source1.value === 'number' && typeof conflict.source2.value === 'number') {
      const weight1 = conflict.source1.confidence / totalConfidence;
      const weight2 = conflict.source2.confidence / totalConfidence;
      return conflict.source1.value * weight1 + conflict.source2.value * weight2;
    }

    // For other types, use latest
    return this.resolveByLatest(conflict);
  }

  private resolveManually(conflict: DataConflict): any {
    // Emit event for manual resolution
    this.emit('conflict:manual_resolution_required', conflict);
    
    // For now, fall back to latest
    return this.resolveByLatest(conflict);
  }

  detectConflicts(
    currentState: LearningState,
    updates: Partial<LearningState>,
    source: AgentType
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];

    // Check for conflicting updates
    for (const [field, newValue] of Object.entries(updates)) {
      const currentValue = (currentState as any)[field];
      
      if (currentValue !== undefined && newValue !== currentValue) {
        // Check if this is a significant conflict
        if (this.isSignificantConflict(field, currentValue, newValue)) {
          conflicts.push({
            id: uuidv4(),
            field,
            source1: {
              agentType: 'orchestrator', // Current state
              value: currentValue,
              timestamp: currentState.lastUpdated,
              confidence: 0.8
            },
            source2: {
              agentType: source,
              value: newValue,
              timestamp: Date.now(),
              confidence: 0.7
            },
            timestamp: Date.now(),
            resolved: false
          });
        }
      }
    }

    return conflicts;
  }

  private isSignificantConflict(field: string, value1: any, value2: any): boolean {
    // Determine if the difference is significant enough to be a conflict
    
    // For numeric values, check if difference is > 10%
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const diff = Math.abs(value1 - value2);
      const avg = (value1 + value2) / 2;
      return diff / avg > 0.1;
    }

    // For objects, do deep comparison
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      return JSON.stringify(value1) !== JSON.stringify(value2);
    }

    // For other types, any difference is significant
    return value1 !== value2;
  }

  // ============================================================================
  // Backup and Recovery
  // ============================================================================

  createBackup(studentId: string, state: LearningState): BackupEntry {
    const backup: BackupEntry = {
      id: uuidv4(),
      studentId,
      data: JSON.parse(JSON.stringify(state)), // Deep copy
      timestamp: Date.now(),
      checksum: this.calculateChecksum(state)
    };

    // Store backup
    if (!this.backups.has(studentId)) {
      this.backups.set(studentId, []);
    }

    const studentBackups = this.backups.get(studentId)!;
    studentBackups.push(backup);

    // Maintain max backups
    if (studentBackups.length > this.config.maxBackups) {
      studentBackups.shift();
    }

    this.emit('backup:created', { studentId, backupId: backup.id });
    return backup;
  }

  getLatestBackup(studentId: string): BackupEntry | undefined {
    const backups = this.backups.get(studentId);
    if (!backups || backups.length === 0) return undefined;
    return backups[backups.length - 1];
  }

  getAllBackups(studentId: string): BackupEntry[] {
    return this.backups.get(studentId) || [];
  }

  async restoreFromBackup(studentId: string, backupId?: string): Promise<LearningState | null> {
    const backups = this.backups.get(studentId);
    if (!backups || backups.length === 0) {
      console.error(`No backups found for student ${studentId}`);
      return null;
    }

    let backup: BackupEntry | undefined;
    
    if (backupId) {
      backup = backups.find(b => b.id === backupId);
    } else {
      backup = backups[backups.length - 1]; // Latest backup
    }

    if (!backup) {
      console.error(`Backup not found: ${backupId}`);
      return null;
    }

    // Verify checksum if enabled
    if (this.config.checksumValidation) {
      const currentChecksum = this.calculateChecksum(backup.data);
      if (currentChecksum !== backup.checksum) {
        console.error(`Backup checksum mismatch for ${backup.id}`);
        this.emit('backup:corruption_detected', { backupId: backup.id });
        return null;
      }
    }

    this.emit('backup:restored', { studentId, backupId: backup.id });
    return JSON.parse(JSON.stringify(backup.data)); // Deep copy
  }

  private startAutomaticBackup(): void {
    this.backupInterval = setInterval(() => {
      this.emit('backup:automatic_trigger');
    }, this.config.backupInterval);
  }

  // ============================================================================
  // Corruption Detection and Repair
  // ============================================================================

  detectCorruption(state: LearningState): CorruptionReport[] {
    if (!this.config.corruptionDetectionEnabled) {
      return [];
    }

    const reports: CorruptionReport[] = [];

    // Check for null/undefined in required fields
    if (!state.studentId) {
      reports.push(this.createCorruptionReport(
        'LearningState',
        'studentId',
        'Required field is null or undefined',
        'critical'
      ));
    }

    // Check for invalid data types
    if (state.engagementMetrics && typeof state.engagementMetrics.currentLevel !== 'number') {
      reports.push(this.createCorruptionReport(
        'EngagementData',
        'currentLevel',
        'Invalid data type (expected number)',
        'high'
      ));
    }

    // Check for circular references in knowledge map
    if (state.knowledgeMap && this.hasCircularReferences(state.knowledgeMap)) {
      reports.push(this.createCorruptionReport(
        'ConceptMap',
        'relationships',
        'Circular references detected',
        'medium'
      ));
    }

    // Store reports
    this.corruptionReports.push(...reports);
    this.maintainCorruptionHistory();

    if (reports.length > 0) {
      this.emit('corruption:detected', { reports });
    }

    return reports;
  }

  async repairCorruption(state: LearningState, reports: CorruptionReport[]): Promise<LearningState> {
    if (!this.config.autoRepairEnabled) {
      return state;
    }

    const repairedState = JSON.parse(JSON.stringify(state)); // Deep copy

    for (const report of reports) {
      try {
        const repaired = await this.repairCorruptionIssue(repairedState, report);
        if (repaired) {
          report.repaired = true;
          this.emit('corruption:repaired', { report });
        }
      } catch (error) {
        console.error(`Failed to repair corruption in ${report.field}:`, error);
      }
    }

    return repairedState;
  }

  private async repairCorruptionIssue(state: LearningState, report: CorruptionReport): Promise<boolean> {
    switch (report.field) {
      case 'studentId':
        // Cannot repair missing student ID
        return false;

      case 'currentLevel':
        // Reset to default value
        if (state.engagementMetrics) {
          state.engagementMetrics.currentLevel = 0.5;
          report.repairAction = 'Reset to default value (0.5)';
          return true;
        }
        return false;

      case 'relationships':
        // Remove circular references
        if (state.knowledgeMap) {
          state.knowledgeMap.relationships = this.removeCircularReferences(
            state.knowledgeMap.relationships
          );
          report.repairAction = 'Removed circular references';
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  private createCorruptionReport(
    dataType: string,
    field: string,
    issue: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): CorruptionReport {
    return {
      id: uuidv4(),
      dataType,
      field,
      issue,
      severity,
      detected: Date.now(),
      repaired: false
    };
  }

  private hasCircularReferences(knowledgeMap: ConceptMap): boolean {
    // Simple circular reference detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (conceptId: string): boolean => {
      visited.add(conceptId);
      recursionStack.add(conceptId);

      const outgoing = knowledgeMap.relationships.filter(r => r.fromConcept === conceptId);
      
      for (const rel of outgoing) {
        if (!visited.has(rel.toConcept)) {
          if (hasCycle(rel.toConcept)) {
            return true;
          }
        } else if (recursionStack.has(rel.toConcept)) {
          return true;
        }
      }

      recursionStack.delete(conceptId);
      return false;
    };

    for (const conceptId of Object.keys(knowledgeMap.concepts)) {
      if (!visited.has(conceptId)) {
        if (hasCycle(conceptId)) {
          return true;
        }
      }
    }

    return false;
  }

  private removeCircularReferences(relationships: any[]): any[] {
    // Remove relationships that create cycles
    // This is a simplified implementation
    return relationships.filter((rel, index) => {
      // Keep only if it doesn't create a cycle
      const testRels = relationships.slice(0, index);
      return !this.wouldCreateCycle(testRels, rel);
    });
  }

  private wouldCreateCycle(existingRels: any[], newRel: any): boolean {
    // Check if adding newRel would create a cycle
    // Simplified implementation
    return false; // TODO: Implement proper cycle detection
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateChecksum(data: any): string {
    // Simple checksum calculation using JSON stringification
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private maintainConflictHistory(): void {
    if (this.conflicts.length > this.maxConflictHistory) {
      this.conflicts.splice(0, this.conflicts.length - this.maxConflictHistory);
    }
  }

  private maintainCorruptionHistory(): void {
    if (this.corruptionReports.length > this.maxCorruptionHistory) {
      this.corruptionReports.splice(0, this.corruptionReports.length - this.maxCorruptionHistory);
    }
  }

  // Query methods
  getConflictHistory(limit?: number): DataConflict[] {
    if (limit) {
      return this.conflicts.slice(-limit);
    }
    return [...this.conflicts];
  }

  getCorruptionHistory(limit?: number): CorruptionReport[] {
    if (limit) {
      return this.corruptionReports.slice(-limit);
    }
    return [...this.corruptionReports];
  }

  getStatistics(): DataConsistencyStatistics {
    return {
      totalBackups: Array.from(this.backups.values()).reduce((sum, backups) => sum + backups.length, 0),
      totalConflicts: this.conflicts.length,
      resolvedConflicts: this.conflicts.filter(c => c.resolved).length,
      totalCorruptionReports: this.corruptionReports.length,
      repairedCorruption: this.corruptionReports.filter(r => r.repaired).length,
      studentsWithBackups: this.backups.size
    };
  }

  // Cleanup
  clear(): void {
    this.backups.clear();
    this.conflicts = [];
    this.corruptionReports = [];
  }
}

interface DataConsistencyStatistics {
  totalBackups: number;
  totalConflicts: number;
  resolvedConflicts: number;
  totalCorruptionReports: number;
  repairedCorruption: number;
  studentsWithBackups: number;
}
