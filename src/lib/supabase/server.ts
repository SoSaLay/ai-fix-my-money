// The server client: server components, server actions, and route handlers.
// Carries the caller's session from the request cookies, so RLS applies to it
// exactly as it does in the browser.

import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/supabase'
import { supabaseAnonKey, supabaseUrl } from './env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // A server component cannot set cookies. The middleware refreshes the
          // session on every request, so nothing is lost by ignoring this.
        }
      },
    },
  })
}

/** The signed-in user, or null. Never throws — callers decide what a null means. */
export async function currentUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
