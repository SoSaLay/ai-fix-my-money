'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, RefreshCw, Upload, Calendar, Wallet, PiggyBank, RotateCcw } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import type { Transaction } from '@/components/dashboard/recent-activity'
import { useDashboardSummary, useTransactions } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'

export default function DashboardPage() {
  const { hasData, resetAllocations } = useFinancialData()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { data: summary, loading, error, refresh } = useDashboardSummary()
  const { transactions: recentTransactions, loading: txLoading } = useTransactions({ limit: 5 })

  // Stable date strings for 7-day window
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return d.toISOString().split('T')[0]
  }, [])

  const { transactions: weeklyTransactions } = useTransactions({
    startDate: sevenDaysAgoStr,
    endDate: todayStr,
  })

  // Recurring transactions from the 7-day window
  const recurringItems = useMemo(
    () => weeklyTransactions
      .filter(tx => tx.amount > 0 && tx.is_recurring)
      .reduce<Array<{ name: string; amount: number }>>((acc, tx) => {
        const name = tx.merchant_name || tx.name
        const existing = acc.find(i => i.name === name)
        if (existing) {
          existing.amount += tx.amount
        } else {
          acc.push({ name, amount: tx.amount })
        }
        return acc
      }, [])
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6),
    [weeklyTransactions],
  )
  const recurringTotal = recurringItems.reduce((sum, i) => sum + i.amount, 0)

  // Top variable categories for this month
  const topCategories = useMemo(() => {
    if (!summary) return []
    const combined: Record<string, number> = {}
    recentTransactions
      .filter(tx => tx.amount > 0)
      .forEach(tx => {
        const cat = tx.personal_finance_category || tx.plaid_category || 'Other'
        combined[cat] = (combined[cat] ?? 0) + tx.amount
      })
    return Object.entries(combined)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
  }, [recentTransactions, summary])

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Dashboard" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-64 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-14 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-40 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 h-64 animate-pulse" />
        </div>
      </div>
    )
  }

  // No data imported yet
  if (!hasData || !summary) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Dashboard" />
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <Upload size={28} className="text-secondary" />
            </div>
            <p className="text-headline-sm text-on-surface font-semibold mb-2">No data imported yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Use Perplexity AI to fetch your financial data, then import it here to see your dashboard.
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-label-lg transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}
            >
              <Upload size={16} />
              Import Financial Data
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const monthlyIncome = summary.spending.monthly_income
  const monthlySpending = summary.spending.monthly_spending
  const netCashFlow = summary.spending.net_cash_flow
  const spendingLimit = summary.spending.spending_limit?.limit || 0

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

  // This Month derived data
  const thisMonthIncome = summary.spending.monthly_income
  const thisMonthSpending = summary.spending.monthly_spending
  const thisMonthNet = summary.spending.net_cash_flow
  const thisMonthSavingsRate = thisMonthIncome > 0 ? Math.round((thisMonthNet / thisMonthIncome) * 100) : 0

  const formattedTransactions: Transaction[] = recentTransactions.map(tx => ({
    id: tx.id,
    merchant_name: tx.merchant_name || tx.name,
    name: tx.name,
    plaid_category: tx.plaid_category || 'Uncategorized',
    amount: tx.amount,
    transaction_date: tx.transaction_date,
    pending: tx.pending,
  }))

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Dashboard" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* ── This Month ──────────────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} className="text-on-surface-variant" />
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">This Month</p>
            <span className="ml-auto text-label-sm text-on-surface-variant">
              {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Three stat pillars */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* Income */}
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet size={14} className="text-on-surface-variant" />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Income</p>
              </div>
              <p className="text-headline-md font-bold text-on-surface">
                ${Math.round(thisMonthIncome).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">total this month</p>
            </div>

            {/* Spending */}
            <div className="bg-surface-container rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-1">
                {thisMonthSpending > thisMonthIncome
                  ? <TrendingUp size={14} className="text-error" />
                  : <TrendingDown size={14} className="text-success" />}
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Spending</p>
              </div>
              <p className="text-headline-md font-bold text-on-surface">
                ${Math.round(thisMonthSpending).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {Math.round((thisMonthSpending / thisMonthIncome) * 100)}% of income
              </p>
            </div>

            {/* Saved */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: thisMonthNet >= 0 ? 'rgba(26,107,58,0.08)' : 'rgba(186,26,26,0.08)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <PiggyBank size={14} className={thisMonthNet >= 0 ? 'text-success' : 'text-error'} />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {thisMonthNet >= 0 ? 'Saved' : 'Deficit'}
                </p>
              </div>
              <p
                className="text-headline-md font-bold"
                style={{ color: thisMonthNet >= 0 ? '#1a6b3a' : '#ba1a1a' }}
              >
                ${Math.abs(Math.round(thisMonthNet)).toLocaleString()}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {thisMonthNet >= 0 ? `${thisMonthSavingsRate}% savings rate` : 'over budget'}
              </p>
            </div>
          </div>

          {/* Top categories */}
          {topCategories.length > 0 && (
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Top Categories</p>
              <div className="flex flex-col gap-2">
                {topCategories.map(cat => {
                  const barPct = thisMonthSpending > 0 ? Math.round((cat.amount / thisMonthSpending) * 100) : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <p className="text-body-sm text-on-surface w-36 truncate">{cat.name}</p>
                      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%`, backgroundColor: '#4c49c9' }}
                        />
                      </div>
                      <p className="text-label-sm text-on-surface-variant w-16 text-right">
                        ${cat.amount.toLocaleString()}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recurring Expenses */}
          <div className="mt-5 pt-5 border-t border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                <RefreshCw size={16} />
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Recurring Expenses</p>
                <p className="text-headline-sm font-bold text-on-surface mt-0.5">
                  ${recurringTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-label-sm font-normal text-on-surface-variant ml-2">this week</span>
                </p>
              </div>
            </div>
            <span className="text-label-md text-on-surface-variant">
              {recurringItems.length} active subscription{recurringItems.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Income Allocation Preview */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-headline-sm font-semibold text-on-surface">Income Allocation</h3>
              <p className="text-label-sm text-on-surface-variant mt-0.5">
                How your{' '}
                <span className="font-semibold text-on-surface">
                  ${Math.round(monthlyIncome).toLocaleString()}
                </span>{' '}
                monthly income is distributed
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <p className="text-label-sm text-on-surface-variant">
                {allocatedPct}% allocated · {unallocatedPct}% free
              </p>
              {/* Reset allocation */}
              {showResetConfirm ? (
                <div className="flex items-center gap-2 bg-error/8 rounded-lg px-3 py-1.5">
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

          {/* Legend */}
          <div className="grid grid-cols-4 gap-4">
            {/* Spending */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#ff9817' }} />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Spending Limit</p>
              </div>
              <p className="text-headline-sm font-bold text-on-surface">{spendingPct}%</p>
              <p className="text-label-sm text-on-surface-variant">
                {spendingLimit > 0
                  ? `$${Math.round(spendingAmount).toLocaleString()} limit`
                  : 'Not set'}
              </p>
            </div>

            {/* Saving */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#1a6b3a' }} />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Saving</p>
              </div>
              <p className="text-headline-sm font-bold text-on-surface">{savingsPct}%</p>
              <p className="text-label-sm text-on-surface-variant">
                {savingsAmount > 0
                  ? `$${Math.round(savingsAmount).toLocaleString()} locked`
                  : 'Not set'}
              </p>
            </div>

            {/* Investing */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#4c49c9' }} />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Investing</p>
              </div>
              <p className="text-headline-sm font-bold text-on-surface">{investingPct}%</p>
              <p className="text-label-sm text-on-surface-variant">
                {investingAmount > 0
                  ? `$${Math.round(investingAmount).toLocaleString()} locked`
                  : 'Not set'}
              </p>
            </div>

            {/* Unallocated */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-surface-container-high flex-shrink-0" />
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Unallocated</p>
              </div>
              <p className="text-headline-sm font-bold text-on-surface">{unallocatedPct}%</p>
              <p className="text-label-sm text-on-surface-variant">
                ${Math.round(unallocatedAmount).toLocaleString()} free
              </p>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity transactions={formattedTransactions} />
      </div>
    </div>
  )
}
