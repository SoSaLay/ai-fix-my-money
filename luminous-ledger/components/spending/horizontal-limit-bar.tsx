'use client'

import { useRef, useCallback } from 'react'

interface HorizontalLimitBarProps {
  pct: number
  dollarAmount: number
  currentSpendingPct: number
  onChange: (pct: number) => void
  disabled?: boolean
}

function getBarColor(pct: number): string {
  if (pct <= 40) return '#1a6b3a'
  if (pct <= 65) return '#ff9817'
  return '#ba1a1a'
}

function getLabel(pct: number): string {
  if (pct <= 30) return 'Conservative'
  if (pct <= 55) return 'Balanced'
  if (pct <= 75) return 'Stretched'
  return 'High Risk'
}

export function HorizontalLimitBar({
  pct,
  dollarAmount,
  currentSpendingPct,
  onChange,
  disabled = false,
}: HorizontalLimitBarProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const getPctFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return pct
      const rect = trackRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const raw = (x / rect.width) * 100
      return Math.max(0, Math.min(100, Math.round(raw)))
    },
    [pct],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
      onChange(getPctFromEvent(e.clientX))
    },
    [getPctFromEvent, onChange],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      onChange(getPctFromEvent(e.clientX))
    },
    [getPctFromEvent, onChange],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const thumbColor = getBarColor(pct)
  const statusLabel = getLabel(pct)
  const formattedAmount = `$${dollarAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`

  // Clamp the current spending marker within track bounds
  const spendingMarkerPct = Math.min(currentSpendingPct, 100)

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Value row */}
      <div className="flex items-baseline gap-3">
        <span className="text-display-sm font-bold text-on-surface">{formattedAmount}</span>
        <span className="text-headline-sm font-semibold" style={{ color: thumbColor }}>
          {pct}%
        </span>
        <span className="text-label-md text-on-surface-variant">of monthly income</span>
        <span
          className="ml-auto text-label-sm font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: `${thumbColor}1a`,
            color: thumbColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Track */}
      <div className="flex flex-col gap-2">
        <div
          ref={trackRef}
          className="relative h-5 rounded-full select-none"
          style={{
            background:
              'linear-gradient(to right, #1a6b3a 0%, #4caf7d 30%, #ff9817 60%, #ba1a1a 100%)',
            touchAction: 'none',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onPointerDown={disabled ? undefined : handlePointerDown}
          onPointerMove={disabled ? undefined : handlePointerMove}
          onPointerUp={disabled ? undefined : handlePointerUp}
          onPointerLeave={disabled ? undefined : handlePointerUp}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Spending limit: ${pct}%`}
        >
          {/* Dim overlay — fades everything right of the thumb */}
          <div
            className="absolute top-0 bottom-0 right-0 rounded-r-full pointer-events-none"
            style={{
              left: `${pct}%`,
              background: 'rgba(255,255,255,0.65)',
            }}
          />

          {/* Current spending marker — vertical tick */}
          {spendingMarkerPct > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
              style={{
                left: `${spendingMarkerPct}%`,
                background: 'rgba(255,255,255,0.9)',
              }}
              title={`Current spending: ${spendingMarkerPct}% of limit`}
            />
          )}

          {/* Thumb */}
          <div
            className="absolute top-1/2 w-7 h-7 rounded-full bg-white shadow-lg pointer-events-none"
            style={{
              left: `${pct}%`,
              transform: 'translate(-50%, -50%)',
              border: `3px solid ${thumbColor}`,
              transition: isDragging.current ? 'none' : 'left 0.15s ease',
            }}
          />
        </div>

      </div>
    </div>
  )
}
