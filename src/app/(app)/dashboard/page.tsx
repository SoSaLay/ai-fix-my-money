'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, RefreshCw, Calendar, Wallet, PiggyBank, RotateCcw, ChevronDown } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { EmptyState } from '@/components/layout/empty-state'
import { useDashboardSummary } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'
import { INVESTMENT_CATEGORIES, knownAllocations } from '@/lib/investing/categories'
import { RISK_LABEL, RISK_RAMP } from '@/lib/investing/risk-ramp'

export default function DashboardPage() {
  const { hasData, resetAllocations, financialData, investingGoal } = useFinancialData()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { data: summary, loading, error, refresh } = useDashboardSummary()

  const [showRecurring, setShowRecurring] = useState(false)

  // The fixed costs the learner recorded in Income vs. Spending. Reading them
  // straight off the profile is what makes the figure monthly — the old
  // seven-day transaction window missed everything billed on the 1st.
  const recurringItems = useMemo(
    () => [...(financialData?.expenses_fixed ?? [])]
      .map(exp => ({ name: exp.name, amount: exp.amount }))
      .sort((a, b) => b.amount - a.amount),
    [financialData],
  )
  const recurringTotal = recurringItems.reduce((sum, i) => sum + i.amount, 0)

  // Each investment chosen on the Investing page, with the risk colour and word
  // it wears there. Other entries have no tier, so they wear the brand colour.
  const investments = useMemo(() => {
    const named = INVESTMENT_CATEGORIES
      .map(c => ({ category: c, pct: knownAllocations(investingGoal?.categories)[c.id] ?? 0 }))
      .filter(({ pct }) => pct > 0)
      .map(({ category, pct }) => ({
        id: category.id as string,
        name: category.name,
        label: RISK_LABEL[category.tier],
        color: RISK_RAMP[category.tier].stripe,
        pct,
      }))
    const own = (investingGoal?.custom ?? [])
      .filter(c => (Number(c.pct) || 0) > 0)
      .map(c => ({ id: c.id, name: c.name, label: 'Your own', color: '#4c49c9', pct: Number(c.pct) }))
    return [...named, ...own].sort((a, b) => b.pct - a.pct)
  }, [investingGoal])
  const investmentsPct = investments.reduce((sum, i) => sum + i.pct, 0)

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Dashboard" />
        <div className="flex-1 px-4 sm:px-8 pb-10 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-64 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-14 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-40 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-64 animate-pulse" />
        </div>
      </div>
    )
  }

  // Nothing recorded yet
  if (!hasData || !summary) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Dashboard" />
        <EmptyState
          image="/onboarding/waiting.svg"
          title="Nothing here yet."
          body="Your dashboard fills in as you learn and add your own numbers."
          action={{ href: '/learning', label: 'Go to Learning' }}
        />
      </div>
    )
  }

  const monthlyIncome = summary.spending.monthly_income
  const monthlySpending = summary.spending.monthly_spending
  const netCashFlow = summary.spending.net_cash_flow
  const spendingLimit = summary.spending.spending_limit?.limit || 0
  const investmentsAmount = Math.round((investmentsPct / 100) * monthlyIncome)

  // --- Allocation preview ---
  // All percentages are unified as share of monthly income (the strict 100% baseline)

  // Spending: locked limit as % of income
  const spendingPct = monthlyIncome > 0 && spendingLimit > 0
    ? Math.round((spendingLimit / monthlyIncome) * 100)
    : 0
  const spendingAmount = spendingLimit

  // Saving: locked % is stored as % of income
  const savingsPct = Math.round(summary.goals.savings_total_allocated || 0)
  const savingsAmount = Math.round((savingsPct / 100) * monthlyIncome)

  // Investing: locked % is stored as % of income
  const investingPct = Math.round(summary.goals.investing?.allocation_pct || 0)
  const investingAmount = Math.round((investingPct / 100) * monthlyIncome)

  // Unallocated: whatever is left (all in % of income)
  const allocatedPct = spendingPct + savingsPct + investingPct
  const unallocatedPct = Math.max(0, 100 - allocatedPct)
  const unallocatedAmount = Math.round((unallocatedPct / 100) * monthlyIncome)

  // The four slices of income, read the same way by the phone list and the
  // wide-screen pillars below.
  const allocationRows = [
    {
      key: 'spending', label: 'Spending Limit', color: '#ff9817', pct: spendingPct,
      detail: spendingLimit > 0 ? `$${Math.round(spendingAmount).toLocaleString()} limit` : 'Not set',
    },
    {
      key: 'saving', label: 'Saving', color: '#1a6b3a', pct: savingsPct,
      detail: savingsAmount > 0 ? `$${Math.round(savingsAmount).toLocaleString()} locked` : 'Not set',
    },
    {
      key: 'investing', label: 'Investing', color: '#4c49c9', pct: investingPct,
      detail: investingAmount > 0 ? `$${Math.round(investingAmount).toLocaleString()} locked` : 'Not set',
    },
    {
      key: 'unallocated', label: 'Unallocated', color: null, pct: unallocatedPct,
      detail: `$${Math.round(unallocatedAmount).toLocaleString()} free`,
    },
  ]

  // This Month derived data
  const thisMonthIncome = summary.spending.monthly_income
  const thisMonthSpending = summary.spending.monthly_spending
  const thisMonthNet = summary.spending.net_cash_flow
  const thisMonthSavingsRate = thisMonthIncome > 0 ? Math.round((thisMonthNet / thisMonthIncome) * 100) : 0

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Dashboard" />

      <div className="flex-1 px-4 sm:px-8 pb-10 flex flex-col gap-6">
        {/* ── This Month ──────────────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} className="text-on-surface-variant" />
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Monthly</p>
          </div>

          {/* Three stat pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            {/* Income */}
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet size={14} className="text-on-surface-variant" />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Income</p>
              </div>
              <p className="text-title-lg sm:text-headline-md font-bold text-on-surface tabular-nums">
                ${Math.round(thisMonthIncome).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">total monthly</p>
            </div>

            {/* Spending */}
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                {thisMonthSpending > thisMonthIncome
                  ? <TrendingUp size={14} className="text-error" />
                  : <TrendingDown size={14} className="text-success" />}
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Spending</p>
              </div>
              <p className="text-title-lg sm:text-headline-md font-bold text-on-surface tabular-nums">
                ${Math.round(thisMonthSpending).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {Math.round((thisMonthSpending / thisMonthIncome) * 100)}% of income
              </p>
            </div>

            {/* Saved — takes the full width on a phone rather than leaving a
                hole in the second row. */}
            <div
              className="col-span-2 sm:col-span-1 rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: thisMonthNet >= 0 ? 'rgba(26,107,58,0.08)' : 'rgba(186,26,26,0.08)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <PiggyBank size={14} className={thisMonthNet >= 0 ? 'text-success' : 'text-error'} />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {thisMonthNet >= 0 ? 'Saved' : 'Deficit'}
                </p>
              </div>
              <p
                className="text-title-lg sm:text-headline-md font-bold tabular-nums"
                style={{ color: thisMonthNet >= 0 ? '#1a6b3a' : '#ba1a1a' }}
              >
                ${Math.abs(Math.round(thisMonthNet)).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {thisMonthNet >= 0 ? `${thisMonthSavingsRate}% savings rate` : 'over budget'}
              </p>
            </div>
          </div>

          {/* Recurring expenses — the fixed costs recorded in Income vs. Spending */}
          <div className="mt-5 pt-5 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setShowRecurring(v => !v)}
              disabled={recurringItems.length === 0}
              aria-expanded={showRecurring}
              className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                  <RefreshCw size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Recurring Expenses</p>
                  <p className="text-title-lg sm:text-headline-sm font-bold text-on-surface mt-0.5 tabular-nums">
                    ${recurringTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-label-sm font-normal text-on-surface-variant ml-2">monthly</span>
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-2 text-on-surface-variant shrink-0">
                <span className="text-headline-sm font-bold text-on-surface tabular-nums">
                  {recurringItems.length}
                </span>
                {recurringItems.length > 0 && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showRecurring ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                )}
              </span>
            </button>

            {showRecurring && recurringItems.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {recurringItems.map(item => (
                  <li key={item.name} className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-on-surface truncate">{item.name}</span>
                    <span className="text-body-sm text-on-surface-variant tabular-nums shrink-0">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Investments ─────────────────────────────────────────────────────
            The investments locked in on the Investing page, largest share first. */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-on-surface-variant" />
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Investments</p>
          </div>

          {investments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant px-5 py-8 text-center flex flex-col items-center gap-3">
              <p className="text-body-md text-on-surface-variant">
                You have not chosen any investments yet.
              </p>
              <Link href="/investing" className="text-label-md font-semibold text-secondary hover:underline">
                Choose your investments
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-headline-md font-bold text-on-surface">
                ${investmentsAmount.toLocaleString()}
                <span className="text-label-sm font-normal text-on-surface-variant ml-2">monthly</span>
              </p>

              {/* Share of the investing total held by each choice */}
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {investments.map(inv => (
                  <div
                    key={inv.id}
                    className="h-full"
                    style={{ width: `${(inv.pct / investmentsPct) * 100}%`, backgroundColor: inv.color }}
                    title={`${inv.name}: ${inv.pct}%`}
                  />
                ))}
              </div>

              <ul className="flex flex-col gap-2">
                {investments.map(inv => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-container px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: inv.color }} />
                      <div className="min-w-0">
                        <p className="text-body-md text-on-surface truncate">{inv.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{inv.label}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-label-lg font-semibold text-on-surface tabular-nums">{inv.pct}%</p>
                      <p className="text-label-sm text-on-surface-variant tabular-nums">
                        ${Math.round((inv.pct / 100) * monthlyIncome).toLocaleString()}/mo
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Income Allocation Preview */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div className="min-w-0">
              <h3 className="text-headline-sm font-semibold text-on-surface">Income Allocation</h3>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                How your{' '}
                <span className="font-semibold text-on-surface">
                  ${Math.round(monthlyIncome).toLocaleString()}
                </span>{' '}
                monthly income is distributed
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap sm:justify-end sm:flex-shrink-0">
              <p className="text-label-md text-on-surface-variant tabular-nums">
                {allocatedPct}% allocated · {unallocatedPct}% free
              </p>
              {/* Reset allocation */}
              {showResetConfirm ? (
                <div className="flex items-center gap-2 flex-wrap bg-error/8 rounded-lg px-3 py-1.5">
                  <span className="text-label-sm text-error font-medium">Reset all to 0?</span>
                  <button
                    onClick={() => { resetAllocations(); setShowResetConfirm(false) }}
                    className="text-label-sm font-semibold text-error hover:underline"
                  >
                    Confirm
                  </button>
                  <span className="text-on-surface-variant text-label-sm">·</span>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-label-sm text-on-surface-variant hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error/8"
                  title="Reset all allocations to zero"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Segmented bar */}
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-5">
            {spendingPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${spendingPct}%`, backgroundColor: '#ff9817' }}
                title={`Spending: ${spendingPct}%`}
              />
            )}
            {savingsPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${savingsPct}%`, backgroundColor: '#1a6b3a' }}
                title={`Saving: ${savingsPct}%`}
              />
            )}
            {investingPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${investingPct}%`, backgroundColor: '#4c49c9' }}
                title={`Investing: ${investingPct}%`}
              />
            )}
            {unallocatedPct > 0 && (
              <div
                className="h-full bg-surface-container-high rounded-r-full flex-1 transition-all duration-500"
                title={`Unallocated: ${unallocatedPct}%`}
              />
            )}
          </div>

          {/* Legend. Four columns at phone width crushed each label into its
              own edge, so below sm the same figures read as a plain divided
              list: what it is on the left, the share and the money on the
              right. */}
          <ul className="flex flex-col divide-y divide-outline-variant/25 sm:hidden">
            {allocationRows.map(row => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.color ? '' : 'bg-surface-container-high'}`}
                    style={row.color ? { backgroundColor: row.color } : undefined}
                  />
                  <p className="text-body-md text-on-surface-variant">{row.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-title-md font-bold text-on-surface tabular-nums">{row.pct}%</p>
                  <p className="text-label-md text-on-surface-variant tabular-nums">{row.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden sm:grid grid-cols-4 gap-4">
            {allocationRows.map(row => (
              <div key={row.key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.color ? '' : 'bg-surface-container-high'}`}
                    style={row.color ? { backgroundColor: row.color } : undefined}
                  />
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">{row.label}</p>
                </div>
                <p className="text-headline-sm font-bold text-on-surface tabular-nums">{row.pct}%</p>
                <p className="text-label-sm text-on-surface-variant tabular-nums">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
