import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ok, unauthorized, serverError } from '@/lib/api/response'

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorized('Authentication required.')
  }

  try {
    const now = new Date()
    // Use a 30-day rolling window so newly-connected accounts always show data.
    // Plaid sandbox provides ~30 days of history, so month-start filtering often
    // returns nothing when the user connects early in the month.
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    console.log(`[Dashboard Summary] Fetching data for user: ${user.id}`)

    // 1. Fetch spending limit
    const { data: spendingLimit, error: limitError } = await supabase
      .from('user_spending_limits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (limitError) {
      console.error('[Dashboard Summary] Error fetching spending limit:', limitError)
    }

    // 2. Calculate monthly spending (expenses = positive amounts)
    const { data: expenseTransactions, error: expenseError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('transaction_date', periodStart.toISOString().split('T')[0])
      .lte('transaction_date', now.toISOString().split('T')[0])
      .gt('amount', 0)

    if (expenseError) {
      console.error('[Dashboard Summary] Error fetching expense transactions:', expenseError)
      throw new Error(`Failed to fetch expense transactions: ${expenseError.message}`)
    }

    const monthlySpending = expenseTransactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0
    console.log(`[Dashboard Summary] Monthly spending: $${monthlySpending}`)

    // 3. Calculate monthly income (negative amounts in Plaid represent income)
    const { data: incomeTransactions, error: incomeError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .gte('transaction_date', periodStart.toISOString().split('T')[0])
      .lte('transaction_date', now.toISOString().split('T')[0])
      .lt('amount', 0)

    if (incomeError) {
      console.error('[Dashboard Summary] Error fetching income transactions:', incomeError)
      throw new Error(`Failed to fetch income transactions: ${incomeError.message}`)
    }

    const monthlyIncome = Math.abs(incomeTransactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0)
    console.log(`[Dashboard Summary] Monthly income: $${monthlyIncome}`)

    // 4. Net cash flow
    const netCashFlow = monthlyIncome - monthlySpending

    // 5. Fetch all accounts for assets calculation
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('type, subtype, current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (accountsError) {
      console.error('[Dashboard Summary] Error fetching accounts:', accountsError)
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`)
    }

    console.log(`[Dashboard Summary] Found ${accounts?.length || 0} accounts`)

    // Separate assets and debts based on account type
    let totalAssets = 0
    let totalDebts = 0

    accounts?.forEach(account => {
      const balance = Number(account.current_balance) || 0
      const accountType = account.type?.toLowerCase() || ''

      // Liability accounts (credit cards, loans, mortgages)
      if (accountType === 'credit' || accountType === 'loan' || accountType === 'mortgage') {
        totalDebts += Math.abs(balance)
      }
      // Depository accounts (checking, savings)
      else if (accountType === 'depository') {
        totalAssets += balance
      }
      // Investment accounts
      else if (accountType === 'investment' || accountType === 'brokerage') {
        totalAssets += balance
      }
      // Other accounts - treat as assets if positive
      else if (balance > 0) {
        totalAssets += balance
      }
    })

    // 6. Fetch savings goals
    const { data: savingsGoals, error: goalsError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (goalsError) {
      console.error('[Dashboard Summary] Error fetching savings goals:', goalsError)
    }

    const savingsGoalsSummary = (savingsGoals || []).map(goal => ({
      id: goal.id,
      name: goal.name,
      target_amount: Number(goal.target_amount) || 0,
      current_amount: Number(goal.current_amount) || 0,
      allocation_pct: Number(goal.allocation_pct) || 0,
      progress: Number(goal.target_amount) > 0
        ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
        : 0,
    }))

    // 7. Fetch investment allocation
    const { data: investingGoal, error: investingError } = await supabase
      .from('investment_allocations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (investingError) {
      console.error('[Dashboard Summary] Error fetching investment allocation:', investingError)
    }

    // 8. Calculate spending limit progress
    const spendingLimitData = spendingLimit ? {
      limit: Number(spendingLimit.amount),
      spent: monthlySpending,
      remaining: Math.max(Number(spendingLimit.amount) - monthlySpending, 0),
      percentage: Number(spendingLimit.amount) > 0
        ? Math.min((monthlySpending / Number(spendingLimit.amount)) * 100, 100)
        : 0,
      period: spendingLimit.period,
    } : null

    // 9. Return comprehensive summary
    console.log('[Dashboard Summary] Successfully compiled dashboard data')
    return ok({
      spending: {
        monthly_spending: monthlySpending,
        monthly_income: monthlyIncome,
        net_cash_flow: netCashFlow,
        spending_limit: spendingLimitData,
      },
      wealth: {
        total_assets: totalAssets,
        total_debts: totalDebts,
        net_worth: totalAssets - totalDebts,
      },
      goals: {
        savings: savingsGoalsSummary,
        savings_total_allocated: savingsGoalsSummary.reduce((sum, g) => sum + g.allocation_pct, 0),
        investing: investingGoal ? {
          allocation_pct: Number(investingGoal.allocation_pct),
          risk_profile: investingGoal.risk_profile,
        } : null,
      },
      period: {
        start_date: periodStart.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
      },
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return serverError('Failed to retrieve dashboard summary.')
  }
}
