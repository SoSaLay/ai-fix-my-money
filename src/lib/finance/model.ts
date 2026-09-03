// ============================================================================
// Core financial domain model
// Shapes the data a user enters by hand while working through a learning track.
// Nothing here talks to an external provider — entry is manual by design.
// ============================================================================

export interface IncomeSource {
  name: string
  amount: number
}

export interface FixedExpense {
  name: string
  category?: string
  amount: number
}

export interface VariableExpense {
  category: string
  amount: number
}

export interface Subscription {
  name: string
  amount: number
  frequency?: string
}

export interface AccountEntry {
  name: string
  type: string
  balance: number
  /** Credit limit — revolving accounts only. */
  limit?: number
  institution?: string
}

/** Everything a user has recorded about their money, in one normalised shape. */
export interface FinancialProfile {
  income: {
    total_monthly: number
    sources: IncomeSource[]
  }
  expenses_fixed: FixedExpense[]
  expenses_variable: VariableExpense[]
  subscriptions: Subscription[]
  accounts: AccountEntry[]
  summary: {
    total_income: number
    total_expenses: number
    monthly_savings: number
    savings_rate: number
  }
  imported_at: string
}

/** A single dated money movement the user has recorded. */
export interface LedgerTransaction {
  id: string
  date: string          // YYYY-MM-DD
  description: string
  amount: number        // positive = expense, negative = income/credit
  category: string
  account: string
  is_recurring: boolean
}

// ─── Derived summaries ────────────────────────────────────────────────────────

export interface MonthlyBreakdown {
  month: string       // 'YYYY-MM'
  label: string       // 'February 2026'
  income: number
  expenses: number
  savings: number
  categories: Record<string, number>
  transactionCount: number
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function deriveMonthlyStats(transactions: LedgerTransaction[]): MonthlyBreakdown[] {
  const byMonth: Record<string, LedgerTransaction[]> = {}

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(tx)
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, txs]) => {
      const [year, monthNum] = key.split('-')
      const label = `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year}`

      const nonTransfer = txs.filter(t => t.category !== 'Transfers')
      const income = nonTransfer.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      const expenses = nonTransfer.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)

      const categories: Record<string, number> = {}
      nonTransfer.filter(t => t.amount > 0).forEach(t => {
        categories[t.category] = (categories[t.category] ?? 0) + t.amount
      })

      return {
        month: key,
        label,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savings: Math.round((income - expenses) * 100) / 100,
        categories,
        transactionCount: txs.length,
      }
    })
}

/** An empty profile — the starting point before a user has entered anything. */
export function emptyProfile(): FinancialProfile {
  return {
    income: { total_monthly: 0, sources: [] },
    expenses_fixed: [],
    expenses_variable: [],
    subscriptions: [],
    accounts: [],
    summary: {
      total_income: 0,
      total_expenses: 0,
      monthly_savings: 0,
      savings_rate: 0,
    },
    imported_at: new Date().toISOString(),
  }
}

/** Recompute the summary block from the profile's own entries. */
export function recomputeSummary(profile: FinancialProfile): FinancialProfile {
  const total_income = profile.income.sources.reduce((s, i) => s + i.amount, 0)
    || profile.income.total_monthly

  const total_expenses =
    profile.expenses_fixed.reduce((s, e) => s + e.amount, 0) +
    profile.expenses_variable.reduce((s, e) => s + e.amount, 0) +
    profile.subscriptions.reduce((s, e) => s + e.amount, 0)

  const monthly_savings = total_income - total_expenses

  return {
    ...profile,
    income: { ...profile.income, total_monthly: total_income },
    summary: {
      total_income,
      total_expenses,
      monthly_savings,
      savings_rate: total_income > 0
        ? Math.round((monthly_savings / total_income) * 1000) / 10
        : 0,
    },
  }
}
