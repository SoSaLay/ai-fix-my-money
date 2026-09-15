'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Check, X, ArrowRight } from 'lucide-react'
import { useLearning, type ReviewItem } from '@/contexts/learning-context'
import { getTrack, findLessonImage, type QuizQuestion } from '@/lib/learning/tracks'

/**
 * Spaced review. Questions come back at 1 day, 3 days, then a week. Getting one
 * wrong drops it back to the shortest interval — deliberate practice on the
 * specific thing that did not stick, rather than re-reading the whole lesson.
 */
export default function ReviewPage() {
  const { ready, dueReviews, practiceReviews, completeReview } = useLearning()

  // The session is fixed once, the first time the queue can be read. Deriving
  // it on every render would drop each question out of the list as it was
  // answered — answering re-dates it into the future, so it stops being due —
  // sliding everything after it down a place and skipping the next question.
  const [session, setSession] = useState<{ items: ReviewItem[]; practising: boolean } | null>(null)

  useEffect(() => {
    if (!ready || session) return
    const scheduled = dueReviews()
    // Nothing scheduled still gets a session — questions from finished lessons,
    // so review is somewhere to test yourself rather than only a due list.
    setSession(
      scheduled.length > 0
        ? { items: scheduled, practising: false }
        : { items: practiceReviews(), practising: true },
    )
  }, [ready, session, dueReviews, practiceReviews])

  const due = session?.items ?? []
  const practising = session?.practising === true && due.length > 0

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

  if (!ready || !session) return null

  const finished = index >= due.length

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-8 px-6 sm:px-8 py-10 max-w-2xl w-full mx-auto">
        <Link
          href="/learning"
          className="flex items-center gap-2 text-label-lg text-on-surface-variant hover:text-on-surface transition-colors w-fit"
        >
          <ArrowLeft size={15} /> Learning
        </Link>

        {due.length === 0 || !question && !finished ? (
          <Empty />
        ) : finished ? (
          <Summary right={tally.right} wrong={tally.wrong} />
        ) : question ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 text-body-md text-on-surface-variant tabular-nums">
                <span>{practising ? 'Practice round' : 'Review'}</span>
                <span>{index + 1} of {due.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#17171c] transition-[width] duration-300"
                  style={{ width: `${((index + (selected !== null ? 1 : 0)) / due.length) * 100}%` }}
                />
              </div>
            </div>

            <h1 className="text-headline-lg text-on-surface">{question.question}</h1>

            {image && (
              <figure className="w-full max-w-[380px] rounded-2xl overflow-hidden bg-surface-container-lowest">
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

                let cls = 'border-on-surface/15 hover:border-on-surface/40'
                if (revealed && isAnswer) cls = 'border-transparent bg-tertiary-fixed/40'
                else if (revealed && isPicked) cls = 'border-transparent bg-error/10'
                else if (revealed) cls = 'border-on-surface/10 opacity-55'

                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={revealed}
                    className={`flex items-center justify-between gap-3 text-left border rounded-2xl px-5 py-4 transition-all ${cls}`}
                  >
                    <span className="text-body-lg text-on-surface">{opt}</span>
                    {revealed && isAnswer && <Check size={17} style={{ color: '#1a6b3a' }} className="shrink-0" />}
                    {revealed && isPicked && !isAnswer && <X size={17} className="text-error shrink-0" />}
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <p className="text-body-lg text-on-surface-variant">
                  <span className="text-on-surface">
                    {selected === question.answer ? 'Right.' : 'Not quite.'}
                  </span>{' '}
                  {question.why}
                </p>
                <button onClick={next} className="btn-action items-center justify-center gap-1.5 self-start">
                  {index === due.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
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
    <div className="flex flex-col items-center text-center py-10">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
        <Check size={26} style={{ color: '#1a6b3a' }} />
      </div>
      <h1 className="mt-5 text-display-sm text-on-surface">Nothing to review yet.</h1>
      <p className="mt-3 text-title-lg text-on-surface-variant max-w-sm">
        Finish a lesson and its questions come back here.
      </p>
      <Link href="/learning" className="btn-action items-center justify-center mt-8">
        Back to Learning
      </Link>
    </div>
  )
}

function Summary({ right, wrong }: { right: number; wrong: number }) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <p className="text-display-lg text-on-surface tabular-nums">{right}/{right + wrong}</p>
      <h1 className="mt-3 text-display-sm text-on-surface">Review done.</h1>
      <p className="mt-3 text-title-lg text-on-surface-variant max-w-sm">
        {wrong > 0 ? 'The ones you missed come back tomorrow.' : 'Every one right.'}
      </p>
      <Link href="/learning" className="btn-action items-center justify-center mt-8">
        Back to Learning
      </Link>
    </div>
  )
}
