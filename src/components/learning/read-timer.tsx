'use client'

import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { PROGRESS_YELLOW } from '@/lib/learning/progress-colors'

/**
 * The reading window, running full width above the material. It counts down on
 * its own and cannot be skipped — the pause is the point, and the questions
 * arrive when it reaches zero.
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

  const elapsedPct = ((seconds - remaining) / seconds) * 100

  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-5 flex items-center gap-5">
      <BookOpen size={16} className="text-on-surface-variant shrink-0" />

      <p className="text-label-sm uppercase tracking-widest text-on-surface-variant shrink-0">
        Reading time
      </p>

      {/* Progress fills the width the panel now has */}
      <div className="flex-1 h-1.5 rounded-full bg-outline-variant/40 overflow-hidden min-w-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${elapsedPct}%`,
            background: PROGRESS_YELLOW,
            transition: 'width 1s linear',
          }}
        />
      </div>

      <span className="text-title-lg text-on-surface font-bold tabular-nums shrink-0 w-9 text-right">
        {remaining}
      </span>
    </div>
  )
}
