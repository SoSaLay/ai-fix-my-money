'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { CircularDial } from '@/components/savings/circular-dial'
import { GoalsList } from '@/components/savings/goals-list'
import { RecentTransfers } from '@/components/savings/recent-transfers'
import type { Transfer } from '@/components/savings/recent-transfers'
import { useDashboardSummary, useSavingsGoals } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'

const GOALS_COLOR   = '#11d4bf'
const GENERAL_COLOR = '#1a6b3a'

export default function SavingsPage() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { goals, loading: goalsLoading, updateGoal, deleteGoal, createGoal, updating } = useSavingsGoals()
  const { generalSavingsPct: savedGeneralPct, setGeneralSavings } = useFinancialData()

  const [generalSavingsPct, setGeneralSavingsPct] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initializedRef = useRef(false)

  // goalsAllocationPct: sum of active goal allocations (% of income)
  const goalsAllocationPct = goals.reduce((sum, g) => sum + Number(g.allocation_pct || 0), 0)

  // Cross-category caps (derived safely before summary guard)
  const monthlyIncome = summary?.spending.monthly_income ?? 0
  const lockedSpendingPct = summary?.spending.spending_limit
    ? Math.round((summary.spending.spending_limit.limit / monthlyIncome) * 100)
    : 0
  const lockedInvestingPct = Math.round(summary?.goals.investing?.allocation_pct || 0)
  const maxTotalSavingsPct = Math.max(0, 100 - lockedSpendingPct - lockedInvestingPct)
  const maxGeneralPct = Math.max(0, maxTotalSavingsPct - goalsAllocationPct)

  // Initialize from persisted value once data is available
  useEffect(() => {
    if (initializedRef.current) return
    if (savedGeneralPct > 0) {
      setGeneralSavingsPct(savedGeneralPct)
      setIsLocked(true)
      initializedRef.current = true
    }
  }, [savedGeneralPct])

  // Clamp when caps change due to other allocations being updated
  useEffect(() => {
    setGeneralSavingsPct(prev => Math.min(prev, maxGeneralPct))
  }, [maxGeneralPct])

  if (summaryLoading || goalsLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Savings Strategy" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-96 bg-surface-container-lowest rounded-2xl animate-pulse" />
            <div className="h-96 bg-surface-container-lowest rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return <div>Error loading data</div>
  }

  const totalAllocationPct = goalsAllocationPct + generalSavingsPct
  const totalSavingsAmount = Math.round((totalAllocationPct / 100) * monthlyIncome)
  const goalsAmount = Math.round((goalsAllocationPct / 100) * monthlyIncome)
  const generalAmount = Math.round((generalSavingsPct / 100) * monthlyIncome)

  const handleLockIn = () => {
    setGeneralSavings(generalSavingsPct)
    setHasUnsavedChanges(false)
    setIsLocked(true)
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setHasUnsavedChanges(false)
  }

  const handleDialChange = (newFreePct: number) => {
    setGeneralSavingsPct(newFreePct)
    setHasUnsavedChanges(true)
  }

  const recentTransfers: Transfer[] = []

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Savings Strategy" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left: allocation panel */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col items-center gap-6">
            {/* Header row with net cash flow + corner lock/unlock */}
            <div className="w-full flex items-start justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Monthly Income
                </p>
                <p className="text-display-sm font-bold text-on-surface mt-1">
                  ${Math.round(monthlyIncome).toLocaleString()}
                </p>
              </div>

              {/* Corner lock / unlock */}
              {isLocked ? (
                <button
                  onClick={handleUnlock}
                  className="flex items-center gap-1.5 text-label-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex-shrink-0 ml-4"
                  style={{ background: 'rgba(28,27,31,0.06)', color: '#49454f' }}
                >
                  <Unlock size={13} />
                  Unlock
                </button>
              ) : hasUnsavedChanges ? (
                <button
                  onClick={handleLockIn}
                  disabled={updating}
                  className="flex items-center gap-1.5 text-label-sm font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95 flex-shrink-0 ml-4 disabled:opacity-50"
                  style={{ background: '#1c1b1f', color: '#ffffff' }}
                >
                  <Lock size={13} />
                  {updating ? 'Locking…' : 'Lock In'}
                </button>
              ) : null}
            </div>

            <CircularDial
              lockedPct={goalsAllocationPct}
              freePct={generalSavingsPct}
              dollarAmount={totalSavingsAmount}
              onChange={isLocked ? () => {} : handleDialChange}
              maxFreePct={maxGeneralPct}
              size={220}
            />

            {/* Legend — always shows both tiers so users can see the two-part split */}
            <div className="w-full flex flex-col gap-2">
              {/* Savings Goals — lighter green locked arc */}
              <div className="flex items-center justify-between text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: GOALS_COLOR }} />
                  <span className="text-on-surface-variant">Savings Goals</span>
                </div>
                <span className="font-semibold text-on-surface">
                  {goalsAllocationPct > 0
                    ? `${goalsAllocationPct}% · $${goalsAmount.toLocaleString()}`
                    : <span className="text-on-surface-variant font-normal">Not set — add a goal →</span>
                  }
                </span>
              </div>

              {/* General Savings — draggable dark green arc */}
              <div className="flex items-center justify-between text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: GENERAL_COLOR }} />
                  <span className="text-on-surface-variant">General Savings</span>
                </div>
                <span className="font-semibold text-on-surface">
                  {generalSavingsPct > 0
                    ? `${generalSavingsPct}% · $${generalAmount.toLocaleString()}`
                    : <span className="text-on-surface-variant font-normal">Drag the dial to set</span>
                  }
                </span>
              </div>

              {/* Total */}
              {totalAllocationPct > 0 && (
                <div className="flex items-center justify-between text-label-sm pt-2 border-t border-outline-variant/30 mt-1">
                  <span className="text-on-surface-variant">Total Savings</span>
                  <span className="font-semibold text-on-surface">
                    {totalAllocationPct}% · ${totalSavingsAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: goals list */}
          <GoalsList
            goals={goals}
            monthlyIncome={monthlyIncome}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
            onCreate={createGoal}
            updating={updating}
          />
        </div>

        {/* Recent transfers */}
        {recentTransfers.length > 0 ? (
          <RecentTransfers transfers={recentTransfers} />
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 text-center">
            <p className="text-body-md text-on-surface-variant">No recent transfers</p>
            <p className="text-label-sm text-on-surface-variant mt-2">
              Your savings transfers will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
