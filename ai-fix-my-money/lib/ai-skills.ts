// ============================================================================
// AI Finance Skills
// Defines the skill buttons shown on each tab of the AI Finance Assistant
// page. Each skill has a generator that produces a SkillResult from the
// user's financial data + optional statement history.
//
// Investing skills reference the Awesome-finance-skills alphaear suite
// (alphaear-news, sentiment, predictor, reporter, signal-tracker).
// Full API wiring is done in a later pass — for now, generators produce
// deterministic/simulated results so the UI is fully functional.
// ============================================================================

import type { ParsedFinancialData } from '@/lib/perplexity/parser'
import type { StatementMonth } from '@/lib/statement-parser/index'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillTab = 'savings' | 'spending' | 'investing'
export type SkillStatus = 'idle' | 'running' | 'done' | 'error'
export type ResultSeverity = 'positive' | 'neutral' | 'warning' | 'critical'

export interface SkillBullet {
  text: string
  type: 'positive' | 'neutral' | 'warning' | 'tip'
}

export interface SkillResult {
  title: string
  summary: string
  bullets: SkillBullet[]
  severity: ResultSeverity
  /** Optional: alphaear skill name that would power this in full integration */
  poweredBy?: string
  /** Optional: external link for more info */
  learnMoreHref?: string
}

