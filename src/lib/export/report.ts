/**
 * The dashboard, written down.
 *
 * Everything a learner can export is assembled here from the numbers the
 * dashboard already shows, so the file and the screen can never disagree.
 * The builder is pure: the page hands it what it has derived, and the two
 * renderers (`report-html`, `report-text`) read the result.
 */

export interface ReportLineItem {
  name: string
  amount: number
}

export interface ReportAllocationRow {
  label: string
  pct: number
  detail: string
  /** The dashboard's colour for this slice. Null is the unallocated grey. */
  color: string | null
}

export interface ReportInvestment {
  name: string
  /** The risk word the Investing page uses — "Lower risk", "Your own", … */
  label: string
  pct: number
  monthly: number
  color: string
}

export interface ReportAccount {
  name: string
  institution: string
  /** Checking, credit card, Roth IRA — whatever the learner recorded. */
  kind: string
  /** Always positive. Which side it falls on is the list it is in. */
  balance: number
}

export interface ReportSavingsGoal {
  name: string
  target: number
  current: number
  allocationPct: number
  progressPct: number
}

export interface FinancialReport {
  generatedAt: string
  monthly: {
    income: number
    spending: number
    net: number
    savingsRatePct: number
    spendingPctOfIncome: number
  }
  spendingLimit: { limit: number; period: string } | null
  recurring: {
    total: number
    items: ReportLineItem[]
  }
  allocation: {
    rows: ReportAllocationRow[]
    allocatedPct: number
    unallocatedPct: number
  }
  investments: {
    monthlyAmount: number
    totalPct: number
    items: ReportInvestment[]
  }
  savingsGoals: ReportSavingsGoal[]
  accounts: {
    assets: ReportAccount[]
    liabilities: ReportAccount[]
    totalAssets: number
    totalLiabilities: number
    netWorth: number
  }
}

export type ReportInput = Omit<FinancialReport, 'generatedAt'> & { generatedAt?: string }

export function buildReport(input: ReportInput): FinancialReport {
  return { ...input, generatedAt: input.generatedAt ?? new Date().toISOString() }
}

// ─── Formatting shared by both renderers ────────────────────────────────────

/** Whole dollars. Cents are noise on a one-page summary. */
export function money(amount: number): string {
  const rounded = Math.round(Math.abs(amount))
  return `${amount < 0 ? '-' : ''}$${rounded.toLocaleString('en-US')}`
}

/** Cents kept — recurring bills are the one place they matter. */
export function moneyExact(amount: number): string {
  return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function reportDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** `money-plan-2026-09-18` — sorts by date in a downloads folder. */
export function reportFilename(iso: string, extension: string): string {
  const d = new Date(iso)
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
  return `money-plan-${stamp}.${extension}`
}
