/**
 * Content Generation Agent - Autonomous educational content creation
 * Generates personalized quizzes, lessons, and activities based on student needs
 */

import { BaseAgent } from './base-agent';
import { LearningState } from './types';
import { Challenge, DifficultyLevel, LearningStyle } from '@/types/chat';
import { LessonPlan, LearningActivity, ActivityType } from '@/lib/lesson-plans';

interface ContentGenerationRequest {
  studentId: string;
  contentType: 'quiz' | 'lesson' | 'activity' | 'challenge';
  topic: string;
  difficulty?: DifficultyLevel;
  learningStyle?: LearningStyle;
  targetGaps?: string[];
  duration?: number; // in minutes
}

interface GeneratedContent {
  type: string;
  content: any;
  metadata: {
    generatedAt: number;
    targetedConcepts: string[];
    estimatedDuration: number;
    difficulty: DifficultyLevel;
    adaptedFor: LearningStyle[];
  };
}

export class ContentGenerationAgent extends BaseAgent {
  private readonly QUIZ_SIZES = {
    short: 5,
    medium: 10,
    long: 20
  };

  constructor() {
    super('contentGeneration');
  }

  async initialize(): Promise<void> {
    console.log('Content Generation Agent initialized');
    this.status = 'active';
  }

  async processMessage(message: any): Promise<any> {
    const request: ContentGenerationRequest = message.request;
    const learningState: LearningState = message.learningState;

    let content: GeneratedContent;

    switch (request.contentType) {
      case 'quiz':
        content = await this.generateQuiz(request, learningState);
        break;
      case 'lesson':
        content = await this.generateLesson(request, learningState);
        break;
      case 'activity':
        content = await this.generateActivity(request, learningState);
        break;
      case 'challenge':
        content = await this.generateChallenge(request, learningState);
        break;
      default:
        throw new Error(`Unknown content type: ${request.contentType}`);
    }

    return {
      messageId: message.id,
      success: true,
      data: {
        content,
        recommendations: this.generateContentRecommendations(content, learningState)
      },
      recommendations: []
    };
  }

  async shutdown(): Promise<void> {
    console.log('Content Generation Agent shutting down');
    this.status = 'idle';
  }

  /**
   * Generate a personalized quiz
   */
  private async generateQuiz(
    request: ContentGenerationRequest,
    learningState: LearningState
  ): Promise<GeneratedContent> {
    const difficulty = request.difficulty || learningState.currentDifficulty || 'medium';
    const questionCount = this.determineQuizSize(request.duration || 10);

    // Target concepts to assess
    const targetConcepts = this.selectConceptsToAssess(
      request.topic,
      learningState,
      request.targetGaps
    );

    // Generate questions for each concept
    const questions: Challenge[] = [];
    for (const concept of targetConcepts.slice(0, questionCount)) {
      const question = this.generateQuestion(concept, difficulty, request.learningStyle);
      questions.push(question);
    }

    return {
      type: 'quiz',
      content: {
        title: `${request.topic} Quiz`,
        description: `Personalized quiz on ${request.topic}`,
        questions,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        passingScore: 0.7
      },
      metadata: {
        generatedAt: Date.now(),
        targetedConcepts: targetConcepts,
        estimatedDuration: questionCount * 2, // 2 minutes per question
        difficulty,
        adaptedFor: [request.learningStyle || 'visual']
      }
    };
  }

  /**
   * Generate a personalized lesson
   */
  private async generateLesson(
    request: ContentGenerationRequest,
    learningState: LearningState
  ): Promise<GeneratedContent> {
    const difficulty = request.difficulty || learningState.currentDifficulty || 'medium';

    // Determine lesson structure based on learning style
    const activities = this.createLessonActivities(
      request.topic,
      difficulty,
      request.learningStyle || 'visual',
      request.duration || 15
    );

    // Create learning outcomes
    const outcomes = this.generateLearningOutcomes(request.topic, difficulty);

    const lesson: LessonPlan = {
      id: `lesson-${Date.now()}`,
      title: `${request.topic} - ${this.getDifficultyLabel(difficulty)}`,
      category: this.categorizeTopicForLesson(request.topic),
      gradeLevel: this.determineGradeLevel(learningState),
      author: {
        name: 'Sunny AI',
        id: 'sunny-agent'
      },
      isPublic: false,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      content: {
        id: `content-${Date.now()}`,
        title: request.topic,
        description: `Personalized lesson on ${request.topic} tailored to your learning style`,
        keywords: this.extractKeywords(request.topic),
        learningOutcomes: outcomes,
        activities,
        relatedTopics: this.findRelatedTopics(request.topic, learningState)
      },
      tags: [request.topic, difficulty, request.learningStyle || 'general']
    };

    return {
      type: 'lesson',
      content: lesson,
      metadata: {
        generatedAt: Date.now(),
        targetedConcepts: [request.topic],
        estimatedDuration: request.duration || 15,
        difficulty,
        adaptedFor: [request.learningStyle || 'visual']
      }
    };
  }

