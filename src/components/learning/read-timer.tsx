'use client'

import { useEffect, useState } from 'react'
import { PROGRESS_YELLOW } from '@/lib/learning/progress-colors'

const RING_SIZE = 52
const RING_STROKE = 4
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/**
 * The reading window. It floats at the bottom of the screen while the lesson
 * scrolls underneath, so the time left is always in view without taking a
 * place in the material itself. It counts down on its own and cannot be
 * skipped — the pause is the point, and the questions arrive when it reaches
 * zero.
 */
export function ReadTimer({
  seconds,
  onElapsed,
}: {
  seconds: number
  onElapsed: () => void
}) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onElapsed()
      return
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, onElapsed])

  const elapsed = (seconds - remaining) / seconds
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`

  return (
    <div className="sticky bottom-4 sm:bottom-6 z-20 flex justify-center pointer-events-none">
      <div
        role="timer"
        aria-live="off"
        aria-label={`Reading time: ${remaining} seconds left`}
        className="pointer-events-auto glass w-full max-w-xl rounded-full border border-on-surface/[0.08] shadow-float pl-2.5 pr-6 py-2.5 flex items-center gap-4"
      >
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden>
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke="rgba(45,47,51,0.1)" strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
              fill="none" stroke={PROGRESS_YELLOW} strokeWidth={RING_STROKE} strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - elapsed)}
              className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-label-lg text-on-surface tabular-nums">
            {remaining}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-title-md text-on-surface">Reading time</p>
          <p className="text-body-md text-on-surface-variant truncate">
            Take it in — your questions open in {clock}
          </p>
        </div>

        <div className="hidden sm:block w-28 h-1.5 rounded-full bg-on-surface/10 overflow-hidden shrink-0" aria-hidden>
          <div
            className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-linear"
            style={{ width: `${elapsed * 100}%`, background: PROGRESS_YELLOW }}
          />
        </div>
      </div>
    </div>
  )
}
