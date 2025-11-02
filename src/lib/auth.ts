// Auth module - localStorage-based session management
// TODO: Replace with NextAuth when needed for server-side sessions

import type { UserProfile } from '@/types/user';

const USER_STORAGE_KEY = 'sunny_user';

/**
 * Get current user from localStorage (client-side only)
 */
export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }

  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
  }

  return null;
}

/**
 * Save user to localStorage (client-side only)
 */
export function saveCurrentUser(user: UserProfile): void {
  if (typeof window === 'undefined') {
    return; // Server-side
  }

  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

/**
 * Logout - clear user session
 */
export function logout(): void {
  if (typeof window === 'undefined') {
    return; // Server-side
  }

  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user from localStorage:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// ============================================================================
// Server-side placeholder functions (for NextAuth compatibility)
// ============================================================================

export async function getServerSession() {
  // Placeholder - return null when no auth is configured
  return null;
}

export const authOptions = {
  // Placeholder auth options
};
