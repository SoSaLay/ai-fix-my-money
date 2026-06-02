'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useSnapshotPoller } from '@/hooks/use-snapshot-poller'
import {
  parsePerplexityData,
  type ParsedFinancialData,
  type ParseResult,
} from '@/lib/perplexity/parser'
import {
  parseStatement,
  detectRecurring,
  deriveMonthlyStats,
  type ParsedStatement,
  type StatementMonth,
  type StatementTransaction,
  type StatementImportResult,
} from '@/lib/statement-parser/index'
import type {
  Account,
  Transaction,
  DashboardSummary,
  SpendingLimitData,
  SavingsGoal,
  InvestingGoal,
} from '@/hooks/use-data'

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY_FINANCIAL = 'llg_financial_data'
const STORAGE_KEY_SPENDING_LIMIT = 'llg_spending_limit'
const STORAGE_KEY_SAVINGS_GOALS = 'llg_savings_goals'
const STORAGE_KEY_INVESTING_GOAL = 'llg_investing_goal'
const STORAGE_KEY_GENERAL_SAVINGS = 'llg_general_savings'
const STORAGE_KEY_STATEMENTS = 'llg_statements'
const STORAGE_KEY_MANUAL_ACCOUNTS = 'llg_manual_accounts'

// Storage key helper — no user scoping in local-only mode
const sk = (base: string) => base

// ============================================================================
// Manual Account type
// ============================================================================

export interface ManualAccount {
  id: string
  name: string
  /** e.g. 'checking', 'roth_ira', 'credit_card' */
  type: string
  balance: number
  createdAt: string
}

// ============================================================================
// Local persistence helpers
// ============================================================================

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

// ============================================================================
// Transaction generation
// Synthetic transactions derived from Perplexity expense data
// ============================================================================

function generateTransactions(data: ParsedFinancialData): Transaction[] {
  const txns: Transaction[] = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  let seq = 1

  const makeDate = (dayOffset: number): string => {
    const d = new Date(year, month, Math.min(dayOffset + 1, 28))
    return d.toISOString().split('T')[0]
  }

  const makeId = (prefix: string) => `${prefix}_${seq++}`

  // Fixed expenses — dated 1st–5th of month
  data.expenses_fixed.forEach((exp, i) => {
    const id = makeId('fixed')
    txns.push({
      id,
      user_id: 'local',
      account_id: 'local',
      plaid_transaction_id: id,
      name: exp.name,
      merchant_name: exp.name,
      amount: exp.amount,
      transaction_date: makeDate(i % 5),
      plaid_category: exp.category ?? 'Housing',
      personal_finance_category: exp.category ?? 'Housing',
      pending: false,
      is_recurring: true,
      created_at: new Date().toISOString(),
    })
  })

  // Subscriptions — dated 1st–7th, marked recurring
  data.subscriptions.forEach((sub, i) => {
    const id = makeId('sub')
    txns.push({
      id,
      user_id: 'local',
      account_id: 'local',
      plaid_transaction_id: id,
      name: sub.name,
      merchant_name: sub.name,
      amount: sub.amount,
      transaction_date: makeDate(i % 7),
      plaid_category: 'Subscriptions',
      personal_finance_category: 'Subscriptions',
      pending: false,
      is_recurring: true,
      created_at: new Date().toISOString(),
    })
  })

  // Variable expenses — spread through the month
  data.expenses_variable.forEach((exp, i) => {
    const id = makeId('var')
    txns.push({
      id,
      user_id: 'local',
      account_id: 'local',
      plaid_transaction_id: id,
      name: exp.category,
      merchant_name: exp.category,
      amount: exp.amount,
      transaction_date: makeDate(8 + (i * 4) % 18),
      plaid_category: exp.category,
      personal_finance_category: exp.category,
      pending: false,
      is_recurring: false,
      created_at: new Date().toISOString(),
    })
  })

  return txns.sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime(),
  )
}

// ============================================================================
// Account mapping
// ============================================================================

