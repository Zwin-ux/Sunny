/**
 * POST /api/brain/analyze
 * 
 * Runs the Learning Brain analysis on a student
 * Returns interventions and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLearningBrain } from '@/lib/learning-brain';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    logger.info('Running brain analysis', { userId });

    const brain = getLearningBrain();
    const analysis = await brain.analyzeStudent(userId);

    // Generate interventions for urgent/high priority issues
    const generatedInterventions = [];
    for (const intervention of analysis.interventionsNeeded.slice(0, 3)) {
      if (intervention.priority === 'urgent' || intervention.priority === 'high') {
        const generated = await brain.generateIntervention(intervention, userId);
        if (generated) {
          generatedInterventions.push({
            ...intervention,
            content: generated,
          });
        }
      }
    }

    return NextResponse.json({
      analysis: {
        skillsAnalyzed: analysis.currentSkills.length,
        strugglingSkills: analysis.currentSkills.filter(s => s.trend === 'stuck' || s.trend === 'declining').length,
        improvingSkills: analysis.currentSkills.filter(s => s.trend === 'improving').length,
        learningVelocity: analysis.learningVelocity,
        behavioralPatterns: analysis.behavioralPatterns,
        interventionsNeeded: analysis.interventionsNeeded,
        generatedInterventions,
      },
    });

  } catch (error: any) {
    logger.error('Error in brain analysis', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
