import { type NextRequest } from 'next/server';
import { generateSunnyResponse } from '@/lib/sunny-ai';
import type { UserMessage, AssistantMessage, StudentProfile } from '@/types/chat';

// Use the Edge Runtime for streaming responses
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, studentProfile } = (await req.json()) as {
      messages: (UserMessage | AssistantMessage)[];
      studentProfile: StudentProfile;
    };

    if (!messages || !studentProfile) {
      return new Response('Invalid request body', { status: 400 });
    }

    // Call the server-side function to get a stream
    const stream = await generateSunnyResponse(messages, studentProfile);

    // Return the stream directly to the client
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
