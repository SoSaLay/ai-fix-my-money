'use client'

import { use, useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Trophy, RotateCcw, Unlock,
} from 'lucide-react'
import { useLearning, type Stage } from '@/contexts/learning-context'
import { getTrack, shortTitle, type Track, type Lesson } from '@/lib/learning/tracks'
import { DISCLAIMER_INVESTING } from '@/lib/learning/disclaimer'
import { DisclaimerFooter } from '@/components/learning/disclaimer-footer'
import { LessonContent } from '@/components/learning/lesson-content'
import { LessonAside } from '@/components/learning/lesson-aside'
import { ReadTimer } from '@/components/learning/read-timer'
import { QuestionStack } from '@/components/learning/question-stack'
import { VideoQuiz } from '@/components/learning/video-quiz'
import { StepRail, type RailItem } from '@/components/learning/step-rail'
import { Confetti } from '@/components/learning/celebration'
import { track as capture } from '@/lib/analytics/posthog'

export default function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackParam } = use(params)
  const router = useRouter()
  const {
    ready, isTrackUnlocked, isTrackComplete, trackProgress,
    stageFor, recordLesson, recordAction, recordFinal, startGuided,
  } = useLearning()

  const track = getTrack(trackParam)

  // `view` lets the learner step back through finished material without
  // rewinding their actual progress.
  const [view, setView] = useState<Stage | null>(null)

  // Every track is taken in order, lessons first — there is no skipping to the final.
  useEffect(() => {
    if (!ready || !track) return
    setView(stageFor(track.id))
  }, [ready, track, stageFor])

  // Once per visit to a track, and only after storage has been read — firing
  // before `ready` would count a track start for everyone mid-hydration.
  const startedTrack = useRef<string | null>(null)
  useEffect(() => {
    if (!ready || !track) return
    if (startedTrack.current === track.id) return
    startedTrack.current = track.id
    capture('track_started', { track_id: track.id })
  }, [ready, track])

  // A new step starts at the top. Without this, pressing Next at the bottom of
  // one lesson drops the learner at the bottom of the next.
  const viewKey = view ? (view.kind === 'lesson' ? `lesson:${view.id}` : view.kind) : null
  const shownView = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!viewKey) return
    if (shownView.current !== null && shownView.current !== viewKey) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    shownView.current = viewKey
  }, [viewKey])

  if (!ready || !track) {
    return <Missing message="That track doesn’t exist." />
  }
  if (track.lessons.length === 0) {
    return <ComingSoon track={track} />
  }
  if (!view) return null

  // A final passed before test-outs were removed still counts, so that learner
  // is not locked out of a track they already have.
  const testedOut = trackProgress(track.id).final?.passed === true
  if (!isTrackUnlocked(track.id) && !testedOut) {
    return <Missing message="Finish the tracks before this one first — each builds on the last." />
  }

  const finished = isTrackComplete(track.id)
  const progress = trackProgress(track.id)
  const live = stageFor(track.id)

  // Step rail: lessons, then the action step, then the final.
  const railItems: RailItem[] = [
    ...track.lessons.map((l, i) => ({
      key: l.id,
      label: l.title,
      shortLabel: shortTitle(l.title),
      done: !!progress.lessons[l.id]?.answered,
      stage: { kind: 'lesson' as const, id: l.id, index: i },
    })),
    ...(track.action ? [{
      key: 'action',
      label: track.action.title,
      shortLabel: track.action.label ?? 'Your turn',
      done: progress.actionDone,
      stage: { kind: 'action' as const },
    }] : []),
    ...(track.finalQuiz.length > 0 ? [{
      key: 'final',
      label: 'Final test',
      shortLabel: 'Final test',
      done: progress.final?.passed === true,
      stage: { kind: 'final' as const },
    }] : []),
  ]

  // Anything up to the live step stays reachable, so going back never traps.
  const liveIndex = railItems.findIndex(r => sameStage(r.stage, live))
  const furthest = liveIndex === -1 ? railItems.length - 1 : liveIndex
  const viewIndex = railItems.findIndex(r => sameStage(r.stage, view))

  const canBrowseSteps = isTrackUnlocked(track.id) || testedOut
  const previous = canBrowseSteps && viewIndex > 0 ? railItems[viewIndex - 1] : null

  const advance = () => setView(stageFor(track.id))

  return (
    <div className="flex flex-col">
        <div className="flex flex-col gap-8 px-4 sm:px-8 py-8 sm:py-10 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-5">
            {previous ? (
              <button
                onClick={() => setView(previous.stage)}
                className="flex items-center gap-2 text-body-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit text-left"
              >
                <ArrowLeft size={17} className="shrink-0" />
                <span className="truncate">Back to {shortTitle(previous.label)}</span>
              </button>
            ) : (
              <Link
                href="/learning"
                className="flex items-center gap-2 text-body-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
              >
                <ArrowLeft size={17} /> Learning
              </Link>
            )}

            <div className="flex items-center justify-between gap-6 flex-wrap">
              <h1 className="text-display-md text-on-surface">{track.title}</h1>

              <div className="flex items-center gap-3 shrink-0">
                {finished && (
                  // Same control as the review button on the hub — both are the
                  // one thing on their page competing with the material itself.
                  <Link
                    href={track.unlocks}
                    className="btn-action items-center justify-center gap-1.5 shrink-0"
                  >
                    <Unlock size={13} aria-hidden /> Open {track.title}
                  </Link>
                )}
              </div>
            </div>

            <StepRail
              items={railItems}
              currentIndex={viewIndex}
              furthestIndex={furthest}
              browsable={canBrowseSteps}
              onSelect={setView}
            />
          </div>

          {view.kind === 'lesson' && (
            <LessonStage
              key={view.id}
              lesson={track.lessons.find(l => l.id === view.id)!}
              alreadyAnswered={!!progress.lessons[view.id]?.answered}
              onComplete={missed => { recordLesson(track.id, view.id, missed); advance() }}
            />
          )}

          {view.kind === 'action' && track.action && (
            <ActionStage
              track={track}
              done={progress.actionDone}
              onGo={() => { startGuided(track.id); router.push(track.unlocks) }}
              onContinue={advance}
            />
          )}

          {view.kind === 'final' && (
            <FinalStage
              track={track}
              onSubmit={(correct, total, missed, rankPoints) =>
                recordFinal(track.id, correct, total, missed, rankPoints)
              }
              onDone={advance}
            />
          )}

          {view.kind === 'done' && (
            <Congratulations track={track} result={progress.final} />
          )}

        </div>

        <DisclaimerFooter inner="max-w-6xl" />
    </div>
  )
}

