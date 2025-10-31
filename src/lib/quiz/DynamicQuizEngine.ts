/**
 * Dynamic Quiz Engine
 * Integrates adaptive selection, scaffolding, and AI generation
 * This is the main orchestrator that connects all quiz systems
 */

import { getOpenAIClient } from '@/lib/sunny-ai';
import { adaptiveSelector } from './AdaptiveSelector';
import { scaffoldingSystem } from './ScaffoldingSystem';
import { getLearningBrain } from '@/lib/learning-brain';
import {
  AdaptiveQuestion,
  StudentPerformanceState,
  QuizSession,
  StudentAnswer,
  AnswerEvaluation,
  BloomsLevel,
  DifficultyLevel,
  EnhancedQuestionType,
  FillInBlankContent,
  MultipleChoiceContent,
  Scaffolding
} from '@/types/quiz';
import { v4 as uuidv4 } from 'uuid';

export class DynamicQuizEngine {
  /**
   * Generate an adaptive quiz using AI + adaptive selection
   */
  async generateAdaptiveQuiz(
    userId: string,
    topic: string,
    studentState: StudentPerformanceState,
    questionCount: number = 5
  ): Promise<QuizSession> {
    console.log(`Generating adaptive quiz for ${userId} on ${topic}`);

    // 1. Analyze student with Learning Brain
    const brainAnalysis = await this.analyzeLearningState(userId);
    
    // 2. Determine optimal question parameters
    const zpdAnalysis = adaptiveSelector.calculateZPD(studentState);
    const bloomsLevel = adaptiveSelector.getRecommendedBloomsLevel(studentState.masteryLevel);
    
    // 3. Generate questions using AI with pedagogical constraints
    const questions = await this.generateQuestionsWithAI(
      topic,
      questionCount,
      zpdAnalysis.optimalLevel,
      bloomsLevel,
      brainAnalysis
    );
    
    // 4. Add scaffolding to each question
    const questionsWithScaffolding = questions.map(q => 
      this.addIntelligentScaffolding(q, studentState)
    );
    
    // 5. Create quiz session
    const session: QuizSession = {
      id: uuidv4(),
      userId,
      topic,
      startedAt: new Date(),
      questions: questionsWithScaffolding,
      answers: [],
      totalQuestions: questionCount,
      questionsCompleted: 0,
      correctAnswers: 0,
      totalPoints: questionsWithScaffolding.reduce((sum, q) => sum + q.points, 0),
      earnedPoints: 0,
      difficultyAdjustments: [],
      conceptsMastered: [],
      conceptsToReview: [],
      recommendedNextTopics: []
    };
    
    return session;
  }
  
