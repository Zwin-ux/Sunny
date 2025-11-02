import { NextResponse } from 'next/server';
import { getUserById, saveUser } from '@/lib/db';
import { UserProfile } from '@/types/user';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { cache } from '@/lib/cache';
import { isDemoMode, mockUserProfile } from '@/lib/demo-mode';

/**
 * API Error class for better error handling
 */
class APIError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function GET(request: Request) {
  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip, 'user_api', 60, 30); // 30 requests per minute
  
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded', { ip, endpoint: 'user' });
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }, 
      { status: 429 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    logger.warn('Missing user ID in request');
    return NextResponse.json({ 
      error: 'User ID is required', 
      code: 'MISSING_USER_ID' 
    }, { status: 400 });
  }

  try {
    logger.info('User API GET request', { id });
    
    // Check cache first
    const cacheKey = `user:${id}`;
    let user = await cache.get<UserProfile>(cacheKey);
    
    if (!user) {
      // If not in cache, get from database
      user = await getUserById(id);
      
      if (user) {
        // Cache user data for 5 minutes
        await cache.set(cacheKey, user, 300);
      }
    }
    
    if (user) {
      return NextResponse.json(user);
    } else {
      // If in demo mode, return mock user profile
      if (isDemoMode()) {
        logger.info('Using demo user profile', { id });
        return NextResponse.json(mockUserProfile);
      }
      
      logger.warn('User not found', { id });
      return NextResponse.json({ 
        error: 'User not found', 
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }
  } catch (error: any) {
    logger.error('Error fetching user', { 
      id, 
      error: error.message,
      stack: error.stack 
    });
    
    // If in demo mode, return mock user profile instead of error
    if (isDemoMode()) {
      logger.info('Using demo user profile after error', { id });
      return NextResponse.json(mockUserProfile);
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      code: 'INTERNAL_ERROR',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip, 'user_api_post', 60, 10); // 10 POST requests per minute
  
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded for POST', { ip, endpoint: 'user' });
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }, 
      { status: 429 }
    );
  }
  
  try {
    const userData: UserProfile = await request.json();
    logger.info('User API POST request', { userId: userData.id });

    if (!userData.id) {
      logger.warn('Missing user ID in POST data');
      return NextResponse.json({ 
        error: 'User ID is required', 
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // In demo mode, pretend to save but don't actually save
    if (isDemoMode()) {
      logger.info('Demo mode: Simulating user save', { userId: userData.id });
      return NextResponse.json({ 
        message: 'User data saved successfully (Demo Mode)', 
        demo: true 
      });
    }
    
    await saveUser(userData);
    
    // Update cache with new user data
    const cacheKey = `user:${userData.id}`;
    await cache.set(cacheKey, userData, 300);
    
    logger.info('User data saved successfully', { userId: userData.id });
    return NextResponse.json({ message: 'User data saved successfully' });
  } catch (error: any) {
    logger.error('Error saving user', { 
      userId: error.userId, 
      error: error.message,
      stack: error.stack 
    });
    
    // In demo mode, return success even if there was an error
    if (isDemoMode()) {
      logger.info('Demo mode: Simulating successful user save after error');
      return NextResponse.json({ 
        message: 'User data saved successfully (Demo Mode)', 
        demo: true 
      });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      code: 'INTERNAL_ERROR',
      message: error.message 
    }, { status: 500 });
  }
}
