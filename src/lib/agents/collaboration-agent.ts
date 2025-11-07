/**
 * Collaboration Agent
 *
 * Specialized agent responsible for:
 * - Simulating peer learning experiences
 * - Group activity recommendations
 * - Social learning patterns
 * - Collaborative problem-solving
 * - Peer teaching opportunities
 */

import { BaseAgent } from './base-agent';
import {
  AgentMessage,
  AgentResponse,
  LearningState,
  EnhancedStudentProfile,
} from './types';
import { getOpenAIClient } from '../sunny-ai';

interface PeerLearningActivity {
  id: string;
  type: 'peer_teaching' | 'group_challenge' | 'collaborative_project' | 'discussion';
  title: string;
  description: string;
  recommendedGroupSize: number;
  duration_minutes: number;
  roles: string[]; // e.g., ['explainer', 'questioner', 'recorder']
  learning_objectives: string[];
  materials_needed: string[];
}

interface SimulatedPeer {
  name: string;
  personality: 'curious' | 'supportive' | 'challenging' | 'playful';
  level: 'peer' | 'slightly_ahead' | 'slightly_behind';
  avatar?: string;
}

export class CollaborationAgent extends BaseAgent {
  private simulatedPeers: Map<string, SimulatedPeer> = new Map();

  constructor() {
    super('collaboration');
    this.initializeSimulatedPeers();
  }

  async initialize(): Promise<void> {
    console.log('[CollaborationAgent] Initializing...');
    this.emit('agent:initialized', { agentType: this.agentType });
  }

  async shutdown(): Promise<void> {
    console.log('[CollaborationAgent] Shutting down...');
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { type, payload } = message;

    try {
      if (type === 'recommend_collaboration') {
        // Recommend collaborative activity
        const activity = await this.recommendCollaborativeActivity(
          payload.learningState,
          payload.studentProfile
        );

        return {
          success: true,
          confidence: 0.82,
          priority: 'medium',
          data: { activity },
          recommendations: [
            {
              id: `collab-${Date.now()}`,
              type: 'action',
              priority: 'medium',
              description: 'Suggest collaborative learning activity',
              data: activity,
              confidence: 0.82,
            },
          ],
        };
      }

      if (type === 'simulate_peer_interaction') {
        // Generate simulated peer dialogue
        const peerInteraction = await this.simulatePeerInteraction(
          payload.topic,
          payload.studentProfile,
          payload.interactionType
        );

        return {
          success: true,
          confidence: 0.78,
          priority: 'medium',
          data: { peerInteraction },
          recommendations: [
            {
              id: `peer-${Date.now()}`,
              type: 'content',
              priority: 'medium',
              description: 'Present simulated peer interaction',
              data: peerInteraction,
              confidence: 0.78,
            },
          ],
        };
      }

      if (type === 'peer_teaching_opportunity') {
        // Student teaches concept to simulated peer
        const teachingScenario = await this.createPeerTeachingScenario(
          payload.concept,
          payload.studentProfile
        );

        return {
          success: true,
          confidence: 0.85,
          priority: 'high',
          data: { teachingScenario },
          recommendations: [
            {
              id: `teach-${Date.now()}`,
              type: 'action',
              priority: 'high',
              description: 'Invite student to teach peer',
              data: teachingScenario,
              confidence: 0.85,
            },
          ],
        };
      }

      if (type === 'group_challenge') {
        // Multi-step collaborative challenge
        const challenge = await this.generateGroupChallenge(
          payload.topic,
          payload.difficulty
        );

        return {
          success: true,
          confidence: 0.80,
          priority: 'medium',
          data: { challenge },
          recommendations: [
            {
              id: `group-${Date.now()}`,
              type: 'action',
              priority: 'medium',
              description: 'Launch group challenge',
              data: challenge,
              confidence: 0.80,
            },
          ],
        };
      }

      return {
        success: false,
        confidence: 0.1,
        priority: 'low',
        data: {},
        recommendations: [],
      };
    } catch (error) {
      console.error('[CollaborationAgent] Error processing message:', error);
      return {
        success: false,
        error: (error as Error).message,
        confidence: 0,
        priority: 'low',
        data: {},
        recommendations: [],
      };
    }
  }

  /**
   * Initialize simulated peer personalities
   */
  private initializeSimulatedPeers(): void {
    this.simulatedPeers.set('alex', {
      name: 'Alex',
      personality: 'curious',
      level: 'peer',
    });

    this.simulatedPeers.set('maya', {
      name: 'Maya',
      personality: 'supportive',
      level: 'slightly_ahead',
    });

    this.simulatedPeers.set('jordan', {
      name: 'Jordan',
      personality: 'playful',
      level: 'peer',
    });

    this.simulatedPeers.set('sam', {
      name: 'Sam',
      personality: 'challenging',
      level: 'slightly_behind',
    });
  }

