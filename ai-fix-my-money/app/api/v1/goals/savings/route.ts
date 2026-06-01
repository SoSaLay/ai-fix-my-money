import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

// GET - Fetch all active savings goals with progress
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    console.log(`[Savings Goals GET] Fetching goals for user: ${user.id}`)

    const { data: goals, error: goalsError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (goalsError) {
      console.error('[Savings Goals GET] Error fetching savings goals:', goalsError)
      return serverError(`Failed to retrieve savings goals: ${goalsError.message}`)
    }

    console.log(`[Savings Goals GET] Found ${goals?.length || 0} goals`)

    // Calculate progress for each goal
    const goalsWithProgress = (goals || []).map(goal => {
      const current = Number(goal.current_amount) || 0
      const target = Number(goal.target_amount) || 0
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

      return {
        id: goal.id,
        name: goal.name,
        target_amount: target,
        current_amount: current,
        allocation_pct: Number(goal.allocation_pct),
        allocation_locked: goal.allocation_locked,
        priority: goal.priority,
        color: goal.color,
        target_date: goal.target_date,
        progress: Math.round(progress * 100) / 100,
        remaining: Math.max(target - current, 0),
        created_at: goal.created_at,
        updated_at: goal.updated_at,
      }
    })

    return ok({
      goals: goalsWithProgress,
      total_goals: goalsWithProgress.length,
      total_allocated: goalsWithProgress.reduce((sum, g) => sum + g.allocation_pct, 0),
    })
  } catch (error) {
    console.error('Get savings goals error:', error)
    return serverError('Failed to retrieve savings goals.')
  }
}

// POST - Create a new savings goal
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const body = await request.json()
    const { name, target_amount, allocation_pct, color, target_date, priority } = body

    if (!name || name.trim().length === 0) {
      return err('Goal name is required.', 400)
    }

    const { data: goal, error: insertError } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        name: name.trim(),
        target_amount: target_amount || null,
        current_amount: 0,
        allocation_pct: allocation_pct || 0,
        color: color || null,
        target_date: target_date || null,
        priority: priority || 1,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create savings goal:', insertError)
      return serverError('Failed to create savings goal.')
    }

    return ok({
      success: true,
      goal: {
        id: goal.id,
        name: goal.name,
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount),
        allocation_pct: Number(goal.allocation_pct),
        color: goal.color,
        target_date: goal.target_date,
        priority: goal.priority,
        created_at: goal.created_at,
        updated_at: goal.updated_at,
      },
      message: 'Savings goal created successfully.'
    })
  } catch (error) {
    console.error('Create savings goal error:', error)
    return serverError('Failed to create savings goal.')
  }
}
