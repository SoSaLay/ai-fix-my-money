'use client'

import { clsx } from 'clsx'

interface QuickSelectPillsProps {
  selected: number
  onSelect: (pct: number) => void
  /** Upper bound — pills above this value are disabled */
  maxPct?: number
}

const PRESETS = [5, 10, 20, 50]

export function QuickSelectPills({ selected, onSelect, maxPct = 100 }: QuickSelectPillsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {PRESETS.map((pct) => {
        const disabled = pct > maxPct
        return (
          <button
            key={pct}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect(pct)}
            className={clsx(
              'rounded-full px-5 py-2 text-label-lg font-medium transition-all duration-150',
              disabled
                ? 'opacity-35 cursor-not-allowed bg-surface-container text-on-surface-variant'
                : selected === pct
                  ? 'bg-secondary text-white active:scale-95'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95',
            )}
          >
            {pct}%
          </button>
        )
      })}
    </div>
  )
}
