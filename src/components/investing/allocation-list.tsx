'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'

import {
  INVESTMENT_CATEGORIES,
  type CategoryAllocations,
  type InvestmentCategory,
  type InvestmentCategoryId,
} from '@/lib/investing/categories'
import { RISK_LABEL, RISK_RAMP } from '@/lib/investing/risk-ramp'

/**
 * The instrument list, and what share of income the learner has put behind
 * each one.
 *
 * The savings tool's shape, with one difference: the categories are fixed
 * rather than invented. A savings goal is whatever you are saving for, so the
 * learner names it; an investment category is a thing that exists in the world,
 * and the nine here are exactly the nine the lesson taught. Letting someone
 * type a tenth would be letting them allocate to something we never explained.
 *
 * Every row carries its risk tier as a colour and as a word, the same pairing
 * the lesson table uses.
 */
interface AllocationListProps {
  allocations: CategoryAllocations
  monthlyIncome: number
  /** What is still uncommitted, so a row cannot take more than exists. */
  headroomPct: number
  disabled?: boolean
  onChange: (id: InvestmentCategoryId, pct: number) => void
}

export function AllocationList({
  allocations, monthlyIncome, headroomPct, disabled, onChange,
}: AllocationListProps) {
  const chosen = INVESTMENT_CATEGORIES.filter(c => (allocations[c.id] ?? 0) > 0)
  const rest = INVESTMENT_CATEGORIES.filter(c => (allocations[c.id] ?? 0) <= 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-headline-sm text-on-surface font-bold">Where it goes</h2>
        <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
          Set the share of your monthly income behind each investment you hold. Drag the
          slider or type the number. Anything you invest without naming an instrument
          stays as general investing.
        </p>
      </div>

      {chosen.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {chosen.map(category => (
            <CategoryRow
              key={category.id}
              category={category}
              pct={allocations[category.id] ?? 0}
              monthlyIncome={monthlyIncome}
              headroomPct={headroomPct}
              disabled={disabled}
              onChange={onChange}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {chosen.length > 0 && (
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              Not allocated
            </p>
          )}
          {rest.map(category => (
            <CategoryRow
              key={category.id}
              category={category}
              pct={0}
              monthlyIncome={monthlyIncome}
              headroomPct={headroomPct}
              disabled={disabled}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryRow({
  category, pct, monthlyIncome, headroomPct, disabled, onChange,
}: {
  category: InvestmentCategory
  pct: number
  monthlyIncome: number
  headroomPct: number
  disabled?: boolean
  onChange: (id: InvestmentCategoryId, pct: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(String(pct || ''))
  const shade = RISK_RAMP[category.tier]
  const active = pct > 0
  const amount = Math.round((pct / 100) * monthlyIncome)

  /** This row's own share plus whatever is still free. */
  const ceiling = pct + headroomPct

  // A row clamped from outside — because another row took the headroom — has to
  // show the value that was actually kept, not the one that was typed.
  useEffect(() => {
    setDraft(String(pct || ''))
  }, [pct])

  const set = (value: number) => {
    onChange(category.id, Math.max(0, Math.min(Math.round(value), ceiling)))
  }

  const commitTyped = () => {
    const parsed = parseFloat(draft)
    set(isNaN(parsed) ? 0 : parsed)
  }

  // The controls stay open while a row holds money, so the slider is there to
  // drag without hunting for a way back into edit mode.
  const showControls = (active || open) && !disabled

  return (
    <div
      className="rounded-xl px-4 py-3 flex flex-col gap-2 transition-colors"
      style={{
        backgroundColor: active ? shade.tint : undefined,
        borderLeft: `3px solid ${active ? shade.stripe : 'transparent'}`,
        boxShadow: active ? undefined : 'inset 0 0 0 1px rgba(172,173,177,0.35)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <p className="text-body-md font-semibold text-on-surface truncate">{category.name}</p>
          <span
            className="text-label-sm font-semibold shrink-0 px-2 py-0.5 rounded-full"
            style={{ color: shade.stripe, backgroundColor: active ? 'rgba(255,255,255,0.6)' : shade.tint }}
          >
            {RISK_LABEL[category.tier]}
          </span>
        </div>

        {active ? (
          <div className="shrink-0 text-right">
            <span className="text-body-md font-semibold text-on-surface tabular-nums">
              {pct}%
            </span>
            <span className="block text-label-sm text-on-surface-variant tabular-nums">
              ${amount.toLocaleString()}/mo
            </span>
          </div>
        ) : !showControls ? (
          <button
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className="shrink-0 inline-flex items-center gap-1 text-label-sm text-secondary font-medium disabled:opacity-50"
          >
            <Plus size={13} /> Allocate
          </button>
        ) : null}
      </div>

      {showControls && (
        // Drag it or type it — the same value either way. A percentage is
        // easier to feel on a slider and easier to be exact about in a field,
        // and there is no reason to make someone pick one.
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min={0}
            max={Math.max(ceiling, 1)}
            step={1}
            value={pct}
            onChange={e => set(Number(e.target.value))}
            className="flex-1 min-w-0 h-1.5 cursor-pointer accent-secondary"
            aria-label={`Percent of income for ${category.name}`}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {/* The field sits on a tinted row and on a plain one, so it carries
                its own ground and its own outline rather than borrowing the
                row's. White on white is invisible on a row nobody has funded
                yet, which is exactly when the field matters most. */}
            <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant/70 bg-white pl-1.5 pr-2 py-1 focus-within:ring-2 focus-within:ring-secondary">
              <input
                type="number"
                min={0}
                max={ceiling}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commitTyped}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitTyped()
                  if (e.key === 'Escape') setDraft(String(pct || ''))
                }}
                // Centred, not right-aligned: the browser draws its stepper
                // arrows inside the right edge of the field, so right-aligned
                // digits end up underneath them. Centring puts clear space on
                // both sides of the number.
                className="w-16 bg-transparent text-body-md text-on-surface text-center outline-none"
                aria-label={`Percent of income for ${category.name}, typed`}
              />
              <span className="text-label-sm text-on-surface-variant">%</span>
            </div>

            <button
              onClick={commitTyped}
              className="p-1.5 rounded-lg hover:bg-surface-container"
              aria-label={`Confirm ${category.name}`}
            >
              <Check size={15} className="text-on-surface" />
            </button>

            {active && (
              <button
                onClick={() => { set(0); setOpen(false) }}
                className="p-1.5 rounded-lg hover:bg-surface-container"
                aria-label={`Clear ${category.name}`}
              >
                <X size={15} className="text-on-surface-variant" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
