/**
 * Supabase Server Client
 *
 * This client is used for server-side operations (API routes, Server Components).
 * It properly handles cookies and server-side rendering.
 *
 * Usage in API routes:
 * import { createServerClient } from '@/lib/supabase/server'
 * const supabase = createServerClient()
 * const { data } = await supabase.from('users').select('*')
 *
 * Usage in Server Components:
 * import { createServerClient } from '@/lib/supabase/server'
 * const supabase = createServerClient()
 * const { data } = await supabase.from('users').select('*')
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isDemoMode } from '@/lib/demo-mode'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for server-side usage
 * Returns null if Supabase is not configured (demo mode)
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || isDemoMode()) {
    return null
  }

  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Check if Supabase is available on the server
 */
export function isSupabaseAvailable(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(supabaseUrl && supabaseAnonKey && !isDemoMode())
}
