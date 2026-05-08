import { createClient } from '@supabase/supabase-js'
import type { Database, ApiKeyRow } from '@/types/database'

// Service role client for API key lookups (no RLS)
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Uses Web Crypto API (works in both Edge Runtime and Node.js)
export async function hashApiKey(rawKey: string): Promise<string> {
  const encoded = new TextEncoder().encode(rawKey)
  const buffer  = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateApiKey(): Promise<{ raw: string; hashed: string; prefix: string }> {
  const raw    = `ll_${crypto.randomUUID().replace(/-/g, '')}`
  const hashed = await hashApiKey(raw)
  const prefix = raw.slice(0, 8)
  return { raw, hashed, prefix }
}

export async function validateApiKey(rawKey: string) {
  const supabase = getServiceClient()
  const hashed   = await hashApiKey(rawKey)

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', hashed)
    .eq('is_active', true)
    .single()

  const apiKey = data as ApiKeyRow | null

  if (error || !apiKey) return { valid: false, reason: 'invalid' } as const

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, reason: 'expired' } as const
  }

  if (apiKey.requests_used >= apiKey.requests_limit) {
    return { valid: false, reason: 'limit_exceeded', used: apiKey.requests_used, limit: apiKey.requests_limit } as const
  }

  return { valid: true, apiKey } as const
}
