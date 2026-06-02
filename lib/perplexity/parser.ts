// ============================================================================
// Perplexity Financial Data Parser
// Validates and normalises JSON output from the Perplexity prompt.
// Deliberately wide: handles every key-name variant Perplexity might emit.
// ============================================================================

export interface PerplexityIncomeSource {
  name: string
  amount: number
}

export interface PerplexityFixedExpense {
  name: string
  category?: string
  amount: number
}

export interface PerplexityVariableExpense {
  category: string
  amount: number
}

export interface PerplexitySubscription {
  name: string
  amount: number
  frequency?: string
}

export interface PerplexityAccount {
  name: string
  type: string
  balance: number
  institution?: string
}

// Normalised internal structure
export interface ParsedFinancialData {
  income: {
    total_monthly: number
    sources: PerplexityIncomeSource[]
  }
  expenses_fixed: PerplexityFixedExpense[]
  expenses_variable: PerplexityVariableExpense[]
  subscriptions: PerplexitySubscription[]
  accounts: PerplexityAccount[]
  summary: {
    total_income: number
    total_expenses: number
    monthly_savings: number
    savings_rate: number
  }
  imported_at: string
}

export interface ParseResult {
  success: boolean
  data?: ParsedFinancialData
  errors: string[]
  warnings: string[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  if (v == null) return 0
  const n = Number(v)
  return isFinite(n) ? n : 0
}

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback
}

/** Pick the first key from `obj` that exists and has a non-null value */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

/** Flatten an accounts structure that may be an array, object, or keyed map */
function flattenAccounts(raw: unknown): Array<Record<string, unknown>> {
  if (!raw) return []

  // Already a flat array → use directly
  if (Array.isArray(raw)) {
    return raw.filter(a => a && typeof a === 'object') as Array<Record<string, unknown>>
  }

  // Object keyed by account type: { checking: [...], savings: [...] }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const out: Array<Record<string, unknown>> = []
    for (const [typeKey, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        val.forEach(a => {
          if (a && typeof a === 'object') {
            out.push({ type: typeKey, ...(a as Record<string, unknown>) })
          }
        })
      } else if (val && typeof val === 'object') {
        // Single account as value
        out.push({ type: typeKey, ...(val as Record<string, unknown>) })
      } else if (typeof val === 'number') {
        // { checking: 3200, savings: 8500 } shorthand
        out.push({ name: typeKey, type: typeKey, balance: val })
      }
    }
    return out
  }

  return []
}

/** Flatten an expenses structure that may be an array or { fixed: [...], variable: [...] } */
function flattenExpenses(raw: unknown): {
  fixed: Array<Record<string, unknown>>
  variable: Array<Record<string, unknown>>
} {
  const empty = { fixed: [], variable: [] }
  if (!raw) return empty

  if (Array.isArray(raw)) {
    // Single flat list — try to classify each item
    const fixed: Array<Record<string, unknown>> = []
    const variable: Array<Record<string, unknown>> = []
    raw.forEach(e => {
      if (!e || typeof e !== 'object') return
      const item = e as Record<string, unknown>
      const isRec = String(item.type ?? item.expense_type ?? '').toLowerCase()
      if (isRec === 'variable') {
        variable.push(item)
      } else {
        fixed.push(item)
      }
    })
    return { fixed, variable }
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    const fixedRaw = pick(obj, 'fixed', 'fixed_expenses', 'expenses_fixed')
    const varRaw = pick(obj, 'variable', 'variable_expenses', 'expenses_variable', 'variable_spending', 'discretionary')
    return {
      fixed: Array.isArray(fixedRaw) ? (fixedRaw as Array<Record<string, unknown>>) : [],
      variable: Array.isArray(varRaw) ? (varRaw as Array<Record<string, unknown>>) : [],
    }
  }

  return empty
}

// ─── main parser ──────────────────────────────────────────────────────────────

