import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { Database, ApiKeyRow } from '@/types/database'

// Service role client for API key lookups (no RLS)
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export function generateApiKey(): { raw: string; hashed: string; prefix: string } {
  const raw    = `ll_${crypto.randomUUID().replace(/-/g, '')}`
  const hashed = hashApiKey(raw)
  const prefix = raw.slice(0, 8)
  return { raw, hashed, prefix }
}

export async function validateApiKey(rawKey: string) {
  const supabase = getServiceClient()
  const hashed   = hashApiKey(rawKey)

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