  /**
   * Recommend collaborative activity based on student profile
   */
  private async recommendCollaborativeActivity(
    learningState: LearningState,
    studentProfile: EnhancedStudentProfile
  ): Promise<PeerLearningActivity> {
    const { motivationFactors, learningVelocity } = studentProfile;
    const { currentObjectives } = learningState;

    // Determine activity type based on profile
    let activityType: PeerLearningActivity['type'] = 'group_challenge';

    if (motivationFactors.collaborative > 0.7) {
      activityType = 'collaborative_project';
    } else if (learningVelocity > 0.7) {
      activityType = 'peer_teaching'; // High performers benefit from teaching
    } else if (motivationFactors.intrinsic > 0.6) {
      activityType = 'discussion';
    }

    // Get current topic
    const currentTopic = currentObjectives[0]?.topic || 'general learning';

    return await this.generateCollaborativeActivity(currentTopic, activityType);
  }

  /**
   * Generate collaborative activity
   */
  private async generateCollaborativeActivity(
    topic: string,
    activityType: PeerLearningActivity['type']
  ): Promise<PeerLearningActivity> {
    try {
      const client = getOpenAIClient();

      const prompt = `You are an educational activity designer creating collaborative learning experiences for children aged 6-10.

Topic: ${topic}
Activity Type: ${activityType}

Create a ${activityType} activity that:
1. Encourages collaboration and communication
2. Has clear roles for participants
3. Is age-appropriate and engaging
4. Takes 15-20 minutes
5. Has measurable learning objectives

Return as JSON:
{
  "title": "Activity Title",
  "description": "Brief description (2-3 sentences)",
  "recommendedGroupSize": 2-4,
  "duration_minutes": 15-20,
  "roles": ["role1", "role2", ...],
  "learning_objectives": ["objective1", "objective2"],
  "materials_needed": ["item1", "item2"],
  "instructions": "Step-by-step instructions"
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const activity = JSON.parse(content);

      return {
        id: `collab-${Date.now()}`,
        type: activityType,
        title: activity.title,
        description: activity.description,
        recommendedGroupSize: activity.recommendedGroupSize,
        duration_minutes: activity.duration_minutes,
        roles: activity.roles || [],
        learning_objectives: activity.learning_objectives || [],
        materials_needed: activity.materials_needed || [],
      };
    } catch (error) {
      console.error(
        '[CollaborationAgent] Error generating activity:',
        error
      );

      // Fallback activity
      return this.getFallbackActivity(topic, activityType);
    }
  }

  /**
   * Simulate peer interaction
   */
  private async simulatePeerInteraction(
    topic: string,
    studentProfile: EnhancedStudentProfile,
    interactionType: 'question' | 'explanation' | 'challenge' | 'encouragement'
  ): Promise<{
    peer: SimulatedPeer;
    dialogue: Array<{ speaker: 'peer' | 'sunny'; message: string }>;
  }> {
    // Select appropriate peer
    const peer = this.selectPeerForInteraction(studentProfile, interactionType);

    // Generate dialogue
    const dialogue = await this.generatePeerDialogue(
      topic,
      peer,
      interactionType
    );

    return { peer, dialogue };
  }

  /**
   * Select appropriate peer for interaction
   */
  private selectPeerForInteraction(
    studentProfile: EnhancedStudentProfile,
    interactionType: string
  ): SimulatedPeer {
    if (interactionType === 'encouragement') {
      return this.simulatedPeers.get('maya')!; // Supportive peer
    } else if (interactionType === 'challenge') {
      return this.simulatedPeers.get('alex')!; // Curious peer
    } else if (interactionType === 'explanation') {
      return this.simulatedPeers.get('sam')!; // Slightly behind, needs help
    } else {
      return this.simulatedPeers.get('jordan')!; // Playful peer
    }
  }

  /**
   * Generate peer dialogue
   */
  private async generatePeerDialogue(
    topic: string,
    peer: SimulatedPeer,
    interactionType: string
  ): Promise<Array<{ speaker: 'peer' | 'sunny'; message: string }>> {
    try {
      const client = getOpenAIClient();

      const prompt = `You are writing dialogue for a simulated peer learning interaction for children aged 6-10.

Peer Character: ${peer.name} (${peer.personality}, ${peer.level})
Topic: ${topic}
Interaction Type: ${interactionType}

Generate a short dialogue (3-5 exchanges) between:
- ${peer.name} (the peer)
- Sunny (the AI tutor, facilitating)

The dialogue should:
1. Reflect ${peer.name}'s personality (${peer.personality})
2. Be age-appropriate and natural
3. Encourage the student to participate
4. Model good collaborative learning

Return as JSON:
{
  "dialogue": [
    {"speaker": "peer", "message": "message"},
    {"speaker": "sunny", "message": "message"},
    ...
  ]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.85,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      return parsed.dialogue || [];
    } catch (error) {
      console.error('[CollaborationAgent] Error generating dialogue:', error);

      // Fallback dialogue
      return this.getFallbackDialogue(peer, interactionType);
    }
  }

  /**
   * Create peer teaching scenario
   */
  private async createPeerTeachingScenario(
    concept: string,
    studentProfile: EnhancedStudentProfile
  ): Promise<{
    peer: SimulatedPeer;
    scenario: string;
    prompt: string;
    successCriteria: string[];
  }> {
    // Select peer who needs help (slightly behind)
    const peer = this.simulatedPeers.get('sam')!;

    try {
      const client = getOpenAIClient();

      const prompt = `You are creating a peer teaching scenario for a child aged 6-10.

The student has learned about: ${concept}
They will now teach this to a simulated peer named ${peer.name}.

Create a teaching scenario that:
1. Sets up why ${peer.name} needs help with ${concept}
2. Prompts the student to explain ${concept} in their own words
3. Defines success criteria for the teaching attempt
4. Is encouraging and low-pressure

Return as JSON:
{
  "scenario": "Brief scenario setup (2-3 sentences)",
  "prompt": "What Sunny says to invite the student to teach",
  "successCriteria": ["criteria1", "criteria2", "criteria3"]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.75,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);

      return {
        peer,
        scenario: parsed.scenario,
        prompt: parsed.prompt,
        successCriteria: parsed.successCriteria || [],
      };
    } catch (error) {
      console.error(
        '[CollaborationAgent] Error creating teaching scenario:',
        error
      );

      // Fallback scenario
      return {
        peer,
        scenario: `${peer.name} is having trouble understanding ${concept}. They could really use your help!`,
        prompt: `Can you explain ${concept} to ${peer.name} in your own words? Teaching someone else is a great way to make sure you really understand something! 🌟`,
        successCriteria: [
          'Explain the concept clearly',
          'Use an example',
          'Answer Sam\'s questions patiently',
        ],
      };
    }
  }

  /**
   * Generate group challenge
   */
  private async generateGroupChallenge(
    topic: string,
    difficulty: string
  ): Promise<{
    title: string;
    description: string;
    steps: Array<{ step: number; task: string; role: string }>;
    finalGoal: string;
  }> {
    // Implementation similar to other generation methods
    // For brevity, returning fallback

    return {
      title: `Team ${topic} Challenge`,
      description: `Work together to solve this multi-step ${topic} challenge!`,
      steps: [
        {
          step: 1,
          task: 'Discuss what you know about the problem',
          role: 'Everyone',
        },
        {
          step: 2,
          task: 'Come up with different solution ideas',
          role: 'Brainstormer',
        },
        {
          step: 3,
          task: 'Test your best idea',
          role: 'Experimenter',
        },
        {
          step: 4,
          task: 'Share your solution and explain why it works',
          role: 'Presenter',
        },
      ],
      finalGoal: `Successfully solve the challenge as a team! 🎯`,
    };
  }

  /**
   * Fallback activity
   */
  private getFallbackActivity(
    topic: string,
    activityType: PeerLearningActivity['type']
  ): PeerLearningActivity {
    return {
      id: `fallback-${Date.now()}`,
      type: activityType,
      title: `${topic} Team Activity`,
      description: `Work together to explore ${topic} through fun, collaborative learning!`,
      recommendedGroupSize: 3,
      duration_minutes: 15,
      roles: ['Questioner', 'Explainer', 'Recorder'],
      learning_objectives: [
        `Understand key concepts in ${topic}`,
        'Practice collaboration skills',
        'Communicate ideas clearly',
      ],
      materials_needed: ['Paper', 'Pencils', 'Enthusiasm!'],
    };
  }

  /**
   * Fallback dialogue
   */
  private getFallbackDialogue(
    peer: SimulatedPeer,
    interactionType: string
  ): Array<{ speaker: 'peer' | 'sunny'; message: string }> {
    return [
      {
        speaker: 'peer',
        message: `Hi! I'm ${peer.name}! Want to learn together? 😊`,
      },
      {
        speaker: 'sunny',
        message: `Great! ${peer.name} is excited to work with you! Let's figure this out as a team! 🌟`,
      },
      {
        speaker: 'peer',
        message: `Yeah! Two heads are better than one! 💡`,
      },
    ];
  }

  /**
   * Detect if student would benefit from collaboration
   */
  public shouldRecommendCollaboration(studentProfile: EnhancedStudentProfile): {
    recommend: boolean;
    reason: string;
    confidence: number;
  } {
    const { motivationFactors, behavioralPatterns } = studentProfile;

    // High collaborative motivation
    if (motivationFactors.collaborative > 0.7) {
      return {
        recommend: true,
        reason: 'Student thrives in collaborative environments',
        confidence: 0.9,
      };
    }

    // Low engagement - might benefit from social interaction
    const lowEngagement = behavioralPatterns.find(
      (p) => p.pattern === 'low_engagement'
    );
    if (lowEngagement && lowEngagement.confidence > 0.6) {
      return {
        recommend: true,
        reason: 'Social learning might boost engagement',
        confidence: 0.75,
      };
    }

    // High mastery - ready to teach others
    if (studentProfile.learningVelocity > 0.8) {
      return {
        recommend: true,
        reason: 'Student ready for peer teaching opportunities',
        confidence: 0.85,
      };
    }

    return {
      recommend: false,
      reason: 'Continue with current learning modality',
      confidence: 0.5,
    };
  }
}
