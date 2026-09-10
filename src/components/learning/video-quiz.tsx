'use client'

// ============================================================================
// The final paper: eight video questions answered in writing, then two multiple
// choice. Ten questions, scored out of twenty.
//
// Every answer is marked the moment it is given and cannot then be changed.
// A written answer goes to the grader, which returns a score with its reasoning
// and the rubric points the answer did not reach — that feedback is the whole
// point of writing rather than picking, so holding it back until the end would
// waste it. Multiple choice reveals on the same beat, so the paper never has
// two different rules about when you find out how you did.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Check, Loader2, RotateCcw, X } from 'lucide-react'

import { VideoEmbed } from '@/components/learning/video-embed'
import { completeAttempt, reportVideoUnavailable } from '@/lib/learning/quiz/client'
import { findLessonImage, type QuizQuestion, type Track } from '@/lib/learning/tracks'
import type { PublicVideoQuestion } from '@/lib/learning/video-pool/types'

/** Both question kinds are worth the same, so neither dominates the paper. */
const POINTS_PER_QUESTION = 2

/** Matches PASS_THRESHOLD. Kept local so this file has no server import. */
const PASS_FRACTION = 0.8

interface PublicChoiceQuestion {
  id: string
}

interface Paper {
  trackId: string
  attemptId: string
  videos: PublicVideoQuestion[]
  choices: PublicChoiceQuestion[]
}

interface Grade {
  score: 0 | 1 | 2
  verdict: 'missed' | 'partial' | 'full'
  reasoning: string
  missed: string[]
}

interface VideoQuizProps {
  track: Track
  /** Returns whether the attempt passed. Scored in points, not questions. */
  onSubmit: (points: number, totalPoints: number, missed: string[]) => boolean
  onDone: () => void
  /** Bumped by the parent to draw a fresh paper. */
  attemptKey: number
}

