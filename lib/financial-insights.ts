// ============================================================================
// Financial Insights Engine
// Rule-based insight generator. Analyses ParsedFinancialData + statement
// history and returns natural-language bullets organized by category.
// No LLM calls — deterministic, instant, works offline.
// ============================================================================

import type { ParsedFinancialData } from '@/lib/perplexity/parser'
import type { StatementMonth } from '@/lib/statement-parser/index'

// ─── Output types ─────────────────────────────────────────────────────────────

export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical'

export interface Insight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  title: string
  body: string
  /** Optional CTA label */
  action?: string
  /** Optional route for the CTA */
  actionHref?: string
}

export type InsightCategory =
  | 'spending'
  | 'savings'
  | 'income'
  | 'debt'
  | 'subscriptions'
  | 'trends'
  | 'net_worth'
  | 'general'

export interface InsightSummary {
  /** One-paragraph narrative for the Trends page hero */
  headline: string
  /** Bullet insights grouped by category */
  insights: Insight[]
  generatedAt: string
  /** Score 0-100. Higher = healthier finances */
  healthScore: number
  healthLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0

let _seq = 0
const id = (cat: InsightCategory) => `${cat}_${++_seq}`

// ─── Rule groups ──────────────────────────────────────────────────────────────

function incomeInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []
  const { total_monthly } = data.income

  if (data.income.sources.length > 1) {
    out.push({
      id: id('income'),
      category: 'income',
      severity: 'positive',
      title: 'Diversified income streams',
      body: `You have ${data.income.sources.length} income sources totalling ${fmt(total_monthly)}/mo. Multiple streams reduce financial risk.`,
    })
  }

  if (total_monthly < 2000) {
    out.push({
      id: id('income'),
      category: 'income',
      severity: 'warning',
      title: 'Income below comfort threshold',
      body: `Your monthly income of ${fmt(total_monthly)} is below the national average. Consider ways to grow earnings or reduce fixed obligations.`,
      action: 'Explore savings goals',
      actionHref: '/savings',
    })
  }

  return out
}

function savingsInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []
  const { total_monthly } = data.income
  const { total_expenses, monthly_savings, savings_rate } = data.summary

  if (savings_rate >= 20) {
    out.push({
      id: id('savings'),
      category: 'savings',
      severity: 'positive',
      title: 'Strong savings rate',
      body: `You're saving ${savings_rate}% of your income — that's above the recommended 20% benchmark. Great discipline!`,
    })
  } else if (savings_rate >= 10) {
    out.push({
      id: id('savings'),
      category: 'savings',
      severity: 'neutral',
      title: 'Moderate savings rate',
      body: `Your savings rate is ${savings_rate}%. Aim for 20%+ by reducing discretionary spending by ${fmt((0.2 * total_monthly) - monthly_savings)}/mo.`,
      action: 'View spending',
      actionHref: '/spending',
    })
  } else if (savings_rate > 0) {
    out.push({
      id: id('savings'),
      category: 'savings',
      severity: 'warning',
      title: 'Low savings rate',
      body: `You're saving only ${savings_rate}% of income. Increasing to 20% would mean saving an extra ${fmt((0.2 * total_monthly) - monthly_savings)}/mo.`,
      action: 'Set a savings goal',
      actionHref: '/savings',
    })
  } else {
    out.push({
      id: id('savings'),
      category: 'savings',
      severity: 'critical',
      title: 'Spending exceeds income',
      body: `Your expenses (${fmt(total_expenses)}) exceed your income (${fmt(total_monthly)}) by ${fmt(total_expenses - total_monthly)}/mo. This is unsustainable without drawing down savings.`,
      action: 'Review budget',
      actionHref: '/spending',
    })
  }

  // Emergency fund heuristic (if we have account data)
  const liquidAssets = data.accounts
    .filter(a => ['checking', 'savings', 'cash'].some(k => a.type.toLowerCase().includes(k)))
    .reduce((s, a) => s + a.balance, 0)

  if (liquidAssets > 0) {
    const monthsCovered = total_expenses > 0 ? liquidAssets / total_expenses : 0
    if (monthsCovered < 3) {
      out.push({
        id: id('savings'),
        category: 'savings',
        severity: 'warning',
        title: 'Emergency fund below 3 months',
        body: `Your liquid savings (${fmt(liquidAssets)}) cover only ${monthsCovered.toFixed(1)} months of expenses. A 3-6 month cushion is recommended.`,
        action: 'Add savings goal',
        actionHref: '/savings',
      })
    } else if (monthsCovered >= 6) {
      out.push({
        id: id('savings'),
        category: 'savings',
        severity: 'positive',
        title: 'Solid emergency fund',
        body: `Your liquid savings cover ${monthsCovered.toFixed(1)} months of expenses. You have a strong financial safety net.`,
      })
    }
  }

  return out
}

function spendingInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []
  const { total_monthly } = data.income

  // Fixed expense ratio
  const fixedTotal = data.expenses_fixed.reduce((s, e) => s + e.amount, 0)
  const fixedRatio = pct(fixedTotal, total_monthly)
  if (fixedRatio > 60) {
    out.push({
      id: id('spending'),
      category: 'spending',
      severity: 'warning',
      title: 'High fixed expense ratio',
      body: `Fixed expenses (rent, utilities, etc.) consume ${fixedRatio}% of your income. Aim to keep them under 50% for financial flexibility.`,
    })
  } else if (fixedRatio <= 40) {
    out.push({
      id: id('spending'),
      category: 'spending',
      severity: 'positive',
      title: 'Manageable fixed costs',
      body: `Your fixed expenses are ${fixedRatio}% of income, leaving good room for saving and discretionary spending.`,
    })
  }

  // Variable spending
  const varTotal = data.expenses_variable.reduce((s, e) => s + e.amount, 0)
  const varRatio = pct(varTotal, total_monthly)
  if (varRatio > 40) {
    out.push({
      id: id('spending'),
      category: 'spending',
      severity: 'warning',
      title: 'Variable spending is high',
      body: `Discretionary spending (${fmt(varTotal)}/mo, ${varRatio}% of income) leaves limited room to save. Look for categories to trim.`,
      action: 'Review spending',
      actionHref: '/spending',
    })
  }

  // Largest variable category
  if (data.expenses_variable.length > 0) {
    const sorted = [...data.expenses_variable].sort((a, b) => b.amount - a.amount)
    const top = sorted[0]
    const topPct = pct(top.amount, varTotal)
    if (topPct > 40 && top.amount > 200) {
      out.push({
        id: id('spending'),
        category: 'spending',
        severity: 'neutral',
        title: `${top.category} is your biggest variable cost`,
        body: `${top.category} accounts for ${topPct}% of discretionary spending at ${fmt(top.amount)}/mo. Small reductions here have the biggest impact.`,
      })
    }
  }

  // Housing cost ratio
  const rent = data.expenses_fixed.find(e =>
    ['rent', 'mortgage', 'housing'].some(k => e.name.toLowerCase().includes(k) || (e.category ?? '').toLowerCase().includes(k))
  )
  if (rent) {
    const housingRatio = pct(rent.amount, total_monthly)
    if (housingRatio > 35) {
      out.push({
        id: id('spending'),
        category: 'spending',
        severity: 'warning',
        title: 'Housing costs above 30% guideline',
        body: `${rent.name} is ${fmt(rent.amount)}/mo — ${housingRatio}% of your income. The 30% rule recommends keeping housing at or below ${fmt(total_monthly * 0.3)}/mo.`,
      })
    }
  }

  return out
}

function subscriptionInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []
  const subTotal = data.subscriptions.reduce((s, e) => s + e.amount, 0)

  if (data.subscriptions.length === 0) return out

  const annualCost = subTotal * 12
  out.push({
    id: id('subscriptions'),
    category: 'subscriptions',
    severity: subTotal > 200 ? 'warning' : 'neutral',
    title: `${data.subscriptions.length} active subscription${data.subscriptions.length > 1 ? 's' : ''}`,
    body: `Subscriptions cost ${fmt(subTotal)}/mo (${fmt(annualCost)}/yr). ${subTotal > 200 ? 'Review which ones you actually use — unused subscriptions are easy savings.' : 'A reasonable subscription spend.'}`,
    action: subTotal > 200 ? 'View subscriptions' : undefined,
    actionHref: subTotal > 200 ? '/spending' : undefined,
  })

  if (data.subscriptions.length >= 5) {
    out.push({
      id: id('subscriptions'),
      category: 'subscriptions',
      severity: 'neutral',
      title: 'Subscription audit recommended',
      body: `With ${data.subscriptions.length} subscriptions, a quarterly audit helps catch forgotten charges. Even cancelling one saves ${fmt(subTotal / data.subscriptions.length * 12)}/yr on average.`,
    })
  }

  return out
}

function debtInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []

  const debtAccounts = data.accounts.filter(a =>
    ['credit', 'loan', 'mortgage', 'auto', 'student', 'heloc'].some(k =>
      a.type.toLowerCase().includes(k),
    ),
  )

  if (debtAccounts.length === 0) return out

  const totalDebt = debtAccounts.reduce((s, a) => s + Math.abs(a.balance), 0)
  const { total_monthly } = data.income

  const debtToIncome = pct(totalDebt, total_monthly * 12)
  if (debtToIncome > 100) {
    out.push({
      id: id('debt'),
      category: 'debt',
      severity: 'critical',
      title: 'High debt-to-annual-income ratio',
      body: `Total debt (${fmt(totalDebt)}) exceeds your annual income (${fmt(total_monthly * 12)}). Focus on paying down high-interest balances first.`,
    })
  } else if (debtToIncome > 36) {
    out.push({
      id: id('debt'),
      category: 'debt',
      severity: 'warning',
      title: 'Debt above comfort zone',
      body: `Your total debt (${fmt(totalDebt)}) is ${debtToIncome}% of annual income. Aim to get this below 36%.`,
    })
  } else {
    out.push({
      id: id('debt'),
      category: 'debt',
      severity: 'positive',
      title: 'Debt-to-income is healthy',
      body: `Your total debt (${fmt(totalDebt)}) is ${debtToIncome}% of annual income — within the healthy range.`,
    })
  }

  return out
}

function trendInsights(months: StatementMonth[]): Insight[] {
  if (months.length < 2) return []

  const out: Insight[] = []
  const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]

  const spendingChange = pct(latest.expenses - prev.expenses, prev.expenses)

  if (spendingChange > 15) {
    out.push({
      id: id('trends'),
      category: 'trends',
      severity: 'warning',
      title: 'Spending jumped month-over-month',
      body: `Your spending in ${latest.label} was ${fmt(latest.expenses)}, up ${spendingChange}% vs ${prev.label}. Review categories for one-off purchases.`,
      action: 'View spending',
      actionHref: '/spending',
    })
  } else if (spendingChange < -10) {
    out.push({
      id: id('trends'),
      category: 'trends',
      severity: 'positive',
      title: 'Spending decreased this month',
      body: `Spending in ${latest.label} dropped ${Math.abs(spendingChange)}% vs ${prev.label} (${fmt(latest.expenses)} vs ${fmt(prev.expenses)}). Keep it up!`,
    })
  }

  // Savings trend
  if (sorted.length >= 3) {
    const recentSavings = sorted.slice(-3).map(m => m.savings)
    const allPositive = recentSavings.every(s => s > 0)
    const improving = recentSavings[2] > recentSavings[1] && recentSavings[1] > recentSavings[0]

    if (allPositive && improving) {
      out.push({
        id: id('trends'),
        category: 'trends',
        severity: 'positive',
        title: 'Savings trending upward',
        body: `Your net savings have grown each of the last 3 months. Consistent progress is the key to long-term wealth.`,
      })
    }
  }

  // Top growing category
  if (latest.categories && prev.categories) {
    let biggestGrowthCat = ''
    let biggestGrowthAmt = 0

    for (const [cat, amt] of Object.entries(latest.categories)) {
      const prevAmt = prev.categories[cat] ?? 0
      const delta = amt - prevAmt
      if (delta > biggestGrowthAmt && delta > 50) {
        biggestGrowthAmt = delta
        biggestGrowthCat = cat
      }
    }

    if (biggestGrowthCat) {
      out.push({
        id: id('trends'),
        category: 'trends',
        severity: 'neutral',
        title: `${biggestGrowthCat} spending increased most`,
        body: `${biggestGrowthCat} rose by ${fmt(biggestGrowthAmt)} from ${prev.label} to ${latest.label}. Check if this is a one-time or recurring change.`,
      })
    }
  }

  return out
}

function netWorthInsights(data: ParsedFinancialData): Insight[] {
  const out: Insight[] = []

  const assetTotal = data.accounts
    .filter(a => !['credit', 'loan', 'mortgage', 'debt'].some(k => a.type.toLowerCase().includes(k)))
    .reduce((s, a) => s + a.balance, 0)

  const debtTotal = data.accounts
    .filter(a => ['credit', 'loan', 'mortgage', 'auto', 'student', 'heloc'].some(k => a.type.toLowerCase().includes(k)))
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  const netWorth = assetTotal - debtTotal

  if (netWorth > 0) {
    out.push({
      id: id('net_worth'),
      category: 'net_worth',
      severity: 'positive',
      title: 'Positive net worth',
      body: `Your net worth is ${fmt(netWorth)} (${fmt(assetTotal)} assets − ${fmt(debtTotal)} liabilities). You're building real wealth.`,
    })
  } else if (netWorth < 0) {
    out.push({
      id: id('net_worth'),
      category: 'net_worth',
      severity: 'warning',
      title: 'Negative net worth',
      body: `Liabilities (${fmt(debtTotal)}) exceed assets (${fmt(assetTotal)}) by ${fmt(Math.abs(netWorth))}. This is common early in a financial journey — keep paying down debt.`,
    })
  }

  return out
}

// ─── Health score ─────────────────────────────────────────────────────────────

