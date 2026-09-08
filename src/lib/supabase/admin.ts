// ============================================================================
// The service-role client.
//
// This key bypasses row-level security completely: with it, every policy in
// 0001_init.sql is advisory. It exists for the two writes a learner must not be
// able to make for themselves — their own quiz score, and their own grade — and
// for nothing else.
//
// `server-only` is the guard. Importing this from a client component fails the
// build rather than shipping the key to a browser.
// ============================================================================

import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'
import { supabaseUrl } from './env'

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. See DEPLOYMENT.md §6.2.')
  }

  return createSupabaseClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Whether the server can write. Recording a quiz attempt is bookkeeping, not
 * the feature — when this is false the quiz still runs and grades, it is just
 * not written down. That keeps a missing key off the learner's path.
 */
export function adminConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
}
