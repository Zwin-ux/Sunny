/**
 * POST /api/notes
 *
 * Create a new Sunny note (observation, milestone, concern)
 *
 * GET /api/notes?userId=xxx
 *
 * Get all notes for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { addSunnyNote, getSunnyNotes, getActionableNotes } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      comment,
      noteType = 'observation',
      relatedSkillId,
      priority = 'medium',
      actionable = false,
    } = body;

    if (!userId || !comment) {
      return NextResponse.json(
        { error: 'userId and comment are required' },
        { status: 400 }
      );
    }

    // Validate noteType
    const validNoteTypes = ['observation', 'milestone', 'concern'];
    if (!validNoteTypes.includes(noteType)) {
      return NextResponse.json(
        { error: `noteType must be one of: ${validNoteTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    logger.info('Creating Sunny note', { userId, noteType, priority });

    const noteId = await addSunnyNote(
      userId,
      comment,
      noteType as 'observation' | 'milestone' | 'concern',
      relatedSkillId,
      priority as 'low' | 'medium' | 'high',
      actionable
    );

    if (!noteId) {
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    logger.info('Sunny note created', { noteId, userId });

    return NextResponse.json({
      success: true,
      noteId,
      note: {
        id: noteId,
        userId,
        comment,
        noteType,
        priority,
        actionable,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Error in create_note', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const noteType = searchParams.get('noteType');
    const actionableOnly = searchParams.get('actionableOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    logger.info('Getting Sunny notes', { userId, noteType, actionableOnly });

    let notes;

    if (actionableOnly) {
      // Get only actionable high-priority notes
      notes = await getActionableNotes(userId);
    } else if (noteType) {
      // Get notes filtered by type
      notes = await getSunnyNotes(userId, noteType);
    } else {
      // Get all notes
      notes = await getSunnyNotes(userId);
    }

    const formattedNotes = notes.map(n => ({
      id: n.id,
      userId: n.user_id,
      comment: n.sunny_comment,
      noteType: n.note_type,
      priority: n.priority,
      actionable: n.actionable,
      relatedSkillId: n.related_skill_id,
      relatedSessionId: n.related_session_id,
      timestamp: n.timestamp,
    }));

    logger.info('Sunny notes retrieved', { userId, count: notes.length });

    return NextResponse.json({
      notes: formattedNotes,
      count: formattedNotes.length,
    });

  } catch (error: any) {
    logger.error('Error in get_notes', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
