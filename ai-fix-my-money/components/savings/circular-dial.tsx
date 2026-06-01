'use client'

import { useRef, useCallback } from 'react'

interface CircularDialProps {
  /** Goals allocation — drawn in teal, fixed and not draggable */
  lockedPct: number
  /** Additional / general savings — drawn in freeColor, draggable */
  freePct: number
  /** Total dollar amount (both arcs combined) */
  dollarAmount: number
  onChange: (freePct: number) => void
  /** Override the internal cap (default: 100 - lockedPct) */
  maxFreePct?: number
  /** Override the draggable-arc color (default: dark green) */
  freeColor?: string
  size?: number
}

const LOCKED_COLOR = '#11d4bf'
const FREE_COLOR   = '#1a6b3a'
const TRACK_COLOR  = '#e7e8ee'

export function CircularDial({
  lockedPct,
  freePct,
  dollarAmount,
  onChange,
  maxFreePct: maxFreePctProp,
  freeColor = FREE_COLOR,
  size = 240,
}: CircularDialProps) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)

  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 14
  const radius      = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius

  const totalPct   = lockedPct + freePct
  const maxFreePct = maxFreePctProp !== undefined
    ? Math.max(0, maxFreePctProp)
    : Math.max(0, 100 - lockedPct)

  const lockedLength = (lockedPct / 100) * circumference
  const freeLength   = (freePct   / 100) * circumference

  // Thumb sits at the end of the orange arc
  const thumbAngleDeg = (totalPct / 100) * 360 - 90
  const thumbRad      = (thumbAngleDeg * Math.PI) / 180
  const thumbX        = cx + radius * Math.cos(thumbRad)
  const thumbY        = cy + radius * Math.sin(thumbRad)

  const getAngleFromEvent = useCallback(
    (clientX: number, clientY: number): number => {
      if (!svgRef.current) return 0
      const rect  = svgRef.current.getBoundingClientRect()
      const x     = clientX - rect.left - cx
      const y     = clientY - rect.top - cy
      let angle   = Math.atan2(y, x) * (180 / Math.PI) + 90
      if (angle < 0) angle += 360
      return angle
    },
    [cx, cy],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (maxFreePct === 0) return
      isDragging.current = true
      svgRef.current?.setPointerCapture(e.pointerId)
      const angle   = getAngleFromEvent(e.clientX, e.clientY)
      const rawPct  = Math.round(angle / 3.6)
      const newFree = Math.max(0, Math.min(maxFreePct, rawPct - lockedPct))
      onChange(newFree)
    },
    [getAngleFromEvent, onChange, lockedPct, maxFreePct],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging.current) return
      const angle   = getAngleFromEvent(e.clientX, e.clientY)
      const rawPct  = Math.round(angle / 3.6)
      const newFree = Math.max(0, Math.min(maxFreePct, rawPct - lockedPct))
      onChange(newFree)
    },
    [getAngleFromEvent, onChange, lockedPct, maxFreePct],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const fmt = (n: number) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          cursor: maxFreePct > 0 ? 'pointer' : 'default',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={maxFreePct}
        aria-valuenow={freePct}
        aria-label={`Additional savings: ${freePct}%`}
      >
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />

        {/* Red arc — goals allocation (locked) */}
        {lockedPct > 0 && (
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={LOCKED_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${lockedLength} ${circumference - lockedLength}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}

        {/* Free arc — draggable portion */}
        {freePct > 0 && (
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={freeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`0 ${lockedLength} ${freeLength} ${circumference - lockedLength - freeLength}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}

        {/* Thumb — shows at end of whichever arc is outermost */}
        {totalPct > 0 && (
          <circle
            cx={thumbX}
            cy={thumbY}
            r={strokeWidth / 2 + 2}
            fill={freePct > 0 ? freeColor : LOCKED_COLOR}
            stroke="white"
            strokeWidth={3}
          />
        )}

        {/* Center: total percentage */}
        <text
          x={cx}
          y={cy - size * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#2d2f33"
          fontSize={size * 0.16}
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {totalPct}%
        </text>

        {/* Center: label */}
        <text
          x={cx}
          y={cy + size * 0.04}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#8a8c94"
          fontSize={size * 0.065}
          fontFamily="Inter, system-ui, sans-serif"
        >
          of income
        </text>

        {/* Center: dollar total */}
        <text
          x={cx}
          y={cy + size * 0.145}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={freeColor}
          fontSize={size * 0.075}
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {fmt(dollarAmount)}
        </text>
      </svg>
    </div>
  )
}