export function VideoQuiz({ track, onSubmit, onDone, attemptKey }: VideoQuizProps) {
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loadError, setLoadError] = useState<{ message: string; detail?: string } | null>(null)

  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [picks, setPicks] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ points: number; passed: boolean } | null>(null)

  useEffect(() => {
    let active = true
    setPaper(null)
    setLoadError(null)
    setGrades({})
    setPicks({})
    setResult(null)

    void (async () => {
      try {
        const response = await fetch(`/api/quiz/${track.id}`, { cache: 'no-store' })
        const body = await response.json()
        if (!active) return
        if (!response.ok) {
          setLoadError({ message: body.error ?? 'Could not start the quiz.', detail: body.detail })
          return
        }
        setPaper(body as Paper)
      } catch {
        if (active) setLoadError({ message: 'Could not reach the quiz. Check your connection.' })
      }
    })()

    return () => { active = false }
  }, [track.id, attemptKey])

  // The paper carries choice ids only. The questions themselves are already in
  // the bundle, and that is where the answer key lives — the API deliberately
  // does not send one.
  const choices: QuizQuestion[] = useMemo(() => {
    if (!paper) return []
    return paper.choices
      .map(c => track.finalQuiz.find(q => q.id === c.id))
      .filter((q): q is QuizQuestion => Boolean(q))
  }, [paper, track.finalQuiz])

  const videos = paper?.videos ?? []
  const total = videos.length + choices.length
  const answered = Object.keys(grades).length + Object.keys(picks).length
  const allAnswered = total > 0 && answered === total
  const totalPoints = total * POINTS_PER_QUESTION

  const points = useMemo(() => {
    const written = Object.values(grades).reduce((sum, g) => sum + g.score, 0)
    const picked = choices.filter(q => picks[q.id] === q.answer).length * POINTS_PER_QUESTION
    return written + picked
  }, [grades, picks, choices])

  const submit = useCallback(() => {
    if (!paper) return
    // Anything short of full marks is worth seeing again, whichever kind it was.
    const missed = [
      ...Object.entries(grades).filter(([, g]) => g.score < POINTS_PER_QUESTION).map(([id]) => id),
      ...choices.filter(q => picks[q.id] !== q.answer).map(q => q.id),
    ]
    const passed = onSubmit(points, totalPoints, missed)
    setResult({ points, passed })
    void completeAttempt({
      attemptId: paper.attemptId,
      correct: points,
      total: totalPoints,
      passed,
    })
  }, [paper, grades, picks, choices, points, totalPoints, onSubmit])

  if (loadError) {
    return (
      <div className="bg-surface-container-lowest rounded-3xl px-7 py-10 flex flex-col gap-3 items-center text-center max-w-2xl mx-auto">
        <p className="text-title-md text-on-surface font-semibold">{loadError.message}</p>
        {loadError.detail && (
          <p className="text-body-md text-on-surface-variant">{loadError.detail}</p>
        )}
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-on-surface-variant">
        <Loader2 size={18} className="animate-spin" aria-hidden />
        <span className="text-body-md">Drawing your paper…</span>
      </div>
    )
  }

  if (result) {
    return (
      <Result
        points={result.points}
        totalPoints={totalPoints}
        passed={result.passed}
        onDone={onDone}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-3xl px-7 py-6 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
            Final quiz · {track.title}
          </span>
          <span className="text-label-sm text-on-surface-variant tabular-nums">
            {answered}/{total} answered
          </span>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {videos.length} videos to watch and answer in your own words, then {choices.length}{' '}
          multiple choice. Each is worth {POINTS_PER_QUESTION} points — {totalPoints} in total,
          and you need {Math.ceil(totalPoints * PASS_FRACTION)} to pass. Every answer is marked
          as soon as you give it, and cannot be changed after that.
        </p>
      </div>

      {videos.map((video, i) => (
        <VideoQuestion
          key={video.id}
          index={i + 1}
          video={video}
          attemptId={paper.attemptId}
          trackId={paper.trackId}
          grade={grades[video.id]}
          onGraded={grade => setGrades(prev => ({ ...prev, [video.id]: grade }))}
        />
      ))}

      {choices.map((choice, i) => (
        <ChoiceQuestion
          key={choice.id}
          index={videos.length + i + 1}
          question={choice}
          picked={picks[choice.id]}
          onPick={option =>
            setPicks(prev => (prev[choice.id] !== undefined ? prev : { ...prev, [choice.id]: option }))
          }
        />
      ))}

      <div className="flex items-center justify-end gap-4 flex-wrap">
        {!allAnswered && (
          <p className="text-label-sm text-on-surface-variant">Answer every question to finish.</p>
        )}
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="btn-action items-center justify-center gap-1.5 disabled:opacity-30"
        >
          Finish quiz <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── One video question ──────────────────────────────────────────────────────

function VideoQuestion({
  index, video, attemptId, trackId, grade, onGraded,
}: {
  index: number
  video: PublicVideoQuestion
  attemptId: string
  trackId: string
  grade?: Grade
  onGraded: (grade: Grade) => void
}) {
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reported, setReported] = useState(false)

  const send = useCallback(async () => {
    if (busy || grade) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/quiz/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, questionId: video.id, answer }),
      })
      const body = await response.json()
      if (!response.ok) {
        // A grader outage must not read as a wrong answer, so nothing is
        // recorded and the learner can try the same answer again.
        setError(body.error ?? 'Could not grade that answer.')
        return
      }
      onGraded(body as Grade)
    } catch {
      setError('Could not reach the grader. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }, [busy, grade, attemptId, video.id, answer, onGraded])

  const report = useCallback(() => {
    setReported(true)
    void reportVideoUnavailable({ trackId, videoId: video.id })
  }, [trackId, video.id])

  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-6 flex flex-col gap-4">
      <p className="text-body-lg text-on-surface font-medium leading-snug">
        <span className="text-on-surface-variant tabular-nums mr-1.5">{index}.</span>
        {video.question}
      </p>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <VideoEmbed
          embedUrl={video.embedUrl}
          shareUrl={video.shareUrl}
          creatorHandle={video.creatorHandle}
          postedAt={video.postedAt}
          onReportUnavailable={grade || reported ? undefined : report}
        />

        <div className="flex-1 min-w-0 flex flex-col gap-3 w-full">
          <textarea
            value={answer}
            onChange={event => setAnswer(event.target.value)}
            disabled={Boolean(grade) || busy}
            rows={7}
            placeholder="Answer in your own words. Spelling and grammar are not marked — what you understood is."
            className="w-full resize-y rounded-2xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container focus:outline-none focus:ring-2 focus:ring-secondary/35 disabled:opacity-70"
          />

          {reported && !grade && (
            <p className="text-label-sm text-on-surface-variant">
              Flagged for review. Answer what you can — a dead embed will not count against you.
            </p>
          )}

          {!grade && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={send}
                disabled={busy || answer.trim() === ''}
                className="btn-action items-center justify-center gap-1.5 disabled:opacity-30"
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden /> Marking…
                  </>
                ) : (
                  'Submit answer'
                )}
              </button>
              <span className="text-label-sm text-on-surface-variant">
                You cannot change it afterwards.
              </span>
            </div>
          )}

          {error && <p className="text-body-md text-error">{error}</p>}

          {grade && <GradeCard grade={grade} />}
        </div>
      </div>
    </div>
  )
}

