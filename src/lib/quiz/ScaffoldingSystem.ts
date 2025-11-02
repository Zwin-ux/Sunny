/**
 * Scaffolding System
 * Provides progressive support to help students succeed
 */

import {
  AdaptiveQuestion,
  Hint,
  WorkedExample,
  Scaffolding,
  StudentAnswer
} from '@/types/quiz';

export class ScaffoldingSystem {
  /**
   * Get the next appropriate hint based on student progress
   */
  getNextHint(
    question: AdaptiveQuestion,
    attemptNumber: number,
    studentConfidence?: 'low' | 'medium' | 'high',
    previousAnswers?: StudentAnswer[]
  ): Hint | null {
    const hints = question.scaffolding.hints;
    
    if (!hints || hints.length === 0) return null;
    
    // Progressive disclosure based on attempt number
    let hintIndex = 0;
    
    if (attemptNumber === 1 && studentConfidence === 'low') {
      // First attempt, low confidence → give gentle nudge
      hintIndex = 0;
    } else if (attemptNumber === 2) {
      // Second attempt → more specific guidance
      hintIndex = Math.min(1, hints.length - 1);
    } else if (attemptNumber >= 3) {
      // Third+ attempt → nearly reveal answer
      hintIndex = Math.min(2, hints.length - 1);
    }
    
    // Check if student is struggling across multiple questions
    if (previousAnswers && this.isStruggling(previousAnswers)) {
      // Provide more help faster
      hintIndex = Math.min(hintIndex + 1, hints.length - 1);
    }
    
    return hints[hintIndex] || hints[hints.length - 1];
  }
  
  /**
   * Determine if student should see a worked example
   */
  shouldShowWorkedExample(
    question: AdaptiveQuestion,
    attemptNumber: number,
    recentPerformance?: StudentAnswer[]
  ): boolean {
    // Show worked example if:
    // 1. Student has tried 3+ times
    // 2. Student is struggling on recent questions
    // 3. Question has a worked example available
    
    if (!question.scaffolding.workedExample) return false;
    
    if (attemptNumber >= 3) return true;
    
    if (recentPerformance && this.isStruggling(recentPerformance)) {
      return attemptNumber >= 2;
    }
    
    return false;
  }
  
  /**
   * Generate a worked example for the question
   * (In production, these would be pre-created or AI-generated)
   */
  generateWorkedExample(question: AdaptiveQuestion): WorkedExample | null {
    // Return pre-existing worked example if available
    if (question.scaffolding.workedExample) {
      return question.scaffolding.workedExample;
    }
    
    // Otherwise, generate a simple template
    // In production, this would use AI to create contextual examples
    return {
      problem: `Let's solve a similar problem together`,
      steps: [
        {
          step: 1,
          action: "Identify what we know",
          explanation: "First, let's look at what information we have.",
        },
        {
          step: 2,
          action: "Apply the concept",
          explanation: "Now, let's use what we learned to solve this.",
        },
        {
          step: 3,
          action: "Check our answer",
          explanation: "Finally, let's verify our solution makes sense.",
        }
      ],
      solution: "Step-by-step solution would be shown here",
      reasoning: "This approach works because..."
    };
  }
  
  /**
   * Determine if student is struggling based on recent answers
   */
  private isStruggling(recentAnswers: StudentAnswer[]): boolean {
    if (recentAnswers.length < 2) return false;
    
    // Check last 3 answers
    const last3 = recentAnswers.slice(-3);
    
    // Struggling indicators:
    // 1. Multiple wrong answers in a row (would need correctness data)
    // 2. High hint usage
    // 3. Very long time spent
    
    const avgHintsUsed = last3.reduce((sum, a) => sum + a.hintsUsed, 0) / last3.length;
    const avgTimeSpent = last3.reduce((sum, a) => sum + a.timeSpent, 0) / last3.length;
    
    // If using lots of hints or taking very long
    return avgHintsUsed > 2 || avgTimeSpent > 60000; // 60 seconds
  }
  
  /**
   * Create scaffolding for a question based on difficulty and topic
   */
  createScaffolding(
    topic: string,
    difficulty: string,
    questionText: string
  ): Scaffolding {
    // In production, this would use AI to generate contextual scaffolding
    // For now, return a template structure
    
    return {
      hints: [
        {
          id: 'hint-1',
          level: 1,
          text: 'Think about what the question is asking. What information do you have?',
          type: 'nudge'
        },
        {
          id: 'hint-2',
          level: 2,
          text: 'Try breaking the problem into smaller steps. What would you do first?',
          type: 'guidance'
        },
        {
          id: 'hint-3',
          level: 3,
          text: 'Here\'s the key concept you need: [concept would be inserted here]',
          type: 'reveal'
        }
      ],
      prerequisiteKnowledge: []
    };
  }
  
  /**
   * Adjust scaffolding based on student's learning style
   */
  adjustForLearningStyle(
    scaffolding: Scaffolding,
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  ): Scaffolding {
    const adjusted = { ...scaffolding };
    
    switch (learningStyle) {
      case 'visual':
        // Add visual aids if not present
        if (!adjusted.visualAid) {
          adjusted.visualAid = {
            type: 'diagram',
            url: '/placeholder-diagram.png',
            caption: 'Visual representation of the concept',
            altText: 'Diagram showing the concept'
          };
        }
        break;
        
      case 'kinesthetic':
        // Suggest hands-on activities in hints
        adjusted.hints = adjusted.hints.map(hint => ({
          ...hint,
          text: hint.text + ' Try drawing it out or using objects to represent the problem.'
        }));
        break;
        
      case 'auditory':
        // Hints could be read aloud (would integrate with voice system)
        break;
        
      case 'reading':
        // Provide more detailed written explanations
        adjusted.hints = adjusted.hints.map(hint => ({
          ...hint,
          text: hint.text + ' Read through the question carefully and underline key information.'
        }));
        break;
    }
    
    return adjusted;
  }
  
  /**
   * Determine optimal scaffolding level based on student state
   */
  getOptimalScaffoldingLevel(
    masteryLevel: number,
    recentPerformance: StudentAnswer[]
  ): 'high' | 'medium' | 'low' {
    // High scaffolding for beginners or struggling students
    if (masteryLevel < 30) return 'high';
    
    // Check recent performance
    if (this.isStruggling(recentPerformance)) return 'high';
    
    // Medium scaffolding for intermediate students
    if (masteryLevel < 70) return 'medium';
    
    // Low scaffolding for advanced students
    return 'low';
  }
  
  /**
   * Generate encouragement message based on hint usage
   */
  getEncouragementMessage(hintsUsed: number, correct: boolean): string {
    if (correct && hintsUsed === 0) {
      return "Amazing! You solved it on your own! 🌟";
    } else if (correct && hintsUsed === 1) {
      return "Great job! Using hints wisely shows good learning! 💡";
    } else if (correct && hintsUsed > 1) {
      return "Excellent! You stuck with it and figured it out! 💪";
    } else if (!correct && hintsUsed === 0) {
      return "Good try! Don't hesitate to use hints next time. 🤔";
    } else {
      return "Keep practicing! You're learning and that's what matters! 🌱";
    }
  }
}

// Export singleton instance
export const scaffoldingSystem = new ScaffoldingSystem();