// Type name is the primary signal; negative balance is only a fallback for unknown types.
const ASSET_TYPE_KEYWORDS = [
  'checking', 'savings', 'depository', 'investment', 'brokerage',
  'cd', 'money market', 'money_market', 'cash', 'bank', 'deposit',
  'retirement', '401k', 'ira',
]
const DEBT_TYPE_KEYWORDS = [
  'credit', 'loan', 'mortgage', 'auto', 'student', 'debt',
  'liability', 'heloc', 'line of credit', 'credit_card',
]

function classifyAccount(rawType: string, balance: number): 'asset' | 'debt' {
  const t = rawType.toLowerCase()
  if (ASSET_TYPE_KEYWORDS.some(k => t.includes(k))) return 'asset'
  if (DEBT_TYPE_KEYWORDS.some(k => t.includes(k))) return 'debt'
  // Unknown type — fall back to balance sign
  return balance < 0 ? 'debt' : 'asset'
}

function mapAccounts(data: ParsedFinancialData): { assets: Account[]; debts: Account[] } {
  const assets: Account[] = []
  const debts: Account[] = []
  const now = new Date().toISOString()

  data.accounts.forEach((acc, i) => {
    const kind = classifyAccount(acc.type, acc.balance)

    const mapped: Account = {
      id: `acc_${i}`,
      user_id: 'local',
      plaid_item_id: 'local',
      plaid_account_id: `acc_${i}`,
      name: acc.name,
      official_name: acc.name,
      type: kind === 'debt' ? 'credit' : 'depository',
      subtype: acc.type.toLowerCase(),
      mask: undefined,
      current_balance: Math.abs(acc.balance),
      available_balance: Math.abs(acc.balance),
      currency_code: 'USD',
      is_active: true,
      institution_name: acc.institution ?? 'Your Bank',
      created_at: now,
      updated_at: now,
    }

    if (kind === 'debt') {
      debts.push(mapped)
    } else {
      assets.push(mapped)
    }
  })

  return { assets, debts }
}

// ============================================================================
// Account derivation from statement groups
// One account per user-named group (not one per file).
// ============================================================================

function deriveAccountsFromStatementGroups(stmts: ParsedStatement[]): { assets: Account[]; debts: Account[] } {
  const assets: Account[] = []
  const debts: Account[] = []

  // Group statements by their accountName tag (falls back to filename for untagged uploads)
  const groups: Record<string, ParsedStatement[]> = {}
  for (const stmt of stmts) {
    const key = stmt.accountName ?? stmt.filename
    if (!groups[key]) groups[key] = []
    groups[key].push(stmt)
  }

  for (const [groupName, groupStmts] of Object.entries(groups)) {
    const allTxns = groupStmts
      .flatMap(s => s.transactions)
      .filter(t => t.category !== 'Transfers')

    const totalExpenses = allTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const totalCredits  = allTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

    // If credits are less than 40% of expenses → mostly spending → credit card
    const isCreditCard = totalCredits / (totalExpenses || 1) < 0.4

    // Average monthly net across all months represented in the statements
    const byMonth: Record<string, { expenses: number; credits: number }> = {}
    for (const tx of allTxns) {
      const month = tx.date.slice(0, 7) // 'YYYY-MM'
      if (!byMonth[month]) byMonth[month] = { expenses: 0, credits: 0 }
      if (tx.amount > 0) byMonth[month].expenses += tx.amount
      else byMonth[month].credits += Math.abs(tx.amount)
    }
    const months = Object.values(byMonth)
    const monthCount = months.length || 1
    const avgMonthlyNet = isCreditCard
      ? months.reduce((s, m) => s + (m.expenses - m.credits), 0) / monthCount
      : months.reduce((s, m) => s + (m.credits - m.expenses), 0) / monthCount
    const netBalance = Math.round(avgMonthlyNet * 100) / 100

    const bank = groupStmts[0].bank
    const safeKey = groupName.replace(/[^a-z0-9]/gi, '_')

    const account: Account = {
      id: `stmt_grp_${safeKey}`,
      user_id: 'local',
      plaid_item_id: 'statement',
      plaid_account_id: `stmt_grp_${safeKey}`,
      name: groupName,
      official_name: groupName,
      type: isCreditCard ? 'credit' : 'depository',
      subtype: isCreditCard ? 'credit card' : 'checking',
      current_balance: netBalance,
      currency_code: 'USD',
      is_active: true,
      institution_name: bank,
      created_at: groupStmts[0].importedAt,
      updated_at: groupStmts[groupStmts.length - 1].importedAt,
    }

    if (isCreditCard) debts.push(account)
    else assets.push(account)
  }

  return { assets, debts }
}

