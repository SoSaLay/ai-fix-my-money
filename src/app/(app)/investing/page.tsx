'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, CheckCircle2, Upload } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { CircularDial } from '@/components/savings/circular-dial'
import { useDashboardSummary, useInvestingGoal } from '@/hooks/use-data'
import { SectionGate } from '@/components/learning/section-gate'
import { ArchetypeCards } from '@/components/investing/archetype-cards'
import { ArchetypeAssets } from '@/components/investing/archetype-assets'
import { getArchetype, type ArchetypeId } from '@/lib/investing/archetypes'

function InvestingPageTool() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { goal, loading: goalLoading, updateGoal, updating } = useInvestingGoal()

  const [allocationPct, setAllocationPct] = useState(0)
  const [archetype, setArchetype] = useState<ArchetypeId | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load existing goal data
  useEffect(() => {
    if (goal) {
      setAllocationPct(Number(goal.allocation_pct))
      setArchetype(goal.archetype ?? null)
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
            <p className="text-headline-sm text-on-surface font-semibold mb-2">Nothing recorded yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Record your income and spending first — this page allocates from those figures.
            </p>
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-label-lg transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}
            >
              <Upload size={16} />
              Go to Learning
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
      // The archetype is what the learner actually chose; the risk profile is
      // the internal shape the stored goal has always carried.
      risk_profile: getArchetype(archetype)?.risk ?? 'moderate',
      archetype: archetype ?? undefined,
    })
    if (success) {
      setHasUnsavedChanges(false)
    }
  }

  const handleAllocationChange = (newPct: number) => {
    setAllocationPct(Math.min(newPct, maxInvestingPct))
    setHasUnsavedChanges(true)
  }

  const handleArchetypeChange = (id: ArchetypeId) => {
    setArchetype(id)
    setHasUnsavedChanges(true)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Investing" />

      {/* Allocation on the left, the archetype picker on the right. They stack
          on narrow screens, allocation first — it is the thing that has to be
          set regardless of whether an archetype is chosen. */}
      <div className="flex-1 px-8 pb-10 flex flex-col lg:flex-row gap-6 items-start max-w-6xl mx-auto w-full">
        {/* Left: monthly income, the dial, and what the chosen archetype holds */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 flex flex-col items-center gap-8 w-full lg:max-w-md lg:shrink-0">
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

          <ArchetypeAssets archetypeId={archetype} />
        </div>

        {/* Right: the archetype picker */}
        <div className="w-full lg:flex-1 bg-surface-container-lowest rounded-2xl shadow-card p-6">
          <ArchetypeCards selected={archetype} onSelect={handleArchetypeChange} />
        </div>
      </div>
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
