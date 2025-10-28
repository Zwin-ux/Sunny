/**
 * Database Layer - User Management
 *
 * This module provides a unified interface for user data operations.
 * It automatically uses Supabase when available, or falls back to JSON file storage in demo mode.
 */

import { UserProfile } from '@/types/user';
import { LearningStyle } from '@/types/chat';
import fs from 'fs/promises';
import path from 'path';
import { getAdminClient, isAdminClientAvailable } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

const DB_FILE = path.resolve(process.cwd(), 'src/data/db/users.json');

// Type alias for database user row
type DatabaseUser = Database['public']['Tables']['users']['Row'];
type DatabaseUserInsert = Database['public']['Tables']['users']['Insert'];

// ============================================================================
// Type Mappers (Convert between app types and database types)
// ============================================================================

/**
 * Convert UserProfile to database format
 */
function userProfileToDatabase(profile: UserProfile): DatabaseUserInsert {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password_hash: profile.passwordHash,
    learning_style: profile.learningStyle || null,
    learning_interests: profile.learningInterests,
    progress: profile.progress,
    quiz_progress: profile.quizProgress,
    chat_history: profile.chatHistory,
  };
}

/**
 * Convert database user to UserProfile
 */
function databaseToUserProfile(dbUser: DatabaseUser): UserProfile {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    passwordHash: dbUser.password_hash,
    learningStyle: dbUser.learning_style as LearningStyle | undefined,
    learningInterests: dbUser.learning_interests || [],
    progress: dbUser.progress || {},
    quizProgress: dbUser.quiz_progress || {},
    chatHistory: dbUser.chat_history || [],
  };
}

// ============================================================================
// JSON File Storage (Demo Mode / Fallback)
// ============================================================================

async function getUsersFromFile(): Promise<UserProfile[]> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File does not exist, return empty array
      return [];
    }
    logger.error('Error reading users from file:', error as Error);
    throw error;
  }
}

async function saveUsersToFile(users: UserProfile[]): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(DB_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error writing users to file:', error as Error);
    throw error;
  }
}

// ============================================================================
// Supabase Storage (Production Mode)
// ============================================================================

async function getUsersFromSupabase(): Promise<UserProfile[]> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error('Supabase admin client not available');
  }

  const { data, error } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching users from Supabase:', error as any);
    throw error;
  }

  return (data || []).map(databaseToUserProfile);
}

async function saveUserToSupabase(user: UserProfile): Promise<void> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error('Supabase admin client not available');
  }

  // Convert to database format and upsert
  const dbUser = userProfileToDatabase(user);
  const { error } = await admin
    .from('users')
    .upsert(dbUser, { onConflict: 'id' });

  if (error) {
    logger.error('Error saving user to Supabase:', error as any);
    throw error;
  }
}

async function getUserByIdFromSupabase(id: string): Promise<UserProfile | null> {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error('Supabase admin client not available');
  }

  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - user not found
      return null;
    }
    logger.error('Error fetching user from Supabase:', error as any);
    throw error;
  }

  return data ? databaseToUserProfile(data) : null;
}

// ============================================================================
// Public API (Auto-routing between Supabase and File Storage)
// ============================================================================

/**
 * Get all users
 * Uses Supabase if available, otherwise falls back to JSON file
 */
export async function getUsers(): Promise<UserProfile[]> {
  if (isAdminClientAvailable()) {
    try {
      return await getUsersFromSupabase();
    } catch (error) {
      logger.warn('Failed to get users from Supabase, falling back to file:', error as any);
      return await getUsersFromFile();
    }
  }
  return await getUsersFromFile();
}

/**
 * Get user by ID
 * Uses Supabase if available, otherwise falls back to JSON file
 */
export async function getUserById(id: string): Promise<UserProfile | undefined> {
  if (isAdminClientAvailable()) {
    try {
      const user = await getUserByIdFromSupabase(id);
      return user ?? undefined;
    } catch (error) {
      logger.warn('Failed to get user from Supabase, falling back to file:', error as any);
      const users = await getUsersFromFile();
      return users.find(user => user.id === id);
    }
  }
  const users = await getUsersFromFile();
  return users.find(user => user.id === id);
}

/**
 * Save a single user (insert or update)
 * Uses Supabase if available, otherwise falls back to JSON file
 */
export async function saveUser(userToSave: UserProfile): Promise<void> {
  if (isAdminClientAvailable()) {
    try {
      await saveUserToSupabase(userToSave);
      return;
    } catch (error) {
      logger.warn('Failed to save user to Supabase, falling back to file:', error as any);
      // Fall through to file-based save
    }
  }

  // File-based save
  const users = await getUsersFromFile();
  const index = users.findIndex(user => user.id === userToSave.id);

  if (index !== -1) {
    users[index] = userToSave;
  } else {
    users.push(userToSave);
  }
  await saveUsersToFile(users);
}

/**
 * Save multiple users (bulk operation)
 * Note: This is primarily for file-based storage. For Supabase, consider using saveUser() in a loop.
 */
export async function saveUsers(users: UserProfile[]): Promise<void> {
  if (isAdminClientAvailable()) {
    try {
      // For Supabase, we'll save each user individually
      const admin = getAdminClient();
      if (admin) {
        // Convert all users to database format
        const dbUsers = users.map(userProfileToDatabase);
        const { error } = await admin
          .from('users')
          .upsert(dbUsers, { onConflict: 'id' });

        if (error) {
          throw error;
        }
        return;
      }
    } catch (error) {
      logger.warn('Failed to bulk save users to Supabase, falling back to file:', error as any);
      // Fall through to file-based save
    }
  }

  // File-based bulk save
  await saveUsersToFile(users);
}