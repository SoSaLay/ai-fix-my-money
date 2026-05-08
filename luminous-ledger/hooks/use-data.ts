'use client'

import { useState, useCallback } from 'react'
import { useFinancialData } from '@/contexts/financial-data-context'

// ============================================================================
// Types (kept identical so existing pages need zero changes)
// ============================================================================

export interface Account {
  id: string
  user_id: string
  plaid_item_id: string
  plaid_account_id: string
  name: string
  official_name?: string
  type: string
  subtype?: string
  mask?: string
  current_balance: number
  available_balance?: number
  currency_code: string
  is_active: boolean
  institution_name?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  plaid_transaction_id: string
  merchant_name?: string
  name: string
  amount: number
  transaction_date: string
  authorized_date?: string
  plaid_category?: string
  personal_finance_category?: string
  pending: boolean
  payment_channel?: string
  is_recurring: boolean
  created_at: string
}

export interface SpendingLimitData {
  hasLimit: boolean
  limit: {
    id: string
    amount: number
    period: 'monthly' | 'yearly'
    created_at: string
    updated_at: string
  } | null
  spent: number
  remaining: number
  percentage: number
  period_start?: string
  period_end?: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  allocation_pct: number
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InvestingGoal {
  id: string
  user_id: string
  allocation_pct: number
  risk_profile: 'conservative' | 'moderate' | 'aggressive'
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  spending: {
    monthly_spending: number
    monthly_income: number
    net_cash_flow: number
    spending_limit: {
      limit: number
      spent: number
      remaining: number
      percentage: number
      period: 'monthly' | 'yearly'
    } | null
  }
  wealth: {
    total_assets: number
    total_debts: number
    net_worth: number
  }
  goals: {
    savings: Array<{
      id: string
      name: string
      target_amount: number
      current_amount: number
      allocation_pct: number
      progress: number
    }>
    savings_total_allocated: number
    investing: {
      allocation_pct: number
      risk_profile: string
    } | null
  }
  period: {
    start_date: string
    end_date: string
  }
}

// ============================================================================
// Hook: useDashboardSummary
// ============================================================================

export function useDashboardSummary() {
  const { dashboardSummary } = useFinancialData()

  return {
    data: dashboardSummary,
    loading: false,
    error: null as Error | null,
    refresh: () => {},
  }
}

// ============================================================================
// Hook: useAccounts
// ============================================================================

export function useAccounts() {
  const { assetAccounts } = useFinancialData()

  return {
    accounts: assetAccounts,
    loading: false,
    error: null as Error | null,
    refresh: () => {},
  }
}

// ============================================================================
// Hook: useDebts
// ============================================================================

export function useDebts() {
  const { debtAccounts } = useFinancialData()

  return {
    debts: debtAccounts,
    loading: false,
    error: null as Error | null,
    refresh: () => {},
  }
}

// ============================================================================
// Hook: useTransactions
// ============================================================================

interface UseTransactionsOptions {
  limit?: number
  category?: string
  accountId?: string
  startDate?: string
  endDate?: string
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { transactions: allTxns } = useFinancialData()

  let filtered = allTxns

  if (options.category) {
    filtered = filtered.filter(
      tx => tx.plaid_category === options.category ||
            tx.personal_finance_category === options.category,
    )
  }
  if (options.startDate) {
    filtered = filtered.filter(tx => tx.transaction_date >= options.startDate!)
  }
  if (options.endDate) {
    filtered = filtered.filter(tx => tx.transaction_date <= options.endDate!)
  }
  if (options.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return {
    transactions: filtered,
    loading: false,
    error: null as Error | null,
    refresh: () => {},
  }
}

// ============================================================================
// Hook: useSpendingLimit
// ============================================================================

export function useSpendingLimit() {
  const {
    spendingLimit,
    setSpendingLimit,
    removeSpendingLimit,
    financialData,
  } = useFinancialData()
  const [updating, setUpdating] = useState(false)

  const monthlySpending = financialData?.summary.total_expenses ?? 0

  let data: SpendingLimitData
  if (spendingLimit) {
    const spent = monthlySpending
    const remaining = spendingLimit.amount - spent
    const percentage = spendingLimit.amount > 0
      ? Math.round((spent / spendingLimit.amount) * 100)
      : 0
    data = {
      hasLimit: true,
      limit: spendingLimit,
      spent,
      remaining,
      percentage,
    }
  } else {
    data = {
      hasLimit: false,
      limit: null,
      spent: monthlySpending,
      remaining: 0,
      percentage: 0,
    }
  }

  const updateLimit = useCallback(
    async (amount: number, period: 'monthly' | 'yearly' = 'monthly') => {
      setUpdating(true)
      setSpendingLimit(amount, period)
      setUpdating(false)
      return true
    },
    [setSpendingLimit],
  )

  const deleteLimit = useCallback(async () => {
    setUpdating(true)
    removeSpendingLimit()
    setUpdating(false)
    return true
  }, [removeSpendingLimit])

  return {
    data,
    loading: false,
    error: null as Error | null,
    updating,
    refresh: () => {},
    updateLimit,
    deleteLimit,
  }
}

// ============================================================================
// Hook: useSavingsGoals
// ============================================================================

export function useSavingsGoals() {
  const {
    savingsGoals: goals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
  } = useFinancialData()
  const [updating, setUpdating] = useState(false)

  const createGoal = useCallback(
    async (goal: {
      name: string
      target_amount: number
      allocation_pct?: number
      priority?: number
    }): Promise<string | false> => {
      setUpdating(true)
      const newId = createSavingsGoal({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: 0,
        allocation_pct: goal.allocation_pct ?? 0,
        priority: goal.priority ?? 0,
        is_active: true,
      })
      setUpdating(false)
      return newId
    },
    [createSavingsGoal],
  )

  const updateGoal = useCallback(
    async (id: string, updates: {
      name?: string
      target_amount?: number
      current_amount?: number
      allocation_pct?: number
      priority?: number
    }) => {
      setUpdating(true)
      updateSavingsGoal(id, updates)
      setUpdating(false)
      return true
    },
    [updateSavingsGoal],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      setUpdating(true)
      deleteSavingsGoal(id)
      setUpdating(false)
      return true
    },
    [deleteSavingsGoal],
  )

  return {
    goals,
    loading: false,
    error: null as Error | null,
    updating,
    refresh: () => {},
    createGoal,
    updateGoal,
    deleteGoal,
  }
}

// ============================================================================
// Hook: useInvestingGoal
// ============================================================================

export function useInvestingGoal() {
  const { investingGoal: goal, setInvestingGoal, removeInvestingGoal } = useFinancialData()
  const [updating, setUpdating] = useState(false)

  const updateGoal = useCallback(
    async (data: {
      allocation_pct: number
      risk_profile: 'conservative' | 'moderate' | 'aggressive'
    }) => {
      setUpdating(true)
      setInvestingGoal(data)
      setUpdating(false)
      return true
    },
    [setInvestingGoal],
  )

  const deleteGoal = useCallback(async () => {
    setUpdating(true)
    removeInvestingGoal()
    setUpdating(false)
    return true
  }, [removeInvestingGoal])

  return {
    goal,
    loading: false,
    error: null as Error | null,
    updating,
    refresh: () => {},
    updateGoal,
    deleteGoal,
  }
}
