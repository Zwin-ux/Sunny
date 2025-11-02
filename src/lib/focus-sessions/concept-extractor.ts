// Concept Extractor - Extracts learning concepts from conversations and content
// Uses GPT-4 to analyze context and build concept maps

import OpenAI from 'openai';
import { ConceptMap, Subtopic } from '@/types/focus-session';
import { DifficultyLevel } from '@/types/chat';
import { logger } from '@/lib/logger';

export class ConceptExtractor {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Extract concepts from input context (conversation, notes, etc.)
   */
  async extractConcepts(
    topic: string,
    context: string,
    learningGoals?: string[]
  ): Promise<ConceptMap> {
    if (!this.openai) {
      logger.warn('OpenAI not configured, using fallback concept extraction');
      return this.getFallbackConceptMap(topic);
    }

    try {
      const prompt = this.buildExtractionPrompt(topic, context, learningGoals);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: CONCEPT_EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const conceptMapData = JSON.parse(responseText);
      return this.validateAndNormalizeConceptMap(conceptMapData, topic);
    } catch (error) {
      logger.error('Error extracting concepts:', error as Error);
      return this.getFallbackConceptMap(topic);
    }
  }

  /**
   * Update concept map based on new interactions
   */
  async updateConceptMap(
    existingMap: ConceptMap,
    newContext: string,
    performance?: {
      subtopic: string;
      accuracy: number;
      timestamp: number;
    }[]
  ): Promise<ConceptMap> {
    if (!this.openai) {
      return this.updateConceptMapLocally(existingMap, performance);
    }

    try {
      const prompt = this.buildUpdatePrompt(existingMap, newContext, performance);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: CONCEPT_UPDATE_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const updates = JSON.parse(responseText);
      return this.applyUpdates(existingMap, updates);
    } catch (error) {
      logger.error('Error updating concept map:', error as Error);
      return this.updateConceptMapLocally(existingMap, performance);
    }
  }

  /**
   * Identify knowledge gaps from concept map
   */
  identifyGaps(conceptMap: ConceptMap): string[] {
    const gaps: string[] = [];

    // Find weak or new subtopics
    conceptMap.subtopics.forEach((subtopic) => {
      if (subtopic.status === 'weak' || subtopic.masteryLevel < 0.5) {
        gaps.push(`Low mastery in ${subtopic.name} (${Math.round(subtopic.masteryLevel * 100)}%)`);
      }

      // Check prerequisites
      subtopic.prerequisites.forEach((prereq) => {
        const prereqSubtopic = conceptMap.subtopics.find((s) => s.name === prereq);
        if (!prereqSubtopic || prereqSubtopic.masteryLevel < 0.6) {
          gaps.push(`Prerequisite needed: ${prereq} for ${subtopic.name}`);
        }
      });
    });

    // Add misconceptions as gaps
    conceptMap.misconceptions.forEach((misconception) => {
      gaps.push(`Misconception to address: ${misconception}`);
    });

    return gaps;
  }

