'use client'

import { useEffect, useId, useState } from 'react'

interface MonthlyAmountFieldProps {
  /** The share of monthly income this holds now, in whole percent. */
  pct: number
  monthlyIncome: number
  /** The most it may be set to, in percent. */
  maxPct: number
  disabled?: boolean
  onChange: (pct: number) => void
  /** Names what is being funded, for the field label. */
  label: string
}

/**
 * The allocation typed as dollars a month, kept as a percent of income behind
 * the scenes. A dial is quick but approximate; someone who knows they want
 * $400 a month should not have to hunt for it with their thumb.
 */
export function MonthlyAmountField({
  pct, monthlyIncome, maxPct, disabled, onChange, label,
}: MonthlyAmountFieldProps) {
  const fieldId = useId()
  const ceiling = Math.max(0, Math.round(maxPct))
  const maxAmount = Math.round((ceiling / 100) * monthlyIncome)

  const asAmount = (share: number) =>
    share > 0 ? String(Math.round((share / 100) * monthlyIncome)) : ''

  const [draft, setDraft] = useState('')

  // The value can move from outside this field — the dial, a clamp when
  // another category takes the headroom — so the draft follows it.
  useEffect(() => {
    setDraft(asAmount(pct))
    // asAmount is derived from the two values already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, monthlyIncome])

  const commit = () => {
    if (monthlyIncome <= 0) return
    const parsed = parseFloat(draft.replace(/[^0-9.]/g, ''))
    const amount = isNaN(parsed) ? 0 : parsed
    const share = Math.round((amount / monthlyIncome) * 100)
    onChange(Math.max(0, Math.min(share, ceiling)))
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <label htmlFor={fieldId} className="flex flex-col gap-1.5">
        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Dollars a month
        </span>
        <span className="flex items-center gap-1 rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 focus-within:border-on-surface/40 transition-colors">
          <span className="text-body-lg text-on-surface-variant shrink-0">$</span>
          <input
            id={fieldId}
            inputMode="decimal"
            disabled={disabled || monthlyIncome <= 0}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setDraft(asAmount(pct))
            }}
            placeholder="0"
            aria-label={`${label} in dollars a month`}
            className="w-full min-w-0 bg-transparent text-body-lg text-on-surface tabular-nums outline-none disabled:opacity-50"
          />
        </span>
      </label>

      {/* The ceiling is what this holds plus whatever income is still free. */}
      {ceiling > 0 && (
        <p className="text-label-sm text-on-surface-variant">
          Up to {ceiling}% · ${maxAmount.toLocaleString()}/mo
        </p>
      )}
    </div>
  )
}
