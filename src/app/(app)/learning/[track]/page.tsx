'use client'

import { use, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, PenLine, Sparkles, Trophy, RotateCcw, Unlock,
} from 'lucide-react'
import { useLearning, type Stage } from '@/contexts/learning-context'
import { getTrack, passMark, shortTitle, type Track, type Lesson } from '@/lib/learning/tracks'
import { DISCLAIMER_INVESTING } from '@/lib/learning/disclaimer'
import { DisclaimerBar } from '@/components/learning/disclaimer-bar'
import { AcknowledgmentGate } from '@/components/learning/acknowledgment-gate'
import { LessonContent } from '@/components/learning/lesson-content'
import { LessonImages } from '@/components/learning/lesson-images'
import { ReadTimer } from '@/components/learning/read-timer'
import { QuestionStack } from '@/components/learning/question-stack'

export default function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackParam } = use(params)
  const router = useRouter()
  const {
    ready, isTrackUnlocked, isTrackComplete, trackProgress, trackCompletion,
    stageFor, recordLesson, recordAction, recordFinal, startGuided,
  } = useLearning()

  const track = getTrack(trackParam)

  // `view` lets the learner step back through finished material without
  // rewinding their actual progress.
  const [view, setView] = useState<Stage | null>(null)

  // `?step=final` is the test-out route off a locked section: it drops the
  // learner straight on the final quiz, lessons and ordering set aside.
  useEffect(() => {
    if (!ready || !track) return
    const testOut = new URLSearchParams(window.location.search).get('step') === 'final'
    setView(testOut && track.finalQuiz.length > 0 ? { kind: 'final' } : stageFor(track.id))
  }, [ready, track, stageFor])

  if (!ready || !track) {
    return <Missing message="That track doesn’t exist." />
  }
  if (track.lessons.length === 0) {
    return <ComingSoon track={track} />
  }
  if (!view) return null

  // Track order still holds for the lessons — but never for the final, or for
  // a track already passed by way of it.
  const testedOut = trackProgress(track.id).final?.passed === true
  if (!isTrackUnlocked(track.id) && view.kind !== 'final' && !testedOut) {
    return <Missing message="Finish the tracks before this one first — each builds on the last." />
  }

  const completion = trackCompletion(track.id)
  const finished = isTrackComplete(track.id)
  const progress = trackProgress(track.id)
  const live = stageFor(track.id)

  // Step rail: lessons, then the action step, then the final.
  const railItems = [
    ...track.lessons.map((l, i) => ({
      key: l.id,
      label: l.title,
      done: !!progress.lessons[l.id]?.answered,
      stage: { kind: 'lesson' as const, id: l.id, index: i },
    })),
    ...(track.action ? [{
      key: 'action',
      label: track.action.title,
      done: progress.actionDone,
      stage: { kind: 'action' as const },
    }] : []),
    ...(track.finalQuiz.length > 0 ? [{
      key: 'final',
      label: 'Final quiz',
      done: progress.final?.passed === true,
      stage: { kind: 'final' as const },
    }] : []),
  ]

  // Anything up to the live step stays reachable, so going back never traps.
  const liveIndex = railItems.findIndex(r => sameStage(r.stage, live))
  const furthest = liveIndex === -1 ? railItems.length - 1 : liveIndex
  const viewIndex = railItems.findIndex(r => sameStage(r.stage, view))

  // Testing out of an order-locked track shows the final and nothing else —
  // stepping back would land on lessons that aren't open to them yet.
  const canBrowseSteps = isTrackUnlocked(track.id) || testedOut
  const previous = canBrowseSteps && viewIndex > 0 ? railItems[viewIndex - 1] : null

  const advance = () => setView(stageFor(track.id))

  return (
    <AcknowledgmentGate>
      <div className="flex flex-col gap-6 px-8 py-8 max-w-6xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4">
          {previous ? (
            <button
              onClick={() => setView(previous.stage)}
              className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit text-left"
            >
              <ArrowLeft size={15} className="shrink-0" />
              <span className="truncate">Back to {shortTitle(previous.label)}</span>
            </button>
          ) : (
            <Link
              href="/learning"
              className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
            >
              <ArrowLeft size={15} /> Learning
            </Link>
          )}

          <div className="flex items-center justify-between gap-6 flex-wrap">
            <h1 className="text-headline-lg text-on-surface font-bold">{track.title}</h1>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-label-lg text-on-surface-variant tabular-nums">
                {completion.done}/{completion.total} done
              </span>
              {finished && (
                <Link
                  href={track.unlocks}
                  className="flex items-center gap-2 bg-secondary text-white rounded-xl px-4 py-2 text-label-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Unlock size={14} /> Open {track.title}
                </Link>
              )}
            </div>
          </div>

          {/* Step rail */}
          <div className="flex items-center gap-1.5">
            {railItems.map((item, i) => (
              <button
                key={item.key}
                onClick={() => canBrowseSteps && i <= furthest ? setView(item.stage) : undefined}
                disabled={!canBrowseSteps || i > furthest}
                className="h-1.5 flex-1 rounded-full transition-all disabled:cursor-not-allowed"
                style={{
                  background: item.done
                    ? '#1a6b3a'
                    : sameStage(item.stage, view) ? '#4c49c9' : 'rgba(0,0,0,0.08)',
                }}
                aria-label={item.label}
              />
            ))}
          </div>
        </div>

        {track.id === 'investing' && (
          <div className="bg-surface-container rounded-2xl px-5 py-4">
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {DISCLAIMER_INVESTING}
            </p>
          </div>
        )}

        {view.kind === 'lesson' && (
          <LessonStage
            key={view.id}
            track={track}
            lesson={track.lessons.find(l => l.id === view.id)!}
            index={view.index}
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
            onSubmit={(correct, total, missed) => recordFinal(track.id, correct, total, missed)}
            onDone={advance}
          />
        )}

        {view.kind === 'done' && (
          <Congratulations track={track} result={progress.final} didAction={progress.actionDone} />
        )}

        <DisclaimerBar />
      </div>
    </AcknowledgmentGate>
  )
}

