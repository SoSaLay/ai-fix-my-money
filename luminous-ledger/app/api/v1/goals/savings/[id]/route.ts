import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

// PUT - Update an existing savings goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  const goalId = params.id

  try {
    const body = await request.json()
    const { name, target_amount, current_amount, allocation_pct, color, target_date, priority } = body

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name.trim()
    if (target_amount !== undefined) updates.target_amount = target_amount
    if (current_amount !== undefined) updates.current_amount = current_amount
    if (allocation_pct !== undefined) updates.allocation_pct = allocation_pct
    if (color !== undefined) updates.color = color
    if (target_date !== undefined) updates.target_date = target_date
    if (priority !== undefined) updates.priority = priority

    const { data: goal, error: updateError } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update savings goal:', updateError)
      return serverError('Failed to update savings goal.')
    }

    if (!goal) {
      return err('Savings goal not found.', 404)
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
        updated_at: goal.updated_at,
      },
      message: 'Savings goal updated successfully.'
    })
  } catch (error) {
    console.error('Update savings goal error:', error)
    return serverError('Failed to update savings goal.')
  }
}

// DELETE - Delete/archive a savings goal
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  const goalId = params.id

  try {
    // Soft delete by setting is_active to false
    const { data: goal, error: deleteError } = await supabase
      .from('savings_goals')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (deleteError) {
      console.error('Failed to delete savings goal:', deleteError)
      return serverError('Failed to delete savings goal.')
    }

    if (!goal) {
      return err('Savings goal not found.', 404)
    }

    return ok({
      success: true,
      message: 'Savings goal deleted successfully.'
    })
  } catch (error) {
    console.error('Delete savings goal error:', error)
    return serverError('Failed to delete savings goal.')
  }
}
