'use client'

import { use, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, PenLine, Sparkles, Trophy, RotateCcw, Unlock,
} from 'lucide-react'
import { useLearning, type Stage } from '@/contexts/learning-context'
import { getTrack, shortTitle, type Track, type Lesson, type LessonSection } from '@/lib/learning/tracks'
import { DISCLAIMER_INVESTING } from '@/lib/learning/disclaimer'
import { DisclaimerFooter } from '@/components/learning/disclaimer-footer'
import { LessonContent } from '@/components/learning/lesson-content'
import { LessonAside } from '@/components/learning/lesson-aside'
import { ReadTimer } from '@/components/learning/read-timer'
import { QuestionStack } from '@/components/learning/question-stack'
import { VideoQuiz } from '@/components/learning/video-quiz'
import { StepRail, type RailItem } from '@/components/learning/step-rail'

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
            <Congratulations track={track} result={progress.final} didAction={progress.actionDone} />
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

  const onElapsed = useCallback(() => setReading(false), [])

  return (
    <div className="flex flex-col gap-8">
      {/* Content on the left, reference imagery on the right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-10 flex flex-col gap-8">
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
 * Reference material carried into the action step. Deliberately quieter than a
 * lesson — this is something to look across while working, not something to
 * read through, so it sits in a recessed block rather than in the page's own
 * type scale.
 */
function ActionBrief({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
      {sections.map((section, i) => (
        <div
          key={section.heading ?? i}
          className={section.divider && i > 0 ? 'border-t border-on-surface/10 pt-5' : undefined}
        >
          {section.heading && (
            <p className="text-title-md text-on-surface mb-2">{section.heading}</p>
          )}
          {section.body && (
            <p className="text-body-lg text-on-surface-variant leading-relaxed">{section.body}</p>
          )}
          {section.bullets && (
            <ul className="flex flex-col gap-2.5">
              {section.bullets.map(bullet => (
                <li key={bullet.term ?? bullet.text} className="flex gap-3">
                  <span className="mt-[10px] w-1.5 h-1.5 rounded-full bg-on-surface/40 shrink-0" aria-hidden />
                  <p className="text-body-lg text-on-surface-variant leading-relaxed">
                    {bullet.term && (
                      <span className="text-on-surface font-medium">{bullet.term}. </span>
                    )}
                    {bullet.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

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
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
          <PenLine size={15} className="text-on-surface" />
        </span>
        <span className="text-title-md text-on-surface-variant">
          {action.label ?? 'Your turn'}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-display-sm sm:text-display-md text-on-surface">{action.title}</h2>
        <p className="text-title-lg text-on-surface-variant">{action.prompt}</p>
      </div>

      {action.brief && <ActionBrief sections={action.brief} />}

      <div className="flex flex-col gap-4">
        <h3 className="text-headline-md text-on-surface">What to do</h3>
        <ol className="flex flex-col gap-3">
          {action.tasks.map((task, i) => (
            <li key={task} className="flex gap-3.5">
              <span className="mt-0.5 w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-label-lg text-on-surface tabular-nums shrink-0" aria-hidden>
                {i + 1}
              </span>
              <p className="text-body-lg text-on-surface-variant leading-relaxed">{task}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-on-surface/10 px-5 py-4 flex gap-3">
        <Check size={18} className="text-success mt-0.5 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-title-md text-on-surface">Done when</p>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">{action.doneWhen}</p>
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
  track, result, didAction,
}: {
  track: Track
  result: { best: number; total: number; attempts: number } | null
  /** False when the learner tested out and skipped the lessons. */
  didAction: boolean
}) {
  return (
    <div className="flex items-center justify-center bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] px-6 sm:px-8 py-16 sm:py-20 animate-fade-in">
      <div className="flex flex-col gap-6 items-center text-center max-w-xl">
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

        <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-md">
          {didAction
            ? `${track.title} is unlocked for good, and it already holds the data you entered. Everything you covered will come back in review over the next week.`
            : `${track.title} is unlocked for good. The lessons are still here whenever you want them, and anything you missed comes back in review over the next week.`}
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
    <div className="flex-1 flex items-center justify-center px-8 py-20">
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
    <div className="flex-1 flex items-center justify-center px-8 py-20">
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
