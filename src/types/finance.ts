// Core domain types used across the app

export interface MonthlyStats {
  income: number
  spending: number
  netCashFlow: number
  spendingVsLastMonth: number // percentage change
}

export interface SpendingByCategory {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  amount: number
  pct: number
}

export interface DailySpending {
  date: string
  dayLabel: string // 'Mon', 'Tue' etc.
  amount: number
}

export interface AllocationSummary {
  netCashFlow: number
  savingsAllocated: number
  investingAllocated: number
  available: number
}

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'
export type TransferType = 'auto_allocation' | 'interest' | 'manual' | 'investment'
export type QuickSelectPct = 5 | 10 | 20 | 50
