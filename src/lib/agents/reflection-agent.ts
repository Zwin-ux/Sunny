/**
 * Reflection Agent
 *
 * Specialized agent responsible for:
 * - Post-session summaries and insights
 * - Self-evaluation prompts for students
 * - Learning progress narratives
 * - Metacognitive skill development
 * - Growth mindset reinforcement
 */

import { BaseAgent } from './base-agent';
import {
  AgentMessage,
  AgentResponse,
  LearningState,
  EnhancedStudentProfile,
} from './types';
import { getOpenAIClient } from '../sunny-ai';

interface SessionSummary {
  sessionId: string;
  duration_minutes: number;
  topics_covered: string[];
  concepts_mastered: string[];
  concepts_struggling: string[];
  activities_completed: number;
  overall_performance: number; // 0-1
  emotional_journey: string[]; // e.g., ['confused', 'focused', 'excited']
  key_insights: string[];
  recommended_next_steps: string[];
  celebration_moments: string[];
}

export class ReflectionAgent extends BaseAgent {
  constructor() {
    super('reflection');
  }

  async initialize(): Promise<void> {
    console.log('[ReflectionAgent] Initializing...');
    this.emit('agent:initialized', { agentType: this.agentType });
  }

  async shutdown(): Promise<void> {
    console.log('[ReflectionAgent] Shutting down...');
  }

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { type, payload } = message;

