import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database, SavingsGoalRow } from '@/types/database'
import { ok, serverError } from '@/lib/api/response'
import { recordUsage } from '@/lib/api/usage'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const start     = Date.now()
  const apiKeyId  = request.headers.get('x-api-key-id')!
  const userId    = request.headers.get('x-api-user-id')

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const userAgent = request.headers.get('user-agent') ?? undefined

  if (!userId) {
    await recordUsage({ apiKeyId, endpoint: '/api/v1/savings', method: 'GET', statusCode: 403, responseTimeMs: Date.now() - start, ipAddress: ip, userAgent })
    return serverError('API key is not associated with a user account.')
  }

  try {
    const supabase = getServiceClient()

    const { data: goalsRaw, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) throw error

    const goals = (goalsRaw ?? []) as SavingsGoalRow[]

    const goalsWithProgress = goals.map((goal) => {
      const pct =
        goal.target_amount && goal.target_amount > 0
          ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
          : null

      return {
        id:                goal.id,
        name:              goal.name,
        current_amount:    goal.current_amount,
        target_amount:     goal.target_amount,
        progress_pct:      pct,
        allocation_pct:    goal.allocation_pct,
        allocation_locked: goal.allocation_locked,
        target_date:       goal.target_date,
        color:             goal.color,
        priority:          goal.priority,
        created_at:        goal.created_at,
      }
    })

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/savings',
      method:         'GET',
      statusCode:     200,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return ok(goalsWithProgress)
  } catch (err) {
    console.error('/api/v1/savings error:', err)

    await recordUsage({
      apiKeyId,
      endpoint:       '/api/v1/savings',
      method:         'GET',
      statusCode:     500,
      responseTimeMs: Date.now() - start,
      ipAddress:      ip,
      userAgent,
    })

    return serverError('Failed to fetch savings goals.')
  }
}
