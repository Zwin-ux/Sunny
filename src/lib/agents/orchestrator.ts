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
import {
    createInitialNarrativeState,
    evolvePersonalizedLesson,
    summarizeProfile,
} from './personalized-learning-engine';

export interface OrchestratorConfig {
    maxConcurrentOperations: number;
    decisionTimeout: number;
    conflictResolutionStrategy: 'priority' | 'consensus' | 'weighted';
    enableAnalytics: boolean;
    enableStateSync: boolean;
    syncInterval: number; // milliseconds
    conflictResolutionTimeout: number;
}

export class LearningOrchestrator extends EventEmitter {
    private agents: Map<AgentType, BaseAgent> = new Map();
    private learningStates: Map<string, LearningState> = new Map(); // studentId -> state
    private profileSnapshots: Map<string, EnhancedStudentProfile> = new Map();
    private activeOperations: Map<string, Operation> = new Map();
    private config: OrchestratorConfig;
    private eventSystem: AgentEventSystem;
    private isRunning: boolean = false;
    private stateSyncInterval?: NodeJS.Timeout;
    private messageRouter: MessageRouter;
    private conflictResolver: ConflictResolver;
    private coherenceManager: CoherenceManager;

    constructor(config: Partial<OrchestratorConfig> = {}) {
        super();
        this.config = {
            maxConcurrentOperations: 10,
            decisionTimeout: 5000,
            conflictResolutionStrategy: 'weighted',
            enableAnalytics: true,
            enableStateSync: true,
            syncInterval: 1000,
            conflictResolutionTimeout: 3000,
            ...config
        };
        this.eventSystem = globalEventSystem;
        this.messageRouter = new MessageRouter(this.eventSystem);
        this.conflictResolver = new ConflictResolver(this.config.conflictResolutionStrategy);
        this.coherenceManager = new CoherenceManager();
        this.setupEventHandlers();
    }

