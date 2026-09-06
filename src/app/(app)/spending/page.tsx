'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock, Unlock } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { SummaryBar } from '@/components/spending/summary-bar'
import { HorizontalLimitBar } from '@/components/spending/horizontal-limit-bar'
import { useDashboardSummary, useSpendingLimit } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'
import { SectionGate } from '@/components/learning/section-gate'
import { ProfileEntry } from '@/components/entry/profile-entry'

function SpendingPageTool() {
  const { hasData } = useFinancialData()
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
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
  if (summaryLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Income vs. Spending" />
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
        <TopNav title="Income vs. Spending" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-5 max-w-2xl">
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            Record what comes in and what goes out. The analytics below build
            themselves from what you enter here.
          </p>
          <ProfileEntry section="income" />
          <ProfileEntry section="fixed" />
          <ProfileEntry section="variable" />
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



  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Income vs. Spending" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Entry panels — everything below is derived from these */}
        <div className="grid gap-4 md:grid-cols-3">
          <ProfileEntry section="income" />
          <ProfileEntry section="fixed" />
          <ProfileEntry section="variable" />
        </div>

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
            {/* Why the slider stops short of 100% */}
            {maxSpendingPct < 100 && (
              <div className="bg-surface-container rounded-xl px-4 py-3">
                <p className="text-label-md text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface">
                    {100 - maxSpendingPct}% of your income is already committed
                  </span>
                  {' — '}
                  {lockedSavingsPct > 0 && `${lockedSavingsPct}% to savings goals`}
                  {lockedSavingsPct > 0 && lockedInvestingPct > 0 && ' and '}
                  {lockedInvestingPct > 0 && `${lockedInvestingPct}% to investing`}
                  , so this cap stops at {maxSpendingPct}%. Change those on the{' '}
                  <Link href="/savings" className="text-secondary underline underline-offset-2">
                    Savings
                  </Link>
                  {lockedInvestingPct > 0 && (
                    <>
                      {' and '}
                      <Link href="/investing" className="text-secondary underline underline-offset-2">
                        Investing
                      </Link>
                    </>
                  )}
                  {' '}page{lockedInvestingPct > 0 ? 's' : ''} to free up more.
                </p>
              </div>
            )}

            <HorizontalLimitBar
              pct={spendingLimitPct}
              dollarAmount={spendingLimitAmount}
              currentSpendingPct={budgetPct}
              onChange={handleBarChange}
              disabled={isLocked}
            />

            {/* What the cap leaves over, and what that money is for */}
            <ProjectedNet leftover={monthlyIncome - spendingLimitAmount} />

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
      </div>
    </div>
  )
}

/**
 * What the chosen cap leaves over each month, said in money and in plain
 * words: a figure on the left, what it means on the right.
 */
function ProjectedNet({ leftover }: { leftover: number }) {
  const short = leftover < 0
  const color = short ? '#ba1a1a' : '#1a6b3a'
  const money = (n: number) =>
    `$${Math.abs(Math.round(n)).toLocaleString('en-US')}`

  const rows = short
    ? [
        {
          value: money(leftover),
          unit: 'short each month',
          text: 'This cap spends more than comes in. Lower it until the number turns positive, or the gap comes out of savings or onto a card.',
        },
        {
          value: money(leftover * 12),
          unit: 'over a year',
          text: 'What that monthly gap adds up to if nothing changes.',
        },
      ]
    : [
        {
          value: money(leftover),
          unit: 'left each month',
          text: 'Money that isn’t spoken for — what you could put toward savings, investments, travel, or paying down debt faster.',
        },
        {
          value: money(leftover * 12),
          unit: 'over a year',
          text: 'The same amount, twelve months on, if you hold this cap.',
        },
      ]

  return (
    <div className="bg-surface-container rounded-2xl overflow-hidden">
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-5 pt-4">
        If you stay within this cap
      </p>

      <table className="w-full mt-2">
        <tbody>
          {rows.map(row => (
            <tr key={row.unit} className="border-t border-outline-variant/25 first:border-0">
              <td className="align-top px-5 py-3.5 w-[38%] min-w-[132px]">
                <p className="text-headline-md font-bold leading-tight" style={{ color }}>
                  {row.value}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-0.5">{row.unit}</p>
              </td>
              <td className="align-top px-5 py-3.5">
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {row.text}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// The tool is gated behind its learning track — see SectionGate.
export default function SpendingPage() {
  return (
    <SectionGate trackId="spending">
      <SpendingPageTool />
    </SectionGate>
  )
}
