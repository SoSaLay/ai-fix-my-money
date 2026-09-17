'use client'

import { Check } from 'lucide-react'

import type { Stage } from '@/contexts/learning-context'
import { PROGRESS_GREEN, PROGRESS_YELLOW } from '@/lib/learning/progress-colors'

export interface RailItem {
  key: string
  /** Full title, used for the tooltip and the accessible name. */
  label: string
  /** Trimmed title shown under the circle. */
  shortLabel: string
  done: boolean
  stage: Stage
}

interface StepRailProps {
  items: RailItem[]
  /** Index of the step on screen. */
  currentIndex: number
  /** Highest index the learner may jump to. Anything past it is not reachable. */
  furthestIndex: number
  browsable: boolean
  onSelect: (stage: Stage) => void
}

/**
 * Numbered steps joined by a line, the way a setup wizard shows where you are:
 * a finished step is a green tick, everything else keeps its number, and the
 * step you are on is ringed. The numbers make the old "3 of 7 done" counter
 * redundant — the position is already on screen.
 */
export function StepRail({
  items,
  currentIndex,
  furthestIndex,
  browsable,
  onSelect,
}: StepRailProps) {
  if (items.length === 0) return null

  return (
    // Seven steps do not fit a phone. Scrolling the rail beats shrinking the
    // labels until they are unreadable.
    <nav
      aria-label="Course steps"
      className="scrollbar-dark overflow-x-auto rounded-3xl bg-surface-container-lowest border border-on-surface/[0.06] px-3 sm:px-5 pt-5 pb-4"
    >
      <ol className="flex min-w-[600px] items-start">
        {items.map((item, i) => {
          const current = i === currentIndex
          const reachable = browsable && i <= furthestIndex
          // The connector belongs to the step before it, and is only filled
          // when that step is behind the learner.
          const previousDone = i > 0 && items[i - 1].done

          return (
            <li key={item.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <Connector visible={i > 0} filled={previousDone} />
                <StepMarker
                  index={i}
                  done={item.done}
                  current={current}
                  reachable={reachable}
                  label={item.label}
                  onSelect={() => reachable && onSelect(item.stage)}
                />
                <Connector visible={i < items.length - 1} filled={item.done} />
              </div>

              <span
                title={item.label}
                className={`mt-2.5 line-clamp-2 px-1 text-center text-label-lg leading-snug ${
                  current ? 'text-on-surface' : item.done ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {item.shortLabel}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Connector({ visible, filled }: { visible: boolean; filled: boolean }) {
  return (
    <span
      aria-hidden
      className="h-[3px] flex-1 rounded-full transition-colors duration-300"
      style={{
        background: !visible ? 'transparent' : filled ? PROGRESS_GREEN : 'rgba(0,0,0,0.12)',
      }}
    />
  )
}

interface StepMarkerProps {
  index: number
  done: boolean
  current: boolean
  reachable: boolean
  label: string
  onSelect: () => void
}

function StepMarker({ index, done, current, reachable, label, onSelect }: StepMarkerProps) {
  // Done is green, the step in progress is yellow, and anything still ahead is
  // a plain outline — the same three-colour language as the track bars.
  const ring = done ? PROGRESS_GREEN : current ? PROGRESS_YELLOW : 'rgba(0,0,0,0.18)'
  const text = done ? '#ffffff' : current ? '#8a6400' : '#5a5b60'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!reachable}
      title={label}
      aria-label={label}
      aria-current={current ? 'step' : undefined}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-label-lg tabular-nums transition-all duration-200 ${
        reachable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
      }`}
      style={{
        borderColor: ring,
        // The step you are on glows faintly yellow, so it reads at a glance
        // without a second colour.
        background: done ? PROGRESS_GREEN : current ? 'rgba(224,163,0,0.12)' : '#ffffff',
        boxShadow: current ? '0 0 0 4px rgba(224,163,0,0.14)' : undefined,
        color: text,
      }}
    >
      {done ? <Check size={17} strokeWidth={3} /> : index + 1}
    </button>
  )
}
