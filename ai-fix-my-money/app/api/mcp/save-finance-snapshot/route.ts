import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parsePerplexityData } from '@/lib/perplexity/parser'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

function authenticate(request: NextRequest): boolean {
  const secret = process.env.MCP_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  if (!authenticate(request)) return unauthorized()

  const userId = process.env.MCP_TARGET_USER_ID
  if (!userId) return serverError('MCP_TARGET_USER_ID is not configured.')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('Invalid JSON body', 400)
  }

  const result = parsePerplexityData(body)
  if (!result.success || !result.data) {
    return err(`Validation failed: ${result.errors.join(', ')}`, 422)
  }

  const now = new Date().toISOString()
  const supabase = getServiceClient()

  const { data: row, error } = await supabase
    .from('finance_snapshots')
    .upsert(
      { user_id: userId, data: result.data, updated_at: now },
      { onConflict: 'user_id' },
    )
    .select('id, updated_at')
    .single()

  if (error) {
    console.error('[save-finance-snapshot]', error)
    return serverError('Database write failed.')
  }

  return ok({
    success: true,
    snapshot_id: row.id,
    updated_at: row.updated_at,
    message: 'Finance dashboard updated successfully.',
    warnings: result.warnings,
  })
}
