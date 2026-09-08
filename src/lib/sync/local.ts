// ============================================================================
// The local half of the cache.
//
// Keys are scoped by user id, so two accounts on one laptop do not read each
// other's figures. Signed out — or with no Supabase project configured — the
// bare key is used, which is what every existing install already holds.
// ============================================================================

'use client'

/** `llg_ledger` → `llg_ledger::<uuid>` once someone is signed in. */
export function scopedKey(base: string, userId: string | null): string {
  return userId ? `${base}::${userId}` : base
}

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
    // ignore quota errors
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * The unscoped keys, read once when an account first signs in on a browser that
 * was used signed out. Without this, creating an account looks like losing
 * everything you just entered.
 */
export function readLegacy<T>(base: string): T | null {
  return readLocal<T>(base)
}

const ADOPTED_FLAG = 'llg_legacy_adopted'

export function legacyAdopted(userId: string): boolean {
  try {
    const raw = localStorage.getItem(ADOPTED_FLAG)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    return list.includes(userId)
  } catch {
    return true // Cannot tell — do not re-import and risk overwriting.
  }
}

export function markLegacyAdopted(userId: string): void {
  try {
    const raw = localStorage.getItem(ADOPTED_FLAG)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    if (!list.includes(userId)) {
      list.push(userId)
      localStorage.setItem(ADOPTED_FLAG, JSON.stringify(list))
    }
  } catch {
    // ignore
  }
}
