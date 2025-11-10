// Integration layer for error handling and data consistency systems
import { EventEmitter } from 'events';
import { BaseAgent } from './base-agent';
import { LearningOrchestrator } from './orchestrator';
import { AgentFailureRecoverySystem } from './error-recovery';
import { DataConsistencyManager } from './data-consistency';
import { globalEventSystem } from './event-system';
import {
  AgentType,
  LearningState,
  EnhancedStudentProfile
} from './types';

/**
 * Unified error handling and data consistency system
 * Integrates failure recovery and data consistency management
 */
export class ErrorHandlingSystem extends EventEmitter {
  private recoverySystem: AgentFailureRecoverySystem;
  private consistencyManager: DataConsistencyManager;
  private orchestrator?: LearningOrchestrator;
  private isRunning: boolean = false;

  constructor(
    recoveryConfig?: any,
    consistencyConfig?: any
  ) {
    super();
    
    this.recoverySystem = new AgentFailureRecoverySystem(recoveryConfig);
    this.consistencyManager = new DataConsistencyManager(consistencyConfig);
    
    this.setupEventForwarding();
  }

  // Initialize the error handling system
  async initialize(orchestrator: LearningOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    
    // Start both subsystems
    this.recoverySystem.start();
    this.consistencyManager.start();
    
    this.isRunning = true;
    this.emit('system:initialized');
    
    console.log('Error handling system initialized');
  }

  // Shutdown the error handling system
  async shutdown(): Promise<void> {
    if (!this.isRunning) return;

    this.recoverySystem.stop();
    this.consistencyManager.stop();
    
    this.isRunning = false;
    this.emit('system:shutdown');
    
    console.log('Error handling system shutdown');
  }

  // Register an agent for monitoring
  registerAgent(agent: BaseAgent): void {
    this.recoverySystem.registerAgent(agent);
    
    // Set up agent error handling
    agent.on('error', async (error: Error, context: any) => {
      await this.handleAgentError(agent, error, context);
    });
    
    console.log(`Agent ${agent.type} registered with error handling system`);
  }

  // Unregister an agent
  unregisterAgent(agentType: AgentType): void {
    this.recoverySystem.unregisterAgent(agentType);
    console.log(`Agent ${agentType} unregistered from error handling system`);
  }

  // Handle agent errors
  private async handleAgentError(
    agent: BaseAgent,
    error: Error,
    context: any
  ): Promise<void> {
    console.error(`Agent ${agent.type} error:`, error.message);
    
    // Attempt recovery
    const recovered = await this.recoverySystem.handleAgentFailure(agent, error, context);
    
    if (!recovered) {
      // Emit critical error event
      this.emit('agent:critical_failure', {
        agentType: agent.type,
        error,
        context
      });
      
      // Check if fallback is available
      const fallback = this.recoverySystem.getFallbackBehavior(agent.type);
      if (fallback && !fallback.active) {
        console.log(`Activating fallback behavior for ${agent.type}`);
      }
    }
  }

