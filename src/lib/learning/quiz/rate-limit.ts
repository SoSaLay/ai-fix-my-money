// ============================================================================
// Per-IP rate limiting for the graded path.
//
// Grading is the only route a visitor can trigger that costs money, so it is
// the only one worth limiting. In-memory and per-instance: it holds on a single
// Node process and degrades to per-instance limits behind a load balancer.
// That is the right trade while the app has no shared store — it stops the
// obvious abuse, and the honest limitation is written down rather than assumed
// away. Move it to a shared store if the app ever scales horizontally.
// ============================================================================

import 'server-only'

interface Window {
  count: number
  resetAt: number
}

const WINDOW_MS = 60 * 60 * 1000

/** A full ten-question paper is ten calls. This allows a few papers an hour. */
const MAX_PER_WINDOW = 40

const windows = new Map<string, Window>()

/** Old entries would otherwise accumulate for every IP ever seen. */
function sweep(now: number) {
  if (windows.size < 1000) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. For the Retry-After header. */
  retryAfter: number
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
 * acceptable for cost control, never for anything security-bearing.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
