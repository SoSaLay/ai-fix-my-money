'use client'

import Link from 'next/link'
import { Lock, ArrowRight, CheckCircle2, Check } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { getTrack, shortTitle, type TrackId } from '@/lib/learning/tracks'
import { DisclaimerBar } from './disclaimer-bar'

/**
 * Hard gate on a section's tool.
 *
 * A tool opens permanently once its track is finished. Before that, the only
 * way in is a practice step, which hands the learner a pass for one loop —
 * they arrive with a task rather than an empty screen.
 */
export function SectionGate({
  trackId,
  children,
}: {
  trackId: TrackId
  children: React.ReactNode
}) {
  const {
    ready, isToolUnlocked, guided, endGuided, recordAction,
    trackCompletion,
  } = useLearning()
  const track = getTrack(trackId)

  if (!ready || !track) return null

  const unlocked = isToolUnlocked(trackId)
  const pass = guided?.trackId === trackId ? guided : null

  if (unlocked) return <>{children}</>

  if (pass && track.action) {
    return (
      <>
        <div className="px-8 pt-6">
          <div className="bg-secondary-fixed/25 rounded-3xl px-6 py-5 flex flex-col gap-3">
            <span className="text-label-sm uppercase tracking-widest text-secondary font-semibold">
              Your turn · {track.title}
            </span>

            <div>
              <p className="text-title-md text-on-surface font-semibold">{track.action.title}</p>
              <p className="text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
                {track.action.prompt}
              </p>
            </div>

            <ul className="flex flex-col gap-2 mt-1">
              {track.action.tasks.map(task => (
                <li key={task} className="flex gap-2.5">
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0" aria-hidden />
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">{task}</p>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
              <p className="text-label-sm text-on-surface-variant max-w-lg">
                Done when: {track.action.doneWhen}
              </p>
              <Link
                href={`/learning/${trackId}`}
                onClick={() => { recordAction(trackId); endGuided() }}
                className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-5 py-2.5 text-label-lg font-medium hover:opacity-90 transition-opacity shrink-0"
              >
                <CheckCircle2 size={16} /> I&apos;ve done this
              </Link>
            </div>
          </div>
        </div>
        {children}
      </>
    )
  }

  // Locked. Say the rule in one line, show the path, then offer the shortcut.
  const { done, total } = trackCompletion(trackId)
  const started = done > 0
  const comingSoon = track.status === 'coming-soon'

  return (
    <div className="flex-1 flex items-center justify-center px-8 py-16">
      <div className="max-w-md w-full flex flex-col gap-7 items-center">
        <div className="flex flex-col gap-3 items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
            <Lock size={20} className="text-on-surface-variant" />
          </div>
          <h1 className="text-headline-md text-on-surface font-bold">
            Learn it to unlock it
          </h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            In this app, every feature opens once you finish its short course.
            Here&apos;s the one for {track.title}.
          </p>
        </div>

        {comingSoon ? (
          <p className="text-body-md text-on-surface-variant bg-surface-container rounded-2xl px-5 py-4 text-center">
            This course is still being written. The other three are ready now.
          </p>
        ) : (
          <>
            <LearningPath trackId={trackId} />

            <Link
              href={`/learning/${trackId}`}
              className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
            >
              {started ? `Continue — ${done} of ${total} done` : 'Start the course'}
              <ArrowRight size={16} />
            </Link>

            {track.finalQuiz.length > 0 && (
              <Link
                href={`/learning/${trackId}?step=final`}
                className="-mt-3 text-label-lg font-medium text-on-surface-variant underline underline-offset-4 hover:text-on-surface transition-colors"
              >
                Skip the learning — take me to the final test
              </Link>
            )}
          </>
        )}

        <DisclaimerBar className="justify-center" />
      </div>
    </div>
  )
}

/** The steps of the course, in order, with what's already behind them ticked. */
function LearningPath({ trackId }: { trackId: TrackId }) {
  const { trackProgress } = useLearning()
  const track = getTrack(trackId)
  if (!track) return null

  const p = trackProgress(trackId)
  const steps = [
    ...track.lessons.map(l => ({
      key: l.id,
      label: shortTitle(l.title),
      done: !!p.lessons[l.id]?.answered,
    })),
    ...(track.action ? [{
      key: 'action',
      label: 'Your turn — enter your own numbers',
      done: p.actionDone,
    }] : []),
    ...(track.finalQuiz.length > 0 ? [{
      key: 'final',
      label: 'Final test',
      done: p.final?.passed === true,
    }] : []),
  ]

  return (
    <ol className="w-full bg-surface-container-lowest rounded-3xl px-6 py-5 flex flex-col gap-3">
      {steps.map((step, i) => (
        <li key={step.key} className="flex items-center gap-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-label-sm font-semibold tabular-nums"
            style={
              step.done
                ? { background: '#1a6b3a', color: '#fff' }
                : { background: 'rgba(0,0,0,0.06)', color: 'inherit' }
            }
          >
            {step.done ? <Check size={13} /> : i + 1}
          </span>
          <span
            className={`text-body-md leading-snug ${
              step.done ? 'text-on-surface-variant line-through decoration-1' : 'text-on-surface'
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}
