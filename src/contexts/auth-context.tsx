// ============================================================================
// Who is signed in.
//
// One subscription to Supabase's auth state, shared by every consumer. The
// contexts below it key their storage on `userId`, so this has to settle before
// they read anything — `ready` is that signal, and it is separate from "there
// is a user", because signed-out-and-known is a real state the app renders.
//
// With no Supabase project configured the app runs signed out and local, the
// way it did before accounts existed. That keeps a fresh clone working.
// ============================================================================

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'

import { authConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { installFlushOnLeave, setSyncUser } from '@/lib/sync/user-state'

interface AuthContextValue {
  user: User | null
  userId: string | null
  /** The auth state has been determined. Not the same as "signed in". */
  ready: boolean
  /** False when no Supabase project is configured — local-only mode. */
  enabled: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = authConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setSyncUser(null)
      return
    }

    const supabase = createClient()
    let active = true

    // getUser verifies the token against the auth server. getSession would
    // trust whatever is in the cookie, which is not a check.
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user ?? null)
      setSyncUser(data.user?.id ?? null)
      setReady(true)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setSyncUser(session?.user?.id ?? null)
      setReady(true)
    })

    const uninstall = installFlushOnLeave()

    return () => {
      active = false
      subscription.subscription.unsubscribe()
      uninstall()
    }
  }, [enabled])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    userId: user?.id ?? null,
    ready,
    enabled,
    signOut: async () => {
      if (!enabled) return
      const supabase = createClient()
      await supabase.auth.signOut()
    },
  }), [user, ready, enabled])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
