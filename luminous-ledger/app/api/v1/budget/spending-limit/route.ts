import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError, err } from '@/lib/api/response'

// GET - Fetch current spending limit and calculate progress
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    console.log(`[Spending Limit GET] Fetching limit for user: ${user.id}`)

    // Fetch spending limit
    const { data: limit, error: limitError } = await supabase
      .from('user_spending_limits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (limitError) {
      console.error('[Spending Limit GET] Error fetching spending limit:', limitError)
      return serverError(`Failed to retrieve spending limit: ${limitError.message}`)
    }

    if (!limit) {
      return ok({
        hasLimit: false,
        limit: null,
        spent: 0,
        remaining: 0,
        percentage: 0
      })
    }

    // Calculate current spending for the period
    const now = new Date()
    let startDate: Date

    if (limit.period === 'monthly') {
      // 30-day rolling window instead of calendar month start, so newly-connected
      // accounts always show meaningful spending data
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      // Start of current year
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Fetch total spending (sum of positive amounts = expenses), include pending
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', now.toISOString().split('T')[0])
      .gt('amount', 0) // Only expenses (positive amounts in Plaid)

    if (txError) {
      console.error('[Spending Limit GET] Error fetching transactions:', txError)
      return serverError(`Failed to calculate spending: ${txError.message}`)
    }

    console.log(`[Spending Limit GET] Found ${transactions?.length || 0} transactions`)

    const totalSpent = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0
    const remaining = Number(limit.amount) - totalSpent
    const percentage = Number(limit.amount) > 0
      ? Math.min((totalSpent / Number(limit.amount)) * 100, 100)
      : 0

    return ok({
      hasLimit: true,
      limit: {
        id: limit.id,
        amount: Number(limit.amount),
        period: limit.period,
        created_at: limit.created_at,
        updated_at: limit.updated_at,
      },
      spent: totalSpent,
      remaining: Math.max(remaining, 0),
      percentage: Math.round(percentage * 100) / 100,
      period_start: startDate.toISOString().split('T')[0],
      period_end: now.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Get spending limit error:', error)
    return serverError('Failed to retrieve spending limit.')
  }
}

// POST - Create or update spending limit
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  let amount: number
  let period: 'monthly' | 'yearly'

  try {
    const body = await request.json()
    amount = body.amount
    period = body.period || 'monthly'

    if (!amount || amount <= 0) {
      return err('Amount must be a positive number.', 400)
    }

    if (!['monthly', 'yearly'].includes(period)) {
      return err('Period must be either "monthly" or "yearly".', 400)
    }
  } catch {
    return err('Invalid request body. Expected { amount: number, period: "monthly" | "yearly" }', 400)
  }

  try {
    // Upsert spending limit (insert or update if exists)
    const { data: limit, error: upsertError } = await supabase
      .from('user_spending_limits')
      .upsert({
        user_id: user.id,
        amount,
        period,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Failed to upsert spending limit:', upsertError)
      return serverError('Failed to save spending limit.')
    }

    return ok({
      success: true,
      limit: {
        id: limit.id,
        amount: Number(limit.amount),
        period: limit.period,
        created_at: limit.created_at,
        updated_at: limit.updated_at,
      },
      message: 'Spending limit saved successfully.'
    })
  } catch (error) {
    console.error('Set spending limit error:', error)
    return serverError('Failed to save spending limit.')
  }
}

// DELETE - Remove spending limit
export async function DELETE(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const { error: deleteError } = await supabase
      .from('user_spending_limits')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete spending limit:', deleteError)
      return serverError('Failed to remove spending limit.')
    }

    return ok({
      success: true,
      message: 'Spending limit removed successfully.'
    })
  } catch (error) {
    console.error('Delete spending limit error:', error)
    return serverError('Failed to remove spending limit.')
  }
}