function sameStage(a: Stage, b: Stage): boolean {
  if (a.kind !== b.kind) return false
  return a.kind === 'lesson' && b.kind === 'lesson' ? a.id === b.id : true
}

// ─── Lesson: read on the left, timer then questions on the right ─────────────

function LessonStage({
  lesson, alreadyAnswered, onComplete,
}: {
  lesson: Lesson
  alreadyAnswered: boolean
  onComplete: (missed: string[]) => void
}) {
  // Revisiting a finished lesson goes straight to the questions.
  const [reading, setReading] = useState(!alreadyAnswered)
  const [state, setState] = useState({ allAnswered: false, missed: [] as string[], correct: 0 })

  // Swapping the timer for the questions must not move the page. The browser's
  // scroll anchoring can latch onto something below the timer and follow it
  // down past the new questions, so the reading position is put back by hand.
  const readingScroll = useRef<number | null>(null)

  const onElapsed = useCallback(() => {
    readingScroll.current = window.scrollY
    setReading(false)
  }, [])

  useLayoutEffect(() => {
    if (reading || readingScroll.current === null) return
    const y = readingScroll.current
    readingScroll.current = null
    window.scrollTo({ top: y, behavior: 'instant' })
    // Anchoring can adjust again on the next layout, once the questions settle.
    const frame = requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [reading])

  return (
    <div className="flex flex-col gap-8">
      {/* Content on the left, reference imagery on the right */}
      {/* Stretch below lg: a content-sized card grows past the screen when a
          table in it is wide, and drags the whole page sideways. */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        <div className="w-full flex-1 min-w-0 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-5 sm:p-8 lg:p-10 flex flex-col gap-8">
          {/* No step counter. The rail above already shows where you are, and
              a second count only made the lesson feel like a queue. */}
          <h2 className="text-display-sm sm:text-display-md text-on-surface">
            {lesson.title}
          </h2>
          <LessonContent lesson={lesson} />
        </div>

        <LessonAside lesson={lesson} />
      </div>

      {/* Below both: the timer runs, and the questions take its place */}
      {reading ? (
        <ReadTimer seconds={lesson.readSeconds} onElapsed={onElapsed} />
      ) : (
        <div className="flex flex-col gap-6">
          <QuestionStack
            questions={lesson.questions}
            images={lesson.images}
            onChange={setState}
          />
          <div className="flex items-center justify-end gap-4 flex-wrap">
            {!state.allAnswered && (
              <p className="text-body-md text-on-surface-variant">
                Answer every question to continue. Getting one wrong won’t hold you back.
              </p>
            )}
            <button
              onClick={() => onComplete(state.missed)}
              disabled={!state.allAnswered}
              className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 disabled:opacity-30"
            >
              {alreadyAnswered ? 'Continue' : 'Next step'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Action: go and use the real tool ────────────────────────────────────────

/**
 * Two short lists and one button: what to have ready, and what to do once the
 * tool is open. The rail already says this step is the learner's to do, so the
 * page doesn't repeat it.
 */
function ActionStage({
  track, done, onGo, onContinue,
}: {
  track: Track
  done: boolean
  onGo: () => void
  onContinue: () => void
}) {
  const action = track.action!
  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-10 flex flex-col gap-8 max-w-3xl w-full">
      <h2 className="text-display-sm sm:text-display-md text-on-surface">{action.title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-surface-container-low p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="text-headline-md text-on-surface">What you need</h3>
          <ul className="flex flex-col gap-3">
            {action.need.map(item => (
              <li key={item} className="flex gap-3">
                <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-on-surface/40 shrink-0" aria-hidden />
                <p className="text-body-lg text-on-surface-variant">{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-surface-container-low p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="text-headline-md text-on-surface">What you’ll do</h3>
          <ol className="flex flex-col gap-3">
            {action.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-label-md text-on-surface tabular-nums shrink-0" aria-hidden>
                  {i + 1}
                </span>
                <p className="text-body-lg text-on-surface-variant">{step}</p>
              </li>
            ))}
          </ol>

          {action.bonus && (
            <div className="flex gap-3 border-t border-on-surface/10 pt-4">
              <span className="w-6 h-6 rounded-full bg-[rgba(224,163,0,0.14)] flex items-center justify-center shrink-0" aria-hidden>
                <Sparkles size={13} className="text-[#8a6400]" />
              </span>
              <p className="text-body-lg text-on-surface-variant">
                <span className="text-on-surface font-medium">Bonus: </span>
                {action.bonus}
              </p>
            </div>
          )}
        </div>
      </div>

      {done ? (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2 text-body-lg text-success">
            <Check size={18} /> Recorded
          </span>
          <button
            onClick={onContinue}
            className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2"
          >
            Take the final quiz <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={onGo}
          className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 self-start"
        >
          Open {track.title} and do it <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}

// ─── Final quiz ──────────────────────────────────────────────────────────────

function FinalStage({
  track, onSubmit, onDone,
}: {
  track: Track
  onSubmit: (correct: number, total: number, missed: string[], rankPoints: number) => boolean
  onDone: () => void
}) {
  // A retake draws a fresh paper rather than re-showing the one just sat.
  const [attemptKey, setAttemptKey] = useState(0)

  const submit = useCallback(
    (points: number, totalPoints: number, missed: string[], rankPoints: number) => {
      const passed = onSubmit(points, totalPoints, missed, rankPoints)
      if (!passed) setAttemptKey(k => k + 1)
      return passed
    },
    [onSubmit],
  )

  return (
    <VideoQuiz
      track={track}
      attemptKey={attemptKey}
      onSubmit={submit}
      onDone={onDone}
    />
  )
}

// ─── Congratulations ─────────────────────────────────────────────────────────

function Congratulations({
  track, result,
}: {
  track: Track
  result: { best: number; total: number; attempts: number } | null
}) {
  return (
    <div className="flex items-center justify-center bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] px-6 sm:px-8 py-16 sm:py-20 animate-fade-in">
      <div className="flex flex-col gap-6 items-center text-center max-w-xl">
        <Confetti />
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <Trophy size={34} className="text-success" />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-display-md sm:text-display-lg text-on-surface">
            {track.title} complete
          </h2>
          {result && (
            <p className="text-title-lg text-on-surface-variant tabular-nums">
              {result.best} of {result.total} on the final
              {result.attempts > 1 ? ` — ${result.attempts} attempts` : ''}.
            </p>
          )}
        </div>

        <p className="text-title-lg text-on-surface max-w-md">
          {track.outcome}
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
          <Link
            href={track.unlocks}
            className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2"
          >
            <Unlock size={16} /> Open {track.title}
          </Link>
          <Link
            href="/learning"
            className="flex items-center gap-2 text-body-lg text-on-surface-variant hover:text-on-surface px-5 py-3 transition-colors"
          >
            Next track <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── States ──────────────────────────────────────────────────────────────────

function ComingSoon({ track }: { track: Track }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-20">
      <div className="max-w-md flex flex-col gap-5 text-center items-center">
        <Sparkles size={22} className="text-on-surface-variant" />
        <h1 className="text-display-sm text-on-surface">
          {track.title} is still being written
        </h1>
        <p className="text-title-lg text-on-surface-variant">{track.outcome}</p>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {DISCLAIMER_INVESTING}
        </p>
        <Link
          href="/learning"
          className="btn-action items-center justify-center gap-1.5"
        >
          <ArrowLeft size={16} /> Back to Learning
        </Link>
      </div>
    </div>
  )
}

function Missing({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-20">
      <div className="max-w-sm flex flex-col gap-5 text-center items-center">
        <p className="text-title-lg text-on-surface-variant">{message}</p>
        <Link
          href="/learning"
          className="btn-action items-center justify-center gap-1.5"
        >
          <ArrowLeft size={16} /> Back to Learning
        </Link>
      </div>
    </div>
  )
}
