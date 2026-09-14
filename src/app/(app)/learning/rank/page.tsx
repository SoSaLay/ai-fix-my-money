'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Lock, ListChecks, PenLine, Medal } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { AcknowledgmentGate } from '@/components/learning/acknowledgment-gate'
import { DisclaimerFooter } from '@/components/learning/disclaimer-footer'
import { getTrack } from '@/lib/learning/tracks'
import {
  RANKS,
  POINTS_PER_CHOICE,
  POINTS_PER_WRITTEN,
  POINTS_PER_GRADE_STEP,
  rankGradient,
  rankStanding,
} from '@/lib/learning/rank'

export default function RankPage() {
  const { ready, progress, currentTrackId, stageFor, isTrackComplete } = useLearning()

  if (!ready) return null

  const standing = rankStanding(progress)
  const { points, maxPoints, rank, next, pctToNext, pointsToNext, byTrack } = standing

  const current = getTrack(currentTrackId())
  const stage = current ? stageFor(current.id) : null
  const nextStep =
    !current || !stage || stage.kind === 'done'
      ? null
      : stage.kind === 'lesson'
        ? `Answer the questions in “${current.lessons[stage.index].title}”`
        : stage.kind === 'action'
          ? `Finish the ${current.title} action step, then take its final test`
          : `Take the ${current.title} final test`

  return (
    <AcknowledgmentGate>
      <div className="flex flex-col">
        <div className="flex flex-col gap-8 px-8 py-10 max-w-4xl w-full mx-auto">
          <Link
            href="/learning"
            className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
          >
            <ArrowLeft size={15} /> Learning
          </Link>

          {/* Where you are */}
          <section className="bg-surface-container-lowest rounded-3xl px-7 py-7 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <Medal size={15} className="text-secondary" />
              <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
                Your rank · #{rank.level}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-headline-lg text-on-surface font-bold">{rank.name}</h1>
              <p className="text-body-lg text-on-surface-variant leading-relaxed">“{rank.line}”</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="h-2 rounded-full bg-outline-variant/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pctToNext}%`,
                    background: rankGradient(rank, 1, 90),
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-label-md text-on-surface tabular-nums font-semibold">
                  {points} points
                </span>
                <span className="text-label-md text-on-surface-variant tabular-nums">
                  {next ? `${pointsToNext} to ${next.name}` : 'The top. Nowhere left to go.'}
                </span>
              </div>
            </div>

            {nextStep && current && (
              <div className="bg-surface-container rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                    To rank up
                  </p>
                  <p className="text-body-md text-on-surface leading-relaxed">{nextStep}.</p>
                </div>
                <Link
                  href={`/learning/${current.id}`}
                  className="btn-action items-center justify-center gap-1.5"
                >
                  Continue {current.title} <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>

          {/* The ladder */}
          <section className="flex flex-col gap-3">
            <h2 className="text-title-lg text-on-surface font-semibold">The ranks</h2>
            <ol className="flex flex-col gap-2">
              {[...RANKS].reverse().map(r => {
                const reached = points >= r.minPoints
                const isCurrent = r.level === rank.level
                return (
                  <li
                    key={r.level}
                    className={`rounded-2xl px-5 py-4 flex items-center gap-4 bg-surface-container-lowest ${
                      reached ? '' : 'opacity-60'
                    }`}
                    style={isCurrent ? { boxShadow: `0 0 0 2px ${r.colors[0]}66` } : undefined}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-label-lg font-semibold tabular-nums"
                      style={{
                        background: rankGradient(r, reached ? 0.25 : 0.1),
                        border: `1px solid ${r.colors[0]}${reached ? '66' : '26'}`,
                        color: '#0F1111',
                      }}
                    >
                      {r.level}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-title-md text-on-surface font-semibold">{r.name}</p>
                        {isCurrent && (
                          <span className="text-label-sm text-secondary bg-secondary-fixed/30 px-2 py-0.5 rounded-lg">
                            You are here
                          </span>
                        )}
                      </div>
                      <p className="text-body-md text-on-surface-variant leading-relaxed">“{r.line}”</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-label-sm text-on-surface-variant tabular-nums">
                        {r.minPoints} pts
                      </span>
                      {reached ? (
                        <Check size={15} style={{ color: '#1a6b3a' }} />
                      ) : (
                        <Lock size={13} className="text-on-surface-variant" />
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          {/* How it's earned */}
          <section className="flex flex-col gap-3">
            <h2 className="text-title-lg text-on-surface font-semibold">How your rank is earned</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Your rank is built from how you answer. Every correct answer adds points, and the
              final tests count for more than the lessons — explaining a video in your own words
              shows more understanding than picking the right option.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest rounded-2xl px-5 py-5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-secondary" />
                  <p className="text-title-sm text-on-surface font-semibold">Lesson questions</p>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  <span className="text-on-surface font-semibold">{POINTS_PER_CHOICE} points</span> for
                  each multiple choice question you get right after a lesson. Only your first try
                  counts, so going back to a lesson won’t change it.
                </p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl px-5 py-5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <PenLine size={16} className="text-secondary" />
                  <p className="text-title-sm text-on-surface font-semibold">Final test answers</p>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  Up to <span className="text-on-surface font-semibold">{POINTS_PER_WRITTEN} points</span> for
                  each written answer, based on how close the AI marks your understanding:{' '}
                  {POINTS_PER_WRITTEN} for full marks, {POINTS_PER_GRADE_STEP} for partly there.
                  Retakes can raise your best score, never lower it.
                </p>
              </div>
            </div>
          </section>

          {/* By track */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-title-lg text-on-surface font-semibold">Points by track</h2>
              <span className="text-label-sm text-on-surface-variant tabular-nums">
                {points} of {maxPoints} possible
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {byTrack.map(t => {
                const track = getTrack(t.trackId)!
                const earned = t.lessons + t.final
                const possible = t.lessonsMax + t.finalMax
                const pct = possible === 0 ? 0 : Math.round((earned / possible) * 100)
                return (
                  <div
                    key={t.trackId}
                    className="bg-surface-container-lowest rounded-2xl px-5 py-4 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-title-sm text-on-surface font-semibold flex items-center gap-2">
                        {track.title}
                        {isTrackComplete(t.trackId) && <Check size={14} style={{ color: '#1a6b3a' }} />}
                      </p>
                      <span className="text-label-md text-on-surface tabular-nums">
                        {earned} / {possible}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-outline-variant/40 overflow-hidden">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center gap-4 text-label-sm text-on-surface-variant tabular-nums flex-wrap">
                      <span>Lessons {t.lessons} / {t.lessonsMax}</span>
                      <span>Final test {t.final} / {t.finalMax}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <DisclaimerFooter />
      </div>
    </AcknowledgmentGate>
  )
}
