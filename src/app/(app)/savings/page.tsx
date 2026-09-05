'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock, Unlock, Upload } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { CircularDial } from '@/components/savings/circular-dial'
import { GoalsList } from '@/components/savings/goals-list'
import { useDashboardSummary, useSavingsGoals } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'
import { SectionGate } from '@/components/learning/section-gate'

const GOALS_COLOR   = '#11d4bf'
const GENERAL_COLOR = '#1a6b3a'

function SavingsPageTool() {
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
  const spendingLimitAmount = summary?.spending.spending_limit?.limit ?? 0
  const lockedSpendingPct = monthlyIncome > 0
    ? Math.round((spendingLimitAmount / monthlyIncome) * 100)
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
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Savings Strategy" />
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <Upload size={28} className="text-secondary" />
            </div>
            <p className="text-headline-sm text-on-surface font-semibold mb-2">Nothing recorded yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Work through the Savings track — you’ll set your goals and allocation as you go.
            </p>
            <Link
              href="/learning/savings"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-label-lg transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}
            >
              <Upload size={16} />
              Go to the Savings track
            </Link>
          </div>
        </div>
      </div>
    )
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

            <CommittedAllocations
              monthlyIncome={monthlyIncome}
              spendingPct={lockedSpendingPct}
              spendingAmount={spendingLimitAmount}
              investingPct={lockedInvestingPct}
            />
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

      </div>
    </div>
  )
}

/**
 * Income already committed elsewhere — the reason the dial has a ceiling.
 * Figures only; the numbers say it.
 */
function CommittedAllocations({
  monthlyIncome, spendingPct, spendingAmount, investingPct,
}: {
  monthlyIncome: number
  spendingPct: number
  spendingAmount: number
  investingPct: number
}) {
  if (spendingPct === 0 && investingPct === 0) return null

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const investingAmount = Math.round((investingPct / 100) * monthlyIncome)

  return (
    <div className="w-full border-t border-outline-variant/30 pt-4">
      <table className="w-full text-label-sm">
        <tbody>
          {spendingPct > 0 && (
            <tr>
              <td className="py-1.5 text-on-surface-variant">Spending limit</td>
              <td className="py-1.5 text-right font-semibold text-on-surface whitespace-nowrap">
                {spendingPct}% · {money(spendingAmount)}
              </td>
            </tr>
          )}

          {investingPct > 0 && (
            <tr>
              <td className="py-1.5 text-on-surface-variant">Investing</td>
              <td className="py-1.5 text-right font-semibold text-on-surface whitespace-nowrap">
                {investingPct}% · {money(investingAmount)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// The tool is gated behind its learning track — see SectionGate.
export default function SavingsPage() {
  return (
    <SectionGate trackId="savings">
      <SavingsPageTool />
    </SectionGate>
  )
}
