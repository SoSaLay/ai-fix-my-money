// The browser client. Reads and writes only what row-level security allows the
// signed-in user to touch.

'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/supabase'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * One instance per browser context. `createBrowserClient` memoises internally,
 * so calling this from several components does not open several connections.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
}
