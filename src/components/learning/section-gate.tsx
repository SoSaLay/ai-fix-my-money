'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { getTrack, type TrackId } from '@/lib/learning/tracks'

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
  const { ready, isToolUnlocked, guided, endGuided, recordAction } = useLearning()
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
              {track.action.label ?? 'Your turn'} · {track.title}
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
                className="btn-action items-center justify-center gap-1.5 shrink-0"
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

  // Locked. One picture, one line, one way forward.
  const comingSoon = track.status === 'coming-soon'

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimise */}
        <img src="/onboarding/locked.svg" alt="" className="w-full max-w-[220px] aspect-square" />
        <h1 className="mt-4 text-display-sm text-on-surface">
          {comingSoon ? 'Coming soon.' : 'Learn it to unlock it.'}
        </h1>
        <p className="mt-3 text-title-lg text-on-surface-variant">
          {comingSoon
            ? `The ${track.title} track is still being written.`
            : `Finish the ${track.title} track to open this.`}
        </p>
        <Link href="/learning" className="btn-action items-center justify-center mt-8">
          Go to Learning
        </Link>
      </div>
    </div>
  )
}

