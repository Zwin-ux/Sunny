// Central orchestration layer that coordinates all agents
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './base-agent';
import { AgentEventSystem, globalEventSystem } from './event-system';
import {
    AgentType,
    AgentMessage,
    AgentResponse,
    AgentEvent,
    LearningState,
    EnhancedStudentProfile,
    Recommendation,
    Priority,
    LearningObjective,
    Activity,
    ConceptMap,
    EngagementData
} from './types';

export interface OrchestratorConfig {
    maxConcurrentOperations: number;
    decisionTimeout: number;
    conflictResolutionStrategy: 'priority' | 'consensus' | 'weighted';
    enableAnalytics: boolean;
}

export class LearningOrchestrator extends EventEmitter {
    private agents: Map<AgentType, BaseAgent> = new Map();
    private learningStates: Map<string, LearningState> = new Map(); // studentId -> state
    private activeOperations: Map<string, Operation> = new Map();
    private config: OrchestratorConfig;
    private eventSystem: AgentEventSystem;
    private isRunning: boolean = false;

    constructor(config: Partial<OrchestratorConfig> = {}) {
        super();
        this.config = {
            maxConcurrentOperations: 10,
            decisionTimeout: 5000,
            conflictResolutionStrategy: 'weighted',
            enableAnalytics: true,
            ...config
        };
        this.eventSystem = globalEventSystem;
        this.setupEventHandlers();
    }