    try {
      if (type === 'session_complete') {
        // Generate post-session summary
        const summary = await this.generateSessionSummary(
          payload.learningState,
          payload.studentProfile
        );

        return {
          success: true,
          confidence: 0.9,
          priority: 'high',
          data: { summary },
          recommendations: [
            {
              id: `reflect-${Date.now()}`,
              type: 'content',
              priority: 'high',
              description: 'Present session summary to student',
              data: summary,
              confidence: 0.9,
            },
          ],
        };
      }

      if (type === 'prompt_self_evaluation') {
        // Generate self-evaluation prompts
        const prompts = await this.generateSelfEvaluationPrompts(
          payload.learningState,
          payload.recentActivity
        );

        return {
          success: true,
          confidence: 0.85,
          priority: 'medium',
          data: { prompts },
          recommendations: [
            {
              id: `eval-${Date.now()}`,
              type: 'action',
              priority: 'medium',
              description: 'Ask student self-evaluation questions',
              data: { prompts },
              confidence: 0.85,
            },
          ],
        };
      }

      if (type === 'generate_progress_narrative') {
        // Create a story about student's learning journey
        const narrative = await this.generateProgressNarrative(
          payload.studentProfile,
          payload.timeframe
        );

        return {
          success: true,
          confidence: 0.88,
          priority: 'medium',
          data: { narrative },
          recommendations: [
            {
              id: `narrative-${Date.now()}`,
              type: 'content',
              priority: 'medium',
              description: 'Share progress narrative',
              data: { narrative },
              confidence: 0.88,
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
      console.error('[ReflectionAgent] Error processing message:', error);
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
   * Generate comprehensive session summary
   */
  private async generateSessionSummary(
    learningState: LearningState,
    studentProfile: EnhancedStudentProfile
  ): Promise<SessionSummary> {
    const {
      sessionId,
      sessionStartTime,
      lastUpdated,
      currentObjectives,
      knowledgeMap,
      contextHistory,
    } = learningState;

    // Calculate duration
    const durationMs = lastUpdated - (sessionStartTime || lastUpdated);
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Extract topics
    const topicsCovered = [...new Set(contextHistory.map((c) => c.topic))];

    // Analyze mastery
    const conceptsMastered = knowledgeMap.concepts
      .filter((c) => c.masteryLevel > 0.8)
      .map((c) => c.name);

    const conceptsStruggling = knowledgeMap.concepts
      .filter((c) => c.masteryLevel < 0.4 && c.interactionCount > 2)
      .map((c) => c.name);

    // Count activities
    const activitiesCompleted = contextHistory.length;

    // Calculate overall performance
    const overallPerformance =
      knowledgeMap.concepts.reduce((sum, c) => sum + c.masteryLevel, 0) /
      (knowledgeMap.concepts.length || 1);

    // Track emotional journey (simplified - would integrate with emotion tracking)
    const emotionalJourney = this.inferEmotionalJourney(contextHistory);

    // Generate insights using AI
    const aiInsights = await this.generateAIInsights(
      learningState,
      studentProfile
    );

    // Celebration moments
    const celebrationMoments = this.identifyCelebrationMoments(
      contextHistory,
      conceptsMastered
    );

    return {
      sessionId,
      duration_minutes: durationMinutes,
      topics_covered: topicsCovered,
      concepts_mastered: conceptsMastered,
      concepts_struggling: conceptsStruggling,
      activities_completed: activitiesCompleted,
      overall_performance: overallPerformance,
      emotional_journey: emotionalJourney,
      key_insights: aiInsights,
      recommended_next_steps: this.generateNextSteps(
        conceptsMastered,
        conceptsStruggling
      ),
      celebration_moments: celebrationMoments,
    };
  }

  /**
   * Infer emotional journey from context history
   */
  private inferEmotionalJourney(
    contextHistory: Array<{ importance: number; timestamp: number; topic: string }>
  ): string[] {
    // Simplified emotion inference
    const journey: string[] = [];

    // Start
    journey.push('curious');

    // Mid-session (based on activity patterns)
    if (contextHistory.length > 5) {
      journey.push('focused');
    }

    // End (assume positive)
    journey.push('accomplished');

    return journey;
  }

  /**
   * Generate AI-powered insights
   */
  private async generateAIInsights(
    learningState: LearningState,
    studentProfile: EnhancedStudentProfile
  ): Promise<string[]> {
    try {
      const client = getOpenAIClient();

      const prompt = `You are an educational psychologist analyzing a learning session for a child aged ${
        studentProfile.ageYears || '6-10'
      }.

Session data:
- Topics covered: ${learningState.contextHistory.map((c) => c.topic).join(', ')}
- Concepts mastered: ${learningState.knowledgeMap.concepts
        .filter((c) => c.masteryLevel > 0.8)
        .map((c) => c.name)
        .join(', ')}
- Learning velocity: ${studentProfile.learningVelocity}
- Engagement patterns: ${studentProfile.engagementPatterns.map((p) => p.pattern).join(', ')}

Generate 3-4 key insights about this student's learning session. Focus on:
1. Strengths and growth areas
2. Learning patterns observed
3. Emotional/motivational observations
4. Actionable recommendations for next session

Write insights in a warm, encouraging tone suitable for sharing with the student and parents.
Each insight should be 1-2 sentences.

Return as JSON:
{
  "insights": ["insight 1", "insight 2", "insight 3"]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      return parsed.insights || [];
    } catch (error) {
      console.error('[ReflectionAgent] Error generating AI insights:', error);

      // Fallback insights
      return [
        'You showed great persistence today! 🌟',
        'Your problem-solving skills are improving! 💡',
        'Keep practicing these concepts to build mastery! 📚',
      ];
    }
  }

  /**
   * Identify celebration-worthy moments
   */
  private identifyCelebrationMoments(
    contextHistory: Array<any>,
    conceptsMastered: string[]
  ): string[] {
    const moments: string[] = [];

    // Mastery achievements
    if (conceptsMastered.length > 0) {
      moments.push(`Mastered ${conceptsMastered.length} new concept${conceptsMastered.length > 1 ? 's' : ''}! 🎉`);
    }

    // High activity count
    if (contextHistory.length >= 10) {
      moments.push(`Completed ${contextHistory.length} activities - amazing dedication! 💪`);
    }

    // Streak (would check actual streak data)
    moments.push('Came back to learn today - building a great habit! 🔥');

    return moments;
  }

  /**
   * Generate next steps recommendations
   */
  private generateNextSteps(
    conceptsMastered: string[],
    conceptsStruggling: string[]
  ): string[] {
    const steps: string[] = [];

    if (conceptsStruggling.length > 0) {
      steps.push(`Review ${conceptsStruggling[0]} with practice activities`);
    }

    if (conceptsMastered.length > 0) {
      steps.push(`Build on ${conceptsMastered[0]} with more advanced challenges`);
    }

    steps.push('Take a short break before next session');
    steps.push('Try a different learning activity for variety');

    return steps;
  }

  /**
   * Generate self-evaluation prompts (metacognition)
   */
  private async generateSelfEvaluationPrompts(
    learningState: LearningState,
    recentActivity?: string
  ): Promise<string[]> {
    const prompts: string[] = [];

    // Comprehension check
    prompts.push('On a scale of 1-5, how well do you understand what we just learned? ⭐⭐⭐⭐⭐');

    // Confidence check
    prompts.push('How confident do you feel trying this on your own? (Not confident / A little confident / Very confident)');

    // Difficulty perception
    prompts.push('Was that activity too easy, just right, or too hard?');

    // Interest level
    prompts.push('How interesting did you find this topic? (Not interesting / Okay / Super interesting!)');

    // Open reflection
    if (recentActivity) {
      prompts.push(`What was the most important thing you learned about ${recentActivity}?`);
    }

    // Growth mindset
    prompts.push('What\'s one thing you struggled with but got better at today?');

    return prompts;
  }

  /**
   * Generate progress narrative (story format)
   */
  private async generateProgressNarrative(
    studentProfile: EnhancedStudentProfile,
    timeframe: 'week' | 'month' | 'all_time'
  ): Promise<{
    title: string;
    narrative: string;
    achievements: string[];
    growthAreas: string[];
  }> {
    try {
      const client = getOpenAIClient();

      const prompt = `You are a storyteller creating an encouraging learning journey narrative for a child aged ${
        studentProfile.ageYears || '6-10'
      }.

Student profile:
- Learning velocity: ${studentProfile.learningVelocity}
- Intrinsic motivation: ${studentProfile.motivationFactors.intrinsic}
- Cognitive strengths: ${
        studentProfile.cognitiveProfile.metacognition > 0.7
          ? 'Strong self-awareness'
          : 'Growing awareness'
      }

Timeframe: ${timeframe}

Create an encouraging, narrative-style progress report. It should:
1. Tell a story of their learning journey
2. Highlight 3-4 specific achievements
3. Mention 1-2 growth areas in a positive, growth-mindset way
4. Be written in a warm, engaging tone
5. Be 150-200 words
6. End on an inspiring note about future learning

Return as JSON:
{
  "title": "Your Amazing Learning Journey",
  "narrative": "Once upon a time...",
  "achievements": ["achievement 1", "achievement 2", ...],
  "growthAreas": ["area 1", "area 2"]
}`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('[ReflectionAgent] Error generating narrative:', error);

      // Fallback narrative
      return {
        title: 'Your Learning Adventure!',
        narrative: `This ${timeframe}, you've been on an incredible learning journey! You've explored new topics, solved challenging problems, and grown your skills. Every question you asked, every problem you tackled, and every mistake you learned from made you stronger. You're building amazing learning habits that will help you for years to come. Keep up the fantastic work! 🌟`,
        achievements: [
          'Showed great curiosity',
          'Practiced consistently',
          'Asked thoughtful questions',
        ],
        growthAreas: [
          'Keep practicing challenging concepts',
          'Try different types of activities',
        ],
      };
    }
  }

  /**
   * Generate growth mindset reinforcement messages
   */
  public generateGrowthMindsetMessage(context: {
    situation: 'mistake' | 'challenge' | 'success' | 'frustration';
    specificExample?: string;
  }): string {
    const { situation, specificExample } = context;

    const messages = {
      mistake: [
        'Mistakes are proof that you\'re trying! 💪 That\'s how we learn!',
        'Great job noticing that! Your brain just grew stronger from that mistake! 🧠',
        'Every mistake is a step closer to mastering this! Keep going! 🌟',
      ],
      challenge: [
        'This is tough, but tough things help our brains grow! 🌱',
        'You haven\'t mastered this YET - and that\'s exciting! 🚀',
        'Challenges make us stronger learners! Let\'s figure this out together! 💡',
      ],
      success: [
        'Your hard work paid off! This is what persistence looks like! 🏆',
        'Look how far you\'ve come! All that practice made a difference! ⭐',
        'You believed you could, and you did! That\'s the power of a growth mindset! 🌈',
      ],
      frustration: [
        'Feeling stuck is normal when learning something new! Your brain is working hard! 💙',
        'Let\'s take a breath and try a different approach! Every problem has a solution! 🔍',
        'You\'re not failing - you\'re learning! That\'s what makes you amazing! 🌟',
      ],
    };

    const options = messages[situation];
    let message = options[Math.floor(Math.random() * options.length)];

    if (specificExample) {
      message += ` ${specificExample}`;
    }

    return message;
  }
}