    // Orchestrator lifecycle
    async start(): Promise<void> {
        if (this.isRunning) {
            throw new Error('Orchestrator is already running');
        }

        try {
            // Start message router
            this.messageRouter.start();

            // Start all registered agents
            for (const [agentType, agent] of Array.from(this.agents.entries())) {
                await agent.start();
                // Register agent with message router
                this.messageRouter.registerAgent(agentType, agent);
                console.log(`Started agent: ${agentType}`);
            }

            // Start state synchronization if enabled
            if (this.config.enableStateSync) {
                this.startStateSync();
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
            // Stop state synchronization
            if (this.stateSyncInterval) {
                clearInterval(this.stateSyncInterval);
                this.stateSyncInterval = undefined;
            }

            // Stop message router
            this.messageRouter.stop();

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
            lastUpdated: Date.now(),
            profileSummary: summarizeProfile(profile),
            adaptiveNarrative: createInitialNarrativeState(profile),
            momentumScore: 0.6
        };

        this.learningStates.set(studentId, learningState);
        this.profileSnapshots.set(studentId, profile);
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

            // 3. Resolve conflicts and make decisions using conflict resolver
            const decisions = await this.conflictResolver.resolveConflicts(
                recommendations,
                learningState,
                this.config.conflictResolutionTimeout
            );

            operation.decisions = decisions;

            // 4. Ensure coherence across decisions
            const coherentDecisions = this.coherenceManager.ensureCoherence(
                decisions,
                learningState,
                this.getRecentDecisions(studentId)
            );

            // 5. Execute decisions
            const results = await this.executeDecisions(coherentDecisions, studentId);

            const personalization = evolvePersonalizedLesson({
                studentId,
                learningState,
                profile: this.profileSnapshots.get(studentId),
                interaction,
                baseResponse: results.response
            });

            if (personalization) {
                results.response = personalization.response;
                results.actions = Array.from(new Set([...results.actions, ...personalization.actions]));
                results.updates = { ...results.updates, ...personalization.updates };
            }

            // 6. Update learning state with synchronization
            await this.updateLearningStateWithSync(studentId, results);

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

    // State synchronization
    private startStateSync(): void {
        this.stateSyncInterval = setInterval(() => {
            this.synchronizeLearningStates();
        }, this.config.syncInterval);
    }

    private synchronizeLearningStates(): void {
        for (const [studentId, state] of this.learningStates.entries()) {
            // Emit sync event for persistence layer
            this.emit('learning:state:sync', { studentId, state });
        }
    }

    private async updateLearningStateWithSync(studentId: string, results: ExecutionResult): Promise<void> {
        if (Object.keys(results.updates).length > 0) {
            this.updateLearningState(studentId, results.updates);
            
            // Notify all agents of state change
            const stateChangeEvent: AgentEvent = {
                id: uuidv4(),
                type: 'learning:state:changed',
                source: 'orchestrator',
                data: { studentId, updates: results.updates },
                timestamp: Date.now(),
                priority: 'high'
            };
            this.eventSystem.publishEvent(stateChangeEvent);
        }
    }

    private getRecentDecisions(studentId: string, limit: number = 10): Decision[] {
        // Get recent decisions from operation history
        const recentOps = Array.from(this.activeOperations.values())
            .filter(op => op.studentId === studentId && op.status === 'completed')
            .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
            .slice(0, limit);

        return recentOps.map(op => op.decisions || []).flat();
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
            queueStats: this.eventSystem.getQueueStats(),
            messageRouterStats: this.messageRouter.getStats(),
            coherenceScore: this.coherenceManager.getAverageCoherenceScore()
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
    decisions?: Decision[];
}

interface Decision {
    id: string;
    type: string;
    action: string;
    data: any;
    confidence: number;
    agentSource?: AgentType;
    timestamp?: number;
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
    messageRouterStats: any;
    coherenceScore: number;
}

// Message Router - handles intelligent message routing with priority
class MessageRouter {
    private eventSystem: AgentEventSystem;
    private agentRegistry: Map<AgentType, BaseAgent> = new Map();
    private messageStats: Map<AgentType, MessageStats> = new Map();
    private isRunning: boolean = false;

    constructor(eventSystem: AgentEventSystem) {
        this.eventSystem = eventSystem;
    }

    start(): void {
        this.isRunning = true;
    }

    stop(): void {
        this.isRunning = false;
    }

    registerAgent(agentType: AgentType, agent: BaseAgent): void {
        this.agentRegistry.set(agentType, agent);
        this.messageStats.set(agentType, {
            sent: 0,
            received: 0,
            failed: 0,
            avgResponseTime: 0
        });
    }

    async routeMessage(message: AgentMessage): Promise<AgentResponse> {
        if (!this.isRunning) {
            throw new Error('Message router is not running');
        }

        const startTime = Date.now();
        const targetAgent = this.agentRegistry.get(message.to as AgentType);
        
        if (!targetAgent) {
            return {
                messageId: message.id,
                success: false,
                error: `Agent ${message.to} not found`
            };
        }

        try {
            // Update stats
            const stats = this.messageStats.get(message.to as AgentType)!;
            stats.sent++;

            // Route message based on priority
            const response = await this.routeWithPriority(message, targetAgent);
            
            // Update response time stats
            const responseTime = Date.now() - startTime;
            stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
            stats.received++;

            return response;
        } catch (error) {
            const stats = this.messageStats.get(message.to as AgentType)!;
            stats.failed++;
            
            return {
                messageId: message.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async routeWithPriority(message: AgentMessage, agent: BaseAgent): Promise<AgentResponse> {
        // For urgent messages, bypass queue
        if (message.priority === 'urgent') {
            return await agent.handleMessage(message);
        }

        // For other priorities, use normal routing
        return await agent.handleMessage(message);
    }

    getStats(): Record<string, MessageStats> {
        const stats: Record<string, MessageStats> = {};
        for (const [agentType, agentStats] of this.messageStats.entries()) {
            stats[agentType] = { ...agentStats };
        }
        return stats;
    }
}

interface MessageStats {
    sent: number;
    received: number;
    failed: number;
    avgResponseTime: number;
}

// Conflict Resolver - resolves conflicts between competing agent recommendations
class ConflictResolver {
    private strategy: 'priority' | 'consensus' | 'weighted';

    constructor(strategy: 'priority' | 'consensus' | 'weighted') {
        this.strategy = strategy;
    }

    async resolveConflicts(
        recommendations: Recommendation[],
        learningState: LearningState,
        timeout: number
    ): Promise<Decision[]> {
        // Group conflicting recommendations
        const conflicts = this.identifyConflicts(recommendations);
        
        if (conflicts.length === 0) {
            // No conflicts, convert all recommendations to decisions
            return recommendations.map(rec => this.recommendationToDecision(rec));
        }

        // Resolve each conflict group
        const resolvedDecisions: Decision[] = [];
        
        for (const conflictGroup of conflicts) {
            const resolved = await this.resolveConflictGroup(conflictGroup, learningState);
            resolvedDecisions.push(...resolved);
        }

        // Add non-conflicting recommendations
        const nonConflicting = recommendations.filter(rec => 
            !conflicts.some(group => group.some(r => r.id === rec.id))
        );
        resolvedDecisions.push(...nonConflicting.map(rec => this.recommendationToDecision(rec)));

        return resolvedDecisions;
    }

    private identifyConflicts(recommendations: Recommendation[]): Recommendation[][] {
        const conflicts: Recommendation[][] = [];
        const processed = new Set<string>();

        for (let i = 0; i < recommendations.length; i++) {
            if (processed.has(recommendations[i].id)) continue;

            const conflictGroup: Recommendation[] = [recommendations[i]];
            processed.add(recommendations[i].id);

            for (let j = i + 1; j < recommendations.length; j++) {
                if (processed.has(recommendations[j].id)) continue;

                if (this.areConflicting(recommendations[i], recommendations[j])) {
                    conflictGroup.push(recommendations[j]);
                    processed.add(recommendations[j].id);
                }
            }

            if (conflictGroup.length > 1) {
                conflicts.push(conflictGroup);
            }
        }

        return conflicts;
    }

    private areConflicting(rec1: Recommendation, rec2: Recommendation): boolean {
        // Two recommendations conflict if they suggest different actions for the same type
        if (rec1.type !== rec2.type) return false;
        
        // Check if they're trying to do opposite things
        const opposites = [
            ['increase', 'decrease'],
            ['add', 'remove'],
            ['start', 'stop'],
            ['enable', 'disable']
        ];

        for (const [action1, action2] of opposites) {
            if (
                (rec1.description.toLowerCase().includes(action1) && 
                 rec2.description.toLowerCase().includes(action2)) ||
                (rec1.description.toLowerCase().includes(action2) && 
                 rec2.description.toLowerCase().includes(action1))
            ) {
                return true;
            }
        }

        return false;
    }

    private async resolveConflictGroup(
        conflictGroup: Recommendation[],
        learningState: LearningState
    ): Promise<Decision[]> {
        switch (this.strategy) {
            case 'priority':
                return this.resolvePriority(conflictGroup);
            case 'consensus':
                return this.resolveConsensus(conflictGroup);
            case 'weighted':
                return this.resolveWeighted(conflictGroup, learningState);
            default:
                return this.resolvePriority(conflictGroup);
        }
    }

    private resolvePriority(conflictGroup: Recommendation[]): Decision[] {
        // Sort by priority and confidence, take the top one
        const sorted = conflictGroup.sort((a, b) => {
            const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
            if (priorityDiff !== 0) return priorityDiff;
            return b.confidence - a.confidence;
        });

        return [this.recommendationToDecision(sorted[0])];
    }

    private resolveConsensus(conflictGroup: Recommendation[]): Decision[] {
        // Find the recommendation with most similar recommendations
        const similarityCounts = conflictGroup.map(rec => ({
            rec,
            count: conflictGroup.filter(other => 
                this.calculateSimilarity(rec, other) > 0.7
            ).length
        }));

        similarityCounts.sort((a, b) => b.count - a.count);
        return [this.recommendationToDecision(similarityCounts[0].rec)];
    }

    private resolveWeighted(conflictGroup: Recommendation[], learningState: LearningState): Decision[] {
        // Calculate weighted scores based on context
        const weighted = conflictGroup.map(rec => ({
            rec,
            score: this.calculateContextualWeight(rec, learningState)
        }));

        weighted.sort((a, b) => b.score - a.score);
        return [this.recommendationToDecision(weighted[0].rec)];
    }

    private calculateSimilarity(rec1: Recommendation, rec2: Recommendation): number {
        // Simple similarity based on type and description overlap
        if (rec1.type !== rec2.type) return 0;
        
        const words1 = rec1.description.toLowerCase().split(' ');
        const words2 = rec2.description.toLowerCase().split(' ');
        const overlap = words1.filter(w => words2.includes(w)).length;
        
        return overlap / Math.max(words1.length, words2.length);
    }

    private calculateContextualWeight(rec: Recommendation, learningState: LearningState): number {
        let weight = rec.confidence;

        // Adjust based on priority
        weight *= this.getPriorityValue(rec.priority) / 4;

        // Adjust based on engagement level
        if (learningState.engagementMetrics.currentLevel < 0.5 && rec.type === 'intervention') {
            weight *= 1.5;
        }

        // Adjust based on frustration level
        if (learningState.engagementMetrics.frustrationLevel > 0.7 && rec.type === 'intervention') {
            weight *= 1.3;
        }

        return weight;
    }

    private recommendationToDecision(rec: Recommendation): Decision {
        return {
            id: uuidv4(),
            type: rec.type,
            action: rec.description,
            data: rec.data,
            confidence: rec.confidence,
            timestamp: Date.now()
        };
    }

    private getPriorityValue(priority: Priority): number {
        const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
        return priorityMap[priority];
    }
}

// Coherence Manager - ensures learning experience coherence across agents
class CoherenceManager {
    private coherenceHistory: CoherenceCheck[] = [];
    private maxHistorySize: number = 100;

    ensureCoherence(
        decisions: Decision[],
        learningState: LearningState,
        recentDecisions: Decision[]
    ): Decision[] {
        const coherentDecisions: Decision[] = [];
        
        for (const decision of decisions) {
            const coherenceScore = this.calculateCoherence(decision, learningState, recentDecisions);
            
            if (coherenceScore >= 0.6) {
                coherentDecisions.push(decision);
            } else {
                // Try to adjust decision to improve coherence
                const adjusted = this.adjustForCoherence(decision, learningState, recentDecisions);
                if (adjusted) {
                    coherentDecisions.push(adjusted);
                }
            }

            // Record coherence check
            this.recordCoherenceCheck({
                decisionId: decision.id,
                score: coherenceScore,
                timestamp: Date.now(),
                accepted: coherenceScore >= 0.6
            });
        }

        return coherentDecisions;
    }

    private calculateCoherence(
        decision: Decision,
        learningState: LearningState,
        recentDecisions: Decision[]
    ): number {
        let score = 1.0;

        // Check consistency with recent decisions
        const recentSimilar = recentDecisions.filter(d => 
            d.type === decision.type && 
            Date.now() - (d.timestamp || 0) < 60000 // Within last minute
        );

        if (recentSimilar.length > 0) {
            // Penalize if contradicting recent decisions
            const contradicting = recentSimilar.some(d => 
                this.areContradicting(d, decision)
            );
            if (contradicting) {
                score *= 0.5;
            }
        }

        // Check alignment with learning objectives
        if (learningState.currentObjectives.length > 0) {
            const aligned = this.isAlignedWithObjectives(decision, learningState.currentObjectives);
            if (!aligned) {
                score *= 0.7;
            }
        }

        // Check engagement appropriateness
        if (learningState.engagementMetrics.currentLevel < 0.3 && decision.type !== 'intervention') {
            score *= 0.6; // Prefer interventions when engagement is low
        }

        return Math.max(0, Math.min(1, score));
    }

    private areContradicting(decision1: Decision, decision2: Decision): boolean {
        // Check if decisions contradict each other
        const opposites = [
            ['increase', 'decrease'],
            ['add', 'remove'],
            ['start', 'stop']
        ];

        for (const [action1, action2] of opposites) {
            if (
                (decision1.action.toLowerCase().includes(action1) && 
                 decision2.action.toLowerCase().includes(action2)) ||
                (decision1.action.toLowerCase().includes(action2) && 
                 decision2.action.toLowerCase().includes(action1))
            ) {
                return true;
            }
        }

        return false;
    }

    private isAlignedWithObjectives(decision: Decision, objectives: LearningObjective[]): boolean {
        // Check if decision supports current learning objectives
        if (objectives.length === 0) return true;

        // Simple check: decision should relate to at least one objective
        return objectives.some(obj => 
            decision.action.toLowerCase().includes(obj.title.toLowerCase()) ||
            decision.data?.objectiveId === obj.id
        );
    }

    private adjustForCoherence(
        decision: Decision,
        learningState: LearningState,
        recentDecisions: Decision[]
    ): Decision | null {
        // Try to adjust decision to improve coherence
        // For now, just return null if coherence is too low
        // In a more sophisticated implementation, we could modify the decision
        return null;
    }

    private recordCoherenceCheck(check: CoherenceCheck): void {
        this.coherenceHistory.push(check);
        
        // Maintain history size
        if (this.coherenceHistory.length > this.maxHistorySize) {
            this.coherenceHistory.shift();
        }
    }

    getAverageCoherenceScore(): number {
        if (this.coherenceHistory.length === 0) return 1.0;
        
        const sum = this.coherenceHistory.reduce((acc, check) => acc + check.score, 0);
        return sum / this.coherenceHistory.length;
    }
}

interface CoherenceCheck {
    decisionId: string;
    score: number;
    timestamp: number;
    accepted: boolean;
}