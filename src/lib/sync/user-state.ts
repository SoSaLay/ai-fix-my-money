// ============================================================================
// Keeping browser state and the database in step.
//
// The browser stays the fast path: a page paints from local storage on the
// first frame, then reconciles with the server. That is what keeps the app
// usable on a bad connection, and it is why local storage is still here at all
// — it is a cache now, not the store.
//
// Reconciliation is last-write-wins on a timestamp, per key. Two devices on one
// account is the realistic conflict, not two people editing the same figure at
// once, and a learning app does not earn anything more elaborate.
// ============================================================================

'use client'

import { createClient } from '@/lib/supabase/client'
import { USER_STATE_KEYS, isUserStateKey, type Json, type UserStateKey } from '@/types/supabase'

/** How long writes are held before they go out, so a slider is one request. */
const DEBOUNCE_MS = 800

export interface RemoteRow {
  value: unknown
  updatedAt: string
}

export type RemoteState = Partial<Record<UserStateKey, RemoteRow>>

// ─── Local write times ───────────────────────────────────────────────────────
// The database stamps its own `updated_at`; the browser has to stamp its own or
// there is nothing to compare on the next sign-in.

const metaKey = (userId: string) => `llg_sync_meta::${userId}`

type Meta = Partial<Record<UserStateKey, string>>

export function readMeta(userId: string): Meta {
  try {
    const raw = localStorage.getItem(metaKey(userId))
    return raw ? (JSON.parse(raw) as Meta) : {}
  } catch {
    return {}
  }
}

function stampMeta(userId: string, key: UserStateKey): void {
  try {
    const meta = readMeta(userId)
    meta[key] = new Date().toISOString()
    localStorage.setItem(metaKey(userId), JSON.stringify(meta))
  } catch {
    // Quota or a private window. The write still went out; only the tiebreak
    // is lost, and the server's own timestamp still orders it.
  }
}

// ─── Reading ─────────────────────────────────────────────────────────────────

/**
 * Everything the server holds for this user. A failure returns null rather than
 * an empty object: "we could not reach the server" and "this user has no data"
 * must not look the same, or a network blip reads as a wiped account.
 */
export async function loadRemoteState(): Promise<RemoteState | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_state')
      .select('key, value, updated_at')

    if (error || !data) return null

    const state: RemoteState = {}
    for (const row of data) {
      if (isUserStateKey(row.key)) {
        state[row.key] = { value: row.value, updatedAt: row.updated_at }
      }
    }
    return state
  } catch {
    return null
  }
}

// ─── Writing ─────────────────────────────────────────────────────────────────

const pending = new Map<UserStateKey, unknown>()
let timer: ReturnType<typeof setTimeout> | null = null
let currentUserId: string | null = null

/** Called once the user is known, and again with null on sign-out. */
export function setSyncUser(userId: string | null): void {
  if (userId !== currentUserId) {
    // Never carry one account's unflushed writes into the next one's rows.
    pending.clear()
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  currentUserId = userId
}

async function flush(): Promise<void> {
  timer = null
  const userId = currentUserId
  if (!userId || pending.size === 0) return

  const rows = [...pending.entries()].map(([key, value]) => ({
    user_id: userId,
    key,
    value: value as Json,
  }))
  pending.clear()

  try {
    const supabase = createClient()
    const { error } = await supabase.from('user_state').upsert(rows, { onConflict: 'user_id,key' })
    if (error) {
      // Local storage already has it, so the next write of the same key carries
      // it up. Nothing the learner did is lost by staying quiet here.
      console.warn('[sync] user_state upsert failed', error.message)
    }
  } catch {
    // Offline. Same reasoning.
  }
}

/** Queue one key. Repeated calls inside the debounce window collapse. */
export function queueRemoteWrite(key: string, value: unknown): void {
  if (!currentUserId || !isUserStateKey(key)) return

  pending.set(key, value)
  stampMeta(currentUserId, key)

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { void flush() }, DEBOUNCE_MS)
}

/** Send what is queued now. For a tab going away, or a sign-out. */
export async function flushRemoteWrites(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  await flush()
}

/**
 * A tab that closes mid-debounce would otherwise drop the last edit. `hidden`
 * is the event that actually fires on mobile — `beforeunload` does not when the
 * app is swiped away.
 */
export function installFlushOnLeave(): () => void {
  const onHidden = () => {
    if (document.visibilityState === 'hidden') void flushRemoteWrites()
  }
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('pagehide', onHidden)
  return () => {
    document.removeEventListener('visibilitychange', onHidden)
    window.removeEventListener('pagehide', onHidden)
  }
}

// ─── Reconciliation ──────────────────────────────────────────────────────────

export interface Reconciled {
  /** Keys where the server was newer. Apply these to state. */
  fromRemote: Partial<Record<UserStateKey, unknown>>
  /** Keys the browser holds that the server has not seen, or holds older. */
  toRemote: UserStateKey[]
}

/**
 * Decide, key by key, which side wins. `localValues` is what the browser has
 * right now; a key missing from both sides simply does not appear.
 */
export function reconcile(
  userId: string,
  remote: RemoteState,
  localValues: Partial<Record<UserStateKey, unknown>>,
): Reconciled {
  const meta = readMeta(userId)
  const fromRemote: Partial<Record<UserStateKey, unknown>> = {}
  const toRemote: UserStateKey[] = []

  for (const key of USER_STATE_KEYS) {
    const remoteRow = remote[key]
    const hasLocal = localValues[key] !== undefined
    const localAt = meta[key]

    if (!remoteRow && hasLocal) {
      // First sign-in on this account, or a key added since. Upload it — this
      // is what carries work done before the account existed.
      toRemote.push(key)
      continue
    }
    if (!remoteRow) continue
    if (!hasLocal || !localAt) {
      fromRemote[key] = remoteRow.value
      continue
    }

    if (new Date(remoteRow.updatedAt).getTime() > new Date(localAt).getTime()) {
      fromRemote[key] = remoteRow.value
    } else if (new Date(localAt).getTime() > new Date(remoteRow.updatedAt).getTime()) {
      toRemote.push(key)
    }
  }

  return { fromRemote, toRemote }
}
