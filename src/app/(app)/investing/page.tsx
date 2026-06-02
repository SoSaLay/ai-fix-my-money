'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, CheckCircle2, Upload } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { CircularDial } from '@/components/savings/circular-dial'
import { useDashboardSummary, useInvestingGoal } from '@/hooks/use-data'

export default function InvestingPage() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { goal, loading: goalLoading, updateGoal, updating } = useInvestingGoal()

  const [allocationPct, setAllocationPct] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load existing goal data
  useEffect(() => {
    if (goal) {
      setAllocationPct(Number(goal.allocation_pct))
    }
  }, [goal])

  // Show loading state
  if (summaryLoading || goalLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Investing" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
          <div className="max-w-xl mx-auto w-full h-96 bg-surface-container-lowest rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Investing" />
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <Upload size={28} className="text-secondary" />
            </div>
            <p className="text-headline-sm text-on-surface font-semibold mb-2">No data imported yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Import your financial data to set your investing allocation and track your portfolio.
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

  // All allocations from monthly income (the unified 100% baseline)
  const monthlyIncome = summary.spending.monthly_income

  // Cross-category: locked spending and savings as % of income
  const lockedSpendingPct = summary.spending.spending_limit
    ? Math.round((summary.spending.spending_limit.limit / monthlyIncome) * 100)
    : 0
  const totalSavingsPct = Math.round(summary.goals.savings_total_allocated || 0)
  const maxInvestingPct = Math.max(0, 100 - lockedSpendingPct - totalSavingsPct)

  // Dollar amounts from monthly income
  const savingsAmount = Math.round((totalSavingsPct / 100) * monthlyIncome)
  const investingAmount = Math.round((allocationPct / 100) * monthlyIncome)

  // Remaining unallocated after all three categories
  const allocatedPct = lockedSpendingPct + totalSavingsPct + allocationPct
  const availableLiquidity = Math.round(((100 - allocatedPct) / 100) * monthlyIncome)

  const handleLockIn = async () => {
    const success = await updateGoal({
      allocation_pct: allocationPct,
      risk_profile: 'moderate',
    })
    if (success) {
      setHasUnsavedChanges(false)
    }
  }

  const handleAllocationChange = (newPct: number) => {
    setAllocationPct(Math.min(newPct, maxInvestingPct))
    setHasUnsavedChanges(true)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Investing" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Main investing card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 flex flex-col items-center gap-8 max-w-xl mx-auto w-full">
          {/* Monthly Income — the allocation base */}
          <div className="w-full">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              Monthly Income
            </p>
            <p className="text-display-sm font-bold text-on-surface mt-1">
              ${Math.round(monthlyIncome).toLocaleString()}
            </p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              {maxInvestingPct}% available after spending &amp; savings
            </p>
          </div>

          {/* Circular dial — investing allocation */}
          <CircularDial
            lockedPct={0}
            freePct={allocationPct}
            dollarAmount={investingAmount}
            onChange={handleAllocationChange}
            maxFreePct={maxInvestingPct}
            freeColor="#4c49c9"
            size={260}
          />

          {/* Allocation breakdown */}
          <div className="w-full bg-surface-container-low rounded-2xl p-4 flex flex-col gap-3">
            {lockedSpendingPct > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-label-md text-on-surface-variant">Locked for spending ({lockedSpendingPct}%)</p>
                <p className="text-label-md font-semibold text-on-surface">
                  −${Math.round((lockedSpendingPct / 100) * monthlyIncome).toLocaleString()}
                </p>
              </div>
            )}
            {totalSavingsPct > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-label-md text-on-surface-variant">Locked for savings ({totalSavingsPct}%)</p>
                <p className="text-label-md font-semibold text-on-surface">
                  −${savingsAmount.toLocaleString()}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-label-md text-on-surface-variant">Locking for investing ({allocationPct}%)</p>
              <p className="text-label-md font-semibold text-on-surface">
                −${investingAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-full h-px bg-outline-variant/40" />
            <div className="flex items-center justify-between">
              <p className="text-label-md font-semibold text-on-surface">Unallocated</p>
              <p
                className="text-headline-sm font-bold"
                style={{ color: availableLiquidity >= 0 ? '#1a6b3a' : '#ba1a1a' }}
              >
                ${Math.abs(availableLiquidity).toLocaleString()}
                {availableLiquidity < 0 && <span className="text-label-sm font-normal ml-1">over</span>}
              </p>
            </div>
          </div>

          {/* Lock In button */}
          <button
            onClick={handleLockIn}
            disabled={!hasUnsavedChanges || updating}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-label-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: hasUnsavedChanges ? '#1c1b1f' : 'rgba(28,27,31,0.06)',
              color: hasUnsavedChanges ? '#ffffff' : '#49454f',
            }}
          >
            {updating ? (
              'Locking in…'
            ) : hasUnsavedChanges ? (
              <>
                <Lock size={16} />
                Lock In Investment Plan
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Investment Plan Locked
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