export function parsePerplexityData(raw: unknown): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { success: false, errors: ['Input must be a JSON object'], warnings }
  }

  const obj = raw as Record<string, unknown>

  // ── Income ──────────────────────────────────────────────────────────────────
  const incomeRaw = pick(obj, 'income', 'monthly_income', 'income_summary')

  let totalMonthly = 0
  let incomeSources: PerplexityIncomeSource[] = []

  if (typeof incomeRaw === 'number') {
    // "income": 5000
    totalMonthly = incomeRaw
  } else if (incomeRaw && typeof incomeRaw === 'object') {
    const inc = incomeRaw as Record<string, unknown>

    totalMonthly = num(
      pick(inc,
        'total_monthly', 'monthly', 'total', 'net_monthly', 'gross_monthly',
        'monthly_income', 'monthly_total', 'net_income', 'gross_income',
        'take_home', 'take_home_pay',
      )
    )

    // If no explicit total, try annual ÷ 12
    if (!totalMonthly) {
      const annual = num(pick(inc, 'annual', 'yearly', 'annual_income', 'yearly_income'))
      if (annual > 0) totalMonthly = Math.round(annual / 12)
    }

    // If still no total, sum sources
    const rawSources = pick(inc, 'sources', 'income_sources', 'streams')
    if (Array.isArray(rawSources)) {
      incomeSources = rawSources
        .filter(s => s && typeof s === 'object')
        .map((s, i) => {
          const src = s as Record<string, unknown>
          return {
            name: str(pick(src, 'name', 'source', 'description'), `Source ${i + 1}`),
            amount: num(pick(src, 'amount', 'monthly', 'monthly_amount')),
          }
        })
        .filter(s => s.amount > 0)

      if (!totalMonthly && incomeSources.length > 0) {
        totalMonthly = incomeSources.reduce((s, src) => s + src.amount, 0)
      }
    }
  }

  if (!totalMonthly || totalMonthly <= 0) {
    errors.push(
      'Could not find a positive monthly income. Make sure your JSON has an "income" field with "total_monthly" (or "monthly", "gross_monthly", "take_home_pay", etc.).',
    )
    return { success: false, errors, warnings }
  }

  // ── Expenses — fixed + variable ─────────────────────────────────────────────

  // Top-level flat arrays (canonical)
  const fixedRawTop = pick(obj, 'expenses_fixed', 'fixed_expenses', 'fixed')
  const varRawTop = pick(obj,
    'expenses_variable', 'variable_expenses', 'variable_spending',
    'variable', 'discretionary_spending', 'discretionary',
  )

  // Nested under "expenses" key
  const expensesNested = pick(obj, 'expenses', 'monthly_expenses', 'expense_breakdown')
  const { fixed: fixedNested, variable: varNested } = flattenExpenses(expensesNested)

  // Merge: top-level wins, fall back to nested
  const rawFixed: unknown[] = Array.isArray(fixedRawTop) ? fixedRawTop : fixedNested
  const rawVariable: unknown[] = Array.isArray(varRawTop) ? varRawTop : varNested

  const expenses_fixed: PerplexityFixedExpense[] = []
  rawFixed.forEach(e => {
    if (!e || typeof e !== 'object') return
    const exp = e as Record<string, unknown>
    const amount = num(pick(exp, 'amount', 'monthly_amount', 'cost', 'monthly_cost'))
    if (amount > 0) {
      expenses_fixed.push({
        name: str(pick(exp, 'name', 'description', 'item', 'expense'), 'Expense'),
        category: exp.category ? str(exp.category) : undefined,
        amount,
      })
    }
  })

  const expenses_variable: PerplexityVariableExpense[] = []
  rawVariable.forEach(e => {
    if (!e || typeof e !== 'object') return
    const exp = e as Record<string, unknown>
    const amount = num(pick(exp, 'amount', 'monthly_amount', 'monthly', 'total', 'average'))
    if (amount > 0) {
      expenses_variable.push({
        category: str(pick(exp, 'category', 'name', 'type', 'description'), 'Other'),
        amount,
      })
    }
  })

  // ── Subscriptions ────────────────────────────────────────────────────────────
  const rawSubs = pick(obj, 'subscriptions', 'recurring_subscriptions',
    'subscription_services', 'recurring')
  const subscriptions: PerplexitySubscription[] = []

  if (Array.isArray(rawSubs)) {
    rawSubs.forEach(s => {
      if (!s || typeof s === 'object' && !Array.isArray(s)) {
        const sub = s as Record<string, unknown>
        const amount = num(pick(sub, 'amount', 'monthly_amount', 'cost', 'monthly_cost', 'price'))
        if (amount > 0) {
          subscriptions.push({
            name: str(pick(sub, 'name', 'service', 'description'), 'Subscription'),
            amount,
            frequency: str(pick(sub, 'frequency', 'billing_cycle', 'period'), 'monthly'),
          })
        }
      }
    })
  }

  // ── Accounts ─────────────────────────────────────────────────────────────────
  const rawAccountsField = pick(obj,
    'accounts', 'account_balances', 'balances', 'bank_accounts',
    'financial_accounts', 'account_summary',
  )
  const rawAccountsList = flattenAccounts(rawAccountsField)

  const ASSET_TYPES = new Set([
    'checking', 'savings', 'depository', 'investment', 'brokerage',
    'cd', 'money market', 'money_market', 'cash', 'bank', 'deposit',
    'retirement', '401k', 'ira',
  ])
  const DEBT_TYPES_SET = new Set([
    'credit', 'credit card', 'credit_card', 'loan', 'mortgage',
    'auto', 'auto loan', 'student', 'student loan', 'debt', 'liability',
    'heloc', 'line of credit',
  ])

  const accounts: PerplexityAccount[] = []
  rawAccountsList.forEach(acc => {
    const balance = num(pick(acc, 'balance', 'current_balance', 'amount', 'current'))
    const rawType = str(pick(acc, 'type', 'account_type', 'subtype'), 'checking').toLowerCase()
    const name = str(pick(acc, 'name', 'account_name', 'description', 'title'), 'Account')
    const institution = str(pick(acc, 'institution', 'bank', 'institution_name', 'provider') ?? '')

    accounts.push({
      name,
      type: rawType,
      balance,
      institution: institution || undefined,
    })
  })

  // ── Warnings ──────────────────────────────────────────────────────────────────
  if (expenses_fixed.length === 0 && expenses_variable.length === 0 && subscriptions.length === 0) {
    warnings.push(
      'No expense data was found. Monthly spending will show $0. ' +
      'Check that your JSON has "expenses_fixed", "expenses_variable", or "subscriptions" keys.',
    )
  }
  if (accounts.length === 0) {
    warnings.push(
      'No account data was found. The Accounts page will be empty. ' +
      'Check that your JSON has an "accounts" key with a list of account objects.',
    )
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const rawSummary = (obj.summary ?? {}) as Record<string, unknown>
  const totalExpenses =
    expenses_fixed.reduce((s, e) => s + e.amount, 0) +
    expenses_variable.reduce((s, e) => s + e.amount, 0) +
    subscriptions.reduce((s, e) => s + e.amount, 0)

  const computedSavings = totalMonthly - totalExpenses
  const monthlySavings = num(
    pick(rawSummary,
      'monthly_savings', 'total_monthly_savings', 'net_savings',
      'savings', 'monthly_surplus', 'surplus',
    )
  ) || computedSavings

  const savingsRate = totalMonthly > 0
    ? Math.round((monthlySavings / totalMonthly) * 100)
    : num(pick(rawSummary, 'savings_rate', 'saving_rate'))

  const parsed: ParsedFinancialData = {
    income: { total_monthly: totalMonthly, sources: incomeSources },
    expenses_fixed,
    expenses_variable,
    subscriptions,
    accounts,
    summary: {
      total_income: totalMonthly,
      total_expenses: totalExpenses,
      monthly_savings: monthlySavings,
      savings_rate: savingsRate,
    },
    imported_at: new Date().toISOString(),
  }

  return { success: true, data: parsed, errors: [], warnings }
}

