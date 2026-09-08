'use client'

import Link from 'next/link'
import {
  CreditCard, PieChart, PiggyBank, TrendingUp,
  Lock, Check, ArrowRight, RotateCcw, Clock,
} from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { TRACKS, readingMinutes, type Track } from '@/lib/learning/tracks'
import { progressColor } from '@/lib/learning/progress-colors'
import { AcknowledgmentGate } from '@/components/learning/acknowledgment-gate'
import { DisclaimerFooter } from '@/components/learning/disclaimer-footer'

const ICONS: Record<string, React.ReactNode> = {
  accounts:  <CreditCard size={20} />,
  spending:  <PieChart size={20} />,
  savings:   <PiggyBank size={20} />,
  investing: <TrendingUp size={20} />,
}

export default function LearningPage() {
  const {
    ready, isTrackUnlocked, isTrackComplete, trackCompletion,
    currentTrackId, dueReviews,
  } = useLearning()

  if (!ready) return null

  const current = currentTrackId()
  const due = dueReviews()

  return (
    <AcknowledgmentGate>
      <div className="flex flex-col">
        <div className="flex flex-col gap-8 px-8 py-10 max-w-4xl w-full mx-auto">
          {/* Header. The review queue sits beside it rather than as its own band —
              it is a standing prompt, not news, and it should not push the tracks
              down the page every time something falls due. */}
          <header className="flex items-start justify-between gap-6">
            <h3 className="max-w-2xl text-body-lg font-normal leading-relaxed text-on-surface-variant">
              Learn to manage and grow your money. Complete the lessons, unlock the
              features, understand how your money works.
            </h3>

            {/* Always here. Review is somewhere to test yourself whenever you
                want, not a notification that only appears when something falls
                due — a finished learner still has everything to practise. */}
            <Link
              href="/learning/review"
              title={
                due.length > 0
                  ? `${due.length} ${due.length === 1 ? 'question' : 'questions'} due for review`
                  : 'Practise questions from the lessons you have finished'
              }
              className="btn-action items-center justify-center gap-1.5 shrink-0"
            >
              <RotateCcw size={13} aria-hidden />
              Go to review mode
              {due.length > 0 && (
                <span className="tabular-nums font-semibold">({due.length})</span>
              )}
            </Link>
          </header>

          {/* Tracks */}
          <div className="flex flex-col gap-3">
            {TRACKS.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                index={i}
                unlocked={isTrackUnlocked(track.id)}
                complete={isTrackComplete(track.id)}
                isCurrent={track.id === current}
                completion={trackCompletion(track.id)}
              />
            ))}
          </div>
        </div>

        <DisclaimerFooter />
      </div>
    </AcknowledgmentGate>
  )
}

function TrackCard({
  track, index, unlocked, complete, isCurrent, completion,
}: {
  track: Track
  index: number
  unlocked: boolean
  complete: boolean
  isCurrent: boolean
  completion: { done: number; total: number; pct: number }
}) {
  const comingSoon = track.status === 'coming-soon'
  const open = unlocked && !comingSoon

  const minutes = readingMinutes(track)

  const body = (
    <div
      className={`rounded-3xl px-6 py-5 flex flex-col gap-4 transition-all ${
        open
          ? 'bg-surface-container-lowest hover:bg-surface-container-low'
          : 'bg-surface-container-lowest opacity-60'
      } ${isCurrent && open ? 'ring-2 ring-secondary/40' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: complete ? 'rgba(26,107,58,0.12)' : 'var(--surface-container, rgba(0,0,0,0.05))',
              color: complete ? '#1a6b3a' : undefined,
            }}
          >
            {complete ? <Check size={20} /> : comingSoon || !unlocked ? <Lock size={18} /> : ICONS[track.id]}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-label-sm text-on-surface-variant tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-title-lg text-on-surface font-semibold">{track.title}</p>
              {isCurrent && open && !complete && (
                <span className="text-label-sm text-secondary bg-secondary-fixed/30 px-2 py-0.5 rounded-lg">
                  Up next
                </span>
              )}
              {comingSoon && (
                <span className="text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-body-md text-on-surface mt-1.5 leading-relaxed">
              <span className="text-on-surface-variant">What you&apos;ll learn: </span>
              {track.blurb}
            </p>
          </div>
        </div>

        {open && <ArrowRight size={18} className="text-on-surface-variant shrink-0 mt-1" />}
      </div>

      {/* Footer row */}
      <div className="flex items-center gap-4 pl-14 flex-wrap">
        {track.lessons.length > 0 && (
          <>
            <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <Clock size={12} /> ~{minutes} min
            </span>
            <div className="flex-1 min-w-[80px] h-1 rounded-full bg-outline-variant/40 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  // An untouched track has nothing to fill, so the track itself
                  // carries the red rather than a zero-width bar.
                  width: completion.done === 0 ? '100%' : `${completion.pct}%`,
                  background: progressColor(completion.done, completion.total),
                  opacity: completion.done === 0 ? 0.25 : 1,
                }}
              />
            </div>
            {/* After the bar, so the count reads as the bar's value rather
                than as another label competing with the time. */}
            <span className="text-label-sm text-on-surface-variant tabular-nums shrink-0">
              {completion.done} of {completion.total} steps
            </span>
          </>
        )}
        {!unlocked && !comingSoon && (
          <span className="text-label-sm text-on-surface-variant">
            Finish the track before this one to open it
          </span>
        )}
      </div>
    </div>
  )

  return open ? <Link href={`/learning/${track.id}`}>{body}</Link> : <div>{body}</div>
}
