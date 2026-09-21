'use client'

import { useEffect, useId, useState } from 'react'

interface ShareFieldProps {
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
 * The allocation typed as a percent of income.
 *
 * The dial is quick but approximate, and everything else on this page — the
 * goals, the committed figures, the caps — is kept in percent, so this is too:
 * a number typed here is the number the legend and the dial then show.
 */
export function ShareField({
  pct, monthlyIncome, maxPct, disabled, onChange, label,
}: ShareFieldProps) {
  const fieldId = useId()
  const ceiling = Math.max(0, Math.round(maxPct))
  const maxAmount = Math.round((ceiling / 100) * monthlyIncome)
  const nothingFree = ceiling <= 0

  const [draft, setDraft] = useState('')
  /** A share larger than the income left. */
  const [tooBig, setTooBig] = useState(false)

  // The value can move from outside this field — the dial, a clamp when a goal
  // takes the headroom — so the draft follows it.
  useEffect(() => {
    setDraft(pct > 0 ? String(pct) : '')
    setTooBig(false)
  }, [pct])

  const commit = () => {
    const parsed = parseFloat(draft.replace(/[^0-9.]/g, ''))
    if (draft.trim() === '' || isNaN(parsed)) { onChange(0); return }

    // More than there is: the field empties and the ceiling turns red, rather
    // than quietly keeping the ceiling as though the figure had been taken.
    if (Math.round(parsed) > ceiling) {
      setTooBig(true)
      setDraft('')
      return
    }
    onChange(Math.max(0, Math.round(parsed)))
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <label htmlFor={fieldId} className="flex flex-col gap-1.5">
        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Share of income
        </span>
        <span className={`flex items-center gap-1 rounded-2xl border bg-surface-container-lowest px-4 py-2.5 transition-colors ${
          tooBig ? 'border-error' : 'border-on-surface/15 focus-within:border-on-surface/40'
        }`}>
          <input
            id={fieldId}
            inputMode="decimal"
            disabled={disabled || nothingFree}
            value={draft}
            onChange={e => { setTooBig(false); setDraft(e.target.value) }}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setTooBig(false); setDraft(pct > 0 ? String(pct) : '') }
            }}
            placeholder="0"
            aria-invalid={tooBig}
            aria-label={`${label} as a percent of monthly income`}
            className="w-full min-w-0 bg-transparent text-body-lg text-on-surface tabular-nums outline-none disabled:opacity-50"
          />
          <span className="text-body-lg text-on-surface-variant shrink-0">%</span>
        </span>
      </label>

      {/* The ceiling is what this holds plus whatever income is still free.
          With none free the field has nothing to accept, so it says why. */}
      {nothingFree ? (
        <p className="text-label-sm text-on-surface-variant">
          Nothing free — your spending limit and goals already claim it all.
        </p>
      ) : (
        <p className={`text-label-sm ${tooBig ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
          Up to {ceiling}% · ${maxAmount.toLocaleString()}/mo
        </p>
      )}
    </div>
  )
}