// ─── Sample + prompt ──────────────────────────────────────────────────────────

export const SAMPLE_PERPLEXITY_JSON = `{
  "income": {
    "total_monthly": 5000,
    "sources": [
      { "name": "Salary", "amount": 4500 },
      { "name": "Freelance", "amount": 500 }
    ]
  },
  "expenses_fixed": [
    { "name": "Rent", "category": "Housing", "amount": 1500 },
    { "name": "Electric", "category": "Utilities", "amount": 80 },
    { "name": "Internet", "category": "Utilities", "amount": 60 }
  ],
  "expenses_variable": [
    { "category": "Food & Dining", "amount": 400 },
    { "category": "Transport", "amount": 150 },
    { "category": "Shopping", "amount": 200 },
    { "category": "Healthcare", "amount": 50 }
  ],
  "subscriptions": [
    { "name": "Netflix", "amount": 15, "frequency": "monthly" },
    { "name": "Spotify", "amount": 10, "frequency": "monthly" },
    { "name": "iCloud", "amount": 3, "frequency": "monthly" }
  ],
  "accounts": [
    { "name": "Chase Checking", "type": "checking", "balance": 3200, "institution": "Chase" },
    { "name": "Chase Savings", "type": "savings", "balance": 8500, "institution": "Chase" },
    { "name": "Citi Credit Card", "type": "credit", "balance": -1200, "institution": "Citi" }
  ],
  "summary": {
    "total_income": 5000,
    "total_expenses": 2468,
    "monthly_savings": 2532,
    "savings_rate": 50
  }
}`

export const PERPLEXITY_PROMPT = `Connect to my linked financial accounts and return a structured summary of my finances. Include: monthly income (total and per source), fixed expenses (rent, utilities, subscriptions), variable spending (categorized), account balances (checking, savings, credit cards), recurring subscriptions, and total monthly savings or deficit. Format the response as clean JSON with keys: income, expenses_fixed, expenses_variable, subscriptions, accounts, summary. Ensure all values are monthly totals and include category breakdowns where possible.`