  // Validate and update learning state with consistency checks
  async updateLearningState(
    studentId: string,
    updates: Partial<LearningState>,
    source: AgentType
  ): Promise<{ success: boolean; state?: LearningState; errors?: string[] }> {
    try {
      // Get current state from orchestrator
      const currentState = this.orchestrator?.getLearningState(studentId);
      if (!currentState) {
        return {
          success: false,
          errors: ['Learning state not found']
        };
      }

      // Detect conflicts
      const conflicts = this.consistencyManager.detectConflicts(
        currentState,
        updates,
        source
      );

      // Resolve conflicts if any
      let resolvedUpdates = updates;
      if (conflicts.length > 0) {
        console.log(`Detected ${conflicts.length} conflicts, resolving...`);
        const resolutions = await this.consistencyManager.resolveConflicts(conflicts);
        
        // Apply resolutions
        resolvedUpdates = { ...updates };
        for (const [field, value] of resolutions.entries()) {
          (resolvedUpdates as any)[field] = value;
        }
      }

      // Create updated state
      const updatedState: LearningState = {
        ...currentState,
        ...resolvedUpdates,
        lastUpdated: Date.now()
      };

      // Validate the updated state
      const validation = this.consistencyManager.validateLearningState(updatedState);
      
      if (!validation.valid) {
        console.error('Learning state validation failed:', validation.errors);
        
        // Attempt auto-repair if enabled
        const corruptionReports = this.consistencyManager.detectCorruption(updatedState);
        if (corruptionReports.length > 0) {
          const repairedState = await this.consistencyManager.repairCorruption(
            updatedState,
            corruptionReports
          );
          
          // Validate repaired state
          const revalidation = this.consistencyManager.validateLearningState(repairedState);
          if (revalidation.valid) {
            // Create backup before applying
            this.consistencyManager.createBackup(studentId, currentState);
            
            // Apply repaired state
            this.orchestrator?.updateLearningState(studentId, repairedState);
            
            return {
              success: true,
              state: repairedState
            };
          }
        }
        
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      // Create backup before applying updates
      this.consistencyManager.createBackup(studentId, currentState);

      // Apply updates to orchestrator
      this.orchestrator?.updateLearningState(studentId, resolvedUpdates);

      return {
        success: true,
        state: updatedState
      };

    } catch (error) {
      console.error('Error updating learning state:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Validate student profile
  validateProfile(profile: EnhancedStudentProfile): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const validation = this.consistencyManager.validateStudentProfile(profile);
    
    return {
      valid: validation.valid,
      errors: validation.errors.map(e => e.message),
      warnings: validation.warnings.map(w => w.message)
    };
  }

  // Create backup for a student's learning state
  createBackup(studentId: string): boolean {
    try {
      const state = this.orchestrator?.getLearningState(studentId);
      if (!state) {
        console.error(`Cannot create backup: Learning state not found for ${studentId}`);
        return false;
      }

      this.consistencyManager.createBackup(studentId, state);
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }

  // Restore from backup
  async restoreFromBackup(studentId: string, backupId?: string): Promise<boolean> {
    try {
      const restoredState = await this.consistencyManager.restoreFromBackup(studentId, backupId);
      
      if (!restoredState) {
        console.error('Failed to restore from backup');
        return false;
      }

      // Validate restored state
      const validation = this.consistencyManager.validateLearningState(restoredState);
      if (!validation.valid) {
        console.error('Restored state is invalid:', validation.errors);
        return false;
      }

      // Apply restored state
      this.orchestrator?.updateLearningState(studentId, restoredState);
      
      this.emit('backup:restored', { studentId, backupId });
      return true;

    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  // Get system health report
  getSystemHealth(): SystemHealthReport {
    const recoveryHealth = this.recoverySystem.getSystemHealth();
    const consistencyStats = this.consistencyManager.getStatistics();

    return {
      healthy: recoveryHealth.healthy,
      recoverySystem: {
        criticalAgents: recoveryHealth.criticalAgents,
        activeFallbacks: recoveryHealth.activeFallbacks,
        recentFailures: recoveryHealth.recentFailures,
        agentHealth: Object.fromEntries(recoveryHealth.agentHealth)
      },
      consistencySystem: {
        totalBackups: consistencyStats.totalBackups,
        unresolvedConflicts: consistencyStats.totalConflicts - consistencyStats.resolvedConflicts,
        unrepairedCorruption: consistencyStats.totalCorruptionReports - consistencyStats.repairedCorruption
      },
      timestamp: Date.now()
    };
  }

  // Get agent health status
  getAgentHealth(agentType: AgentType): any {
    return this.recoverySystem.getAgentHealth(agentType);
  }

  // Get all agent health statuses
  getAllAgentHealth(): Map<AgentType, any> {
    return this.recoverySystem.getAllAgentHealth();
  }

  // Check if fallback is active for an agent
  isFallbackActive(agentType: AgentType): boolean {
    return this.recoverySystem.isFallbackActive(agentType);
  }

  // Get failure history
  getFailureHistory(agentType?: AgentType, limit?: number): any[] {
    return this.recoverySystem.getFailureHistory(agentType, limit);
  }

  // Get conflict history
  getConflictHistory(limit?: number): any[] {
    return this.consistencyManager.getConflictHistory(limit);
  }

  // Get corruption history
  getCorruptionHistory(limit?: number): any[] {
    return this.consistencyManager.getCorruptionHistory(limit);
  }

  // Get all backups for a student
  getBackups(studentId: string): any[] {
    return this.consistencyManager.getAllBackups(studentId);
  }

  // Setup event forwarding from subsystems
  private setupEventForwarding(): void {
    // Forward recovery system events
    this.recoverySystem.on('agent:failure', (event) => {
      this.emit('agent:failure', event);
    });

    this.recoverySystem.on('agent:recovered', (event) => {
      this.emit('agent:recovered', event);
    });

    this.recoverySystem.on('agent:critical', (event) => {
      this.emit('agent:critical', event);
    });

    this.recoverySystem.on('agent:degraded', (event) => {
      this.emit('agent:degraded', event);
    });

    // Forward consistency manager events
    this.consistencyManager.on('validation:failed', (event) => {
      this.emit('validation:failed', event);
    });

    this.consistencyManager.on('corruption:detected', (event) => {
      this.emit('corruption:detected', event);
    });

    this.consistencyManager.on('corruption:repaired', (event) => {
      this.emit('corruption:repaired', event);
    });

    this.consistencyManager.on('backup:created', (event) => {
      this.emit('backup:created', event);
    });

    this.consistencyManager.on('backup:restored', (event) => {
      this.emit('backup:restored', event);
    });

    // Forward to global event system
    this.on('agent:failure', (event) => {
      globalEventSystem.publishEvent({
        id: event.id,
        type: 'agent:failure',
        source: event.agentType,
        data: event,
        timestamp: Date.now(),
        priority: 'urgent'
      });
    });
  }
}

interface SystemHealthReport {
  healthy: boolean;
  recoverySystem: {
    criticalAgents: number;
    activeFallbacks: number;
    recentFailures: number;
    agentHealth: Record<string, boolean>;
  };
  consistencySystem: {
    totalBackups: number;
    unresolvedConflicts: number;
    unrepairedCorruption: number;
  };
  timestamp: number;
}

// Singleton instance for global use
export const globalErrorHandlingSystem = new ErrorHandlingSystem();