function computeHealthScore(data: ParsedFinancialData, months: StatementMonth[]): number {
  let score = 50 // baseline

  const { savings_rate } = data.summary
  const { total_monthly } = data.income

  // Savings rate: up to +25 pts
  if (savings_rate >= 20) score += 25
  else if (savings_rate >= 10) score += 15
  else if (savings_rate > 0) score += 5
  else score -= 15

  // Fixed expense ratio: up to +10 pts
  const fixedTotal = data.expenses_fixed.reduce((s, e) => s + e.amount, 0)
  const fixedRatio = pct(fixedTotal, total_monthly)
  if (fixedRatio <= 40) score += 10
  else if (fixedRatio <= 50) score += 5
  else score -= 5

  // Emergency fund
  const liquid = data.accounts
    .filter(a => ['checking', 'savings'].some(k => a.type.toLowerCase().includes(k)))
    .reduce((s, a) => s + a.balance, 0)
  const monthsCovered = data.summary.total_expenses > 0 ? liquid / data.summary.total_expenses : 0
  if (monthsCovered >= 6) score += 10
  else if (monthsCovered >= 3) score += 5
  else score -= 5

  // Debt
  const debtTotal = data.accounts
    .filter(a => ['credit', 'loan', 'mortgage'].some(k => a.type.toLowerCase().includes(k)))
    .reduce((s, a) => s + Math.abs(a.balance), 0)
  const dti = pct(debtTotal, total_monthly * 12)
  if (dti <= 20) score += 10
  else if (dti <= 36) score += 5
  else if (dti > 100) score -= 10

  // Income diversification
  if (data.income.sources.length > 1) score += 5

  // Trend bonus
  if (months.length >= 2) {
    const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    if (latest.expenses < prev.expenses) score += 5
  }

  return Math.max(0, Math.min(100, score))
}

function healthLabel(score: number): InsightSummary['healthLabel'] {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Attention'
}

// ─── Headline generator ───────────────────────────────────────────────────────

function buildHeadline(data: ParsedFinancialData, score: number, months: StatementMonth[]): string {
  const label = healthLabel(score)
  const { total_monthly } = data.income
  const { savings_rate, monthly_savings } = data.summary
  const hasHistory = months.length >= 2

  const savingsStr = monthly_savings >= 0
    ? `saving ${fmt(monthly_savings)}/mo (${savings_rate}% rate)`
    : `running a ${fmt(Math.abs(monthly_savings))}/mo deficit`

  const trendStr = (() => {
    if (!hasHistory) return ''
    const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month))
    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const chg = pct(latest.expenses - prev.expenses, prev.expenses)
    if (chg > 10) return ` Spending is up ${chg}% month-over-month — worth watching.`
    if (chg < -10) return ` Spending is down ${Math.abs(chg)}% vs last month — great trend.`
    return ' Spending is stable month-over-month.'
  })()

  const labelMap: Record<InsightSummary['healthLabel'], string> = {
    'Excellent': 'Your finances are in excellent shape.',
    'Good': 'Your finances are in good shape.',
    'Fair': 'Your finances are doing okay with room to improve.',
    'Needs Attention': 'Your finances need some attention right now.',
  }

  return `${labelMap[label]} You bring in ${fmt(total_monthly)}/mo and are currently ${savingsStr}.${trendStr} ${score >= 60 ? 'Keep up the solid habits.' : 'Small consistent changes can move the needle quickly.'}`
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a full insight summary from financial data + optional statement history.
 * Pass an empty array for `months` if no statement history is available.
 */
export function generateInsights(
  data: ParsedFinancialData,
  months: StatementMonth[] = [],
): InsightSummary {
  _seq = 0 // reset ID counter per call

  const allInsights: Insight[] = [
    ...incomeInsights(data),
    ...savingsInsights(data),
    ...spendingInsights(data),
    ...subscriptionInsights(data),
    ...debtInsights(data),
    ...trendInsights(months),
    ...netWorthInsights(data),
  ]

  const score = computeHealthScore(data, months)
  const headline = buildHeadline(data, score, months)

  // Sort: critical first, then warning, neutral, positive
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    neutral: 2,
    positive: 3,
  }
  allInsights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return {
    headline,
    insights: allInsights,
    generatedAt: new Date().toISOString(),
    healthScore: score,
    healthLabel: healthLabel(score),
  }
}

/**
 * Quick summary for dashboard widgets — just score + top 3 insights.
 */
export function generateQuickInsights(
  data: ParsedFinancialData,
  months: StatementMonth[] = [],
): { score: number; label: InsightSummary['healthLabel']; top: Insight[] } {
  const full = generateInsights(data, months)
  return {
    score: full.healthScore,
    label: full.healthLabel,
    top: full.insights.slice(0, 3),
  }
}
