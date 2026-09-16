// ============================================================================
// Rate limiting the graded path.
//
// Grading is the only route a visitor can trigger that costs money, so it is
// the only one worth limiting.
//
// Be clear about how much this is worth. The window is a `Map` in one Node
// process, and Amplify runs the app on Lambda: there are several instances,
// they are recycled constantly, and each starts with an empty map. The key is
// the forwarded IP, which the client sets and can therefore change at will.
//
// So this stops a runaway loop and an unsophisticated hammering. It does not
// stop anyone who is trying. With no accounts there is nobody to attribute a
// request to, so a real limit is not available from inside the app — the thing
// that actually bounds the bill is the monthly spend cap on the Anthropic key.
// Set one.
// ============================================================================

import 'server-only'

const WINDOW_MS = 60 * 60 * 1000

/** A full ten-question paper is ten calls. This allows a few papers an hour. */
const MAX_PER_WINDOW = 40

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  /** Seconds until the window resets. For the Retry-After header. */
  retryAfter: number
}

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
 * acceptable for cost control, never for anything security-bearing.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