  /**
   * Generate an interactive activity
   */
  private async generateActivity(
    request: ContentGenerationRequest,
    learningState: LearningState
  ): Promise<GeneratedContent> {
    const activityType = this.selectActivityType(request.learningStyle || 'visual');
    const difficulty = request.difficulty || learningState.currentDifficulty || 'medium';

    const activity: LearningActivity = {
      id: `activity-${Date.now()}`,
      type: activityType,
      title: `${request.topic} ${this.getActivityTypeLabel(activityType)}`,
      description: `Explore ${request.topic} through ${this.getActivityTypeLabel(activityType).toLowerCase()}`,
      difficulty: difficulty as any,
      estimatedTimeMinutes: request.duration || 10,
      ageRange: this.determineAgeRange(learningState),
      content: this.generateActivityContent(activityType, request.topic, difficulty)
    };

    return {
      type: 'activity',
      content: activity,
      metadata: {
        generatedAt: Date.now(),
        targetedConcepts: [request.topic],
        estimatedDuration: request.duration || 10,
        difficulty,
        adaptedFor: [request.learningStyle || 'visual']
      }
    };
  }

  /**
   * Generate a challenge
   */
  private async generateChallenge(
    request: ContentGenerationRequest,
    learningState: LearningState
  ): Promise<GeneratedContent> {
    const difficulty = request.difficulty || learningState.currentDifficulty || 'medium';

    const challenge = this.generateQuestion(
      request.topic,
      difficulty,
      request.learningStyle
    );

    return {
      type: 'challenge',
      content: challenge,
      metadata: {
        generatedAt: Date.now(),
        targetedConcepts: [request.topic],
        estimatedDuration: 3,
        difficulty,
        adaptedFor: [request.learningStyle || 'visual']
      }
    };
  }

  /**
   * Select concepts to assess based on learning state
   */
  private selectConceptsToAssess(
    topic: string,
    learningState: LearningState,
    targetGaps?: string[]
  ): string[] {
    const concepts: string[] = [topic];

    // Add concepts with gaps
    if (targetGaps && targetGaps.length > 0) {
      concepts.push(...targetGaps);
    }

    // Add related concepts that need review
    for (const gap of learningState.knowledgeMap.knowledgeGaps) {
      if (gap.relatedConcepts.includes(topic) && !concepts.includes(gap.concept)) {
        concepts.push(gap.concept);
      }
    }

    return concepts;
  }

  /**
   * Generate a single question
   */
  private generateQuestion(
    concept: string,
    difficulty: DifficultyLevel,
    learningStyle?: LearningStyle
  ): Challenge {
    // In production, this would call OpenAI API
    // For now, generate template-based questions

    const questionTemplates = this.getQuestionTemplates(concept, difficulty);
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

    return {
      id: `challenge-${Date.now()}-${Math.random()}`,
      type: 'multiple-choice',
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: template.explanation,
      points: this.calculatePoints(difficulty),
      difficulty,
      learningStyle: learningStyle ? [learningStyle] : ['visual'],
      followUpQuestions: template.followUp
    };
  }

  /**
   * Get question templates for a concept
   */
  private getQuestionTemplates(concept: string, difficulty: DifficultyLevel): any[] {
    // Simplified template system - would be more sophisticated in production
    const baseTemplates = [
      {
        question: `What is the main idea of ${concept}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: `The main idea of ${concept} is...`,
        followUp: [`Can you explain ${concept} in your own words?`]
      }
    ];

    return baseTemplates;
  }

  /**
   * Create lesson activities
   */
  private createLessonActivities(
    topic: string,
    difficulty: DifficultyLevel,
    learningStyle: LearningStyle,
    duration: number
  ): LearningActivity[] {
    const activities: LearningActivity[] = [];
    const activityCount = Math.floor(duration / 5); // 5 minutes per activity

    // Diversify activity types based on learning style
    const preferredTypes = this.getPreferredActivityTypes(learningStyle);

    for (let i = 0; i < Math.min(activityCount, 4); i++) {
      const activityType = preferredTypes[i % preferredTypes.length];

      activities.push({
        id: `activity-${Date.now()}-${i}`,
        type: activityType,
        title: `${topic} - Part ${i + 1}`,
        description: `Learn about ${topic} through ${this.getActivityTypeLabel(activityType).toLowerCase()}`,
        difficulty: difficulty as any,
        estimatedTimeMinutes: 5,
        ageRange: { min: 6, max: 10 },
        content: this.generateActivityContent(activityType, topic, difficulty)
      });
    }

    return activities;
  }

  /**
   * Get preferred activity types for learning style
   */
  private getPreferredActivityTypes(learningStyle: LearningStyle): ActivityType[] {
    const typeMap: Record<LearningStyle, ActivityType[]> = {
      visual: ['creative', 'pattern', 'matching'],
      auditory: ['discussion', 'creative'],
      kinesthetic: ['creative', 'matching', 'pattern'],
      reading: ['discussion', 'multiple-choice'],
      logical: ['multiple-choice', 'pattern']
    };

    return typeMap[learningStyle] || ['multiple-choice', 'creative'];
  }

  /**
   * Generate activity content based on type
   */
  private generateActivityContent(
    type: ActivityType,
    topic: string,
    difficulty: DifficultyLevel
  ): any {
    switch (type) {
      case 'multiple-choice':
        return {
          question: `Which of these best describes ${topic}?`,
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 'Option 1'
        };

      case 'creative':
        return {
          instructions: `Create something that shows what you learned about ${topic}`,
          examples: ['Draw a picture', 'Write a story', 'Build something'],
          submissionType: 'text-or-image'
        };

      case 'discussion':
        return {
          prompt: `Let's talk about ${topic}. What do you think?`,
          thinkingPoints: [
            'What interests you most?',
            'How does this connect to things you already know?',
            'Can you think of an example?'
          ]
        };

      case 'pattern':
        return {
          pattern: 'A, B, A, B, ?',
          instructions: 'Complete the pattern',
          correctAnswer: 'A'
        };

      case 'matching':
        return {
          pairs: [
            { item: 'Term 1', match: 'Definition 1' },
            { item: 'Term 2', match: 'Definition 2' }
          ]
        };

      default:
        return { type, topic };
    }
  }

