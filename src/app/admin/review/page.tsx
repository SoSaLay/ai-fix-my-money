// The tracks, with where each pool stands. Start here, pick a track, review.

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { TRACKS } from '@/lib/learning/tracks'
import {
  poolHealth,
  readQueue,
  REPLENISH_BELOW,
  TARGET_POOL_SIZE,
  VIDEO_QUESTIONS_PER_QUIZ,
} from '@/lib/learning/video-pool/pool'

export default async function ReviewIndexPage() {
  const rows = await Promise.all(
    TRACKS.map(async track => {
      const queue = await readQueue(track.id)
      return {
        track,
        health: poolHealth(track.id),
        waiting: queue.filter(item => !item.rejected).length,
      }
    }),
  )

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-body-md text-on-surface-variant">
        Each track needs {TARGET_POOL_SIZE} approved videos so the{' '}
        {VIDEO_QUESTIONS_PER_QUIZ} on a paper can be sampled without the set becoming
        memorisable. Below {REPLENISH_BELOW} live, the track wants a new ingestion round.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ track, health, waiting }) => (
          <Link
            key={track.id}
            href={`/admin/review/${track.id}`}
            className="group flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-card transition-shadow hover:shadow-float"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-headline-sm text-on-surface">{track.title}</span>
              <ArrowRight className="h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-label-md text-on-surface-variant">
              <span className="tabular-nums">
                <span className="text-headline-md text-on-surface">{health.live}</span>
                {' / '}
                {TARGET_POOL_SIZE} approved
              </span>
              {waiting > 0 && (
                <span className="tabular-nums text-secondary">{waiting} awaiting review</span>
              )}
              {health.unavailable > 0 && (
                <span className="tabular-nums">{health.unavailable} unavailable</span>
              )}
            </div>

            {health.belowQuizSize ? (
              <span className="text-label-md text-error">
                Cannot fill a paper yet — needs {VIDEO_QUESTIONS_PER_QUIZ - health.live} more.
              </span>
            ) : health.needsReplenishment ? (
              <span className="text-label-md text-tertiary">Needs a new ingestion round.</span>
            ) : (
              <span className="text-label-md text-success">Healthy.</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
