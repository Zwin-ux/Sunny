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
    .upsert(dbUser as any, { onConflict: 'id' });

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
          .upsert(dbUsers as any, { onConflict: 'id' });

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

// ============================================================================
// Phase 4: Learning OS - Skills, Sessions, and Notes
// ============================================================================

// Type aliases for database types
type DatabaseSkill = Database['public']['Tables']['skills']['Row'];
type DatabaseSkillInsert = Database['public']['Tables']['skills']['Insert'];
type DatabaseSession = Database['public']['Tables']['sessions']['Row'];
type DatabaseSessionInsert = Database['public']['Tables']['sessions']['Insert'];
type DatabaseNote = Database['public']['Tables']['notes']['Row'];
type DatabaseNoteInsert = Database['public']['Tables']['notes']['Insert'];

/**
 * Phase 4.1: Skills CRUD Operations
 */

/**
 * Get all skills for a user
 */
export async function getSkillsByUser(userId: string): Promise<DatabaseSkill[]> {
  if (!isAdminClientAvailable()) {
    logger.warn('Supabase not available, using demo mode mock skills');
    // Return realistic mock skills in demo mode
    const { generateMockSkills } = await import('./demo-mode');
    return generateMockSkills();
  }

  const admin = getAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from('skills')
    .select('*')
    .eq('user_id', userId)
    .order('mastery', { ascending: false });

  if (error) {
    logger.error('Error getting skills:', error);
    return [];
  }

  return data || [];
}

/**
 * Update skill mastery level
 */
