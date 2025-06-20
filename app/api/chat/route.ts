import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Rate limiting setup
const rateLimit = 10; // Max requests per minute
const rateLimitWindow = 60 * 1000; // 1 minute in milliseconds
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Safety check function
const containsInappropriateContent = (text: string): boolean => {
  const inappropriatePatterns = [
    // Add patterns for inappropriate content here
    /\b(?:badword1|badword2|badword3)\b/gi,
    // Add more patterns as needed
  ];
  
  return inappropriatePatterns.some(pattern => pattern.test(text));
};

export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Rate limiting check
  const clientData = requestCounts.get(clientIp) || { count: 0, resetTime: now + rateLimitWindow };
  
  // Reset the counter if the window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + rateLimitWindow;
  }
  
  // Check if rate limit exceeded
  if (clientData.count >= rateLimit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }
  
  // Increment request count
  clientData.count++;
  requestCounts.set(clientIp, clientData);
  
  try {
    const { messages, name } = await request.json();
    
    // Input validation
    if (!Array.isArray(messages) || messages.some(m => typeof m.content !== 'string')) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }
    
    // Check for inappropriate content in user messages
    const userMessages = messages.filter(m => m.role === 'user');
    for (const message of userMessages) {
      if (containsInappropriateContent(message.content)) {
        return NextResponse.json(
          { content: "I'm sorry, I can't respond to that. Let's talk about something else! 🌈" },
          { status: 200 }
        );
      }
    }

    // Add system message with safety instructions and personality
    const systemMessage = {
      role: 'system' as const,
      content: `You are Sunny, a friendly and enthusiastic AI assistant for children. Your goal is to make learning fun and engaging. 
      - Keep responses appropriate for children aged 5-12
      - Use simple, clear language (1st-3rd grade reading level)
      - Be positive, encouraging, and patient
      - Use emojis occasionally to make it fun (but not too many)
      - Keep responses concise (1-2 short paragraphs)
      - If the user's name is provided, use it occasionally
      - If you don't know something, say so and suggest finding out together
      - Never provide personal or sensitive information
      - Redirect any personal questions to talk about general topics
      - Include fun facts and ask engaging questions
      - Use markdown for **emphasis** and *italics*`
    };

    // Prepare conversation history (last 5 messages for context)
    const conversationHistory = messages.slice(-5);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, ...conversationHistory],
      temperature: 0.7,
      max_tokens: 200,
      frequency_penalty: 0.5, // Reduce repetition
      presence_penalty: 0.5,  // Encourage topic variety
    });

    const aiResponse = response.choices[0]?.message?.content || 
      "I'm not sure how to respond to that. Let's talk about something else! 🌟";
      
    // Check AI response for inappropriate content
    if (containsInappropriateContent(aiResponse)) {
      return NextResponse.json({
        content: "I'd love to chat about something else! What else are you curious about? 🌈"
      });
    }

    return NextResponse.json({ 
      content: aiResponse
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        content: "Oops! My brain is feeling a bit fuzzy right now. Could you ask me something else? 🧠✨"
      },
      { status: 200 } // Still return 200 to prevent error in UI
    );
  }
}
