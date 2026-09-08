'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  deriveMonthlyStats,
  emptyProfile,
  normalizeProfile,
  recomputeSummary,
  type FinancialProfile,
  type LedgerTransaction,
  type MonthlyBreakdown,
} from '@/lib/finance/model'
import type {
  Account,
  Transaction,
  DashboardSummary,
  SpendingLimitData,
  SavingsGoal,
  InvestingGoal,
} from '@/hooks/use-data'
import type { ArchetypeId } from '@/lib/investing/archetypes'

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY_FINANCIAL = 'llg_financial_data'
const STORAGE_KEY_SPENDING_LIMIT = 'llg_spending_limit'
const STORAGE_KEY_SAVINGS_GOALS = 'llg_savings_goals'
const STORAGE_KEY_INVESTING_GOAL = 'llg_investing_goal'
const STORAGE_KEY_GENERAL_SAVINGS = 'llg_general_savings'
const STORAGE_KEY_MANUAL_ACCOUNTS = 'llg_manual_accounts'
const STORAGE_KEY_LEDGER = 'llg_ledger'

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
  /** Credit limit — revolving accounts only. Utilisation needs it. */
  limit?: number
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
// Synthetic transactions derived from the recorded expense entries
// ============================================================================

function generateTransactions(data: FinancialProfile): Transaction[] {
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

function mapAccounts(data: FinancialProfile): { assets: Account[]; debts: Account[] } {
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
// DashboardSummary derivation
// ============================================================================

function deriveDashboardSummary(
  data: FinancialProfile,
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
  financialData: FinancialProfile | null
  hasData: boolean


  // Reset
  saveProfile: (update: (current: FinancialProfile) => FinancialProfile) => void
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
  setInvestingGoal: (data: { allocation_pct: number; risk_profile: 'conservative' | 'moderate' | 'aggressive'; archetype?: ArchetypeId }) => void
  removeInvestingGoal: () => void

  // General savings (locked % of net cash flow, separate from goal allocations)
  generalSavingsPct: number
  setGeneralSavings: (pct: number) => void

  // Ledger of individually recorded transactions
  ledger: LedgerTransaction[]
  monthlyBreakdown: MonthlyBreakdown[]
  addLedgerTransaction: (tx: Omit<LedgerTransaction, 'id'>) => LedgerTransaction
  removeLedgerTransaction: (id: string) => void

  // Manually entered accounts
  manualAccounts: ManualAccount[]
  addManualAccount: (account: Omit<ManualAccount, 'id' | 'createdAt'>) => ManualAccount
  updateManualAccount: (id: string, updates: Partial<Pick<ManualAccount, 'name' | 'type' | 'balance' | 'limit'>>) => void
  removeManualAccount: (id: string) => void

  // Edit / remove accounts recorded on the profile
  updateParsedAccount: (accId: string, updates: { name?: string; balance?: number }) => void
  removeParsedAccount: (accId: string) => void

}

// ============================================================================
// Context
// ============================================================================

const FinancialDataContext = createContext<FinancialDataContextValue | null>(null)

// ─── Ledger entry → dashboard Transaction ────────────────────────────────────

function ledgerTxToTransaction(tx: LedgerTransaction): Transaction {
  return {
    id: tx.id,
    user_id: 'local',
    account_id: tx.account || 'local',
    plaid_transaction_id: tx.id,
    name: tx.description,
    merchant_name: tx.description,
    amount: tx.amount,
    transaction_date: tx.date,
    plaid_category: tx.category,
    personal_finance_category: tx.category,
    pending: false,
    is_recurring: tx.is_recurring,
    created_at: new Date().toISOString(),
  }
}

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [financialData, setFinancialData] = useState<FinancialProfile | null>(null)
  const [spendingLimit, setSpendingLimitState] = useState<StoredSpendingLimit | null>(null)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [investingGoal, setInvestingGoalState] = useState<InvestingGoal | null>(null)
  const [generalSavingsPct, setGeneralSavingsPctState] = useState<number>(0)
  const [ledger, setLedger] = useState<LedgerTransaction[]>([])
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([])

  // Load all state from localStorage once on mount
  useEffect(() => {
    setFinancialData(normalizeProfile(readStorage<unknown>(STORAGE_KEY_FINANCIAL)))
    setSpendingLimitState(readStorage<StoredSpendingLimit>(STORAGE_KEY_SPENDING_LIMIT))
    setSavingsGoals(readStorage<SavingsGoal[]>(STORAGE_KEY_SAVINGS_GOALS) ?? [])
    setInvestingGoalState(readStorage<InvestingGoal>(STORAGE_KEY_INVESTING_GOAL))
    setGeneralSavingsPctState(readStorage<number>(STORAGE_KEY_GENERAL_SAVINGS) ?? 0)
    setLedger(readStorage<LedgerTransaction[]>(STORAGE_KEY_LEDGER) ?? [])
    setManualAccounts(readStorage<ManualAccount[]>(STORAGE_KEY_MANUAL_ACCOUNTS) ?? [])
  }, [])

  // ── Profile ───────────────────────────────────────────────────────────────
  // The profile is built up by hand as the user works through a learning track.
  const saveProfile = useCallback((update: (current: FinancialProfile) => FinancialProfile) => {
    setFinancialData(prev => {
      const next = recomputeSummary(update(prev ?? emptyProfile()))
      writeStorage(sk(STORAGE_KEY_FINANCIAL), next)
      return next
    })
  }, [])

  const clearData = useCallback(() => {
    setFinancialData(null)
    setSpendingLimitState(null)
    setSavingsGoals([])
    setInvestingGoalState(null)
    setGeneralSavingsPctState(0)
    setLedger([])
    setManualAccounts([])
    localStorage.removeItem(sk(STORAGE_KEY_FINANCIAL))
    localStorage.removeItem(sk(STORAGE_KEY_SPENDING_LIMIT))
    localStorage.removeItem(sk(STORAGE_KEY_SAVINGS_GOALS))
    localStorage.removeItem(sk(STORAGE_KEY_INVESTING_GOAL))
    localStorage.removeItem(sk(STORAGE_KEY_GENERAL_SAVINGS))
    localStorage.removeItem(sk(STORAGE_KEY_LEDGER))
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
    (data: { allocation_pct: number; risk_profile: 'conservative' | 'moderate' | 'aggressive'; archetype?: ArchetypeId }) => {
      const now = new Date().toISOString()
      const record: InvestingGoal = {
        id: `ig_${Date.now()}`,
        user_id: 'local',
        allocation_pct: data.allocation_pct,
        risk_profile: data.risk_profile,
        archetype: data.archetype,
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

  // ── Ledger CRUD ───────────────────────────────────────────────────────────
  const addLedgerTransaction = useCallback((tx: Omit<LedgerTransaction, 'id'>): LedgerTransaction => {
    const entry: LedgerTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    }
    setLedger(prev => {
      const next = [...prev, entry]
      writeStorage(sk(STORAGE_KEY_LEDGER), next)
      return next
    })
    return entry
  }, [])

  const removeLedgerTransaction = useCallback((id: string) => {
    setLedger(prev => {
      const next = prev.filter(t => t.id !== id)
      writeStorage(sk(STORAGE_KEY_LEDGER), next)
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

  const updateManualAccount = useCallback((id: string, updates: Partial<Pick<ManualAccount, 'name' | 'type' | 'balance' | 'limit'>>) => {
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

  // ── Derived values ────────────────────────────────────────────────────────
  const { assets: parsedAssets, debts: parsedDebts } = financialData
    ? mapAccounts(financialData)
    : { assets: [], debts: [] }

  // Merge manual accounts into asset/debt lists
  const DEBT_KEYWORDS = ['credit', 'loan', 'mortgage', 'auto', 'student', 'heloc', 'debt', 'credit_card', 'personal_loan', 'medical_debt']
  const INVESTMENT_KEYWORDS = ['brokerage', 'retirement', 'investment', '401k', 'ira']

  // `type` has to stay one of the canonical values the pages filter on; the
  // specific kind the user picked lives in `subtype`.
  const toAccount = (a: ManualAccount, isDebt: boolean): Account => {
    const kind = a.type.toLowerCase()
    const canonical = isDebt
      ? 'credit'
      : INVESTMENT_KEYWORDS.some(k => kind.includes(k))
        ? 'investment'
        : 'depository'

    return {
      id: a.id,
      user_id: '',
      plaid_item_id: '',
      plaid_account_id: '',
      name: a.name,
      type: canonical,
      subtype: a.type.replace(/_/g, ' '),
      current_balance: isDebt ? -Math.abs(a.balance) : a.balance,
      currency_code: 'USD',
      mask: '',
      institution_name: 'Manual Entry',
      is_active: true,
      created_at: a.createdAt,
      updated_at: a.createdAt,
    }
  }

  const manualAssets: Account[] = manualAccounts
    .filter(a => !DEBT_KEYWORDS.some(k => a.type.toLowerCase().replace(/_/g, ' ').includes(k.replace(/_/g, ' '))))
    .map(a => toAccount(a, false))
  const manualDebts: Account[] = manualAccounts
    .filter(a => DEBT_KEYWORDS.some(k => a.type.toLowerCase().replace(/_/g, ' ').includes(k.replace(/_/g, ' '))))
    .map(a => toAccount(a, true))

  const assetAccounts: Account[] = [...parsedAssets, ...manualAssets]
  const debtAccounts: Account[] = [...parsedDebts, ...manualDebts]

  // Wealth totals from ALL account sources combined
  const totalAssets = assetAccounts.reduce((s, a) => s + Math.abs(a.current_balance), 0)
  const totalDebts  = debtAccounts.reduce((s, d) => s + Math.abs(d.current_balance), 0)

  // Monthly rollup of everything recorded in the ledger
  const monthlyBreakdown: MonthlyBreakdown[] = deriveMonthlyStats(ledger)

  const transactions: Transaction[] = financialData
    ? generateTransactions(financialData)
    : ledger
        .map(ledgerTxToTransaction)
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))

  // The profile is the source of truth for income and spending; wealth is
  // computed from every account the user has recorded.
  const dashboardSummary = financialData
    ? {
        ...deriveDashboardSummary(
          financialData, spendingLimit, savingsGoals, investingGoal, generalSavingsPct,
        ),
        wealth: {
          total_assets: totalAssets,
          total_debts: totalDebts,
          net_worth: totalAssets - totalDebts,
        },
      }
    : null

  return (
    <FinancialDataContext.Provider
      value={{
        financialData,
        hasData: !!financialData || ledger.length > 0,
        saveProfile,
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
        ledger,
        monthlyBreakdown,
        addLedgerTransaction,
        removeLedgerTransaction,
        manualAccounts,
        addManualAccount,
        updateManualAccount,
        removeManualAccount,
        updateParsedAccount,
        removeParsedAccount,
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
