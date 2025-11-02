/**
 * API Error Handling Utilities
 * Provides consistent error handling across all API endpoints
 */

import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Handle API errors with consistent formatting
 */
export function handleAPIError(
  error: unknown,
  context?: string
): NextResponse<ErrorResponse> {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

  // Handle known API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) break;
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new APIError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS',
      { missingFields: missing }
    );
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on server errors (5xx) but not client errors (4xx)
    return error.statusCode >= 500;
  }

  if (error instanceof Error) {
    // Retry on network errors, timeouts, etc.
    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'network',
      'timeout'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  return false;
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error, context);
    }
  };
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

/**
 * Clean up old rate limit records
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute
