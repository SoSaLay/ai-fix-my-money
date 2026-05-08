import { type NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  // This route is called by the browser with the user's session cookie —
  // no MCP secret needed. We just verify the user is logged in.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return unauthorized()

  const { data: row, error } = await supabase
    .from('finance_snapshots')
    .select('id, data, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[latest-snapshot]', error)
    return serverError('Failed to fetch snapshot.')
  }

  if (!row) return ok({ snapshot: null, updated_at: null })

  return ok({ snapshot_id: row.id, data: row.data, updated_at: row.updated_at })
}
