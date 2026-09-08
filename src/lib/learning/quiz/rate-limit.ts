// ============================================================================
// Rate limiting the graded path.
//
// Grading is the only route a visitor can trigger that costs money, so it is
// the only one worth limiting.
//
// The limit is a count of that user's own grades in the last hour, read from
// the table those grades are already written to. No second store, and — unlike
// the in-memory version this replaces — it survives the Lambda recycling that
// Amplify does constantly, and it counts a person rather than an IP, so testers
// behind one office connection do not throttle each other.
//
// The in-memory window is still here as the fallback for local development,
// where there is no database configured. It is per-process and resets on
// restart; that is fine for one developer and useless in production, which is
// exactly the shape of a fallback.
// ============================================================================

import 'server-only'

import { adminConfigured, createAdminClient } from '@/lib/supabase/admin'

const WINDOW_MS = 60 * 60 * 1000

/** A full ten-question paper is ten calls. This allows a few papers an hour. */
const MAX_PER_WINDOW = 40

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. For the Retry-After header. */
  retryAfter: number
}

// ─── The real limit ──────────────────────────────────────────────────────────

export async function checkUserRateLimit(userId: string): Promise<RateLimitResult> {
  if (!adminConfigured()) return checkRateLimit(`user:${userId}`)

  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('graded_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)

    if (error || count === null) {
      // A limiter that cannot read its own counter must not become a wall in
      // front of paying learners. Fall back to the per-process window, which
      // still stops a runaway loop inside one instance.
      return checkRateLimit(`user:${userId}`)
    }

    return {
      allowed: count < MAX_PER_WINDOW,
      remaining: Math.max(0, MAX_PER_WINDOW - count),
      // The window slides, so the honest answer to "when may I retry" without a
      // second query is "within the hour".
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    }
  } catch {
    return checkRateLimit(`user:${userId}`)
  }
}

// ─── The fallback ────────────────────────────────────────────────────────────

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/** Old entries would otherwise accumulate for every key ever seen. */
function sweep(now: number) {
  if (windows.size < 1000) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = windows.get(key)
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_PER_WINDOW - 1, retryAfter: 0 }
  }

  existing.count++
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
  return {
    allowed: existing.count <= MAX_PER_WINDOW,
    remaining: Math.max(0, MAX_PER_WINDOW - existing.count),
    retryAfter,
  }
}

/**
 * Behind a proxy the socket address is the proxy, so the forwarded header is
 * the only signal available. It is client-controlled and therefore spoofable —
 * acceptable for cost control on an anonymous route, never for anything
 * security-bearing.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
