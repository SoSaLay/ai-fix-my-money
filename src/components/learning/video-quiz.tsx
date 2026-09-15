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
import { ArrowRight, Check, Loader2, Mic, MicOff, RotateCcw, Square, Volume2 } from 'lucide-react'

import { VideoEmbed } from '@/components/learning/video-embed'
import { AnswerOption, WhyPanel } from '@/components/learning/answer-option'
import { useDictation } from '@/hooks/use-dictation'
import { completeAttempt, reportVideoUnavailable } from '@/lib/learning/quiz/client'
import { findLessonImage, type QuizQuestion, type Track } from '@/lib/learning/tracks'
import type { PublicVideoQuestion } from '@/lib/learning/video-pool/types'
import { finalRankPoints } from '@/lib/learning/rank'

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
  onSubmit: (points: number, totalPoints: number, missed: string[], rankPoints: number) => boolean
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
    const rankPoints = finalRankPoints(
      Object.values(grades).map(g => g.score),
      choices.filter(q => picks[q.id] === q.answer).length,
    )
    const passed = onSubmit(points, totalPoints, missed, rankPoints)
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
      <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] px-7 py-12 flex flex-col gap-3 items-center text-center max-w-2xl mx-auto w-full">
        <p className="text-headline-lg text-on-surface">{loadError.message}</p>
        {loadError.detail && (
          <p className="text-body-lg text-on-surface-variant">{loadError.detail}</p>
        )}
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-24 text-on-surface-variant">
        <Loader2 size={20} className="animate-spin" aria-hidden />
        <span className="text-title-lg">Drawing your paper…</span>
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-10 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <span className="text-title-md text-on-surface-variant">Final test · {track.title}</span>
            <h2 className="text-display-sm sm:text-display-md text-on-surface">Show what you know.</h2>
          </div>
          <span className="rounded-full bg-surface-container-low px-3.5 py-1.5 text-label-lg text-on-surface tabular-nums">
            {answered} of {total} answered
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-on-surface/10 overflow-hidden" aria-hidden>
          <div
            className="h-full rounded-full bg-[#17171c] transition-[width] duration-300"
            style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
          />
        </div>
        <p className="text-body-lg text-on-surface-variant leading-relaxed">
          {videos.length} videos to watch and answer in your own words
          {choices.length > 0 ? `, then ${choices.length} multiple choice` : ''}. Each is worth{' '}
          {POINTS_PER_QUESTION} points — {totalPoints} in total, and you need{' '}
          {Math.ceil(totalPoints * PASS_FRACTION)} to pass. Every answer is marked as soon as
          you give it, and cannot be changed after that.
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
          <p className="text-body-md text-on-surface-variant">Answer every question to finish.</p>
        )}
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 disabled:opacity-30"
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
  const dictation = useDictation(answer, setAnswer)
  const stopDictation = dictation.stop
  const [speaking, setSpeaking] = useState(false)
  const [canSpeak, setCanSpeak] = useState(false)

  // Checked after mount so the server render matches. Leaving the page
  // mid-sentence should not keep reading.
  useEffect(() => {
    const available = 'speechSynthesis' in window
    setCanSpeak(available)
    return () => { if (available) window.speechSynthesis.cancel() }
  }, [])

  const toggleSpeak = useCallback(() => {
    const synth = window.speechSynthesis
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(video.question)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(utterance)
  }, [speaking, video.question])

  const send = useCallback(async () => {
    if (busy || grade) return
    stopDictation()
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
  }, [busy, grade, stopDictation, attemptId, video.id, answer, onGraded])

  const report = useCallback(() => {
    setReported(true)
    void reportVideoUnavailable({ trackId, videoId: video.id })
  }, [trackId, video.id])

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-label-lg text-on-surface-variant tabular-nums">Question {index}</p>
          <p className="text-headline-lg text-on-surface">{video.question}</p>
        </div>
        {canSpeak && (
          <button
            type="button"
            onClick={toggleSpeak}
            aria-label={speaking ? 'Stop reading the question' : 'Read the question aloud'}
            title={speaking ? 'Stop reading' : 'Read aloud'}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors"
          >
            {speaking ? <Square size={16} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          </button>
        )}
      </div>

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
            readOnly={dictation.listening}
            rows={7}
            placeholder={
              dictation.supported
                ? 'Type or tap the mic and speak your answer. Spelling and grammar are not marked — what you understood is.'
                : 'Answer in your own words. Spelling and grammar are not marked — what you understood is.'
            }
            className="w-full resize-y rounded-2xl border border-on-surface/10 bg-surface-container-low px-5 py-4 text-body-lg text-on-surface placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:border-on-surface/30 focus:outline-none disabled:opacity-70 transition-colors"
          />

          {reported && !grade && (
            <p className="text-body-md text-on-surface-variant">
              Flagged for review. Answer what you can — a dead embed will not count against you.
            </p>
          )}

          {!grade && dictation.supported && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={dictation.listening ? dictation.stop : dictation.start}
                disabled={busy}
                aria-pressed={dictation.listening}
                className={`inline-flex items-center gap-2 rounded-full px-4 h-10 text-label-lg transition-colors disabled:opacity-30 ${
                  dictation.listening
                    ? 'bg-error/10 text-error'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                {dictation.listening ? (
                  <>
                    <MicOff size={15} aria-hidden /> Stop speaking
                  </>
                ) : (
                  <>
                    <Mic size={15} aria-hidden /> Speak your answer
                  </>
                )}
              </button>
              {dictation.listening && (
                <span className="flex items-center gap-1.5 text-body-md text-on-surface-variant">
                  <span className="h-2 w-2 rounded-full bg-error animate-pulse" aria-hidden />
                  Listening…
                </span>
              )}
            </div>
          )}

          {dictation.error && !grade && (
            <p className="text-body-md text-error">{dictation.error}</p>
          )}

          {!grade && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={send}
                disabled={busy || answer.trim() === ''}
                className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 disabled:opacity-30"
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden /> Marking…
                  </>
                ) : (
                  'Submit answer'
                )}
              </button>
              <span className="text-body-md text-on-surface-variant">
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

  // Green, yellow, red — the same three colours the step rail uses.
  const tone =
    grade.verdict === 'full' ? 'border-success/30 bg-success/[0.07] text-success' :
    grade.verdict === 'partial' ? 'border-[#e0a300]/35 bg-[rgba(224,163,0,0.09)] text-[#8a6400]' :
    'border-error/30 bg-error/[0.06] text-error'

  return (
    <div className={`animate-fade-in rounded-2xl border px-5 py-4 flex flex-col gap-2.5 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-title-md">{label}</span>
        <span className="text-title-md tabular-nums">
          {grade.score} / {POINTS_PER_QUESTION}
        </span>
      </div>

      <p className="text-body-lg text-on-surface leading-relaxed">{grade.reasoning}</p>

      {grade.missed.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-label-lg text-on-surface">
            Not covered
          </span>
          <ul className="list-disc pl-5 text-body-md text-on-surface-variant flex flex-col gap-1">
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
    <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-label-lg text-on-surface-variant tabular-nums">Question {index}</p>
        <p className="text-headline-lg text-on-surface">{question.question}</p>
      </div>

      {image && (
        <figure className="w-full max-w-[420px] rounded-2xl overflow-hidden bg-surface-container-low">
          <div className="relative w-full aspect-[4/3]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="420px"
              unoptimized={image.src.endsWith('.svg')}
              className="object-contain"
            />
          </div>
        </figure>
      )}

      <div className="flex flex-col gap-2.5" role="group" aria-label={`Answers for question ${index}`}>
        {question.options.map((option, i) => (
          <AnswerOption
            key={i}
            index={i}
            label={option}
            picked={i === picked}
            isAnswer={i === question.answer}
            revealed={revealed}
            onPick={() => onPick(i)}
          />
        ))}
      </div>

      {revealed && <WhyPanel correct={picked === question.answer} why={question.why} />}
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
      <div className="animate-fade-in flex flex-col gap-5 items-center text-center max-w-2xl mx-auto w-full bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] px-7 py-14 sm:py-16">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <Check size={30} className="text-success" />
        </div>
        <p className="text-display-lg text-on-surface tabular-nums">{points}/{totalPoints}</p>
        <h2 className="text-display-sm text-on-surface">Passed.</h2>
        <button onClick={onDone} className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 mt-2">
          See your result <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] px-7 py-14 sm:py-16 flex flex-col gap-5 items-center text-center max-w-2xl mx-auto w-full">
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
        <RotateCcw size={28} className="text-on-surface" />
      </div>
      <p className="text-display-lg text-on-surface tabular-nums">{points}/{totalPoints}</p>
      <h2 className="text-display-sm text-on-surface">Not quite yet.</h2>
      <p className="text-title-lg text-on-surface-variant tabular-nums">
        You need {needed} to pass.
      </p>
      <p className="text-body-lg text-on-surface-variant max-w-md leading-relaxed">
        Everything you did not get full marks on is in your review queue. Go back over what
        you want to revisit, then take it again — a retake draws a different paper, and there
        is no limit on attempts.
      </p>
      <button onClick={onDone} className="btn-action !h-12 !px-6 !text-[15px] items-center justify-center gap-2 mt-2">
        Back to the track <ArrowRight size={16} />
      </button>
    </div>
  )
}