  /**
   * Generate questions using AI with pedagogical constraints
   */
  private async generateQuestionsWithAI(
    topic: string,
    count: number,
    difficulty: DifficultyLevel,
    bloomsLevel: BloomsLevel,
    brainAnalysis: any
  ): Promise<AdaptiveQuestion[]> {
    const client = getOpenAIClient();
    
    // Get Bloom's verbs for this level
    const bloomsVerbs = this.getBloomsVerbs(bloomsLevel);
    
    const systemPrompt = `You are an expert educational content creator for children aged 6-10.

Create ${count} adaptive quiz questions about "${topic}" with these constraints:

PEDAGOGICAL REQUIREMENTS:
- Difficulty: ${difficulty}
- Bloom's Taxonomy Level: ${bloomsLevel} (use verbs: ${bloomsVerbs.join(', ')})
- Cognitive Load: Appropriate for young learners
- Each question should build on the previous one

STUDENT CONTEXT:
${brainAnalysis.strugglingAreas?.length > 0 ? `- Struggling with: ${brainAnalysis.strugglingAreas.join(', ')}` : ''}
${brainAnalysis.strengths?.length > 0 ? `- Strong in: ${brainAnalysis.strengths.join(', ')}` : ''}
- Mastery Level: ${brainAnalysis.masteryLevel || 50}/100

QUESTION TYPES TO USE (vary them):
1. multiple-choice - Traditional multiple choice
2. fill-in-blank - Complete the sentence (use ___ for blanks)
3. true-false - True or false with explanation
4. number-input - Type a number answer

REQUIRED FORMAT (JSON array):
[
  {
    "type": "multiple-choice" | "fill-in-blank" | "true-false" | "number-input",
    "topic": "${topic}",
    "subtopic": "specific aspect",
    "bloomsLevel": "${bloomsLevel}",
    "difficulty": "${difficulty}",
    "cognitiveLoad": "low" | "medium" | "high",
    "content": {
      // Content varies by type:
      // multiple-choice: { question, options: [], correctIndex: number }
      // fill-in-blank: { text: "...___ ...", blanks: [{ position: 0, correctAnswers: ["answer1", "answer2"], caseSensitive: false }] }
      // true-false: { statement: "...", correct: true/false, explanation: "..." }
      // number-input: { question: "...", correctAnswer: number, tolerance: 0.1, unit: "optional" }
    },
    "prerequisiteKnowledge": ["concept1", "concept2"],
    "estimatedTime": 30,
    "points": 10,
    "tags": ["tag1", "tag2"]
  }
]

IMPORTANT:
- Make questions engaging and age-appropriate
- Use concrete examples kids can relate to
- Avoid abstract concepts for younger difficulty levels
- Each question should teach something, not just test
- Return ONLY valid JSON, no other text`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message?.content;
      if (!content) throw new Error('No content from AI');

      const parsed = JSON.parse(content);
      const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions || [];
      
      // Convert to AdaptiveQuestion format
      return questionsArray.map((q: any) => ({
        id: uuidv4(),
        type: q.type,
        content: q.content,
        topic: q.topic || topic,
        subtopic: q.subtopic,
        bloomsLevel: q.bloomsLevel || bloomsLevel,
        cognitiveLoad: q.cognitiveLoad || 'medium',
        difficulty: q.difficulty || difficulty,
        prerequisiteKnowledge: q.prerequisiteKnowledge || [],
        relatedConcepts: q.relatedConcepts || [],
        scaffolding: { hints: [] }, // Will be added next
        estimatedTime: q.estimatedTime || 30,
        points: q.points || 10,
        tags: q.tags || [],
        createdAt: new Date()
      }));
      
    } catch (error) {
      console.error('Error generating questions with AI:', error);
      // Fallback to basic questions
      return this.generateFallbackQuestions(topic, count, difficulty);
    }
  }
  
  /**
   * Add intelligent scaffolding based on student state
   */
  private addIntelligentScaffolding(
    question: AdaptiveQuestion,
    studentState: StudentPerformanceState
  ): AdaptiveQuestion {
    // Determine scaffolding level needed
    const scaffoldingLevel = scaffoldingSystem.getOptimalScaffoldingLevel(
      studentState.masteryLevel,
      studentState.recentAnswers
    );
    
    // Generate hints using AI
    const hints = this.generateHintsWithAI(question, scaffoldingLevel);
    
    // Create scaffolding
    const scaffolding: Scaffolding = {
      hints,
      prerequisiteKnowledge: question.prerequisiteKnowledge
    };
    
    // Add worked example for struggling students
    if (scaffoldingLevel === 'high' || studentState.strugglingIndicators.length > 2) {
      const example = scaffoldingSystem.generateWorkedExample(question);
      if (example) {
        scaffolding.workedExample = example;
      }
    }
    
    return {
      ...question,
      scaffolding
    };
  }
  
  /**
   * Generate hints using AI
   */
  private generateHintsWithAI(
    question: AdaptiveQuestion,
    scaffoldingLevel: 'high' | 'medium' | 'low'
  ): any[] {
    // For now, return template hints
    // In production, this would use AI to generate contextual hints
    const hintCount = scaffoldingLevel === 'high' ? 3 : scaffoldingLevel === 'medium' ? 2 : 1;
    
    return Array.from({ length: hintCount }, (_, i) => ({
      id: `hint-${i + 1}`,
      level: (i + 1) as 1 | 2 | 3,
      text: this.getTemplateHint(i + 1, question),
      type: i === 0 ? 'nudge' : i === 1 ? 'guidance' : 'reveal'
    }));
  }
  
  /**
   * Get template hint (will be replaced by AI generation)
   */
  private getTemplateHint(level: number, question: AdaptiveQuestion): string {
    if (level === 1) {
      return "Think about what the question is asking. What information do you already know?";
    } else if (level === 2) {
      return `This question is about ${question.topic}. What have you learned about this?`;
    } else {
      return "Here's the key concept: Try breaking it into smaller steps.";
    }
  }
  
  /**
   * Evaluate answer and provide AI-generated feedback
   */
  async evaluateAnswer(
    question: AdaptiveQuestion,
    studentAnswer: string | number | string[] | boolean,
    session: QuizSession,
    studentState: StudentPerformanceState
  ): Promise<AnswerEvaluation> {
    // 1. Check correctness
    const isCorrect = this.checkAnswer(question, studentAnswer);
    
    // 2. Generate AI feedback
    const feedback = await this.generateAIFeedback(
      question,
      studentAnswer,
      isCorrect,
      studentState
    );
    
    // 3. Update session
    this.updateSession(session, isCorrect, question.points);
    
    // 4. Check if difficulty adjustment needed
    await this.checkDifficultyAdjustment(session, studentState);
    
    return feedback;
  }
  
  /**
   * Check if answer is correct
   */
  private checkAnswer(
    question: AdaptiveQuestion,
    studentAnswer: string | number | string[] | boolean
  ): boolean {
    switch (question.type) {
      case 'multiple-choice':
        const mcContent = question.content as MultipleChoiceContent;
        return studentAnswer === mcContent.correctIndex;
        
      case 'fill-in-blank':
        const fibContent = question.content as FillInBlankContent;
        const answers = studentAnswer as string[];
        return fibContent.blanks.every((blank, i) => {
          const studentAns = answers[i]?.trim().toLowerCase();
          return blank.correctAnswers.some(correct => 
            correct.trim().toLowerCase() === studentAns
          );
        });
        
      case 'true-false':
        return studentAnswer === (question.content as any).correct;
        
      case 'number-input':
        const numContent = question.content as any;
        const tolerance = numContent.tolerance || 0;
        return Math.abs((studentAnswer as number) - numContent.correctAnswer) <= tolerance;
        
      default:
        return false;
    }
  }
  
  /**
   * Generate AI feedback for answer
   */
  private async generateAIFeedback(
    question: AdaptiveQuestion,
    studentAnswer: any,
    isCorrect: boolean,
    studentState: StudentPerformanceState
  ): Promise<AnswerEvaluation> {
    const client = getOpenAIClient();
    
    const prompt = `You are Sunny, an encouraging AI tutor for kids aged 6-10.

A student just answered a question:
Question: ${JSON.stringify(question.content)}
Student's Answer: ${studentAnswer}
Correct: ${isCorrect}

Student Context:
- Mastery Level: ${studentState.masteryLevel}/100
- Recent Accuracy: ${(studentState.accuracyRate * 100).toFixed(0)}%
- Current Streak: ${studentState.currentStreak}

Provide feedback as JSON:
{
  "feedback": "Brief reaction (1 sentence)",
  "explanation": "Why it's correct/incorrect (2-3 sentences, age-appropriate)",
  "encouragement": "Motivational message (1 sentence)",
  "nextSteps": ["suggestion1", "suggestion2"]
}

Be:
- Encouraging and positive
- Clear and simple (6-10 year old level)
- Specific about what they did well or what to improve
- Vary your language (don't repeat phrases)`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message?.content;
      if (!content) throw new Error('No feedback from AI');

      const parsed = JSON.parse(content);
      
      return {
        correct: isCorrect,
        feedback: parsed.feedback,
        explanation: parsed.explanation,
        encouragement: parsed.encouragement,
        nextSteps: parsed.nextSteps || []
      };
      
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      return this.getFallbackFeedback(isCorrect);
    }
  }
  
  /**
   * Update quiz session with answer
   */
  private updateSession(session: QuizSession, isCorrect: boolean, points: number): void {
    session.questionsCompleted++;
    if (isCorrect) {
      session.correctAnswers++;
      session.earnedPoints += points;
    }
  }
  
  /**
   * Check if difficulty adjustment is needed
   */
  private async checkDifficultyAdjustment(
    session: QuizSession,
    studentState: StudentPerformanceState
  ): Promise<void> {
    // Only check after at least 3 questions
    if (session.questionsCompleted < 3) return;
    
    const zpdAnalysis = adaptiveSelector.calculateZPD(studentState);
    
    if (zpdAnalysis.adjustmentNeeded) {
      session.difficultyAdjustments.push({
        questionNumber: session.questionsCompleted,
        from: zpdAnalysis.currentLevel,
        to: zpdAnalysis.optimalLevel,
        reason: zpdAnalysis.reasoning
      });
      
      // Update student state
      studentState.currentDifficulty = zpdAnalysis.optimalLevel;
    }
  }
  
  /**
   * Analyze learning state using Learning Brain
   */
  private async analyzeLearningState(userId: string): Promise<any> {
    try {
      const brain = getLearningBrain();
      const analysis = await brain.analyzeStudent(userId);
      
      return {
        masteryLevel: 50, // Would come from analysis
        strugglingAreas: analysis.interventionsNeeded
          .filter(i => i.priority === 'urgent' || i.priority === 'high')
          .map(i => i.skillId),
        strengths: analysis.currentSkills
          .filter(s => s.trend === 'improving')
          .map(s => s.domain)
      };
    } catch (error) {
      console.error('Error analyzing with Learning Brain:', error);
      return { masteryLevel: 50, strugglingAreas: [], strengths: [] };
    }
  }
  
  /**
   * Get Bloom's taxonomy verbs for a level
   */
  private getBloomsVerbs(level: BloomsLevel): string[] {
    const verbs: Record<BloomsLevel, string[]> = {
      remember: ['list', 'name', 'identify', 'recall', 'recognize'],
      understand: ['explain', 'describe', 'summarize', 'interpret'],
      apply: ['use', 'solve', 'demonstrate', 'apply'],
      analyze: ['compare', 'contrast', 'examine', 'categorize'],
      evaluate: ['judge', 'assess', 'critique', 'evaluate'],
      create: ['design', 'create', 'compose', 'invent']
    };
    return verbs[level];
  }
  
  /**
   * Fallback questions if AI fails
   */
  private generateFallbackQuestions(
    topic: string,
    count: number,
    difficulty: DifficultyLevel
  ): AdaptiveQuestion[] {
    return Array.from({ length: count }, (_, i) => ({
      id: uuidv4(),
      type: 'multiple-choice' as EnhancedQuestionType,
      content: {
        question: `Question ${i + 1} about ${topic}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0
      },
      topic,
      bloomsLevel: 'understand' as BloomsLevel,
      cognitiveLoad: 'medium' as const,
      difficulty,
      prerequisiteKnowledge: [],
      scaffolding: { hints: [] },
      estimatedTime: 30,
      points: 10,
      tags: [topic],
      createdAt: new Date()
    }));
  }
  
  /**
   * Fallback feedback if AI fails
   */
  private getFallbackFeedback(isCorrect: boolean): AnswerEvaluation {
    return {
      correct: isCorrect,
      feedback: isCorrect ? 'Great job!' : 'Not quite, but good try!',
      explanation: isCorrect 
        ? 'You got it right! Well done!' 
        : 'Let\'s review this concept together.',
      encouragement: 'Keep learning! 🌟',
      nextSteps: isCorrect 
        ? ['Try the next question'] 
        : ['Review the concept', 'Try again']
    };
  }
}

// Export singleton instance
export const dynamicQuizEngine = new DynamicQuizEngine();