function sameStage(a: Stage, b: Stage): boolean {
  if (a.kind !== b.kind) return false
  return a.kind === 'lesson' && b.kind === 'lesson' ? a.id === b.id : true
}

// ─── Lesson: read on the left, timer then questions on the right ─────────────

function LessonStage({
  track, lesson, index, alreadyAnswered, onComplete,
}: {
  track: Track
  lesson: Lesson
  index: number
  alreadyAnswered: boolean
  onComplete: (missed: string[]) => void
}) {
  // Revisiting a finished lesson goes straight to the questions.
  const [reading, setReading] = useState(!alreadyAnswered)
  const [state, setState] = useState({ allAnswered: false, missed: [] as string[], correct: 0 })

  const onElapsed = useCallback(() => setReading(false), [])

  return (
    <div className="flex flex-col gap-6">
      {/* Content on the left, reference imagery on the right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 bg-surface-container-lowest rounded-3xl px-7 py-7 flex flex-col gap-5">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
            Step {index + 1} of {track.lessons.length}
          </span>
          <h2 className="text-headline-sm text-on-surface font-bold leading-snug">
            {lesson.title}
          </h2>
          <LessonContent lesson={lesson} />
        </div>

        <LessonImages images={lesson.images} />
      </div>

      {/* Below both: the timer runs, and the questions take its place */}
      {reading ? (
        <ReadTimer seconds={lesson.readSeconds} onElapsed={onElapsed} />
      ) : (
        <div className="flex flex-col gap-4">
          <QuestionStack
            questions={lesson.questions}
            images={lesson.images}
            onChange={setState}
          />
          <div className="flex items-center justify-end gap-4 flex-wrap">
            {!state.allAnswered && (
              <p className="text-label-sm text-on-surface-variant">
                Answer every question to continue. Getting one wrong won’t hold you back.
              </p>
            )}
            <button
              onClick={() => onComplete(state.missed)}
              disabled={!state.allAnswered}
              className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3 text-label-lg font-medium disabled:opacity-30 transition-opacity"
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
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-7 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-2.5">
        <PenLine size={15} className="text-secondary" />
        <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
          Your turn
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-headline-sm text-on-surface font-bold">{action.title}</h2>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">{action.prompt}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-title-md text-on-surface font-semibold">What to do</p>
        <ul className="flex flex-col gap-2.5">
          {action.tasks.map(task => (
            <li key={task} className="flex gap-2.5">
              <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0" aria-hidden />
              <p className="text-body-md text-on-surface-variant leading-relaxed">{task}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface-container rounded-2xl px-5 py-4">
        <p className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5">
          Done when
        </p>
        <p className="text-body-md text-on-surface leading-relaxed">{action.doneWhen}</p>
      </div>

      {done ? (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2 text-body-md" style={{ color: '#1a6b3a' }}>
            <Check size={16} /> Recorded
          </span>
          <button
            onClick={onContinue}
            className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3 text-label-lg font-medium hover:opacity-90 transition-opacity"
          >
            Take the final quiz <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={onGo}
          className="self-start flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
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
  onSubmit: (correct: number, total: number, missed: string[]) => boolean
  onDone: () => void
}) {
  const needed = useMemo(() => passMark(track), [track])
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ allAnswered: false, missed: [] as string[], correct: 0 })
  const [result, setResult] = useState<{ correct: number; passed: boolean } | null>(null)

  const submit = () => {
    const passed = onSubmit(state.correct, track.finalQuiz.length, state.missed)
    setResult({ correct: state.correct, passed })
  }

  const retake = () => {
    setResult(null)
    setState({ allAnswered: false, missed: [], correct: 0 })
    setAttempt(a => a + 1)
  }

  if (result && !result.passed) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl px-7 py-10 flex flex-col gap-5 items-center text-center max-w-2xl mx-auto">
        <RotateCcw size={24} className="text-on-surface-variant" />
        <h2 className="text-headline-sm text-on-surface font-bold">Not quite yet</h2>
        <p className="text-body-lg text-on-surface-variant">
          {result.correct} of {track.finalQuiz.length} correct. You need {needed} to pass.
        </p>
        <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
          The ones you missed are in your review queue. Go back over the steps you
          want to revisit, then take it again — there is no limit on attempts.
        </p>
        <button
          onClick={retake}
          className="mt-1 flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
        >
          Take it again <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  if (result?.passed) {
    return (
      <div className="flex justify-center">
        <button
          onClick={onDone}
          className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
        >
          See your result <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-3xl px-7 py-6 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <Trophy size={15} className="text-secondary" />
          <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
            Final quiz
          </span>
        </div>
        <h2 className="text-headline-sm text-on-surface font-bold">
          Everything from {track.title}
        </h2>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {track.finalQuiz.length} questions. {needed} correct to pass and unlock the
          feature. Answers are not shown until you submit, and you can retake it.
        </p>
      </div>

      <QuestionStack
        key={attempt}
        questions={track.finalQuiz}
        revealImmediately={false}
        onChange={setState}
      />

      <button
        onClick={submit}
        disabled={!state.allAnswered}
        className="self-end flex items-center gap-2 bg-secondary text-white rounded-2xl px-7 py-3.5 text-label-lg font-medium disabled:opacity-30 transition-opacity"
      >
        Submit answers <ArrowRight size={16} />
      </button>
    </div>
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
    <div className="bg-tertiary-fixed/30 rounded-3xl px-8 py-12 flex flex-col gap-5 items-center text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center">
        <Trophy size={28} style={{ color: '#1a6b3a' }} />
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="text-display-sm text-on-surface font-bold leading-tight">
          {track.title} complete
        </h2>
        {result && (
          <p className="text-body-lg text-on-surface-variant">
            {result.best} of {result.total} on the final
            {result.attempts > 1 ? ` — ${result.attempts} attempts` : ''}.
          </p>
        )}
      </div>

      <p className="text-body-lg text-on-surface leading-relaxed max-w-md">
        {track.outcome}
      </p>

      <p className="text-body-md text-on-surface-variant leading-relaxed max-w-md">
        {didAction
          ? `${track.title} is unlocked for good, and it already holds the data you entered. Everything you covered will come back in review over the next week.`
          : `${track.title} is unlocked for good. The lessons are still here whenever you want them, and anything you missed comes back in review over the next week.`}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
        <Link
          href={track.unlocks}
          className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Unlock size={16} /> Open {track.title}
        </Link>
        <Link
          href="/learning"
          className="flex items-center gap-2 text-label-lg font-medium text-on-surface-variant hover:text-on-surface px-5 py-3.5 transition-colors"
        >
          Next track <ArrowRight size={16} />
        </Link>
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
        <h1 className="text-headline-md text-on-surface font-bold">
          {track.title} is still being written
        </h1>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">{track.outcome}</p>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {DISCLAIMER_INVESTING}
        </p>
        <Link
          href="/learning"
          className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
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
        <p className="text-body-lg text-on-surface-variant leading-relaxed">{message}</p>
        <Link
          href="/learning"
          className="flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3.5 text-label-lg font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} /> Back to Learning
        </Link>
      </div>
    </div>
  )
}