  /**
   * Generate learning outcomes
   */
  private generateLearningOutcomes(topic: string, difficulty: DifficultyLevel): string[] {
    const baseOutcomes = [
      `Understand the basics of ${topic}`,
      `Apply ${topic} concepts in simple scenarios`,
      `Explain ${topic} in your own words`
    ];

    if (difficulty === 'hard') {
      baseOutcomes.push(`Analyze complex ${topic} problems`);
      baseOutcomes.push(`Create original work using ${topic}`);
    }

    return baseOutcomes;
  }

  /**
   * Helper methods
   */
  private determineQuizSize(duration: number): number {
    if (duration <= 5) return this.QUIZ_SIZES.short;
    if (duration <= 15) return this.QUIZ_SIZES.medium;
    return this.QUIZ_SIZES.long;
  }

  private calculatePoints(difficulty: DifficultyLevel): number {
    const pointMap = { easy: 10, medium: 20, hard: 30, beginner: 10, intermediate: 20, advanced: 30 };
    return pointMap[difficulty] || 20;
  }

  private getDifficultyLabel(difficulty: DifficultyLevel): string {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  private getActivityTypeLabel(type: ActivityType): string {
    const labels: Record<ActivityType, string> = {
      'multiple-choice': 'Quiz',
      'creative': 'Creative Project',
      'discussion': 'Discussion',
      'pattern': 'Pattern Game',
      'matching': 'Matching Game'
    };
    return labels[type];
  }

  private selectActivityType(learningStyle: LearningStyle): ActivityType {
    const preferences = this.getPreferredActivityTypes(learningStyle);
    return preferences[0];
  }

  private determineGradeLevel(learningState: LearningState): string[] {
    // Simplified - would use actual student age/grade in production
    return ['K-2', '3-5'];
  }

  private determineAgeRange(learningState: LearningState): { min: number; max: number } {
    return { min: 6, max: 10 };
  }

  private categorizeTopicForLesson(topic: string): string {
    // Simplified categorization
    const mathKeywords = ['math', 'number', 'count', 'add', 'subtract'];
    const scienceKeywords = ['science', 'experiment', 'nature', 'animal', 'plant'];

    const topicLower = topic.toLowerCase();
    if (mathKeywords.some(k => topicLower.includes(k))) return 'math';
    if (scienceKeywords.some(k => topicLower.includes(k))) return 'science';

    return 'general';
  }

  private extractKeywords(topic: string): string[] {
    return topic.split(' ').filter(word => word.length > 3);
  }

  private findRelatedTopics(topic: string, learningState: LearningState): string[] {
    // Simplified - would use semantic similarity in production
    return Object.keys(learningState.knowledgeMap.concepts)
      .filter(c => c !== topic)
      .slice(0, 3);
  }

  private generateContentRecommendations(
    content: GeneratedContent,
    learningState: LearningState
  ): string[] {
    const recommendations: string[] = [];

    // Suggest follow-up content
    recommendations.push('generate_follow_up_quiz');

    // Suggest practice if difficulty was high
    if (content.metadata.difficulty === 'hard') {
      recommendations.push('provide_additional_practice');
    }

    return recommendations;
  }
}

// Export singleton instance
export const contentGenerationAgent = new ContentGenerationAgent();