export async function updateSkillMastery(
  userId: string,
  skillId: string,
  masteryDelta: number
): Promise<void> {
  if (!isAdminClientAvailable()) {
    logger.warn('Supabase not available, skipping skill update');
    return;
  }

  const admin = getAdminClient();
  if (!admin) return;

  // Get current skill
  const { data: skill, error: fetchError } = await admin
    .from('skills')
    .select('mastery')
    .eq('id', skillId)
    .single();

  if (fetchError) {
    logger.error('Error fetching skill:', fetchError);
    return;
  }

  // Calculate new mastery (0-100)
  const newMastery = Math.max(0, Math.min(100, (skill?.mastery || 0) + masteryDelta));

  // Update skill
  const { error: updateError } = await admin
    .from('skills')
    .update({
      mastery: newMastery,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', skillId);

  if (updateError) {
    logger.error('Error updating skill:', updateError);
    return;
  }

  logger.info(`Updated skill ${skillId} mastery to ${newMastery}`);

  // Check for level up
  await checkLevelUp(userId);
}

/**
 * Create a new skill for a user
 */
export async function createSkill(
  userId: string,
  domain: string,
  category: string,
  displayName: string,
  initialMastery: number = 0
): Promise<string | null> {
  if (!isAdminClientAvailable()) {
    logger.warn('Supabase not available, skipping skill creation');
    return null;
  }

  const admin = getAdminClient();
  if (!admin) return null;

  const skillData: DatabaseSkillInsert = {
    user_id: userId,
    domain,
    category,
    display_name: displayName,
    mastery: initialMastery,
    confidence: initialMastery < 30 ? 'low' : initialMastery < 70 ? 'medium' : 'high',
    last_seen: new Date().toISOString(),
    decay_rate: 0.05, // Default decay rate
    total_attempts: 0,
    correct_attempts: 0
  };

  const { data, error } = await admin
    .from('skills')
    .insert(skillData)
    .select('id')
    .single();

  if (error) {
    logger.error('Error creating skill:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Check if user should level up based on skill mastery
 */
export async function checkLevelUp(userId: string): Promise<void> {
  if (!isAdminClientAvailable()) return;

  const admin = getAdminClient();
  if (!admin) return;

  // Get all user skills
  const { data: skills } = await admin
    .from('skills')
    .select('mastery')
    .eq('user_id', userId);

  if (!skills || skills.length === 0) return;

  // Calculate average mastery
  const avgMastery = skills.reduce((sum, s) => sum + s.mastery, 0) / skills.length;

  // Calculate new level (0-100 mastery = levels 0-10)
  const newLevel = Math.floor(avgMastery / 10);

  // Get current user level
  const { data: user } = await admin
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!user) return;

  // Update user level
  await admin
    .from('users')
    .update({
      // Note: 'level' column doesn't exist in current schema, would need to be added
      // For now, we'll just log it
    })
    .eq('id', userId);

  logger.info(`User ${userId} should be level ${newLevel} (avg mastery: ${avgMastery.toFixed(1)})`);
}

/**
 * Phase 4.2: Session Recording
 */

/**
 * Record a learning session
 */
export async function recordSession(sessionData: {
  userId: string;
  missionType: string;
  sunnyGoal: string;
  targetSkillId?: string;
  difficultyLevel?: string;
  questionFormat?: string;
  questionsAttempted: number;
  questionsCorrect: number;
  masteryBefore?: number;
  masteryAfter?: number;
  durationSeconds: number;
  attentionQuality?: string;
  sunnySummary?: string;
}): Promise<string | null> {
  if (!isAdminClientAvailable()) {
    logger.warn('Supabase not available, skipping session recording');
    return null;
  }

  const admin = getAdminClient();
  if (!admin) return null;

  const sessionInsert: DatabaseSessionInsert = {
    user_id: sessionData.userId,
    started_at: new Date(Date.now() - sessionData.durationSeconds * 1000).toISOString(),
    ended_at: new Date().toISOString(),
    duration_seconds: sessionData.durationSeconds,
    mission_type: sessionData.missionType,
    sunny_goal: sessionData.sunnyGoal,
    target_skill_id: sessionData.targetSkillId || null,
    difficulty_level: sessionData.difficultyLevel || null,
    question_format: sessionData.questionFormat || null,
    questions_attempted: sessionData.questionsAttempted,
    questions_correct: sessionData.questionsCorrect,
    mastery_before: sessionData.masteryBefore || null,
    mastery_after: sessionData.masteryAfter || null,
    mastery_delta: sessionData.masteryAfter && sessionData.masteryBefore
      ? sessionData.masteryAfter - sessionData.masteryBefore
      : null,
    attention_quality: sessionData.attentionQuality || null,
    sunny_summary: sessionData.sunnySummary || null,
    status: 'completed'
  };

  const { data, error } = await admin
    .from('sessions')
    .insert(sessionInsert)
    .select('id')
    .single();

  if (error) {
    logger.error('Error recording session:', error);
    return null;
  }

  logger.info(`Recorded session ${data?.id} for user ${sessionData.userId}`);
  return data?.id || null;
}

/**
 * Get recent sessions for a user
 */
export async function getRecentSessions(
  userId: string,
  limit: number = 10
): Promise<DatabaseSession[]> {
  if (!isAdminClientAvailable()) {
    // Return realistic mock sessions in demo mode
    const { generateMockSessions } = await import('./demo-mode');
    const allSessions = generateMockSessions();
    return allSessions.slice(0, limit);
  }

  const admin = getAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error getting recent sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent game sessions for a user (via student profile)
 */
export async function getRecentGameSessions(userId: string, limit: number = 20): Promise<any[]> {
  if (!isAdminClientAvailable()) {
    // Return subset of mock sessions as game sessions in demo mode
    const { generateMockSessions } = await import('./demo-mode');
    const allSessions = generateMockSessions();
    // Convert to game session format (simplified)
    return allSessions.slice(0, limit).map(s => ({
      ...s,
      game_type: s.mission_type,
      student_id: 'demo-student-1'
    }));
  }
  const admin = getAdminClient();
  if (!admin) return []
  // Find student profile id
  const { data: profile } = await admin.from('student_profiles').select('id').eq('user_id', userId).single()
  if (!profile?.id) return []
  const { data, error } = await admin
    .from('game_sessions')
    .select('*')
    .eq('student_id', profile.id)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) {
    logger.error('Error getting recent game sessions:', error)
    return []
  }
  return data || []
}

/**
 * Phase 4.3: Sunny Notes
 */

/**
 * Add a note from Sunny about a student
 */
export async function addSunnyNote(
  userId: string,
  comment: string,
  noteType: 'observation' | 'milestone' | 'concern',
  relatedSkillId?: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  actionable: boolean = false
): Promise<string | null> {
  if (!isAdminClientAvailable()) {
    logger.warn('Supabase not available, skipping note creation');
    return null;
  }

  const admin = getAdminClient();
  if (!admin) return null;

  const noteData: DatabaseNoteInsert = {
    user_id: userId,
    sunny_comment: comment,
    related_skill_id: relatedSkillId || null,
    note_type: noteType,
    priority,
    actionable,
    timestamp: new Date().toISOString()
  };

  const { data, error } = await admin
    .from('notes')
    .insert(noteData)
    .select('id')
    .single();

  if (error) {
    logger.error('Error adding Sunny note:', error);
    return null;
  }

  logger.info(`Added Sunny note for user ${userId}: ${comment.substring(0, 50)}...`);
  return data?.id || null;
}

/**
 * Get all notes for a user
 */
export async function getSunnyNotes(
  userId: string,
  noteType?: 'observation' | 'milestone' | 'concern'
): Promise<DatabaseNote[]> {
  if (!isAdminClientAvailable()) {
    return [];
  }

  const admin = getAdminClient();
  if (!admin) return [];

  let query = admin
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (noteType) {
    query = query.eq('note_type', noteType);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error getting Sunny notes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get actionable notes for a user (high priority concerns)
 */
export async function getActionableNotes(userId: string): Promise<DatabaseNote[]> {
  if (!isAdminClientAvailable()) {
    return [];
  }

  const admin = getAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('actionable', true)
    .eq('priority', 'high')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error) {
    logger.error('Error getting actionable notes:', error);
    return [];
  }

  return data || [];
}

/**
 * Find user by email (for authentication)
 */
export async function findUserByEmail(email: string): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

/**
 * Add a new user
 */
export async function addUser(user: UserProfile): Promise<void> {
  await saveUser(user);
}
