'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock, Unlock, TrendingUp, Upload } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { SummaryBar } from '@/components/spending/summary-bar'
import { RecurringCard } from '@/components/spending/recurring-card'
import { TransactionTable } from '@/components/spending/transaction-table'
import { HorizontalLimitBar } from '@/components/spending/horizontal-limit-bar'
import type { TableTransaction } from '@/components/spending/transaction-table'
import { useDashboardSummary, useTransactions, useSpendingLimit } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'

function getBudgetColor(pct: number): string {
  if (pct <= 60) return '#1a6b3a'
  if (pct <= 85) return '#ff9817'
  return '#ba1a1a'
}

export default function SpendingPage() {
  const { hasData } = useFinancialData()
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { transactions, loading: txLoading } = useTransactions({ limit: 50 })
  const { data: spendingLimitData, updateLimit, updating } = useSpendingLimit()

  // Spending limit as % of MONTHLY INCOME (the true capacity ceiling)
  const [spendingLimitPct, setSpendingLimitPct] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initializedRef = useRef(false)

  // Initialize once from saved data — guard prevents re-running on every render
  // (spendingLimitData is a new object reference each render, so without this guard
  //  the effect would re-lock immediately after the user clicks Unlock)
  useEffect(() => {
    if (initializedRef.current) return
    if (spendingLimitData?.hasLimit && spendingLimitData.limit && summary) {
      const income = summary.spending.monthly_income
      if (income > 0) {
        const pct = Math.round((spendingLimitData.limit.amount / income) * 100)
        setSpendingLimitPct(Math.min(pct, 100))
        setIsLocked(true)
        initializedRef.current = true
      }
    }
  }, [spendingLimitData, summary])

  // Show loading state
  if (summaryLoading || txLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Spending Analytics" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
          <div className="h-20 bg-surface-container-lowest rounded-2xl animate-pulse" />
          <div className="h-80 bg-surface-container-lowest rounded-2xl animate-pulse" />
          <div className="h-48 bg-surface-container-lowest rounded-2xl animate-pulse" />
          <div className="h-96 bg-surface-container-lowest rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!hasData || !summary) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Spending Analytics" />
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <Upload size={28} className="text-secondary" />
            </div>
            <p className="text-headline-sm text-on-surface font-semibold mb-2">No data imported yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Import your financial data to see spending analytics and set a monthly budget.
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

  // Extract data
  const monthlyIncome = summary.spending.monthly_income
  const monthlySpending = summary.spending.monthly_spending
  const netCashFlow = summary.spending.net_cash_flow

  // Cross-category: locked savings and investing as % of income
  const lockedSavingsPct = Math.round(summary.goals.savings_total_allocated || 0)
  const lockedInvestingPct = Math.round(summary.goals.investing?.allocation_pct || 0)
  const maxSpendingPct = Math.max(0, 100 - lockedSavingsPct - lockedInvestingPct)

  // Limit based on monthly income — the true ceiling
  const spendingLimitAmount = Math.round((monthlyIncome * spendingLimitPct) / 100)
  const budgetPct = spendingLimitAmount > 0
    ? Math.round((monthlySpending / spendingLimitAmount) * 100)
    : 0
  const budgetRemaining = spendingLimitAmount - monthlySpending
  const barColor = getBudgetColor(budgetPct)

  const handleLockIn = async () => {
    const success = await updateLimit(spendingLimitAmount, 'monthly')
    if (success) {
      setHasUnsavedChanges(false)
      setIsLocked(true)
    }
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setHasUnsavedChanges(false)
  }

  const handleBarChange = (newPct: number) => {
    setSpendingLimitPct(Math.min(newPct, maxSpendingPct))
    setHasUnsavedChanges(true)
  }


  // All transactions for table
  const formattedTransactions: TableTransaction[] = transactions.map(tx => ({
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
      <TopNav title="Spending Analytics" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Summary bar — Income / Spending / Monthly Net Income */}
        <SummaryBar
          income={monthlyIncome}
          spending={monthlySpending}
          netIncome={netCashFlow}
        />

        {/* Spending Limit Setter */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-headline-sm font-semibold text-on-surface">
                Spending Limit Calculator
              </h3>
            </div>

            {/* Unlock button — only visible when locked */}
            {isLocked && (
              <button
                onClick={handleUnlock}
                className="flex items-center gap-1.5 text-label-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex-shrink-0 ml-4"
                style={{ background: 'rgba(28,27,31,0.06)', color: '#49454f' }}
              >
                <Unlock size={13} />
                Unlock
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {/* Cross-category allocation info */}
            {(lockedSavingsPct > 0 || lockedInvestingPct > 0) && (
              <div className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3 text-label-sm">
                <span className="text-on-surface-variant">
                  {lockedSavingsPct > 0 && `${lockedSavingsPct}% savings`}
                  {lockedSavingsPct > 0 && lockedInvestingPct > 0 && ' · '}
                  {lockedInvestingPct > 0 && `${lockedInvestingPct}% investing`}
                  {' '}already allocated
                </span>
                <span className="font-semibold text-on-surface">
                  {maxSpendingPct}% available for spending
                </span>
              </div>
            )}

            <HorizontalLimitBar
              pct={spendingLimitPct}
              dollarAmount={spendingLimitAmount}
              currentSpendingPct={budgetPct}
              onChange={handleBarChange}
              disabled={isLocked}
            />

            {/* Projected net income based on selected cap */}
            <div className="flex items-center justify-between bg-surface-container rounded-2xl px-5 py-4">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Projected Monthly Net Income
                </p>
                <p className="text-label-sm text-on-surface-variant mt-0.5">
                  If you stay within this spending cap
                </p>
              </div>
              <p
                className="text-headline-md font-bold"
                style={{ color: monthlyIncome - spendingLimitAmount >= 0 ? '#1a6b3a' : '#ba1a1a' }}
              >
                ${Math.abs(monthlyIncome - spendingLimitAmount).toLocaleString()}
                {monthlyIncome - spendingLimitAmount < 0 && (
                  <span className="text-label-sm font-normal ml-1">deficit</span>
                )}
              </p>
            </div>

            {/* Lock button — hidden when already locked */}
            {!isLocked && (
              <button
                onClick={handleLockIn}
                disabled={!hasUnsavedChanges || updating}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-label-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: hasUnsavedChanges ? '#1c1b1f' : 'rgba(28,27,31,0.06)',
                  color: hasUnsavedChanges ? '#ffffff' : '#49454f',
                }}
              >
                {updating ? 'Locking in…' : <><Lock size={16} /> Lock In Spending Limit</>}
              </button>
            )}
          </div>
        </div>

        {/* Recurring subscriptions */}
        <RecurringCard />

        {/* Transactions — unified card with budget bar in header */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          {/* Card header: spending total + budget progress */}
          <div className="px-6 pt-6 pb-5 border-b border-outline-variant/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Monthly Spending
                </p>
                <div className="flex items-end gap-3">
                  <p className="text-display-sm font-bold text-on-surface">
                    ${Math.round(monthlySpending).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {/* vs-last-month chip placeholder */}
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold mb-1"
                    style={{
                      backgroundColor: 'rgba(186,26,26,0.10)',
                      color: '#ba1a1a',
                    }}
                  >
                    <TrendingUp size={12} />
                    This month
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant mb-1">
                  {budgetPct}% of budget used
                </p>
                <p
                  className="text-label-md font-semibold"
                  style={{ color: barColor }}
                >
                  {budgetRemaining > 0
                    ? `$${Math.round(budgetRemaining).toLocaleString()} remaining`
                    : `$${Math.round(-budgetRemaining).toLocaleString()} over limit`}
                </p>
              </div>
            </div>

            {/* Budget progress bar */}
            <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          {/* Transaction table */}
          <div className="p-6 pt-4">
            {formattedTransactions.length > 0 ? (
              <TransactionTable transactions={formattedTransactions} />
            ) : (
              <div className="py-10 text-center">
                <p className="text-body-md text-on-surface-variant">No transactions found</p>
                <p className="text-label-sm text-on-surface-variant mt-2">
                  Connect an account to start tracking your spending
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
