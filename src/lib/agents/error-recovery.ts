// Error handling and recovery systems for the Agentic Learning Engine
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './base-agent';
import { AgentEventSystem } from './event-system';
import {
  AgentType,
  AgentMessage,
  AgentResponse,
  LearningState,
  Priority
} from './types';

// ============================================================================
// Agent Failure Recovery System
// ============================================================================

export interface FailureRecoveryConfig {
  maxRestartAttempts: number;
  restartDelay: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  failoverEnabled: boolean;
  gracefulDegradationEnabled: boolean;
  errorLoggingEnabled: boolean;
  alertThreshold: number; // number of failures before alerting
}

export interface AgentHealthStatus {
  agentType: AgentType;
  healthy: boolean;
  lastHealthCheck: number;
  consecutiveFailures: number;
  uptime: number;
  lastRestart?: number;
  errorCount: number;
  details: any;
}

export interface FailureEvent {
  id: string;
  agentType: AgentType;
  timestamp: number;
  error: Error;
  context: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovered: boolean;
  recoveryAction?: string;
}

export class AgentFailureRecoverySystem extends EventEmitter {
  private config: FailureRecoveryConfig;
  private agentHealth: Map<AgentType, AgentHealthStatus> = new Map();
  private failureHistory: FailureEvent[] = [];
  private restartAttempts: Map<AgentType, number> = new Map();
  private healthCheckIntervals: Map<AgentType, NodeJS.Timeout> = new Map();
  private fallbackBehaviors: Map<AgentType, FallbackBehavior> = new Map();
  private isRunning: boolean = false;
  private maxFailureHistorySize: number = 1000;

  constructor(config: Partial<FailureRecoveryConfig> = {}) {
    super();
    this.config = {
      maxRestartAttempts: 3,
      restartDelay: 5000,
      healthCheckInterval: 30000,
      failoverEnabled: true,
      gracefulDegradationEnabled: true,
      errorLoggingEnabled: true,
      alertThreshold: 5,
      ...config
    };
    this.initializeFallbackBehaviors();
  }

  // Start the recovery system
  start(): void {
    if (this.isRunning) {
      throw new Error('Failure recovery system is already running');
    }
    this.isRunning = true;
    this.emit('recovery:started');
    console.log('Agent failure recovery system started');
  }

  // Stop the recovery system
  stop(): void {
    if (!this.isRunning) return;

    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    this.isRunning = false;
    this.emit('recovery:stopped');
    console.log('Agent failure recovery system stopped');
  }

  // Register an agent for monitoring
  registerAgent(agent: BaseAgent): void {
    const agentType = agent.type;
    
    // Initialize health status
    this.agentHealth.set(agentType, {
      agentType,
      healthy: true,
      lastHealthCheck: Date.now(),
      consecutiveFailures: 0,
      uptime: Date.now(),
      errorCount: 0,
      details: {}
    });

    this.restartAttempts.set(agentType, 0);

    // Start health check monitoring
    this.startHealthCheckMonitoring(agent);

    console.log(`Agent ${agentType} registered for failure recovery monitoring`);
  }

  // Unregister an agent
  unregisterAgent(agentType: AgentType): void {
    const interval = this.healthCheckIntervals.get(agentType);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(agentType);
    }

    this.agentHealth.delete(agentType);
    this.restartAttempts.delete(agentType);

