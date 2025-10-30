/**
 * Streaming Chat API Route
 *
 * Streams AI responses character-by-character using Server-Sent Events (SSE)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const limited = await rateLimit(ip, 'chat-stream', 60, 30); // 30 requests per minute

    if (limited) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }

    const body = await request.json();
    const { messages, emotion, stream: enableStream = true } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse('Invalid messages format', { status: 400 });
    }

    // Clamp messages to last 12
    const recentMessages = messages.slice(-12);

    // Add emotion context to system prompt
    const emotionContext = emotion
      ? `The student is feeling ${emotion}. Adapt your teaching style to this emotion.`
      : '';

    const systemPrompt = `You are Sunny, a cheerful, encouraging AI tutor for kids aged 6-10.
Keep responses brief (2-3 sentences), friendly, and age-appropriate.
Use simple language and lots of encouragement!
${emotionContext}`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    if (!enableStream) {
      // Non-streaming fallback
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: finalMessages as any,
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || 'I\'m here to help!';
      return NextResponse.json({ message: content });
    }

    // Streaming response
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: finalMessages as any,
      temperature: 0.8,
      max_tokens: 500,
      stream: true,
    });

    // Create a TransformStream to send SSE events
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // Send [DONE] signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);

    // Fallback response
    return NextResponse.json(
      { message: "I'm here to help! What would you like to learn about?" },
      { status: 500 }
    );
  }
}
