#!/usr/bin/env node
import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ── Supabase ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

// ── Parser (ported from luminous-ledger/lib/perplexity/parser.ts) ─────────────

function num(v) {
  if (v == null) return 0
  const n = Number(v)
  return isFinite(n) ? n : 0
}

function str(v, fallback = '') {
  return v != null ? String(v) : fallback
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

function flattenAccounts(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(a => a && typeof a === 'object')
  if (typeof raw === 'object') {
    const out = []
    for (const [typeKey, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        val.forEach(a => { if (a && typeof a === 'object') out.push({ type: typeKey, ...a }) })
      } else if (val && typeof val === 'object') {
        out.push({ type: typeKey, ...val })
      } else if (typeof val === 'number') {
        out.push({ name: typeKey, type: typeKey, balance: val })
      }
    }
    return out
  }
  return []
}

function flattenExpenses(raw) {
  const empty = { fixed: [], variable: [] }
  if (!raw) return empty
  if (Array.isArray(raw)) {
    const fixed = [], variable = []
    raw.forEach(e => {
      if (!e || typeof e !== 'object') return
      const t = String(e.type ?? e.expense_type ?? '').toLowerCase()
      t === 'variable' ? variable.push(e) : fixed.push(e)
    })
    return { fixed, variable }
  }
  if (typeof raw === 'object') {
    const fixedRaw = pick(raw, 'fixed', 'fixed_expenses', 'expenses_fixed')
    const varRaw = pick(raw, 'variable', 'variable_expenses', 'expenses_variable', 'variable_spending', 'discretionary')
    return {
      fixed: Array.isArray(fixedRaw) ? fixedRaw : [],
      variable: Array.isArray(varRaw) ? varRaw : [],
    }
  }
  return empty
}

function parseFinanceData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { success: false, errors: ['Input must be a JSON object'] }
  }

  // Income
  const incomeRaw = pick(raw, 'income', 'monthly_income', 'income_summary')
  let totalMonthly = 0
  let incomeSources = []

  if (typeof incomeRaw === 'number') {
    totalMonthly = incomeRaw
  } else if (incomeRaw && typeof incomeRaw === 'object') {
    totalMonthly = num(pick(incomeRaw, 'total_monthly', 'monthly', 'total', 'net_monthly',
      'gross_monthly', 'monthly_income', 'net_income', 'take_home', 'take_home_pay'))
    if (!totalMonthly) {
      const annual = num(pick(incomeRaw, 'annual', 'yearly', 'annual_income'))
      if (annual > 0) totalMonthly = Math.round(annual / 12)
    }
    const rawSources = pick(incomeRaw, 'sources', 'income_sources', 'streams')
    if (Array.isArray(rawSources)) {
      incomeSources = rawSources
        .filter(s => s && typeof s === 'object')
        .map((s, i) => ({
          name: str(pick(s, 'name', 'source', 'description'), `Source ${i + 1}`),
          amount: num(pick(s, 'amount', 'monthly', 'monthly_amount')),
        }))
        .filter(s => s.amount > 0)
      if (!totalMonthly && incomeSources.length > 0) {
        totalMonthly = incomeSources.reduce((s, src) => s + src.amount, 0)
      }
    }
  }

  if (!totalMonthly || totalMonthly <= 0) {
    return { success: false, errors: ['Could not find a positive monthly income value.'] }
  }

  // Expenses
  const fixedRawTop = pick(raw, 'expenses_fixed', 'fixed_expenses', 'fixed')
  const varRawTop = pick(raw, 'expenses_variable', 'variable_expenses', 'variable_spending', 'variable', 'discretionary')
  const { fixed: fixedNested, variable: varNested } = flattenExpenses(pick(raw, 'expenses', 'monthly_expenses'))

  const expenses_fixed = []
  const rawFixed = Array.isArray(fixedRawTop) ? fixedRawTop : fixedNested
  rawFixed.forEach(e => {
    if (!e || typeof e !== 'object') return
    const amount = num(pick(e, 'amount', 'monthly_amount', 'cost'))
    if (amount > 0) expenses_fixed.push({
      name: str(pick(e, 'name', 'description', 'item'), 'Expense'),
      category: e.category ? str(e.category) : undefined,
      amount,
    })
  })

  const expenses_variable = []
  const rawVariable = Array.isArray(varRawTop) ? varRawTop : varNested
  rawVariable.forEach(e => {
    if (!e || typeof e !== 'object') return
    const amount = num(pick(e, 'amount', 'monthly_amount', 'monthly', 'total', 'average'))
    if (amount > 0) expenses_variable.push({
      category: str(pick(e, 'category', 'name', 'type'), 'Other'),
      amount,
    })
  })

  // Subscriptions
  const subscriptions = []
  const rawSubs = pick(raw, 'subscriptions', 'recurring_subscriptions', 'recurring')
  if (Array.isArray(rawSubs)) {
    rawSubs.forEach(s => {
      if (!s || typeof s !== 'object') return
      const amount = num(pick(s, 'amount', 'monthly_amount', 'cost', 'price'))
      if (amount > 0) subscriptions.push({
        name: str(pick(s, 'name', 'service', 'description'), 'Subscription'),
        amount,
        frequency: str(pick(s, 'frequency', 'billing_cycle'), 'monthly'),
      })
    })
  }

  // Accounts
  const accounts = flattenAccounts(pick(raw, 'accounts', 'account_balances', 'balances', 'bank_accounts'))
    .map(acc => ({
      name: str(pick(acc, 'name', 'account_name', 'description'), 'Account'),
      type: str(pick(acc, 'type', 'account_type', 'subtype'), 'checking').toLowerCase(),
      balance: num(pick(acc, 'balance', 'current_balance', 'amount', 'current')),
      institution: str(pick(acc, 'institution', 'bank', 'institution_name') ?? '') || undefined,
    }))

  // Summary
  const rawSummary = raw.summary ?? {}
  const totalExpenses =
    expenses_fixed.reduce((s, e) => s + e.amount, 0) +
    expenses_variable.reduce((s, e) => s + e.amount, 0) +
    subscriptions.reduce((s, e) => s + e.amount, 0)
  const computedSavings = totalMonthly - totalExpenses
  const monthlySavings = num(pick(rawSummary, 'monthly_savings', 'net_savings', 'savings', 'monthly_surplus')) || computedSavings
  const savingsRate = totalMonthly > 0 ? Math.round((monthlySavings / totalMonthly) * 100) : 0

  return {
    success: true,
    data: {
      income: { total_monthly: totalMonthly, sources: incomeSources },
      expenses_fixed,
      expenses_variable,
      subscriptions,
      accounts,
      summary: { total_income: totalMonthly, total_expenses: totalExpenses, monthly_savings: monthlySavings, savings_rate: savingsRate },
      imported_at: new Date().toISOString(),
    },
  }
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'luminous-ledger',
  version: '1.0.0',
})

server.tool(
  'save_finance_snapshot',
  'Save a structured finance snapshot to the Luminous Ledger dashboard. The dashboard updates automatically within seconds. Pass your normalized finance JSON as the finance_json argument.',
  {
    finance_json: z.record(z.unknown()).describe(
      'Finance JSON with keys: income, expenses_fixed, expenses_variable, subscriptions, accounts, summary.'
    ),
  },
  async ({ finance_json }) => {
    const userId = process.env.MCP_TARGET_USER_ID
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: MCP_TARGET_USER_ID not set in .env' }], isError: true }
    }

    const result = parseFinanceData(finance_json)
    if (!result.success) {
      return { content: [{ type: 'text', text: `Validation failed: ${result.errors.join(', ')}` }], isError: true }
    }

    const { error, data: row } = await getSupabase()
      .from('finance_snapshots')
      .upsert(
        { user_id: userId, data: result.data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      .select('id, updated_at')
      .single()

    if (error) {
      return { content: [{ type: 'text', text: `Database error: ${error.message}` }], isError: true }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          snapshot_id: row.id,
          updated_at: row.updated_at,
          message: 'Finance dashboard updated successfully.',
        }),
      }],
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
