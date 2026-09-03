'use client'

import Link from 'next/link'
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { getTrack, type TrackId } from '@/lib/learning/tracks'
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
  const { ready, isToolUnlocked, isTrackUnlocked, guided, endGuided, recordAction, trackCompletion } = useLearning()
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

  // Locked. Show what the track gives them and point at the one way forward.
  const trackReachable = isTrackUnlocked(trackId)
  const { done, total } = trackCompletion(trackId)
  const started = done > 0

  return (
    <div className="flex-1 flex items-center justify-center px-8 py-20">
      <div className="max-w-md w-full flex flex-col gap-6 text-center items-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
          <Lock size={22} className="text-on-surface-variant" />
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 className="text-headline-md text-on-surface font-bold">
            {track.title} opens when you pass the course
          </h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            {track.outcome}
          </p>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            You&apos;ll enter your real {track.title.toLowerCase()} data as you go, so by the
            time this section opens it already has your numbers in it.
          </p>
        </div>

        {track.status === 'coming-soon' ? (
          <p className="text-body-md text-on-surface-variant bg-surface-container rounded-2xl px-5 py-4">
            This track is still being written. The other three are ready now.
          </p>
        ) : trackReachable ? (
          <Link
            href={`/learning/${trackId}`}
            className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
          >
            {started ? `Continue — ${done} of ${total} done` : `Start the ${track.title} track`}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <p className="text-body-md text-on-surface-variant">
              Finish the tracks before this one first — each builds on the last.
            </p>
            <Link
              href="/learning"
              className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
            >
              Go to Learning <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <DisclaimerBar className="justify-center pt-2" />
      </div>
    </div>
  )
}
