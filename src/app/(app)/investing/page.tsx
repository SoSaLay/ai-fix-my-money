'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { EmptyState } from '@/components/layout/empty-state'
import { CircularDial } from '@/components/savings/circular-dial'
import { AllocationList } from '@/components/investing/allocation-list'
import { useDashboardSummary, useInvestingGoal } from '@/hooks/use-data'
import { SectionGate } from '@/components/learning/section-gate'
import {
  knownAllocations,
  riskProfileFor,
  totalCategoryPct,
  type CategoryAllocations,
  type CustomAllocation,
  type InvestmentCategoryId,
} from '@/lib/investing/categories'

const CATEGORIES_COLOR = '#4c49c9'

/**
 * Every percent going to investing is put behind a named investment — one from
 * the list, or one the learner writes in under Other. There is no unnamed
 * remainder: money allocated to investing is money allocated to something.
 *
 * The dial shows the total. It is set from the list, not dragged.
 */
function InvestingPageTool() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { goal, loading: goalLoading, updateGoal, updating } = useInvestingGoal()

  const [allocations, setAllocations] = useState<CategoryAllocations>({})
  const [custom, setCustom] = useState<CustomAllocation[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const loadedRef = useRef(false)

  // Load the stored plan once. Categories no longer offered, and any old
  // unnamed "general" share, are dropped rather than carried as money nobody
  // can see or edit.
  useEffect(() => {
    if (loadedRef.current || !goal) return
    const stored = knownAllocations(goal.categories)
    const storedCustom = goal.custom ?? []
    setAllocations(stored)
    setCustom(storedCustom)
    setIsLocked(totalCategoryPct(stored, storedCustom) > 0)
    loadedRef.current = true
  }, [goal])

  if (summaryLoading || goalLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Investing" />
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
        <TopNav title="Investing" />
        <EmptyState
          image="/onboarding/waiting.svg"
          title="Nothing here yet."
          body="Add your income and spending first. Investing works from those numbers."
          action={{ href: '/spending', label: 'Go to Income vs. Spending' }}
        />
      </div>
    )
  }

  const monthlyIncome = summary.spending.monthly_income

  // What the other two categories have already taken. Investing gets the rest.
  const lockedSpendingPct = summary.spending.spending_limit && monthlyIncome > 0
    ? Math.round((summary.spending.spending_limit.limit / monthlyIncome) * 100)
    : 0
  const totalSavingsPct = Math.round(summary.goals.savings_total_allocated || 0)
  const maxInvestingPct = Math.max(0, 100 - lockedSpendingPct - totalSavingsPct)

  const totalInvestingPct = totalCategoryPct(allocations, custom)
  /** What a single row may still claim on top of what it already holds. */
  const headroomPct = Math.max(0, maxInvestingPct - totalInvestingPct)

  const totalInvestingAmount = Math.round((totalInvestingPct / 100) * monthlyIncome)

  const handleCategoryChange = (id: InvestmentCategoryId, pct: number) => {
    setAllocations(prev => {
      const next = { ...prev }
      if (pct <= 0) delete next[id]
      else next[id] = pct
      return next
    })
    setHasUnsavedChanges(true)
  }

  const handleCustomChange = (next: CustomAllocation[]) => {
    setCustom(next)
    setHasUnsavedChanges(true)
  }

  const handleLockIn = async () => {
    const success = await updateGoal({
      allocation_pct: totalInvestingPct,
      risk_profile: riskProfileFor(allocations),
      categories: allocations,
      custom,
    })
    if (success) {
      setHasUnsavedChanges(false)
      setIsLocked(true)
    }
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setHasUnsavedChanges(false)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Investing" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: the allocation panel */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col items-center gap-6">
            <div className="w-full flex items-start justify-between">
              <div>
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

            {/* Display only: the total is set from the list on the right. */}
            <CircularDial
              lockedPct={totalInvestingPct}
              freePct={0}
              dollarAmount={totalInvestingAmount}
              onChange={() => {}}
              maxFreePct={0}
              lockedColor={CATEGORIES_COLOR}
              size={220}
            />

            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: CATEGORIES_COLOR }} />
                  <span className="text-on-surface-variant">Selected investments</span>
                </div>
                <span className="font-semibold text-on-surface">
                  {totalInvestingPct > 0
                    ? `${totalInvestingPct}% · $${totalInvestingAmount.toLocaleString()}/mo`
                    : <span className="text-on-surface-variant font-normal">Not set — select one →</span>
                  }
                </span>
              </div>
            </div>

            <CommittedAllocations
              monthlyIncome={monthlyIncome}
              spendingPct={lockedSpendingPct}
              savingsPct={totalSavingsPct}
            />
          </div>

          {/* Right: the instruments */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <AllocationList
              allocations={allocations}
              custom={custom}
              monthlyIncome={monthlyIncome}
              headroomPct={headroomPct}
              disabled={isLocked}
              onChange={handleCategoryChange}
              onCustomChange={handleCustomChange}
            />
          </div>
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
  monthlyIncome, spendingPct, savingsPct,
}: {
  monthlyIncome: number
  spendingPct: number
  savingsPct: number
}) {
  if (spendingPct === 0 && savingsPct === 0) return null

  const money = (pct: number) => `$${Math.round((pct / 100) * monthlyIncome).toLocaleString()}/mo`

  return (
    <div className="w-full border-t border-outline-variant/30 pt-4">
      <table className="w-full text-label-sm">
        <tbody>
          {spendingPct > 0 && (
            <tr>
              <td className="py-1.5 text-on-surface-variant">Spending limit</td>
              <td className="py-1.5 text-right font-semibold text-on-surface whitespace-nowrap">
                {spendingPct}% · {money(spendingPct)}
              </td>
            </tr>
          )}
          {savingsPct > 0 && (
            <tr>
              <td className="py-1.5 text-on-surface-variant">Savings</td>
              <td className="py-1.5 text-right font-semibold text-on-surface whitespace-nowrap">
                {savingsPct}% · {money(savingsPct)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// The tool is gated behind its learning track — see SectionGate.
export default function InvestingPage() {
  return (
    <SectionGate trackId="investing">
      <InvestingPageTool />
    </SectionGate>
  )
}
