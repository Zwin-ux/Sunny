/**
 * Supabase Admin Client
 *
 * This client uses the service role key and has ADMIN PRIVILEGES.
 * WARNING: Only use this in secure server-side code (API routes, server actions).
 * NEVER expose this client to the browser or client-side code.
 *
 * The admin client bypasses Row Level Security (RLS) policies and can:
 * - Access all data regardless of user permissions
 * - Create/update/delete any records
 * - Perform administrative tasks
 *
 * Usage (server-side only):
 * import { getAdminClient } from '@/lib/supabase/admin'
 * const admin = getAdminClient()
 * if (admin) {
 *   // Perform admin operations
 *   const { data } = await admin.from('users').select('*')
 * }
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-mode'
import type { Database } from '@/types/supabase'

// Export typed client type for use in API routes
export type TypedSupabaseClient = SupabaseClient<Database>

let adminClient: TypedSupabaseClient | null = null

/**
 * Get or create the Supabase admin client
 * Returns null if Supabase is not configured (demo mode)
 */
export function getAdminClient() {
  // Return cached client if available
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey || isDemoMode()) {
    return null
  }

  // Create admin client with service role key
  adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

/**
 * Check if admin client is available
 */
export function isAdminClientAvailable(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(supabaseUrl && supabaseServiceRoleKey && !isDemoMode())
}

/**
 * Reset the admin client (useful for testing)
 */
export function resetAdminClient() {
  adminClient = null
}
