'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock, Unlock, Upload } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { CircularDial } from '@/components/savings/circular-dial'
import { AllocationList } from '@/components/investing/allocation-list'
import { useDashboardSummary, useInvestingGoal } from '@/hooks/use-data'
import { SectionGate } from '@/components/learning/section-gate'
import {
  riskProfileFor,
  totalCategoryPct,
  type CategoryAllocations,
  type InvestmentCategoryId,
} from '@/lib/investing/categories'

const CATEGORIES_COLOR = '#4c49c9'
const GENERAL_COLOR = '#8b89e0'

/**
 * The same two-part shape as the savings tool: named commitments on one side,
 * a draggable remainder on the other, both measured against monthly income.
 *
 * The difference is where the names come from. A savings goal is whatever the
 * learner is saving for, so they write it. An investment category is a thing
 * that exists whether or not they name it, and the nine on offer are the nine
 * the Investment choices lesson taught — so the tool can never ask for money
 * against something it never explained.
 *
 * General investing is what is going in without an instrument named against
 * it. Someone who knows they want to invest 15% before they know what they are
 * buying should be able to record that and come back.
 */
function InvestingPageTool() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { goal, loading: goalLoading, updateGoal, updating } = useInvestingGoal()

  const [allocations, setAllocations] = useState<CategoryAllocations>({})
  const [generalPct, setGeneralPct] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const loadedRef = useRef(false)

  // Load the stored plan once. A goal saved before categories existed has its
  // whole allocation read as general investing, which is what it was.
  useEffect(() => {
    if (loadedRef.current || !goal) return
    const stored = goal.categories ?? {}
    const storedGeneral = goal.general_pct ?? Math.max(0, Number(goal.allocation_pct) - totalCategoryPct(stored))
    setAllocations(stored)
    setGeneralPct(storedGeneral)
    setIsLocked(Number(goal.allocation_pct) > 0)
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

  const monthlyIncome = summary.spending.monthly_income

  // What the other two categories have already taken. Investing gets the rest.
  const lockedSpendingPct = summary.spending.spending_limit && monthlyIncome > 0
    ? Math.round((summary.spending.spending_limit.limit / monthlyIncome) * 100)
    : 0
  const totalSavingsPct = Math.round(summary.goals.savings_total_allocated || 0)
  const maxInvestingPct = Math.max(0, 100 - lockedSpendingPct - totalSavingsPct)

  const categoriesPct = totalCategoryPct(allocations)
  const totalInvestingPct = categoriesPct + generalPct
  const maxGeneralPct = Math.max(0, maxInvestingPct - categoriesPct)
  /** What a single row may still claim on top of what it already holds. */
  const headroomPct = Math.max(0, maxInvestingPct - totalInvestingPct)

  const categoriesAmount = Math.round((categoriesPct / 100) * monthlyIncome)
  const generalAmount = Math.round((generalPct / 100) * monthlyIncome)
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

  const handleDialChange = (pct: number) => {
    setGeneralPct(Math.min(pct, maxGeneralPct))
    setHasUnsavedChanges(true)
  }

  const handleLockIn = async () => {
    const success = await updateGoal({
      allocation_pct: totalInvestingPct,
      risk_profile: riskProfileFor(allocations),
      categories: allocations,
      general_pct: generalPct,
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

            {/* The instruments are the locked arc; general investing is what
                the dial drags. Same division as the savings tool. */}
            <CircularDial
              lockedPct={categoriesPct}
              freePct={generalPct}
              dollarAmount={totalInvestingAmount}
              onChange={isLocked ? () => {} : handleDialChange}
              maxFreePct={maxGeneralPct}
              lockedColor={CATEGORIES_COLOR}
              freeColor={GENERAL_COLOR}
              size={220}
            />

            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: CATEGORIES_COLOR }} />
                  <span className="text-on-surface-variant">Selected investments</span>
                </div>
                <span className="font-semibold text-on-surface">
                  {categoriesPct > 0
                    ? `${categoriesPct}% · $${categoriesAmount.toLocaleString()}/mo`
                    : <span className="text-on-surface-variant font-normal">Not set — allocate one →</span>
                  }
                </span>
              </div>

              <div className="flex items-center justify-between text-label-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: GENERAL_COLOR }} />
                  <span className="text-on-surface-variant">General investing</span>
                </div>
                <span className="font-semibold text-on-surface">
                  {generalPct > 0
                    ? `${generalPct}% · $${generalAmount.toLocaleString()}/mo`
                    : <span className="text-on-surface-variant font-normal">Drag the dial to set</span>
                  }
                </span>
              </div>

              {totalInvestingPct > 0 && (
                <div className="flex items-center justify-between text-label-sm pt-2 border-t border-outline-variant/30 mt-1">
                  <span className="text-on-surface-variant">Total Investing</span>
                  <span className="font-semibold text-on-surface">
                    {totalInvestingPct}% · ${totalInvestingAmount.toLocaleString()}/mo
                  </span>
                </div>
              )}
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
              monthlyIncome={monthlyIncome}
              headroomPct={headroomPct}
              disabled={isLocked}
              onChange={handleCategoryChange}
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