// ============================================================================
// DashboardSummary derivation
// ============================================================================

function deriveDashboardSummary(
  data: ParsedFinancialData,
  spendingLimit: StoredSpendingLimit | null,
  savingsGoals: SavingsGoal[],
  investingGoal: InvestingGoal | null,
  generalSavingsPct: number,
): DashboardSummary {
  const monthlyIncome = data.income.total_monthly
  const monthlySpending = data.summary.total_expenses
  const netCashFlow = monthlyIncome - monthlySpending

  const { assets, debts } = mapAccounts(data)
  const totalAssets = assets.reduce((s, a) => s + a.current_balance, 0)
  const totalDebts = debts.reduce((s, d) => s + d.current_balance, 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const goalsSummary: DashboardSummary['goals']['savings'] = savingsGoals.map(g => ({
    id: g.id,
    name: g.name,
    target_amount: g.target_amount,
    current_amount: g.current_amount,
    allocation_pct: g.allocation_pct,
    progress: g.target_amount > 0
      ? Math.round((g.current_amount / g.target_amount) * 100)
      : 0,
  }))

  const savingsTotalAllocated = savingsGoals.reduce((s, g) => s + g.allocation_pct, 0) + generalSavingsPct

  let spendingLimitSummary: DashboardSummary['spending']['spending_limit'] = null
  if (spendingLimit) {
    const spent = monthlySpending
    const remaining = spendingLimit.amount - spent
    const percentage = spendingLimit.amount > 0
      ? Math.round((spent / spendingLimit.amount) * 100)
      : 0
    spendingLimitSummary = {
      limit: spendingLimit.amount,
      spent,
      remaining,
      percentage,
      period: spendingLimit.period,
    }
  }

  return {
    spending: {
      monthly_spending: monthlySpending,
      monthly_income: monthlyIncome,
      net_cash_flow: netCashFlow,
      spending_limit: spendingLimitSummary,
    },
    wealth: {
      total_assets: totalAssets,
      total_debts: totalDebts,
      net_worth: totalAssets - totalDebts,
    },
    goals: {
      savings: goalsSummary,
      savings_total_allocated: savingsTotalAllocated,
      investing: investingGoal
        ? { allocation_pct: investingGoal.allocation_pct, risk_profile: investingGoal.risk_profile }
        : null,
    },
    period: {
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: endOfMonth.toISOString().split('T')[0],
    },
  }
}

// ============================================================================
// Stored shapes for settings
// ============================================================================

interface StoredSpendingLimit {
  id: string
  amount: number
  period: 'monthly' | 'yearly'
  created_at: string
  updated_at: string
}

// ============================================================================
// Context Shape
// ============================================================================

interface FinancialDataContextValue {
  // Raw imported data
  financialData: ParsedFinancialData | null
  hasData: boolean

  // MCP real-time sync state
  isRefreshing: boolean
  lastMcpUpdate: string | null

  // Import / clear
  importData: (raw: unknown) => ParseResult
  clearData: () => void

  // Reset all allocation settings to zero
  resetAllocations: () => void

  // Derived data (computed, ready for hooks to consume)
  dashboardSummary: DashboardSummary | null
  assetAccounts: Account[]
  debtAccounts: Account[]
  transactions: Transaction[]

  // Spending limit (localStorage CRUD)
  spendingLimit: StoredSpendingLimit | null
  setSpendingLimit: (amount: number, period?: 'monthly' | 'yearly') => void
  removeSpendingLimit: () => void

  // Savings goals (localStorage CRUD)
  savingsGoals: SavingsGoal[]
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => string
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void
  deleteSavingsGoal: (id: string) => void

  // Investing goal (localStorage CRUD)
  investingGoal: InvestingGoal | null
  setInvestingGoal: (data: { allocation_pct: number; risk_profile: 'conservative' | 'moderate' | 'aggressive' }) => void
  removeInvestingGoal: () => void

  // General savings (locked % of net cash flow, separate from goal allocations)
  generalSavingsPct: number
  setGeneralSavings: (pct: number) => void

  // Statement uploads (CSV / OFX historical data)
  statements: ParsedStatement[]
  statementMonths: StatementMonth[]
  importStatement: (text: string, filename: string, accountName?: string) => StatementImportResult
  removeStatement: (filename: string) => void
  removeStatementGroup: (accountName: string) => void

  // Manually entered accounts
  manualAccounts: ManualAccount[]
  addManualAccount: (account: Omit<ManualAccount, 'id' | 'createdAt'>) => ManualAccount
  updateManualAccount: (id: string, updates: Partial<Pick<ManualAccount, 'name' | 'type' | 'balance'>>) => void
  removeManualAccount: (id: string) => void

  // Edit / remove accounts that came from the financialData (Perplexity / JSON) import
  updateParsedAccount: (accId: string, updates: { name?: string; balance?: number }) => void
  removeParsedAccount: (accId: string) => void

  // Subscription CRUD (operates directly on financialData.subscriptions)
  addParsedSubscription: (sub: { name: string; amount: number; frequency?: string }) => void
  updateParsedSubscription: (index: number, updates: { name?: string; amount?: number; frequency?: string }) => void
  removeParsedSubscription: (index: number) => void
}

// ============================================================================
// Context
// ============================================================================

const FinancialDataContext = createContext<FinancialDataContextValue | null>(null)

// ─── Statement transaction → Transaction mapper ───────────────────────────────

function stmtTxToTransaction(tx: StatementTransaction): Transaction {
  return {
    id: tx.id,
    user_id: 'local',
    account_id: tx.account,
    plaid_transaction_id: tx.id,
    merchant_name: tx.description,
    name: tx.description,
    amount: tx.amount,
    transaction_date: tx.date,
    plaid_category: tx.category,
    personal_finance_category: tx.category,
    pending: false,
    is_recurring: tx.is_recurring,
    created_at: new Date().toISOString(),
  }
}

// ─── DashboardSummary derived from statement months ───────────────────────────

function deriveSummaryFromStatementMonths(
  months: StatementMonth[],
  spendingLimit: { amount: number; period: 'monthly' | 'yearly' } | null,
  savingsGoals: SavingsGoal[],
  investingGoal: InvestingGoal | null,
  generalSavingsPct: number,
): DashboardSummary | null {
  if (months.length === 0) return null

  const latest = months[months.length - 1]
  const monthlyIncome = latest.income
  const monthlySpending = latest.expenses
  const netCashFlow = latest.savings

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const goalsSummary = savingsGoals.map(g => ({
    id: g.id,
    name: g.name,
    target_amount: g.target_amount,
    current_amount: g.current_amount,
    allocation_pct: g.allocation_pct,
    progress: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
  }))

  const savingsTotalAllocated = savingsGoals.reduce((s, g) => s + g.allocation_pct, 0) + generalSavingsPct

  let spendingLimitSummary: DashboardSummary['spending']['spending_limit'] = null
  if (spendingLimit) {
    const spent = monthlySpending
    const remaining = spendingLimit.amount - spent
    spendingLimitSummary = {
      limit: spendingLimit.amount,
      spent,
      remaining,
      percentage: spendingLimit.amount > 0 ? Math.round((spent / spendingLimit.amount) * 100) : 0,
      period: spendingLimit.period,
    }
  }

  return {
    spending: {
      monthly_spending: monthlySpending,
      monthly_income: monthlyIncome,
      net_cash_flow: netCashFlow,
      spending_limit: spendingLimitSummary,
    },
    wealth: { total_assets: 0, total_debts: 0, net_worth: 0 },
    goals: {
      savings: goalsSummary,
      savings_total_allocated: savingsTotalAllocated,
      investing: investingGoal
        ? { allocation_pct: investingGoal.allocation_pct, risk_profile: investingGoal.risk_profile }
        : null,
    },
    period: {
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: endOfMonth.toISOString().split('T')[0],
    },
  }
}

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [financialData, setFinancialData] = useState<ParsedFinancialData | null>(null)
  const [spendingLimit, setSpendingLimitState] = useState<StoredSpendingLimit | null>(null)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [investingGoal, setInvestingGoalState] = useState<InvestingGoal | null>(null)
  const [generalSavingsPct, setGeneralSavingsPctState] = useState<number>(0)
  const [statements, setStatements] = useState<ParsedStatement[]>([])
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastMcpUpdate, setLastMcpUpdate] = useState<string | null>(null)

  // Load all state from localStorage once on mount
  useEffect(() => {
    setFinancialData(readStorage<ParsedFinancialData>(STORAGE_KEY_FINANCIAL))
    setSpendingLimitState(readStorage<StoredSpendingLimit>(STORAGE_KEY_SPENDING_LIMIT))
    setSavingsGoals(readStorage<SavingsGoal[]>(STORAGE_KEY_SAVINGS_GOALS) ?? [])
    setInvestingGoalState(readStorage<InvestingGoal>(STORAGE_KEY_INVESTING_GOAL))
    setGeneralSavingsPctState(readStorage<number>(STORAGE_KEY_GENERAL_SAVINGS) ?? 0)
    setStatements(readStorage<ParsedStatement[]>(STORAGE_KEY_STATEMENTS) ?? [])
    setManualAccounts(readStorage<ManualAccount[]>(STORAGE_KEY_MANUAL_ACCOUNTS) ?? [])
  }, [])

  // ── MCP snapshot poller ───────────────────────────────────────────────────
  useSnapshotPoller({
    enabled: true,
    onRefreshing: setIsRefreshing,
    onNewSnapshot: (data, updatedAt) => {
      setFinancialData(data)
      writeStorage(sk(STORAGE_KEY_FINANCIAL), data)
      setLastMcpUpdate(updatedAt)
    },
  })

  // ── Import ────────────────────────────────────────────────────────────────
  const importData = useCallback((raw: unknown): ParseResult => {
    const result = parsePerplexityData(raw)
    if (result.success && result.data) {
      setFinancialData(result.data)
      writeStorage(sk(STORAGE_KEY_FINANCIAL), result.data)
    }
    return result
  }, [])

  const clearData = useCallback(() => {
    setFinancialData(null)
    setSpendingLimitState(null)
    setSavingsGoals([])
    setInvestingGoalState(null)
    setGeneralSavingsPctState(0)
    setStatements([])
    setManualAccounts([])
    localStorage.removeItem(sk(STORAGE_KEY_FINANCIAL))
    localStorage.removeItem(sk(STORAGE_KEY_SPENDING_LIMIT))
    localStorage.removeItem(sk(STORAGE_KEY_SAVINGS_GOALS))
    localStorage.removeItem(sk(STORAGE_KEY_INVESTING_GOAL))
    localStorage.removeItem(sk(STORAGE_KEY_GENERAL_SAVINGS))
    localStorage.removeItem(sk(STORAGE_KEY_STATEMENTS))
    localStorage.removeItem(sk(STORAGE_KEY_MANUAL_ACCOUNTS))
  }, [])

  // ── Spending limit ────────────────────────────────────────────────────────
  const setSpendingLimit = useCallback(
    (amount: number, period: 'monthly' | 'yearly' = 'monthly') => {
      const now = new Date().toISOString()
      const record: StoredSpendingLimit = {
        id: `sl_${Date.now()}`,
        amount,
        period,
        created_at: spendingLimit?.created_at ?? now,
        updated_at: now,
      }
      setSpendingLimitState(record)
      writeStorage(sk(STORAGE_KEY_SPENDING_LIMIT), record)
    },
    [spendingLimit],
  )

  const removeSpendingLimit = useCallback(() => {
    setSpendingLimitState(null)
    localStorage.removeItem(sk(STORAGE_KEY_SPENDING_LIMIT))
  }, [])

  // ── Savings goals ─────────────────────────────────────────────────────────
  const createSavingsGoal = useCallback(
    (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): string => {
      const now = new Date().toISOString()
      const newGoal: SavingsGoal = {
        ...goal,
        id: `sg_${Date.now()}`,
        user_id: 'local',
        created_at: now,
        updated_at: now,
      }
      setSavingsGoals(prev => {
        const next = [...prev, newGoal]
        writeStorage(sk(STORAGE_KEY_SAVINGS_GOALS), next)
        return next
      })
      return newGoal.id
    },
    [],
  )

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(prev => {
      const next = prev.map(g =>
        g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g,
      )
      writeStorage(sk(STORAGE_KEY_SAVINGS_GOALS), next)
      return next
    })
  }, [])

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals(prev => {
      const next = prev.filter(g => g.id !== id)
      writeStorage(sk(STORAGE_KEY_SAVINGS_GOALS), next)
      return next
    })
  }, [])

  // ── Investing goal ────────────────────────────────────────────────────────
  const setInvestingGoal = useCallback(
    (data: { allocation_pct: number; risk_profile: 'conservative' | 'moderate' | 'aggressive' }) => {
      const now = new Date().toISOString()
      const record: InvestingGoal = {
        id: `ig_${Date.now()}`,
        user_id: 'local',
        allocation_pct: data.allocation_pct,
        risk_profile: data.risk_profile,
        created_at: investingGoal?.created_at ?? now,
        updated_at: now,
      }
      setInvestingGoalState(record)
      writeStorage(sk(STORAGE_KEY_INVESTING_GOAL), record)
    },
    [investingGoal],
  )

  const removeInvestingGoal = useCallback(() => {
    setInvestingGoalState(null)
    localStorage.removeItem(sk(STORAGE_KEY_INVESTING_GOAL))
  }, [])

  // ── General savings ───────────────────────────────────────────────────────
  const setGeneralSavings = useCallback((pct: number) => {
    setGeneralSavingsPctState(pct)
    writeStorage(sk(STORAGE_KEY_GENERAL_SAVINGS), pct)
  }, [])

  // ── Reset all allocations ─────────────────────────────────────────────────
  const resetAllocations = useCallback(() => {
    setSpendingLimitState(null)
    localStorage.removeItem(sk(STORAGE_KEY_SPENDING_LIMIT))

    setSavingsGoals(prev => {
      const next = prev.map(g => ({ ...g, allocation_pct: 0, updated_at: new Date().toISOString() }))
      writeStorage(sk(STORAGE_KEY_SAVINGS_GOALS), next)
      return next
    })

    setGeneralSavingsPctState(0)
    writeStorage(sk(STORAGE_KEY_GENERAL_SAVINGS), 0)

    setInvestingGoalState(null)
    localStorage.removeItem(sk(STORAGE_KEY_INVESTING_GOAL))
  }, [])

  // ── Statement uploads ─────────────────────────────────────────────────────
  const importStatement = useCallback((text: string, filename: string, accountName?: string): StatementImportResult => {
    const result = parseStatement(text, filename)
    if (result.success && result.statement) {
      if (accountName) result.statement.accountName = accountName
      setStatements(prev => {
        // Replace if same filename, otherwise append
        const filtered = prev.filter(s => s.filename !== filename)
        const next = [...filtered, result.statement!]

        // Re-run recurring detection across all transactions from every file
        // so that multi-month patterns are caught even when files are uploaded one-at-a-time.
        const allTxns = next.flatMap(s => s.transactions)
        const retagged = detectRecurring(allTxns)
        const retaggedById = new Map(retagged.map(t => [t.id, t]))
        const finalStmts: ParsedStatement[] = next.map(s => ({
          ...s,
          transactions: s.transactions.map(t => retaggedById.get(t.id) ?? t),
        }))

        writeStorage(sk(STORAGE_KEY_STATEMENTS), finalStmts)
        return finalStmts
      })
    }
    return result
  }, [])

  const removeStatement = useCallback((filename: string) => {
    setStatements(prev => {
      const next = prev.filter(s => s.filename !== filename)
      writeStorage(sk(STORAGE_KEY_STATEMENTS), next)
      return next
    })
  }, [])

  const removeStatementGroup = useCallback((accountName: string) => {
    setStatements(prev => {
      const next = prev.filter(s => (s.accountName ?? s.filename) !== accountName)
      writeStorage(sk(STORAGE_KEY_STATEMENTS), next)
      return next
    })
  }, [])

  // ── Manual accounts CRUD ──────────────────────────────────────────────────
  const addManualAccount = useCallback((account: Omit<ManualAccount, 'id' | 'createdAt'>): ManualAccount => {
    const newAccount: ManualAccount = {
      ...account,
      id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }
    setManualAccounts(prev => {
      const next = [...prev, newAccount]
      writeStorage(sk(STORAGE_KEY_MANUAL_ACCOUNTS), next)
      return next
    })
    return newAccount
  }, [])

  const updateManualAccount = useCallback((id: string, updates: Partial<Pick<ManualAccount, 'name' | 'type' | 'balance'>>) => {
    setManualAccounts(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updates } : a)
      writeStorage(sk(STORAGE_KEY_MANUAL_ACCOUNTS), next)
      return next
    })
  }, [])

  const removeManualAccount = useCallback((id: string) => {
    setManualAccounts(prev => {
      const next = prev.filter(a => a.id !== id)
      writeStorage(sk(STORAGE_KEY_MANUAL_ACCOUNTS), next)
      return next
    })
  }, [])

  // ── Parsed-account (financialData) edit / remove ──────────────────────────
  const updateParsedAccount = useCallback((accId: string, updates: { name?: string; balance?: number }) => {
    setFinancialData(prev => {
      if (!prev) return prev
      const idx = parseInt(accId.replace('acc_', ''), 10)
      if (isNaN(idx) || idx < 0 || idx >= prev.accounts.length) return prev
      const accounts = prev.accounts.map((a, i) =>
        i === idx ? { ...a, ...(updates.name !== undefined ? { name: updates.name } : {}), ...(updates.balance !== undefined ? { balance: updates.balance } : {}) } : a
      )
      const next = { ...prev, accounts }
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  const removeParsedAccount = useCallback((accId: string) => {
    setFinancialData(prev => {
      if (!prev) return prev
      const idx = parseInt(accId.replace('acc_', ''), 10)
      if (isNaN(idx) || idx < 0 || idx >= prev.accounts.length) return prev
      const accounts = prev.accounts.filter((_, i) => i !== idx)
      const next = { ...prev, accounts }
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  // ── Subscription CRUD (operates directly on financialData.subscriptions) ──
  const addParsedSubscription = useCallback((sub: { name: string; amount: number; frequency?: string }) => {
    setFinancialData(prev => {
      if (!prev) return prev
      const next = { ...prev, subscriptions: [...prev.subscriptions, sub] }
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  const updateParsedSubscription = useCallback((index: number, updates: { name?: string; amount?: number; frequency?: string }) => {
    setFinancialData(prev => {
      if (!prev || index < 0 || index >= prev.subscriptions.length) return prev
      const subscriptions = prev.subscriptions.map((s, i) => i === index ? { ...s, ...updates } : s)
      const next = { ...prev, subscriptions }
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  const removeParsedSubscription = useCallback((index: number) => {
    setFinancialData(prev => {
      if (!prev || index < 0 || index >= prev.subscriptions.length) return prev
      const subscriptions = prev.subscriptions.filter((_, i) => i !== index)
      const next = { ...prev, subscriptions }
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  // ── Derived values ────────────────────────────────────────────────────────
  const { assets: parsedAssets, debts: parsedDebts } = financialData
    ? mapAccounts(financialData)
    : { assets: [], debts: [] }

  // Merge manual accounts into asset/debt lists
  const DEBT_KEYWORDS = ['credit', 'loan', 'mortgage', 'auto', 'student', 'heloc', 'debt', 'credit_card', 'personal_loan', 'medical_debt']
  const toAccount = (a: ManualAccount, isDebt: boolean): Account => ({
    id: a.id,
    user_id: '',
    plaid_item_id: '',
    plaid_account_id: '',
    name: a.name,
    type: a.type.replace(/_/g, ' '),
    current_balance: isDebt ? -Math.abs(a.balance) : a.balance,
    currency_code: 'USD',
    mask: '',
    institution_name: 'Manual Entry',
    is_active: true,
    created_at: a.createdAt,
    updated_at: a.createdAt,
  })

  const manualAssets: Account[] = manualAccounts
    .filter(a => !DEBT_KEYWORDS.some(k => a.type.toLowerCase().replace(/_/g, ' ').includes(k.replace(/_/g, ' '))))
    .map(a => toAccount(a, false))
  const manualDebts: Account[] = manualAccounts
    .filter(a => DEBT_KEYWORDS.some(k => a.type.toLowerCase().replace(/_/g, ' ').includes(k.replace(/_/g, ' '))))
    .map(a => toAccount(a, true))

  // Always derive accounts from statements so uploaded CSVs are reflected
  // regardless of whether financialData is also present.
  const { assets: stmtAssets, debts: stmtDebts } = statements.length > 0
    ? deriveAccountsFromStatementGroups(statements)
    : { assets: [] as Account[], debts: [] as Account[] }

  const assetAccounts: Account[] = [...parsedAssets, ...manualAssets, ...stmtAssets]
  const debtAccounts: Account[] = [...parsedDebts, ...manualDebts, ...stmtDebts]

  // Wealth totals from ALL account sources combined
  const totalAssets = assetAccounts.reduce((s, a) => s + Math.abs(a.current_balance), 0)
  const totalDebts  = debtAccounts.reduce((s, d) => s + Math.abs(d.current_balance), 0)

  // Derive monthly stats from all statement transactions combined (must come before dashboardSummary)
  const statementMonths: StatementMonth[] = deriveMonthlyStats(
    statements.flatMap(s => s.transactions),
  )

  const transactions: Transaction[] = financialData
    ? generateTransactions(financialData)
    : (() => {
        // Deduplicate IDs before mapping — handles cached statements parsed with
        // the old sequential ID scheme (stmt_34, stmt_34, …) across multiple files.
        const seenIds = new Map<string, number>()
        return statements
          .flatMap(s => s.transactions)
          .map(tx => {
            const count = seenIds.get(tx.id) ?? 0
            seenIds.set(tx.id, count + 1)
            return stmtTxToTransaction(count > 0 ? { ...tx, id: `${tx.id}_${count}` } : tx)
          })
          .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      })()

  // When real bank statements are present, prefer statement months for income/spending.
  // Fall back to financialData (Perplexity import) when no statements exist.
  // In either case, wealth is computed from all account sources (not just financialData).
  const dashboardSummary = (() => {
    // Always use combined account totals from all sources for wealth.
    const wealth = { total_assets: totalAssets, total_debts: totalDebts, net_worth: totalAssets - totalDebts }

    // financialData (Perplexity / JSON import) is the primary source for income
    // and spending figures. CSV statements rarely contain payroll deposits, so
    // letting them override would zero out the income field.
    if (financialData) {
      const base = deriveDashboardSummary(
        financialData, spendingLimit, savingsGoals, investingGoal, generalSavingsPct,
      )
      return { ...base, wealth }
    }

    // Fall back to statement months only when there is no financialData at all.
    if (statementMonths.length > 0) {
      const base = deriveSummaryFromStatementMonths(
        statementMonths, spendingLimit, savingsGoals, investingGoal, generalSavingsPct,
      )
      if (base) return { ...base, wealth }
    }

    return null
  })()

  return (
    <FinancialDataContext.Provider
      value={{
        financialData,
        hasData: !!financialData || statements.length > 0,
        isRefreshing,
        lastMcpUpdate,
        importData,
        clearData,
        resetAllocations,
        dashboardSummary,
        assetAccounts,
        debtAccounts,
        transactions,
        spendingLimit,
        setSpendingLimit,
        removeSpendingLimit,
        savingsGoals,
        createSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        investingGoal,
        setInvestingGoal,
        removeInvestingGoal,
        generalSavingsPct,
        setGeneralSavings,
        statements,
        statementMonths,
        importStatement,
        removeStatement,
        removeStatementGroup,
        manualAccounts,
        addManualAccount,
        updateManualAccount,
        removeManualAccount,
        updateParsedAccount,
        removeParsedAccount,
        addParsedSubscription,
        updateParsedSubscription,
        removeParsedSubscription,
      }}
    >
      {children}
    </FinancialDataContext.Provider>
  )
}

export function useFinancialData() {
  const ctx = useContext(FinancialDataContext)
  if (!ctx) {
    throw new Error('useFinancialData must be used inside FinancialDataProvider')
  }
  return ctx
}
