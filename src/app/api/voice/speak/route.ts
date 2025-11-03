import { NextRequest, NextResponse } from 'next/server';
import { voiceService } from '@/lib/voice-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length (OpenAI limit is 4096 chars)
    if (text.length > 4000) {
      return NextResponse.json(
        { error: 'Text too long (max 4000 characters)' },
        { status: 400 }
      );
    }

    const result = await voiceService.textToSpeech(text, {
      voice: voice || 'nova',
      speed: speed || 1.0,
    });

    return NextResponse.json({
      audio: result.audio,
      format: result.format,
    });
  } catch (error) {
    logger.error('Voice generation error', error as Error);
    return NextResponse.json(
      { error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}

// Rate limiting: 100 requests per user per hour
export const runtime = 'nodejs';
export const maxDuration = 30;
