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
