'use client'

import { useEffect, useId, useState } from 'react'

interface PctAmountFieldsProps {
  /** The share of monthly income this holds now, in whole percent. */
  pct: number
  monthlyIncome: number
  /** The most it may be set to, in percent. */
  maxPct: number
  disabled?: boolean
  onChange: (pct: number) => void
  /** Names what is being funded, for the field labels. */
  label: string
}

/**
 * The same allocation as a percentage and as dollars a month, in two fields
 * that write the same value: type into either one and the other follows.
 *
 * A dial is quick but approximate. Someone who knows they want $400 a month,
 * or exactly 15%, should not have to hunt for it with their thumb.
 */
export function PctAmountFields({
  pct, monthlyIncome, maxPct, disabled, onChange, label,
}: PctAmountFieldsProps) {
  const fieldId = useId()
  const ceiling = Math.max(0, Math.round(maxPct))
  const maxAmount = Math.round((ceiling / 100) * monthlyIncome)

  const [pctDraft, setPctDraft] = useState('')
  const [amountDraft, setAmountDraft] = useState('')

  // The value can move from outside these fields — the dial, a clamp when
  // another category takes the headroom — so the drafts follow it.
  useEffect(() => {
    setPctDraft(pct > 0 ? String(pct) : '')
    setAmountDraft(pct > 0 ? String(Math.round((pct / 100) * monthlyIncome)) : '')
  }, [pct, monthlyIncome])

  const clamp = (value: number) => Math.max(0, Math.min(Math.round(value), ceiling))

  const commitPct = () => {
    const parsed = parseFloat(pctDraft.replace(/[^0-9.]/g, ''))
    onChange(clamp(isNaN(parsed) ? 0 : parsed))
  }

  const commitAmount = () => {
    if (monthlyIncome <= 0) return
    const parsed = parseFloat(amountDraft.replace(/[^0-9.]/g, ''))
    onChange(clamp(isNaN(parsed) ? 0 : (parsed / monthlyIncome) * 100))
  }

  const field = 'flex items-center gap-1 rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 focus-within:border-on-surface/40 transition-colors'

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label htmlFor={`${fieldId}-pct`} className="flex flex-col gap-1.5">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Share of income
          </span>
          <span className={field}>
            <input
              id={`${fieldId}-pct`}
              inputMode="decimal"
              disabled={disabled}
              value={pctDraft}
              onChange={e => setPctDraft(e.target.value)}
              onBlur={commitPct}
              onKeyDown={e => {
                if (e.key === 'Enter') commitPct()
                if (e.key === 'Escape') setPctDraft(pct > 0 ? String(pct) : '')
              }}
              placeholder="0"
              aria-label={`${label} as a percent of monthly income`}
              className="w-full min-w-0 bg-transparent text-body-lg text-on-surface tabular-nums outline-none disabled:opacity-50"
            />
            <span className="text-body-lg text-on-surface-variant shrink-0">%</span>
          </span>
        </label>

        <label htmlFor={`${fieldId}-amount`} className="flex flex-col gap-1.5">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Dollars a month
          </span>
          <span className={field}>
            <span className="text-body-lg text-on-surface-variant shrink-0">$</span>
            <input
              id={`${fieldId}-amount`}
              inputMode="decimal"
              disabled={disabled || monthlyIncome <= 0}
              value={amountDraft}
              onChange={e => setAmountDraft(e.target.value)}
              onBlur={commitAmount}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAmount()
                if (e.key === 'Escape') {
                  setAmountDraft(pct > 0 ? String(Math.round((pct / 100) * monthlyIncome)) : '')
                }
              }}
              placeholder="0"
              aria-label={`${label} in dollars a month`}
              className="w-full min-w-0 bg-transparent text-body-lg text-on-surface tabular-nums outline-none disabled:opacity-50"
            />
          </span>
        </label>
      </div>

      {/* The ceiling is what this row itself holds plus whatever income is
          still free, so it is stated as a limit rather than as headroom. */}
      {ceiling > 0 && (
        <p className="text-label-sm text-on-surface-variant">
          You can set this as high as {ceiling}% · ${maxAmount.toLocaleString()} a month.
        </p>
      )}
    </div>
  )
}