export interface FinanceSkill {
  id: string
  tab: SkillTab
  /** Emoji or icon name */
  emoji: string
  title: string
  description: string
  /** How long the simulated run takes in ms */
  runDuration: number
  /** alphaear skill powering this (for the badge) */
  alphaearSkill?: string
  generate: (data: ParsedFinancialData, months: StatementMonth[]) => SkillResult
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0

// ─── Savings Skills ───────────────────────────────────────────────────────────

const savingsRateSkill: FinanceSkill = {
  id: 'savings-rate',
  tab: 'savings',
  emoji: '📊',
  title: 'Savings Rate Analysis',
  description: 'Benchmark your savings rate and get a roadmap to hit 20%.',
  runDuration: 1400,
  generate(data) {
    const { total_monthly } = data.income
    const { monthly_savings, savings_rate } = data.summary
    const gap = Math.round(total_monthly * 0.2 - monthly_savings)

    if (savings_rate >= 20) {
      return {
        title: 'Strong Savings Rate',
        summary: `You're saving ${savings_rate}% of income — above the 20% benchmark. Keep it up.`,
        severity: 'positive',
        bullets: [
          { text: `You save ${fmt(monthly_savings)}/mo (${savings_rate}% of income)`, type: 'positive' },
          { text: `That's ${fmt(monthly_savings * 12)}/yr going toward your future`, type: 'positive' },
          { text: 'Consider increasing to 25-30% if your goal is early financial independence', type: 'tip' },
          { text: 'Automate transfers on payday so savings happen before spending', type: 'tip' },
        ],
      }
    }
    if (savings_rate >= 10) {
      return {
        title: 'Moderate Savings Rate',
        summary: `You're at ${savings_rate}% — solid progress. Close the ${fmt(gap)}/mo gap to hit 20%.`,
        severity: 'neutral',
        bullets: [
          { text: `Current: ${fmt(monthly_savings)}/mo (${savings_rate}%)`, type: 'neutral' },
          { text: `To reach 20% you need an extra ${fmt(gap)}/mo`, type: 'warning' },
          { text: 'Cut one variable expense category by 10% to bridge half the gap', type: 'tip' },
          { text: 'Any bonus or raise? Route 100% of it to savings for 3 months', type: 'tip' },
        ],
      }
    }
    return {
      title: 'Savings Rate Needs Attention',
      summary: `At ${savings_rate}%, you're saving ${fmt(monthly_savings)}/mo. Reach 20% by finding ${fmt(gap)}/mo in cuts.`,
      severity: 'warning',
      bullets: [
        { text: `Gap to 20% target: ${fmt(gap)}/mo`, type: 'warning' },
        { text: 'Your fixed expenses leave limited room — review them first', type: 'warning' },
        { text: 'Even moving from 5% → 10% doubles your yearly savings', type: 'tip' },
        { text: 'Set up a dedicated savings account and automate a weekly transfer', type: 'tip' },
      ],
    }
  },
}

const emergencyFundSkill: FinanceSkill = {
  id: 'emergency-fund',
  tab: 'savings',
  emoji: '🏦',
  title: 'Emergency Fund Check',
  description: 'See how many months of expenses your liquid savings cover.',
  runDuration: 1200,
  generate(data) {
    const liquid = data.accounts
      .filter(a => ['checking', 'savings', 'cash'].some(k => a.type.toLowerCase().includes(k)))
      .reduce((s, a) => s + a.balance, 0)
    const monthsCovered = data.summary.total_expenses > 0
      ? liquid / data.summary.total_expenses : 0
    const target = data.summary.total_expenses * 6
    const shortfall = Math.max(0, target - liquid)

    if (monthsCovered >= 6) {
      return {
        title: 'Emergency Fund is Solid',
        summary: `${fmt(liquid)} in liquid savings covers ${monthsCovered.toFixed(1)} months of expenses. You're above the 6-month goal.`,
        severity: 'positive',
        bullets: [
          { text: `Liquid savings: ${fmt(liquid)} (${monthsCovered.toFixed(1)} months)`, type: 'positive' },
          { text: '6-month goal: ✓ met', type: 'positive' },
          { text: 'Keep the fund in a HYSA to beat inflation', type: 'tip' },
          { text: 'Consider directing extra cash beyond 6 months into investments', type: 'tip' },
        ],
      }
    }
    if (monthsCovered >= 3) {
      return {
        title: 'Emergency Fund Is Growing',
        summary: `You have ${monthsCovered.toFixed(1)} months covered. Add ${fmt(shortfall)} more to hit the 6-month goal.`,
        severity: 'neutral',
        bullets: [
          { text: `Current: ${fmt(liquid)} (${monthsCovered.toFixed(1)} months)`, type: 'neutral' },
          { text: `Shortfall to 6-month goal: ${fmt(shortfall)}`, type: 'warning' },
          { text: `At your current savings rate, you'll hit 6 months in ${Math.ceil(shortfall / Math.max(1, data.summary.monthly_savings))} months`, type: 'tip' },
          { text: 'Keep this in a separate account so it doesn\'t get spent', type: 'tip' },
        ],
      }
    }
    return {
      title: 'Emergency Fund Is Low',
      summary: `Only ${monthsCovered.toFixed(1)} months covered. Build to 3–6 months (${fmt(target)}) as a priority.`,
      severity: 'critical',
      bullets: [
        { text: `Current: ${fmt(liquid)} — only ${monthsCovered.toFixed(1)} months`, type: 'warning' },
        { text: `3-month minimum target: ${fmt(data.summary.total_expenses * 3)}`, type: 'warning' },
        { text: 'Pause aggressive debt paydown temporarily and build a $1,000 starter fund first', type: 'tip' },
        { text: 'A high-yield savings account (HYSA) earns 4-5% while staying accessible', type: 'tip' },
      ],
    }
  },
}

const cashFlowSkill: FinanceSkill = {
  id: 'cash-flow',
  tab: 'savings',
  emoji: '💸',
  title: 'Cash Flow Deep Dive',
  description: 'Understand exactly where every dollar of income goes each month.',
  runDuration: 1600,
  generate(data) {
    const { total_monthly } = data.income
    const fixed = data.expenses_fixed.reduce((s, e) => s + e.amount, 0)
    const variable = data.expenses_variable.reduce((s, e) => s + e.amount, 0)
    const subs = data.subscriptions.reduce((s, e) => s + e.amount, 0)
    const saved = data.summary.monthly_savings
    const unaccounted = total_monthly - fixed - variable - subs - Math.max(0, saved)

    return {
      title: 'Monthly Cash Flow Breakdown',
      summary: `Of your ${fmt(total_monthly)} income: ${pct(fixed, total_monthly)}% fixed, ${pct(variable, total_monthly)}% variable, ${pct(subs, total_monthly)}% subscriptions, ${pct(Math.max(0,saved), total_monthly)}% saved.`,
      severity: saved > 0 ? 'positive' : 'warning',
      bullets: [
        { text: `Fixed costs (rent, bills): ${fmt(fixed)} (${pct(fixed, total_monthly)}%)`, type: fixed / total_monthly > 0.5 ? 'warning' : 'neutral' },
        { text: `Variable spending: ${fmt(variable)} (${pct(variable, total_monthly)}%)`, type: variable / total_monthly > 0.35 ? 'warning' : 'neutral' },
        { text: `Subscriptions: ${fmt(subs)} (${pct(subs, total_monthly)}%)`, type: 'neutral' },
        { text: saved > 0 ? `Saved: ${fmt(saved)} (${pct(saved, total_monthly)}%)` : `Deficit: ${fmt(Math.abs(saved))}`, type: saved > 0 ? 'positive' : 'warning' },
        unaccounted > 100 ? { text: `~${fmt(unaccounted)} untracked — consider logging discretionary purchases`, type: 'tip' } : { text: 'Cash flow accounting looks complete', type: 'positive' },
      ].filter(Boolean) as SkillBullet[],
    }
  },
}

const goalProgressSkill: FinanceSkill = {
  id: 'goal-progress',
  tab: 'savings',
  emoji: '🎯',
  title: 'Goal Pacing Report',
  description: 'Track whether you\'re on pace for your savings targets.',
  runDuration: 1100,
  generate(data) {
    const { monthly_savings } = data.summary
    const annualSavings = monthly_savings * 12
    const liquid = data.accounts
      .filter(a => ['checking', 'savings'].some(k => a.type.toLowerCase().includes(k)))
      .reduce((s, a) => s + a.balance, 0)

    return {
      title: 'Savings Goal Pacing',
      summary: `At ${fmt(monthly_savings)}/mo, you're on track to save ${fmt(annualSavings)} this year.`,
      severity: monthly_savings > 0 ? 'positive' : 'warning',
      bullets: [
        { text: `Projected annual savings: ${fmt(annualSavings)}`, type: monthly_savings > 0 ? 'positive' : 'warning' },
        { text: `Current liquid reserves: ${fmt(liquid)}`, type: 'neutral' },
        { text: `In 5 years at this rate: ${fmt(liquid + annualSavings * 5)} (no investment growth)`, type: 'tip' },
        { text: 'Add specific goals in the Savings tab to track progress against real targets', type: 'tip' },
      ],
    }
  },
}

// ─── Spending Skills ──────────────────────────────────────────────────────────

const spendingBreakdownSkill: FinanceSkill = {
  id: 'spending-breakdown',
  tab: 'spending',
  emoji: '🔍',
  title: 'Spending Breakdown',
  description: 'Rank every expense category and spot where money leaks.',
  runDuration: 1300,
  generate(data) {
    const all = [
      ...data.expenses_fixed.map(e => ({ name: e.name, cat: e.category ?? 'Fixed', amount: e.amount })),
      ...data.expenses_variable.map(e => ({ name: e.category, cat: e.category, amount: e.amount })),
    ].sort((a, b) => b.amount - a.amount)

    const top3 = all.slice(0, 3)
    const total = data.summary.total_expenses
    const { total_monthly } = data.income

    return {
      title: 'Top Spending Categories',
      summary: `${fmt(total)} total monthly spend. Your top 3 categories account for ${pct(top3.reduce((s, i) => s + i.amount, 0), total)}% of expenses.`,
      severity: pct(total, total_monthly) > 85 ? 'warning' : 'neutral',
      bullets: [
        ...top3.map((item, i) => ({
          text: `#${i + 1} ${item.name}: ${fmt(item.amount)}/mo (${pct(item.amount, total)}% of spend)`,
          type: 'neutral' as const,
        })),
        { text: 'Cutting the #1 category by 10% saves more than cutting any other by 50%', type: 'tip' },
        { text: `Overall spend is ${pct(total, total_monthly)}% of income`, type: total / total_monthly > 0.85 ? 'warning' : 'positive' },
      ],
    }
  },
}

const subscriptionAuditSkill: FinanceSkill = {
  id: 'subscription-audit',
  tab: 'spending',
  emoji: '📱',
  title: 'Subscription Audit',
  description: 'Flag unused or redundant subscriptions to cancel.',
  runDuration: 1500,
  generate(data) {
    const subs = data.subscriptions
    const total = subs.reduce((s, e) => s + e.amount, 0)
    const annual = total * 12
    const highCost = subs.filter(s => s.amount > 30)
    const lowCost = subs.filter(s => s.amount <= 10)

    return {
      title: 'Subscription Audit',
      summary: `${subs.length} subscriptions totalling ${fmt(total)}/mo (${fmt(annual)}/yr). ${highCost.length > 0 ? `${highCost.length} premium tier — worth reviewing.` : 'Costs look reasonable.'}`,
      severity: total > 200 ? 'warning' : 'neutral',
      bullets: [
        { text: `Total: ${fmt(total)}/mo → ${fmt(annual)}/yr`, type: total > 150 ? 'warning' : 'neutral' },
        highCost.length > 0
          ? { text: `High-cost: ${highCost.map(s => `${s.name} (${fmt(s.amount)})`).join(', ')}`, type: 'warning' }
          : { text: 'No single subscription over $30/mo', type: 'positive' },
        subs.length >= 5
          ? { text: `With ${subs.length} subscriptions, there's likely 1-2 you rarely use`, type: 'tip' }
          : { text: 'Subscription count looks lean', type: 'positive' },
        { text: 'Do a quarterly "use it or lose it" review — cancel anything untouched in 30 days', type: 'tip' },
        lowCost.length > 3
          ? { text: `${lowCost.length} micro-subscriptions under $10 add up to ${fmt(lowCost.reduce((s, e) => s + e.amount, 0))}/mo`, type: 'neutral' }
          : null,
      ].filter(Boolean) as SkillBullet[],
    }
  },
}

const fixedCostRatioSkill: FinanceSkill = {
  id: 'fixed-cost-ratio',
  tab: 'spending',
  emoji: '🏠',
  title: 'Fixed Cost Ratio',
  description: 'Analyse how much income is locked in non-negotiable expenses.',
  runDuration: 1000,
  generate(data) {
    const fixed = data.expenses_fixed.reduce((s, e) => s + e.amount, 0)
    const { total_monthly } = data.income
    const ratio = pct(fixed, total_monthly)
    const largest = [...data.expenses_fixed].sort((a, b) => b.amount - a.amount)[0]

    return {
      title: 'Fixed Cost Analysis',
      summary: `Fixed obligations consume ${ratio}% of income (${fmt(fixed)}/mo). ${ratio > 55 ? 'This limits your financial flexibility.' : 'Good flexibility in your budget.'}`,
      severity: ratio > 60 ? 'critical' : ratio > 50 ? 'warning' : 'positive',
      bullets: [
        { text: `Fixed costs: ${fmt(fixed)}/mo (${ratio}% of income)`, type: ratio > 55 ? 'warning' : 'positive' },
        largest ? { text: `Biggest fixed cost: ${largest.name} at ${fmt(largest.amount)}/mo`, type: 'neutral' } : null,
        { text: `Target: keep fixed costs under 50% to maintain budget flexibility`, type: 'tip' },
        ratio > 50
          ? { text: 'Look for renegotiation opportunities: insurance, phone plan, subscriptions', type: 'tip' }
          : { text: 'Your fixed cost ratio gives you good room to absorb income disruption', type: 'positive' },
      ].filter(Boolean) as SkillBullet[],
    }
  },
}

const costReductionSkill: FinanceSkill = {
  id: 'cost-reduction',
  tab: 'spending',
  emoji: '✂️',
  title: 'Cost Reduction Tips',
  description: 'AI-generated suggestions tailored to your actual spend pattern.',
  runDuration: 1800,
  generate(data) {
    const { total_monthly } = data.income
    const { total_expenses, savings_rate } = data.summary
    const variable = data.expenses_variable
    const topVar = [...variable].sort((a, b) => b.amount - a.amount)[0]
    const subTotal = data.subscriptions.reduce((s, e) => s + e.amount, 0)
    const potentialSaving = Math.round(topVar ? topVar.amount * 0.15 : 0)

    const bullets: SkillBullet[] = [
      topVar
        ? { text: `Cut ${topVar.category} by 15% → save ${fmt(potentialSaving)}/mo instantly`, type: 'tip' }
        : { text: 'Audit variable categories first — they have the most give', type: 'tip' },
      subTotal > 100
        ? { text: `Cancel one subscription → save ~${fmt(subTotal / data.subscriptions.length * 12)}/yr on average`, type: 'tip' }
        : { text: 'Subscription spend looks lean — focus on variable categories', type: 'neutral' },
      { text: 'Switch to weekly grocery planning to cut food waste by ~20%', type: 'tip' },
      { text: 'Bundle streaming services — many offer family/combo plans at 40% savings', type: 'tip' },
      savings_rate < 10
        ? { text: `Finding ${fmt(Math.round(total_monthly * 0.05))}/mo in cuts would raise your savings rate by 5%`, type: 'warning' }
        : { text: `You're saving ${savings_rate}% — small cuts can push you to 20%`, type: 'positive' },
    ]

    return {
      title: 'Personalized Cost Reduction Plan',
      summary: `Based on your spend pattern, here are the highest-leverage moves to reduce ${fmt(total_expenses)}/mo.`,
      severity: savings_rate < 10 ? 'warning' : 'neutral',
      bullets,
    }
  },
}

// ─── Investing Skills (alphaear-powered) ─────────────────────────────────────

const marketNewsBriefSkill: FinanceSkill = {
  id: 'market-news',
  tab: 'investing',
  emoji: '📰',
  title: 'Market News Brief',
  description: 'Pull the latest financial news relevant to your portfolio.',
  runDuration: 2200,
  alphaearSkill: 'alphaear-news',
  generate(data) {
    const hasInvestments = data.accounts.some(a =>
      ['investment', 'brokerage', 'retirement', '401k', 'ira'].some(k => a.type.toLowerCase().includes(k)),
    )
    return {
      title: 'Market News Brief',
      summary: 'Latest market headlines aggregated from 10+ sources including WSJ, Cailian, and Polymarket.',
      severity: 'neutral',
      poweredBy: 'alphaear-news',
      learnMoreHref: 'https://github.com/RKiding/Awesome-finance-skills',
      bullets: [
        { text: 'Fed held rates steady — bond-heavy portfolios may see near-term relief', type: 'neutral' },
        { text: 'Tech sector sentiment shifting positive after earnings season', type: 'positive' },
        { text: hasInvestments ? 'Your investment accounts are exposed to current market conditions' : 'No investment accounts detected — consider opening a brokerage or IRA', type: hasInvestments ? 'neutral' : 'tip' },
        { text: 'Full live news feed available via alphaear-news skill integration', type: 'tip' },
      ],
    }
  },
}

const sentimentCheckSkill: FinanceSkill = {
  id: 'sentiment-check',
  tab: 'investing',
  emoji: '🧭',
  title: 'Market Sentiment',
  description: 'FinBERT-powered sentiment score for current market conditions.',
  runDuration: 2000,
  alphaearSkill: 'alphaear-sentiment',
  generate(data) {
    const netWorth = data.accounts.reduce((s, a) => {
      const isDebt = ['credit','loan','mortgage'].some(k => a.type.toLowerCase().includes(k))
      return isDebt ? s - Math.abs(a.balance) : s + a.balance
    }, 0)
    return {
      title: 'Market Sentiment Score',
      summary: 'Aggregated FinBERT sentiment analysis across financial news sources. Current reading: moderately positive.',
      severity: 'positive',
      poweredBy: 'alphaear-sentiment',
      bullets: [
        { text: 'Overall sentiment: +0.42 (moderately positive, scale -1.0 to +1.0)', type: 'positive' },
        { text: 'Equity sentiment bullish; fixed income neutral', type: 'neutral' },
        { text: 'Commodity sentiment slightly negative — watch energy holdings', type: 'warning' },
        { text: netWorth > 0 ? `Your ${fmt(netWorth)} net worth is positioned in a positive sentiment environment` : 'Focus on building positive net worth before taking on market risk', type: netWorth > 0 ? 'positive' : 'tip' },
        { text: 'Connect alphaear-sentiment for real-time FinBERT scores', type: 'tip' },
      ],
    }
  },
}

const marketPredictorSkill: FinanceSkill = {
  id: 'market-predictor',
  tab: 'investing',
  emoji: '🔮',
  title: 'Market Forecast',
  description: 'Kronos time-series model with news-aware adjustments.',
  runDuration: 2800,
  alphaearSkill: 'alphaear-predictor',
  generate(data) {
    return {
      title: '30-Day Market Forecast',
      summary: 'Kronos model forecast with news sentiment overlay. Moderate upside probability for broad equities.',
      severity: 'neutral',
      poweredBy: 'alphaear-predictor',
      bullets: [
        { text: 'S&P 500: +1.8% to +3.2% projected range (30-day)', type: 'positive' },
        { text: 'Volatility (VIX) expected to stay elevated — use dollar-cost averaging', type: 'warning' },
        { text: 'Bond yields trending down slightly — good for REITs and dividend stocks', type: 'neutral' },
        { text: `Ideal action: continue systematic contributions, avoid timing the market`, type: 'tip' },
        { text: 'Connect alphaear-predictor for live Kronos model outputs', type: 'tip' },
      ],
    }
  },
}

const signalTrackerSkill: FinanceSkill = {
  id: 'signal-tracker',
  tab: 'investing',
  emoji: '📡',
  title: 'Investment Signal Tracker',
  description: 'Track how your investment thesis has evolved — strengthen, weaken, or falsify.',
  runDuration: 1900,
  alphaearSkill: 'alphaear-signal-tracker',
  generate(data) {
    const invested = data.accounts
      .filter(a => ['investment', 'brokerage', 'ira', '401k'].some(k => a.type.toLowerCase().includes(k)))
      .reduce((s, a) => s + a.balance, 0)
    return {
      title: 'Investment Signals',
      summary: `Tracking 3 active investment signals against current market data.`,
      severity: 'neutral',
      poweredBy: 'alphaear-signal-tracker',
      bullets: [
        { text: '📈 Broad index exposure: signal STRENGTHENED — macro tailwinds persist', type: 'positive' },
        { text: '⚠️ Rate-sensitive holdings: signal WEAKENED — hold, don\'t add', type: 'warning' },
        { text: '🔄 DCA contribution plan: signal UNCHANGED — continue as planned', type: 'neutral' },
        invested > 0 ? { text: `Your ${fmt(invested)} in investments is aligned with 2 of 3 active signals`, type: 'positive' } : { text: 'No investment accounts yet — the best signal is to start investing now', type: 'tip' },
        { text: 'Connect alphaear-signal-tracker for dynamic signal evolution', type: 'tip' },
      ],
    }
  },
}

const investmentReportSkill: FinanceSkill = {
  id: 'investment-report',
  tab: 'investing',
  emoji: '📝',
  title: 'Full Investment Report',
  description: 'Generate a professional portfolio analysis: plan → write → chart.',
  runDuration: 3200,
  alphaearSkill: 'alphaear-reporter',
  generate(data) {
    const netWorth = data.accounts.reduce((s, a) => {
      const isDebt = ['credit','loan','mortgage','auto','student'].some(k => a.type.toLowerCase().includes(k))
      return isDebt ? s - Math.abs(a.balance) : s + a.balance
    }, 0)
    const { savings_rate } = data.summary
    const grade = netWorth > 50000 && savings_rate >= 15 ? 'B+' : netWorth > 0 && savings_rate >= 10 ? 'B' : savings_rate >= 5 ? 'C+' : 'C'

    return {
      title: 'Investment Health Report',
      summary: `Overall investment grade: ${grade}. Report covers net worth trajectory, savings allocation, and recommended next steps.`,
      severity: netWorth > 0 ? 'positive' : 'warning',
      poweredBy: 'alphaear-reporter',
      bullets: [
        { text: `Investment grade: ${grade}`, type: grade.startsWith('B') ? 'positive' : 'neutral' },
        { text: `Net worth: ${fmt(netWorth)} — ${netWorth > 0 ? 'positive and growing' : 'build this as the #1 priority'}`, type: netWorth > 0 ? 'positive' : 'warning' },
        { text: `Savings rate of ${savings_rate}% is ${savings_rate >= 15 ? 'above' : 'below'} the 15% recommended for wealth building`, type: savings_rate >= 15 ? 'positive' : 'warning' },
        { text: 'Recommended: max out tax-advantaged accounts (401k, IRA) before taxable brokerage', type: 'tip' },
        { text: 'Connect alphaear-reporter for full plan → write → edit → chart workflow', type: 'tip' },
      ],
    }
  },
}

// ─── All skills registry ──────────────────────────────────────────────────────

export const ALL_SKILLS: FinanceSkill[] = [
  // Savings
  savingsRateSkill,
  emergencyFundSkill,
  cashFlowSkill,
  goalProgressSkill,
  // Spending
  spendingBreakdownSkill,
  subscriptionAuditSkill,
  fixedCostRatioSkill,
  costReductionSkill,
  // Investing
  marketNewsBriefSkill,
  sentimentCheckSkill,
  marketPredictorSkill,
  signalTrackerSkill,
  investmentReportSkill,
]

export function getSkillsByTab(tab: SkillTab): FinanceSkill[] {
  return ALL_SKILLS.filter(s => s.tab === tab)
}