/** The mark, its reasoning, and what the answer did not reach. */
function GradeCard({ grade }: { grade: Grade }) {
  const label =
    grade.verdict === 'full' ? 'Full marks' :
    grade.verdict === 'partial' ? 'Partly there' : 'Missed'

  const tone =
    grade.verdict === 'full' ? 'bg-tertiary-fixed/40' :
    grade.verdict === 'partial' ? 'bg-secondary-fixed/40' : 'bg-error/10'

  return (
    <div className={`rounded-2xl px-4 py-3.5 flex flex-col gap-2 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <span className="text-label-md tabular-nums text-on-surface font-semibold">
          {grade.score} / {POINTS_PER_QUESTION}
        </span>
      </div>

      <p className="text-body-md text-on-surface leading-relaxed">{grade.reasoning}</p>

      {grade.missed.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Not covered
          </span>
          <ul className="list-disc pl-5 text-body-sm text-on-surface-variant">
            {grade.missed.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── One multiple choice question ────────────────────────────────────────────

function ChoiceQuestion({
  index, question, picked, onPick,
}: {
  index: number
  question: QuizQuestion
  picked?: number
  onPick: (option: number) => void
}) {
  const image = question.imageSrc ? findLessonImage(question.imageSrc) : undefined
  const revealed = picked !== undefined

  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-6 flex flex-col gap-4">
      <p className="text-body-lg text-on-surface font-medium leading-snug">
        <span className="text-on-surface-variant tabular-nums mr-1.5">{index}.</span>
        {question.question}
      </p>

      {image && (
        <figure className="w-full max-w-[380px] rounded-xl overflow-hidden bg-surface-container">
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="380px"
              unoptimized={image.src.endsWith('.svg')}
              className="object-contain"
            />
          </div>
        </figure>
      )}

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer
          const isPicked = i === picked

          let cls = 'border-outline-variant/60 hover:border-secondary/50 hover:bg-surface-container-low'
          if (revealed && isAnswer) cls = 'border-transparent bg-tertiary-fixed/40'
          else if (revealed && isPicked) cls = 'border-transparent bg-error/10'
          else if (revealed) cls = 'border-outline-variant/30 opacity-55'

          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={revealed}
              className={`flex items-center justify-between gap-3 text-left border rounded-2xl px-4 py-3.5 transition-all ${cls}`}
            >
              <span className="text-body-md text-on-surface">{option}</span>
              {revealed && isAnswer && (
                <Check size={17} style={{ color: '#1a6b3a' }} className="shrink-0" />
              )}
              {revealed && isPicked && !isAnswer && (
                <X size={17} className="text-error shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="bg-surface-container rounded-2xl px-4 py-3.5 flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            {picked === question.answer ? 'Right — here’s why' : 'Not quite — here’s why'}
          </span>
          <p className="text-body-md text-on-surface-variant leading-relaxed">{question.why}</p>
        </div>
      )}
    </div>
  )
}

// ─── Result ──────────────────────────────────────────────────────────────────

function Result({
  points, totalPoints, passed, onDone,
}: {
  points: number
  totalPoints: number
  passed: boolean
  onDone: () => void
}) {
  const needed = Math.ceil(totalPoints * PASS_FRACTION)

  if (passed) {
    return (
      <div className="flex flex-col gap-5 items-center text-center max-w-2xl mx-auto bg-surface-container-lowest rounded-3xl px-7 py-10">
        <Check size={24} style={{ color: '#1a6b3a' }} />
        <h2 className="text-headline-sm text-on-surface font-bold">Passed</h2>
        <p className="text-body-lg text-on-surface-variant tabular-nums">
          {points} of {totalPoints} points.
        </p>
        <button onClick={onDone} className="btn-action items-center justify-center gap-1.5 mt-1">
          See your result <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-10 flex flex-col gap-5 items-center text-center max-w-2xl mx-auto">
      <RotateCcw size={24} className="text-on-surface-variant" />
      <h2 className="text-headline-sm text-on-surface font-bold">Not quite yet</h2>
      <p className="text-body-lg text-on-surface-variant tabular-nums">
        {points} of {totalPoints} points. You need {needed} to pass.
      </p>
      <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
        Everything you did not get full marks on is in your review queue. Go back over what
        you want to revisit, then take it again — a retake draws a different paper, and there
        is no limit on attempts.
      </p>
      <button onClick={onDone} className="btn-action items-center justify-center gap-1.5 mt-1">
        Back to the track <ArrowRight size={16} />
      </button>
    </div>
  )
}
