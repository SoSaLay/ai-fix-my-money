'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check, X, RotateCcw, ArrowRight } from 'lucide-react'
import { useLearning, type ReviewItem } from '@/contexts/learning-context'
import { getTrack, findLessonImage, type QuizQuestion } from '@/lib/learning/tracks'
import { DisclaimerBar } from '@/components/learning/disclaimer-bar'

/**
 * Spaced review. Questions come back at 1 day, 3 days, then a week. Getting one
 * wrong drops it back to the shortest interval — deliberate practice on the
 * specific thing that did not stick, rather than re-reading the whole lesson.
 */
export default function ReviewPage() {
  const { ready, dueReviews, completeReview } = useLearning()

  // Snapshot the queue once so answering does not reshuffle mid-session.
  const [queue] = useState<ReviewItem[]>(() => [])
  const due = useMemo(() => (ready ? dueReviews() : queue), [ready, dueReviews, queue])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [tally, setTally] = useState({ right: 0, wrong: 0 })

  const item = due[index]
  const question = useMemo(() => item ? findQuestion(item) : null, [item])

  // A question that leaned on a diagram in the lesson keeps it here — checking
  // the picture is the point of the review, not a shortcut past it.
  const image = useMemo(
    () => (question?.imageSrc ? findLessonImage(question.imageSrc) : undefined),
    [question],
  )

  const choose = useCallback((i: number) => {
    if (selected !== null || !item || !question) return
    setSelected(i)
    const correct = i === question.answer
    setTally(t => ({ right: t.right + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1) }))
    completeReview(item, correct)
  }, [selected, item, question, completeReview])

  const next = useCallback(() => {
    setIndex(i => i + 1)
    setSelected(null)
  }, [])

  if (!ready) return null

  const finished = index >= due.length

  return (
    <div className="flex flex-col gap-7 px-8 py-10 max-w-2xl w-full mx-auto">
      <Link
        href="/learning"
        className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Learning
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <RotateCcw size={18} className="text-on-surface" />
          <h1 className="text-headline-md text-on-surface font-bold">Review</h1>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Questions you have already seen, back at spaced intervals. Testing yourself
          is what moves this into long-term memory — re-reading does not.
        </p>
      </header>

      {due.length === 0 ? (
        <Empty />
      ) : finished ? (
        <Summary right={tally.right} wrong={tally.wrong} />
      ) : question ? (
        <div className="bg-surface-container-lowest rounded-3xl px-7 py-7 flex flex-col gap-5">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-widest tabular-nums">
            {index + 1} of {due.length}
          </span>

          <p className="text-title-lg text-on-surface font-medium leading-snug">
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
            {question.options.map((opt, i) => {
              const revealed = selected !== null
              const isAnswer = i === question.answer
              const isPicked = i === selected

              let cls = 'border-outline-variant/60 hover:border-secondary/50 hover:bg-surface-container-low'
              if (revealed && isAnswer) cls = 'border-transparent bg-tertiary-fixed/40'
              else if (revealed && isPicked) cls = 'border-transparent bg-error/10'
              else if (revealed) cls = 'border-outline-variant/30 opacity-55'

              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`flex items-center justify-between gap-3 text-left border rounded-2xl px-4 py-3.5 transition-all ${cls}`}
                >
                  <span className="text-body-md text-on-surface">{opt}</span>
                  {revealed && isAnswer && <Check size={17} style={{ color: '#1a6b3a' }} className="shrink-0" />}
                  {revealed && isPicked && !isAnswer && <X size={17} className="text-error shrink-0" />}
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <div className="flex flex-col gap-4">
              <div className="bg-surface-container rounded-2xl px-4 py-3.5">
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {question.why}
                </p>
              </div>
              <button
                onClick={next}
                className="self-start flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3 text-label-lg font-medium hover:opacity-90 transition-opacity"
              >
                {index === due.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <Empty />
      )}

      <DisclaimerBar />
    </div>
  )
}

function findQuestion(item: ReviewItem): QuizQuestion | null {
  const track = getTrack(item.trackId)
  if (!track) return null
  // Questions can come from a lesson or from a missed final-quiz answer.
  const pool = [...track.lessons.flatMap(l => l.questions), ...track.finalQuiz]
  return pool.find(q => q.id === item.questionId) ?? null
}

function Empty() {
  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-10 flex flex-col gap-3 items-center text-center">
      <Check size={22} style={{ color: '#1a6b3a' }} />
      <p className="text-title-md text-on-surface font-semibold">Nothing due right now</p>
      <p className="text-body-md text-on-surface-variant max-w-sm leading-relaxed">
        Reviews appear a day after you cover something, then again three days later,
        then after a week. Come back when something is due.
      </p>
      <Link
        href="/learning"
        className="mt-2 flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3 text-label-lg font-medium hover:opacity-90 transition-opacity"
      >
        Back to Learning
      </Link>
    </div>
  )
}

function Summary({ right, wrong }: { right: number; wrong: number }) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl px-7 py-10 flex flex-col gap-4 items-center text-center">
      <p className="text-headline-sm text-on-surface font-bold">Review done</p>
      <p className="text-body-lg text-on-surface-variant">
        {right} right, {wrong} to see again.
      </p>
      {wrong > 0 && (
        <p className="text-body-md text-on-surface-variant max-w-sm leading-relaxed">
          The ones you missed come back tomorrow. That is the point — you are only
          competing with your own last attempt.
        </p>
      )}
      <Link
        href="/learning"
        className="mt-2 flex items-center gap-2 bg-secondary text-white rounded-2xl px-6 py-3 text-label-lg font-medium hover:opacity-90 transition-opacity"
      >
        Back to Learning
      </Link>
    </div>
  )
}
