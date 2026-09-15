'use client'

import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { getTrack } from '@/lib/learning/tracks'
import {
  RANKS,
  POINTS_PER_CHOICE,
  POINTS_PER_WRITTEN,
  rankGradient,
  rankStanding,
} from '@/lib/learning/rank'

/** Where you stand, how far to the next rank, and the way to get there. */
export default function RankPage() {
  const { ready, progress, currentTrackId, stageFor } = useLearning()

  if (!ready) return null

  const { points, rank, next, pctToNext, pointsToNext } = rankStanding(progress)

  const current = getTrack(currentTrackId())
  const stage = current ? stageFor(current.id) : null
  const canContinue = current && stage && stage.kind !== 'done'

  return (
    <div className="flex flex-col px-6 sm:px-8 py-10 max-w-2xl w-full mx-auto gap-12">
      <Link
        href="/learning"
        className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Learning
      </Link>

      {/* Your rank */}
      <section className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-display-sm text-white tabular-nums"
          style={{ background: rankGradient(rank) }}
          aria-hidden
        >
          {rank.level}
        </div>
        <h1 className="mt-5 text-display-md text-on-surface">{rank.name}</h1>
        <p className="mt-2 text-title-lg text-on-surface-variant max-w-md">{rank.line}</p>

        <div className="mt-8 w-full max-w-sm flex flex-col gap-2">
          <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pctToNext}%`, background: rankGradient(rank, 1, 90) }}
            />
          </div>
          <p className="text-body-md text-on-surface-variant tabular-nums">
            <span className="text-on-surface">{points} points</span>
            {next ? ` · ${pointsToNext} to ${next.name}` : ' · The top rank'}
          </p>
        </div>

        {canContinue && (
          <Link href={`/learning/${current.id}`} className="btn-action items-center justify-center mt-8">
            Keep learning
          </Link>
        )}
      </section>

      {/* The ladder */}
      <ol className="flex flex-col" aria-label="Ranks, highest first">
        {[...RANKS].reverse().map(r => {
          const reached = points >= r.minPoints
          const isCurrent = r.level === rank.level
          return (
            <li
              key={r.level}
              className="flex items-center gap-4 py-4 border-t border-on-surface/10 last:border-b"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: reached ? rankGradient(r) : 'rgba(45,47,51,0.12)' }}
                aria-hidden
              />
              <span className={`flex-1 text-headline-sm ${isCurrent ? 'text-on-surface' : 'text-on-surface-variant/70'}`}>
                {r.name}
              </span>
              <span className="text-body-md text-on-surface-variant tabular-nums">{r.minPoints}</span>
              <span className="w-4 flex justify-end" aria-label={reached ? 'Reached' : undefined}>
                {reached && <Check size={15} style={{ color: '#1a6b3a' }} />}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="text-body-md text-on-surface-variant text-center">
        {POINTS_PER_CHOICE} points for each lesson question right first time.
        Up to {POINTS_PER_WRITTEN} for each written answer.
      </p>
    </div>
  )
}
