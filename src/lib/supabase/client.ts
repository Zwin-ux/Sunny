/**
 * Supabase Browser Client
 *
 * This client is used for client-side operations (browser/React components).
 * It uses public environment variables that are safe to expose to the browser.
 *
 * Usage:
 * import { supabase } from '@/lib/supabase/client'
 * const { data, error } = await supabase.from('users').select('*')
 */

import { createBrowserClient } from '@supabase/ssr'
import { isDemoMode } from '@/lib/demo-mode'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for browser-side usage
 * Returns null if Supabase is not configured (demo mode)
 */
export function createClient() {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || isDemoMode()) {
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance
export const supabase = createClient()

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null
}
