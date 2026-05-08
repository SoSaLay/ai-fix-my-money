'use client'

import { clsx } from 'clsx'

type RiskLevel = 'conservative' | 'moderate' | 'aggressive'

interface RiskSliderProps {
  value: RiskLevel
  onChange: (value: RiskLevel) => void
}

const RISK_LEVELS: RiskLevel[] = ['conservative', 'moderate', 'aggressive']
const RISK_LABELS: Record<RiskLevel, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
}
const RISK_VALUE_MAP: Record<RiskLevel, number> = {
  conservative: 0,
  moderate: 50,
  aggressive: 100,
}
const VALUE_RISK_MAP: Record<number, RiskLevel> = {
  0: 'conservative',
  50: 'moderate',
  100: 'aggressive',
}

export function RiskSlider({ value, onChange }: RiskSliderProps) {
  const sliderValue = RISK_VALUE_MAP[value]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10)
    // Snap to nearest step (0, 50, 100)
    const snapped = raw < 25 ? 0 : raw < 75 ? 50 : 100
    onChange(VALUE_RISK_MAP[snapped])
  }

  const fillPct = sliderValue

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Track + thumb */}
      <div className="relative w-full">
        {/* Background track */}
        <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {/* Native range input (invisible, used for interaction) */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={handleChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '8px' }}
          aria-label={`Risk level: ${RISK_LABELS[value]}`}
        />

        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-secondary rounded-full shadow-float border-2 border-white pointer-events-none transition-all duration-300"
          style={{ left: `calc(${fillPct}% - 10px)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        {RISK_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={clsx(
              'text-label-sm uppercase tracking-wider font-medium transition-colors duration-150',
              value === level ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {RISK_LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  )
}