    console.log(`Agent ${agentType} unregistered from failure recovery monitoring`);
  }

  // Handle agent failure
  async handleAgentFailure(
    agent: BaseAgent,
    error: Error,
    context: any = {}
  ): Promise<boolean> {
    const agentType = agent.type;
    const failureEvent: FailureEvent = {
      id: uuidv4(),
      agentType,
      timestamp: Date.now(),
      error,
      context,
      severity: this.assessFailureSeverity(error, context),
      recovered: false
    };

    // Log failure
    this.logFailure(failureEvent);

    // Update health status
    const health = this.agentHealth.get(agentType);
    if (health) {
      health.healthy = false;
      health.consecutiveFailures++;
      health.errorCount++;
    }

    // Emit failure event
    this.emit('agent:failure', failureEvent);

    // Attempt recovery
    const recovered = await this.attemptRecovery(agent, failureEvent);
    failureEvent.recovered = recovered;

    // Check if alert threshold reached
    if (health && health.consecutiveFailures >= this.config.alertThreshold) {
      this.emit('agent:critical', {
        agentType,
        consecutiveFailures: health.consecutiveFailures,
        lastError: error
      });
    }

    return recovered;
  }

  // Attempt to recover from failure
  private async attemptRecovery(
    agent: BaseAgent,
    failureEvent: FailureEvent
  ): Promise<boolean> {
    const agentType = agent.type;
    const attempts = this.restartAttempts.get(agentType) || 0;

    // Check if max restart attempts exceeded
    if (attempts >= this.config.maxRestartAttempts) {
      console.error(`Max restart attempts exceeded for agent ${agentType}`);
      
      // Try failover if enabled
      if (this.config.failoverEnabled) {
        return await this.attemptFailover(agentType, failureEvent);
      }

      // Try graceful degradation if enabled
      if (this.config.gracefulDegradationEnabled) {
        return await this.enableGracefulDegradation(agentType, failureEvent);
      }

      return false;
    }

    // Attempt restart
    try {
      console.log(`Attempting to restart agent ${agentType} (attempt ${attempts + 1}/${this.config.maxRestartAttempts})`);
      
      // Wait before restart
      await this.delay(this.config.restartDelay);

      // Stop the agent
      await agent.stop();

      // Start the agent
      await agent.start();

      // Update restart attempts
      this.restartAttempts.set(agentType, attempts + 1);

      // Update health status
      const health = this.agentHealth.get(agentType);
      if (health) {
        health.healthy = true;
        health.consecutiveFailures = 0;
        health.lastRestart = Date.now();
      }

      failureEvent.recoveryAction = 'restart';
      this.emit('agent:recovered', { agentType, action: 'restart' });
      
      console.log(`Agent ${agentType} successfully restarted`);
      return true;

    } catch (error) {
      console.error(`Failed to restart agent ${agentType}:`, error);
      this.restartAttempts.set(agentType, attempts + 1);
      return false;
    }
  }

  // Attempt failover to backup agent
  private async attemptFailover(
    agentType: AgentType,
    failureEvent: FailureEvent
  ): Promise<boolean> {
    console.log(`Attempting failover for agent ${agentType}`);
    
    // In a production system, this would switch to a backup agent instance
    // For now, we'll just log the attempt
    failureEvent.recoveryAction = 'failover';
    this.emit('agent:failover', { agentType });
    
    return false; // Not implemented in this version
  }

  // Enable graceful degradation
  private async enableGracefulDegradation(
    agentType: AgentType,
    failureEvent: FailureEvent
  ): Promise<boolean> {
    console.log(`Enabling graceful degradation for agent ${agentType}`);
    
    const fallback = this.fallbackBehaviors.get(agentType);
    if (!fallback) {
      console.warn(`No fallback behavior defined for agent ${agentType}`);
      return false;
    }

    // Activate fallback behavior
    fallback.active = true;
    failureEvent.recoveryAction = 'graceful_degradation';
    this.emit('agent:degraded', { agentType, fallback });
    
    console.log(`Graceful degradation enabled for agent ${agentType}`);
    return true;
  }

  // Health check monitoring
  private startHealthCheckMonitoring(agent: BaseAgent): void {
    const agentType = agent.type;
    
    const interval = setInterval(async () => {
      await this.performHealthCheck(agent);
    }, this.config.healthCheckInterval);

    this.healthCheckIntervals.set(agentType, interval);
  }

  private async performHealthCheck(agent: BaseAgent): Promise<void> {
    const agentType = agent.type;
    const health = this.agentHealth.get(agentType);
    if (!health) return;

    try {
      const agentHealth = agent.getHealthStatus();
      
      health.healthy = agentHealth.healthy;
      health.lastHealthCheck = Date.now();
      health.details = agentHealth.details;

      // Reset consecutive failures if healthy
      if (agentHealth.healthy && health.consecutiveFailures > 0) {
        health.consecutiveFailures = 0;
        this.restartAttempts.set(agentType, 0);
      }

      // Emit health check event
      this.emit('agent:health_check', { agentType, health: agentHealth });

    } catch (error) {
      console.error(`Health check failed for agent ${agentType}:`, error);
      health.healthy = false;
      health.consecutiveFailures++;
      
      // Attempt recovery if unhealthy
      if (!health.healthy) {
        await this.handleAgentFailure(agent, error as Error, { source: 'health_check' });
      }
    }
  }

  // Fallback behavior management
  private initializeFallbackBehaviors(): void {
    // Define fallback behaviors for each agent type
    this.fallbackBehaviors.set('assessment', {
      agentType: 'assessment',
      active: false,
      behavior: 'basic_assessment',
      description: 'Use basic rule-based assessment instead of advanced analysis',
      limitations: ['No real-time conversation analysis', 'Limited knowledge gap detection']
    });

    this.fallbackBehaviors.set('contentGeneration', {
      agentType: 'contentGeneration',
      active: false,
      behavior: 'template_content',
      description: 'Use pre-generated content templates instead of dynamic generation',
      limitations: ['Less personalized content', 'Limited variety']
    });

    this.fallbackBehaviors.set('pathPlanning', {
      agentType: 'pathPlanning',
      active: false,
      behavior: 'linear_path',
      description: 'Use linear learning paths instead of adaptive planning',
      limitations: ['No dynamic path adjustment', 'Fixed progression']
    });

    this.fallbackBehaviors.set('intervention', {
      agentType: 'intervention',
      active: false,
      behavior: 'manual_intervention',
      description: 'Require manual intervention triggers instead of automatic detection',
      limitations: ['No proactive support', 'Delayed interventions']
    });

    this.fallbackBehaviors.set('communication', {
      agentType: 'communication',
      active: false,
      behavior: 'standard_communication',
      description: 'Use standard communication style instead of adaptive',
      limitations: ['No style adaptation', 'Generic responses']
    });
  }

  getFallbackBehavior(agentType: AgentType): FallbackBehavior | undefined {
    return this.fallbackBehaviors.get(agentType);
  }

  isFallbackActive(agentType: AgentType): boolean {
    const fallback = this.fallbackBehaviors.get(agentType);
    return fallback?.active || false;
  }

  // Utility methods
  private assessFailureSeverity(error: Error, context: any): 'low' | 'medium' | 'high' | 'critical' {
    // Assess severity based on error type and context
    if (error.message.includes('timeout')) return 'medium';
    if (error.message.includes('connection')) return 'high';
    if (error.message.includes('critical') || error.message.includes('fatal')) return 'critical';
    return 'low';
  }

  private logFailure(failureEvent: FailureEvent): void {
    if (!this.config.errorLoggingEnabled) return;

    this.failureHistory.push(failureEvent);

    // Maintain history size
    if (this.failureHistory.length > this.maxFailureHistorySize) {
      this.failureHistory.shift();
    }

    console.error(`Agent failure logged: ${failureEvent.agentType} - ${failureEvent.error.message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Query methods
  getAgentHealth(agentType: AgentType): AgentHealthStatus | undefined {
    return this.agentHealth.get(agentType);
  }

  getAllAgentHealth(): Map<AgentType, AgentHealthStatus> {
    return new Map(this.agentHealth);
  }

  getFailureHistory(agentType?: AgentType, limit?: number): FailureEvent[] {
    let history = agentType
      ? this.failureHistory.filter(f => f.agentType === agentType)
      : this.failureHistory;

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  getSystemHealth(): SystemHealthReport {
    const agentHealthMap = new Map<AgentType, boolean>();
    let totalFailures = 0;
    let criticalAgents = 0;

    for (const [agentType, health] of this.agentHealth.entries()) {
      agentHealthMap.set(agentType, health.healthy);
      totalFailures += health.errorCount;
      if (!health.healthy && health.consecutiveFailures >= this.config.alertThreshold) {
        criticalAgents++;
      }
    }

    return {
      healthy: criticalAgents === 0,
      agentHealth: agentHealthMap,
      totalFailures,
      criticalAgents,
      activeFallbacks: Array.from(this.fallbackBehaviors.values()).filter(f => f.active).length,
      recentFailures: this.failureHistory.filter(f => Date.now() - f.timestamp < 300000).length // Last 5 minutes
    };
  }
}

interface FallbackBehavior {
  agentType: AgentType;
  active: boolean;
  behavior: string;
  description: string;
  limitations: string[];
}

interface SystemHealthReport {
  healthy: boolean;
  agentHealth: Map<AgentType, boolean>;
  totalFailures: number;
  criticalAgents: number;
  activeFallbacks: number;
  recentFailures: number;
}