    // Orchestrator lifecycle
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Orchestrator is already running');
        }

        try {
            // Start all registered agents
            for (const [agentType, agent] of Array.from(this.agents.entries())) {
                await agent.start();
                console.log(`Started agent: ${agentType}`);
            }

            this.isRunning = true;
            this.emit('orchestrator:started');
            console.log('Learning Orchestrator started successfully');
        } catch (error) {
            console.error('Failed to start orchestrator:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            // Stop all agents
            for (const [agentType, agent] of Array.from(this.agents.entries())) {
                await agent.stop();
                console.log(`Stopped agent: ${agentType}`);
            }

            this.isRunning = false;
            this.emit('orchestrator:stopped');
            console.log('Learning Orchestrator stopped successfully');
        } catch (error) {
            console.error('Error stopping orchestrator:', error);
            throw error;
        }
    }

    // Agent management
    registerAgent(agent: BaseAgent): void {
        if (this.agents.has(agent.type)) {
            throw new Error(`Agent of type ${agent.type} is already registered`);
        }

        this.agents.set(agent.type, agent);

        // Set up agent event forwarding
        agent.on('agent:event', (event: AgentEvent) => {
            this.eventSystem.publishEvent(event);
        });

        console.log(`Registered agent: ${agent.type}`);
    }

    unregisterAgent(agentType: AgentType): void {
        const agent = this.agents.get(agentType);
        if (agent) {
            agent.removeAllListeners();
            this.agents.delete(agentType);
            console.log(`Unregistered agent: ${agentType}`);
        }
    }

    // Learning state management
    initializeLearningState(studentId: string, profile: EnhancedStudentProfile): LearningState {
        const sessionId = uuidv4();
        const learningState: LearningState = {
            studentId,
            sessionId,
            currentObjectives: [],
            knowledgeMap: this.initializeKnowledgeMap(profile),
            engagementMetrics: this.initializeEngagementData(profile),
            learningPath: [],
            contextHistory: [],
            lastUpdated: Date.now()
        };

        this.learningStates.set(studentId, learningState);
        this.emit('learning:state:initialized', { studentId, sessionId });

        return learningState;
    }

    getLearningState(studentId: string): LearningState | undefined {
        return this.learningStates.get(studentId);
    }

    updateLearningState(studentId: string, updates: Partial<LearningState>): void {
        const currentState = this.learningStates.get(studentId);
        if (!currentState) {
            throw new Error(`No learning state found for student: ${studentId}`);
        }

        const updatedState = {
            ...currentState,
            ...updates,
            lastUpdated: Date.now()
        };

        this.learningStates.set(studentId, updatedState);
        this.emit('learning:state:updated', { studentId, updates });
    }

    // Core orchestration methods
    async processStudentInteraction(
        studentId: string,
        interaction: any
    ): Promise<{ response: string; actions: string[] }> {
        const learningState = this.getLearningState(studentId);
        if (!learningState) {
            throw new Error(`No learning state found for student: ${studentId}`);
        }

        const operationId = uuidv4();
        const operation: Operation = {
            id: operationId,
            type: 'student_interaction',
            studentId,
            data: interaction,
            startTime: Date.now(),
            status: 'processing'
        };

        this.activeOperations.set(operationId, operation);

        try {
            // 1. Assessment Agent analyzes the interaction
            const assessmentResult = await this.requestAgentAnalysis('assessment', {
                interaction,
                learningState,
                operationId
            });

            // 2. Get recommendations from multiple agents
            const recommendations = await this.gatherRecommendations(studentId, {
                assessmentResult,
                interaction,
                operationId
            });

            // 3. Resolve conflicts and make decisions
            const decisions = await this.makeDecisions(recommendations, learningState);

            // 4. Execute decisions
            const results = await this.executeDecisions(decisions, studentId);

            // 5. Update learning state
            this.updateLearningStateFromResults(studentId, results);

            operation.status = 'completed';
            operation.endTime = Date.now();

            return {
                response: results.response || 'I understand! Let me help you with that.',
                actions: results.actions || []
            };

        } catch (error) {
            operation.status = 'failed';
            operation.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error processing student interaction:`, error);

            return {
                response: 'I encountered an issue, but I\'m here to help! Let\'s try again.',
                actions: []
            };
        } finally {
            this.activeOperations.delete(operationId);
        }
    }

    // Agent communication
    private async requestAgentAnalysis(
        agentType: AgentType,
        data: any
    ): Promise<any> {
        const agent = this.agents.get(agentType);
        if (!agent) {
            throw new Error(`Agent ${agentType} not found`);
        }

        const message: AgentMessage = {
            id: uuidv4(),
            from: 'orchestrator',
            to: agentType,
            type: 'request',
            payload: { action: 'analyze', data },
            timestamp: Date.now(),
            priority: 'high'
        };

        const response = await agent.handleMessage(message);
        if (!response.success) {
            throw new Error(`Agent ${agentType} analysis failed: ${response.error}`);
        }

        return response.data;
    }

    private async gatherRecommendations(
        studentId: string,
        context: any
    ): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];
        const agentTypes: AgentType[] = ['pathPlanning', 'contentGeneration', 'intervention', 'communication'];

        const promises = agentTypes.map(async (agentType) => {
            try {
                const agent = this.agents.get(agentType);
                if (!agent) return [];

                const message: AgentMessage = {
                    id: uuidv4(),
                    from: 'orchestrator',
                    to: agentType,
                    type: 'request',
                    payload: { action: 'recommend', studentId, context },
                    timestamp: Date.now(),
                    priority: 'medium'
                };

                const response = await agent.handleMessage(message);
                return response.recommendations || [];
            } catch (error) {
                console.error(`Error getting recommendations from ${agentType}:`, error);
                return [];
            }
        });

        const results = await Promise.all(promises);
        results.forEach(agentRecommendations => {
            recommendations.push(...agentRecommendations);
        });

        return recommendations;
    }

    private async makeDecisions(
        recommendations: Recommendation[],
        learningState: LearningState
    ): Promise<Decision[]> {
        // Sort recommendations by priority and confidence
        const sortedRecommendations = recommendations.sort((a, b) => {
            const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
            if (priorityDiff !== 0) return priorityDiff;
            return b.confidence - a.confidence;
        });

        const decisions: Decision[] = [];

        // Apply conflict resolution strategy
        switch (this.config.conflictResolutionStrategy) {
            case 'priority':
                decisions.push(...this.resolvePriorityBased(sortedRecommendations));
                break;
            case 'consensus':
                decisions.push(...this.resolveConsensusBased(sortedRecommendations));
                break;
            case 'weighted':
                decisions.push(...this.resolveWeightedBased(sortedRecommendations, learningState));
                break;
        }

        return decisions;
    }

    private async executeDecisions(
        decisions: Decision[],
        studentId: string
    ): Promise<ExecutionResult> {
        const results: ExecutionResult = {
            response: '',
            actions: [],
            updates: {}
        };

        for (const decision of decisions) {
            try {
                const result = await this.executeDecision(decision, studentId);

                if (result.response) {
                    results.response = result.response;
                }

                if (result.actions) {
                    results.actions.push(...result.actions);
                }

                if (result.updates) {
                    Object.assign(results.updates, result.updates);
                }
            } catch (error) {
                console.error(`Error executing decision ${decision.id}:`, error);
            }
        }

        return results;
    }

    // Event handling setup
    private setupEventHandlers(): void {
        this.eventSystem.on('orchestrator:message', (message: AgentMessage) => {
            this.handleAgentMessage(message);
        });

        this.eventSystem.on('event:processed', (event: AgentEvent) => {
            this.handleAgentEvent(event);
        });
    }

    private async handleAgentMessage(message: AgentMessage): Promise<void> {
        // Handle messages directed to orchestrator
        console.log(`Orchestrator received message from ${message.from}:`, message.type);
    }

    private async handleAgentEvent(event: AgentEvent): Promise<void> {
        // Handle events from agents
        if (event.type === 'learning:progress' || event.type === 'engagement:change') {
            // Update relevant learning states
            this.emit('orchestrator:event', event);
        }
    }

    // Utility methods
    private initializeKnowledgeMap(profile: EnhancedStudentProfile): ConceptMap {
        return {
            concepts: {}, // Empty record initially, will be populated as student learns
            relationships: [],
            masteryLevels: new Map(),
            knowledgeGaps: []
        };
    }

    private initializeEngagementData(profile: EnhancedStudentProfile): EngagementData {
        return {
            currentLevel: 0.7, // Start with moderate engagement
            attentionSpan: profile.attentionSpanData?.averageSpan || 15,
            interactionFrequency: 0,
            responseTime: 0,
            frustrationLevel: 0,
            motivationLevel: 0.8,
            preferredActivityTypes: profile.preferredActivityTypes?.map(p => p.activityType) || [],
            engagementHistory: []
        };
    }

    private updateLearningStateFromResults(studentId: string, results: ExecutionResult): void {
        if (Object.keys(results.updates).length > 0) {
            this.updateLearningState(studentId, results.updates);
        }
    }

    private getPriorityValue(priority: Priority): number {
        const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
        return priorityMap[priority];
    }

    // Conflict resolution strategies
    private resolvePriorityBased(recommendations: Recommendation[]): Decision[] {
        // Take the highest priority recommendation
        const topRecommendation = recommendations[0];
        if (!topRecommendation) return [];

        return [{
            id: uuidv4(),
            type: topRecommendation.type,
            action: topRecommendation.description,
            data: topRecommendation.data,
            confidence: topRecommendation.confidence
        }];
    }

    private resolveConsensusBased(recommendations: Recommendation[]): Decision[] {
        // Group by type and find consensus
        const grouped = new Map<string, Recommendation[]>();
        recommendations.forEach(rec => {
            const key = `${rec.type}:${rec.description}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(rec);
        });

        const decisions: Decision[] = [];
        for (const [key, recs] of Array.from(grouped.entries())) {
            if (recs.length >= 2) { // Consensus threshold
                const avgConfidence = recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length;
                decisions.push({
                    id: uuidv4(),
                    type: recs[0].type,
                    action: recs[0].description,
                    data: recs[0].data,
                    confidence: avgConfidence
                });
            }
        }

        return decisions;
    }

    private resolveWeightedBased(recommendations: Recommendation[], state: LearningState): Decision[] {
        // Weight recommendations based on current learning context
        const weightedRecs = recommendations.map(rec => ({
            ...rec,
            weightedScore: this.calculateWeight(rec, state)
        }));

        weightedRecs.sort((a, b) => b.weightedScore - a.weightedScore);

        return weightedRecs.slice(0, 3).map(rec => ({
            id: uuidv4(),
            type: rec.type,
            action: rec.description,
            data: rec.data,
            confidence: rec.confidence
        }));
    }

    private calculateWeight(recommendation: Recommendation, state: LearningState): number {
        let weight = recommendation.confidence;

        // Adjust based on priority
        weight *= this.getPriorityValue(recommendation.priority) / 4;

        // Adjust based on current engagement
        if (state.engagementMetrics.currentLevel < 0.5 && recommendation.type === 'intervention') {
            weight *= 1.5;
        }

        return weight;
    }

    private async executeDecision(decision: Decision, studentId: string): Promise<ExecutionResult> {
        // Execute individual decision based on type
        switch (decision.type) {
            case 'content':
                return this.executeContentDecision(decision, studentId);
            case 'intervention':
                return this.executeInterventionDecision(decision, studentId);
            case 'strategy':
                return this.executeStrategyDecision(decision, studentId);
            default:
                return { response: '', actions: [], updates: {} };
        }
    }

    private async executeContentDecision(decision: Decision, studentId: string): Promise<ExecutionResult> {
        // For now, use the AI generation directly
        // TODO: Make content generation agent call OpenAI with specialized prompts
        const learningState = this.getLearningState(studentId);

        // Generate a contextual response based on the learning state
        let response = "Let me help you learn about that! ";

        // Add context-aware suggestions
        if (learningState && learningState.knowledgeMap.knowledgeGaps.length > 0) {
            response += "I notice we can work on some concepts together. ";
        }

        response += decision.data?.hint || "What would you like to explore?";

        return {
            response,
            actions: ['content_generated'],
            updates: {}
        };
    }

    private async executeInterventionDecision(decision: Decision, studentId: string): Promise<ExecutionResult> {
        return {
            response: decision.data.message || 'Let me help you with that!',
            actions: ['intervention_applied'],
            updates: {
                engagementMetrics: {
                    ...this.getLearningState(studentId)?.engagementMetrics,
                    motivationLevel: Math.min(1, (this.getLearningState(studentId)?.engagementMetrics.motivationLevel || 0) + 0.1)
                }
            }
        };
    }

    private async executeStrategyDecision(decision: Decision, studentId: string): Promise<ExecutionResult> {
        return {
            response: '',
            actions: ['strategy_applied'],
            updates: {}
        };
    }

    // Health and monitoring
    getSystemHealth(): SystemHealth {
        const agentHealth = new Map<AgentType, boolean>();
        for (const [type, agent] of Array.from(this.agents.entries())) {
            agentHealth.set(type, agent.getHealthStatus().healthy);
        }

        return {
            orchestratorRunning: this.isRunning,
            agentHealth,
            activeOperations: this.activeOperations.size,
            activeLearningStates: this.learningStates.size,
            queueStats: this.eventSystem.getQueueStats()
        };
    }
}

// Supporting interfaces
interface Operation {
    id: string;
    type: string;
    studentId: string;
    data: any;
    startTime: number;
    endTime?: number;
    status: 'processing' | 'completed' | 'failed';
    error?: string;
}

interface Decision {
    id: string;
    type: string;
    action: string;
    data: any;
    confidence: number;
}

interface ExecutionResult {
    response: string;
    actions: string[];
    updates: any;
}

interface SystemHealth {
    orchestratorRunning: boolean;
    agentHealth: Map<AgentType, boolean>;
    activeOperations: number;
    activeLearningStates: number;
    queueStats: any;
}