  /**
   * Suggest next subtopics to focus on
   */
  suggestNextSubtopics(conceptMap: ConceptMap, count: number = 3): string[] {
    // Score subtopics based on:
    // 1. Prerequisites met
    // 2. Current mastery (want room for improvement)
    // 3. Recency (prefer not recently practiced)

    const scored = conceptMap.subtopics.map((subtopic) => {
      let score = 0;

      // Prerequisites met?
      const prereqsMet = subtopic.prerequisites.every((prereq) => {
        const prereqSubtopic = conceptMap.subtopics.find((s) => s.name === prereq);
        return prereqSubtopic && prereqSubtopic.masteryLevel >= 0.6;
      });
      if (prereqsMet) score += 10;

      // Mastery sweet spot (0.3 - 0.7) - room to improve
      if (subtopic.masteryLevel >= 0.3 && subtopic.masteryLevel <= 0.7) {
        score += 8;
      } else if (subtopic.masteryLevel < 0.3) {
        score += 5; // needs work but might be frustrating
      } else if (subtopic.masteryLevel < 0.9) {
        score += 3; // close to mastery, good for reinforcement
      }

      // Recency - prefer topics not recently practiced
      const hoursSinceLastPractice = subtopic.lastPracticed
        ? (Date.now() - subtopic.lastPracticed) / (1000 * 60 * 60)
        : 1000;

      if (hoursSinceLastPractice > 24) score += 5;
      else if (hoursSinceLastPractice > 6) score += 3;

      // Status boost
      if (subtopic.status === 'learning') score += 4;
      if (subtopic.status === 'weak') score += 6;
      if (subtopic.status === 'new') score += 2;

      return { subtopic: subtopic.name, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.subtopic);
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private buildExtractionPrompt(
    topic: string,
    context: string,
    learningGoals?: string[]
  ): string {
    let prompt = `Extract learning concepts from the following context about "${topic}".\n\n`;
    prompt += `Context:\n${context}\n\n`;

    if (learningGoals && learningGoals.length > 0) {
      prompt += `Learning Goals:\n${learningGoals.map((g) => `- ${g}`).join('\n')}\n\n`;
    }

    prompt += `Generate a concept map with:
- 3-6 subtopics (key areas within this topic)
- For each subtopic: name, prerequisites, initial status
- Common misconceptions students might have
- 2-3 concrete examples to illustrate the topic
- Clear learning goals

Return as JSON matching this structure:
{
  "topic": "string",
  "subtopics": [
    {
      "name": "string",
      "description": "brief description",
      "prerequisites": ["prerequisite concept names"],
      "status": "new"
    }
  ],
  "misconceptions": ["common misconception strings"],
  "examples": ["concrete example strings"],
  "learningGoals": ["clear, measurable goal strings"]
}`;

    return prompt;
  }

  private buildUpdatePrompt(
    existingMap: ConceptMap,
    newContext: string,
    performance?: { subtopic: string; accuracy: number; timestamp: number }[]
  ): string {
    let prompt = `Update this concept map based on new information.\n\n`;
    prompt += `Current Concept Map:\n${JSON.stringify(existingMap, null, 2)}\n\n`;
    prompt += `New Context:\n${newContext}\n\n`;

    if (performance && performance.length > 0) {
      prompt += `Recent Performance:\n`;
      performance.forEach((p) => {
        prompt += `- ${p.subtopic}: ${Math.round(p.accuracy * 100)}% accuracy\n`;
      });
      prompt += '\n';
    }

    prompt += `Return JSON with updates to apply:
{
  "subtopicUpdates": [
    {
      "name": "subtopic name",
      "status": "new | learning | ok | weak | mastered",
      "masteryLevel": 0-1 number
    }
  ],
  "newMisconceptions": ["any new misconceptions detected"],
  "newExamples": ["any new examples to add"],
  "newLearningGoals": ["any additional goals"]
}

Only include fields that should be updated. Adjust mastery based on performance.`;

    return prompt;
  }

  private validateAndNormalizeConceptMap(data: any, topic: string): ConceptMap {
    const now = Date.now();

    return {
      topic: data.topic || topic,
      subtopics: (data.subtopics || []).map((st: any) => this.normalizeSubtopic(st)),
      misconceptions: data.misconceptions || [],
      examples: data.examples || [],
      learningGoals: data.learningGoals || [],
      extractedAt: now,
      lastUpdated: now,
    };
  }

  private normalizeSubtopic(data: any): Subtopic {
    return {
      name: data.name || 'Unknown',
      description: data.description,
      prerequisites: data.prerequisites || [],
      status: data.status || 'new',
      masteryLevel: data.masteryLevel ?? 0,
      interactions: data.interactions || 0,
      lastPracticed: data.lastPracticed,
    };
  }

  private applyUpdates(existingMap: ConceptMap, updates: any): ConceptMap {
    const updatedMap = { ...existingMap };

    // Apply subtopic updates
    if (updates.subtopicUpdates) {
      updates.subtopicUpdates.forEach((update: any) => {
        const subtopic = updatedMap.subtopics.find((s) => s.name === update.name);
        if (subtopic) {
          if (update.status) subtopic.status = update.status;
          if (update.masteryLevel !== undefined) subtopic.masteryLevel = update.masteryLevel;
        }
      });
    }

    // Add new content
    if (updates.newMisconceptions) {
      updatedMap.misconceptions.push(...updates.newMisconceptions);
    }
    if (updates.newExamples) {
      updatedMap.examples.push(...updates.newExamples);
    }
    if (updates.newLearningGoals) {
      updatedMap.learningGoals.push(...updates.newLearningGoals);
    }

    updatedMap.lastUpdated = Date.now();
    return updatedMap;
  }

  private updateConceptMapLocally(
    existingMap: ConceptMap,
    performance?: { subtopic: string; accuracy: number; timestamp: number }[]
  ): ConceptMap {
    const updatedMap = { ...existingMap };

    if (performance) {
      performance.forEach((p) => {
        const subtopic = updatedMap.subtopics.find((s) => s.name === p.subtopic);
        if (subtopic) {
          // Update mastery based on accuracy
          subtopic.masteryLevel = Math.min(
            1,
            subtopic.masteryLevel * 0.7 + p.accuracy * 0.3
          );

          // Update status
          if (subtopic.masteryLevel >= 0.85) subtopic.status = 'mastered';
          else if (subtopic.masteryLevel >= 0.7) subtopic.status = 'ok';
          else if (subtopic.masteryLevel >= 0.4) subtopic.status = 'learning';
          else subtopic.status = 'weak';

          subtopic.interactions += 1;
          subtopic.lastPracticed = p.timestamp;
        }
      });
    }

    updatedMap.lastUpdated = Date.now();
    return updatedMap;
  }

  private getFallbackConceptMap(topic: string): ConceptMap {
    const now = Date.now();

    // Generate basic concept map based on topic
    const subtopics = this.generateFallbackSubtopics(topic);

    return {
      topic,
      subtopics,
      misconceptions: [],
      examples: [`Let's explore ${topic} together!`],
      learningGoals: [`Understand the basics of ${topic}`, `Build confidence with ${topic}`],
      extractedAt: now,
      lastUpdated: now,
    };
  }

  private generateFallbackSubtopics(topic: string): Subtopic[] {
    const commonSubtopics: Subtopic[] = [
      {
        name: 'Introduction',
        description: `Basic concepts of ${topic}`,
        prerequisites: [],
        status: 'new',
        masteryLevel: 0,
        interactions: 0,
      },
      {
        name: 'Core Concepts',
        description: `Main ideas in ${topic}`,
        prerequisites: ['Introduction'],
        status: 'new',
        masteryLevel: 0,
        interactions: 0,
      },
      {
        name: 'Practice',
        description: `Applying ${topic} knowledge`,
        prerequisites: ['Core Concepts'],
        status: 'new',
        masteryLevel: 0,
        interactions: 0,
      },
    ];

    return commonSubtopics;
  }
}

// ============================================================================
// System Prompts
// ============================================================================

const CONCEPT_EXTRACTION_SYSTEM_PROMPT = `You are an expert educational analyst specializing in breaking down topics into learnable concepts for children aged 6-10.

Your job is to analyze conversations, lessons, or content and extract:
1. Key subtopics (3-6 distinct areas)
2. Prerequisites (what should be learned first)
3. Common misconceptions children might have
4. Concrete, relatable examples
5. Clear, age-appropriate learning goals

Make concepts:
- Child-friendly and engaging
- Logically sequenced (prerequisites first)
- Concrete and actionable
- Age-appropriate (6-10 years old)

Always return valid JSON matching the requested structure.`;

const CONCEPT_UPDATE_SYSTEM_PROMPT = `You are analyzing student performance to update a learning concept map.

Based on:
- Current concept map
- New interactions or content
- Performance data (accuracy on different subtopics)

Update the concept map by:
1. Adjusting mastery levels based on performance
2. Changing status (new → learning → ok/weak → mastered)
3. Adding newly discovered misconceptions
4. Adding relevant examples
5. Refining learning goals

Rules:
- Accuracy 85%+ → mastery moving toward "mastered"
- Accuracy 70-85% → status "ok"
- Accuracy 50-70% → status "learning"
- Accuracy <50% → status "weak"
- Only include fields that need updating

Return valid JSON with only the changes to apply.`;

// Singleton instance
export const conceptExtractor = new ConceptExtractor();
