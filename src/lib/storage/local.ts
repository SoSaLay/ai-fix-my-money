// ============================================================================
// Everything the learner has done lives in this browser.
//
// There is no account and no server copy: the figures someone types and the
// progress they make are held in local storage and nowhere else. That is the
// whole storage layer, and it is worth being plain about what it costs — clear
// the browser data and it is gone, and a phone and a laptop are two different
// learners.
//
// Keys are bare, the shape this app used before accounts briefly existed, so
// anyone who has used it before still has their work.
//
// Every read and write is wrapped. A private window, a full quota, or a browser
// set to block site data all throw here rather than returning empty, and none
// of those should take a page down.
// ============================================================================

'use client'

export function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota, or a browser refusing storage. Nothing useful to do — the value is
    // still in React state, so this session carries on as normal and only the
    // next visit is poorer for it.
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // As above.
  }
}

/** Every key this app writes starts with this. Nothing else on the origin does. */
const PREFIX = 'llg_'

/**
 * Erase everything this app has stored in this browser: progress, review queue,
 * onboarding, every figure and goal. The caller reloads afterwards — React state
 * still holds the old values until it does, and a reload is the only way to be
 * sure nothing in memory writes them back.
 */
export function clearAllLocal(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    // Collected first: removing while indexing shifts the indices.
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    // Storage refused. There is nothing stored to clear, either.
  }
}
