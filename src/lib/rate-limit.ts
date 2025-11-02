/**
 * Simple in-memory rate limiting implementation for Sunny API
 * For production, consider using Redis or another distributed cache
 */

import { logger } from './logger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, this should be replaced with Redis or similar
const rateLimitStore: Map<string, RateLimitRecord> = new Map();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Apply rate limiting to an API request
 * 
 * @param identifier - Unique identifier for the client (e.g., IP address)
 * @param endpoint - API endpoint being accessed
 * @param windowSeconds - Time window in seconds
 * @param limit - Maximum number of requests allowed in the window
 * @returns Object containing rate limit result
 */
export async function rateLimit(
  identifier: string,
  endpoint: string,
  windowSeconds: number,
  limit: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Date.now();
  
  // Clean up expired records periodically
  if (Math.random() < 0.01) { // 1% chance to clean up on each request
    cleanupExpiredRecords();
  }
  
  // Get current rate limit record or create new one
  let record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + (windowSeconds * 1000)
    };
  }
  
  // Increment request count
  record.count += 1;
  rateLimitStore.set(key, record);
  
  // Check if limit exceeded
  const remaining = Math.max(0, limit - record.count);
  const success = record.count <= limit;
  
  if (!success) {
    logger.warn('Rate limit exceeded', { 
      identifier, 
      endpoint, 
      limit, 
      count: record.count 
    });
  }
  
  return {
    success,
    limit,
    remaining,
    resetAt: record.resetAt
  };
}

/**
 * Clean up expired rate limit records to prevent memory leaks
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug(`Cleaned up ${cleanedCount} expired rate limit records`);
  }
}
