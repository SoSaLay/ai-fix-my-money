// ============================================================================
// Reading the Supabase settings.
//
// The two public values are public on purpose — the anon key is designed to sit
// in a browser bundle, and row-level security, not secrecy, is what protects
// the data. Missing values throw here rather than at the first query, because a
// client built from `undefined` fails with a network error that looks like an
// outage.
// ============================================================================

export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. See DEPLOYMENT.md §6.2.')
  }
  return value
}

export function supabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. See DEPLOYMENT.md §6.2.')
  }
  return value
}

/**
 * Whether auth is configured at all. Lets the app run locally without a
 * Supabase project — the middleware then leaves every route open, which is the
 * behaviour this repo had before accounts existed.
 */
export function authConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
