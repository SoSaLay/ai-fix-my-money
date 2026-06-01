import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

// GET - Fetch current investment allocation
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    console.log(`[Investing Goal GET] Fetching allocation for user: ${user.id}`)

    const { data: allocation, error: allocationError } = await supabase
      .from('investment_allocations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (allocationError) {
      console.error('[Investing Goal GET] Error fetching investment allocation:', allocationError)
      return serverError(`Failed to retrieve investment allocation: ${allocationError.message}`)
    }

    console.log(`[Investing Goal GET] Allocation found:`, allocation ? 'Yes' : 'No')

    if (!allocation) {
      return ok({
        hasAllocation: false,
        allocation: null,
      })
    }

    return ok({
      hasAllocation: true,
      allocation: {
        id: allocation.id,
        allocation_pct: Number(allocation.allocation_pct),
        risk_profile: allocation.risk_profile,
        allocation_locked: allocation.allocation_locked,
        locked_at: allocation.locked_at,
        created_at: allocation.created_at,
        updated_at: allocation.updated_at,
      },
    })
  } catch (error) {
    console.error('Get investment allocation error:', error)
    return serverError('Failed to retrieve investment allocation.')
  }
}

// POST - Create or update investment allocation
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const body = await request.json()
    const { allocation_pct, risk_profile } = body

    if (allocation_pct === undefined || allocation_pct < 0 || allocation_pct > 100) {
      return err('Allocation percentage must be between 0 and 100.', 400)
    }

    if (risk_profile && !['conservative', 'moderate', 'aggressive'].includes(risk_profile)) {
      return err('Risk profile must be "conservative", "moderate", or "aggressive".', 400)
    }

    // Upsert investment allocation
    const { data: allocation, error: upsertError } = await supabase
      .from('investment_allocations')
      .upsert({
        user_id: user.id,
        allocation_pct,
        risk_profile: risk_profile || 'moderate',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Failed to upsert investment allocation:', upsertError)
      return serverError('Failed to save investment allocation.')
    }

    return ok({
      success: true,
      allocation: {
        id: allocation.id,
        allocation_pct: Number(allocation.allocation_pct),
        risk_profile: allocation.risk_profile,
        allocation_locked: allocation.allocation_locked,
        created_at: allocation.created_at,
        updated_at: allocation.updated_at,
      },
      message: 'Investment allocation saved successfully.'
    })
  } catch (error) {
    console.error('Set investment allocation error:', error)
    return serverError('Failed to save investment allocation.')
  }
}

// DELETE - Remove investment allocation
export async function DELETE(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const { error: deleteError } = await supabase
      .from('investment_allocations')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete investment allocation:', deleteError)
      return serverError('Failed to remove investment allocation.')
    }

    return ok({
      success: true,
      message: 'Investment allocation removed successfully.'
    })
  } catch (error) {
    console.error('Delete investment allocation error:', error)
    return serverError('Failed to remove investment allocation.')
  }
}
