'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { Check, X } from 'lucide-react'
import type { QuizQuestion, LessonImage } from '@/lib/learning/tracks'

interface QuestionStackProps {
  questions: QuizQuestion[]
  /**
   * The lesson's reference art. A question naming one by `imageSrc` shows it
   * inline, so checking the picture never means scrolling back up to find it.
   */
  images?: LessonImage[]
  /** Reveal the right answer and the reason as soon as each one is answered. */
  revealImmediately?: boolean
  /** Fires whenever the answer set changes, so the parent can gate its CTA. */
  onChange: (state: { allAnswered: boolean; missed: string[]; correct: number }) => void
}

/**
 * Every question at once, answered in place. Being wrong does not block
 * anything — the answers just have to exist before the learner moves on.
 */
export function QuestionStack({
  questions,
  images,
  revealImmediately = true,
  onChange,
}: QuestionStackProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Questions point at art by src, so alt text stays defined in one place.
  const bySrc = useMemo(
    () => new Map((images ?? []).map(image => [image.src, image])),
    [images],
  )

  const choose = useCallback((q: QuizQuestion, option: number) => {
    // First answer stands — no changing it once the reason is on screen.
    setAnswers(prev => (prev[q.id] !== undefined ? prev : { ...prev, [q.id]: option }))
  }, [])

  // Reporting upward happens after the render that recorded the answer, not
  // during it.
  useEffect(() => {
    const answered = questions.filter(q => answers[q.id] !== undefined)
    const missed = answered.filter(q => answers[q.id] !== q.answer).map(q => q.id)
    onChange({
      allAnswered: answered.length === questions.length,
      missed,
      correct: answered.length - missed.length,
    })
  }, [answers, questions, onChange])

  const answeredCount = useMemo(
    () => questions.filter(q => answers[q.id] !== undefined).length,
    [questions, answers],
  )

  // A lesson with nothing to ask shows no heading and no counter — an empty
  // "0/0 answered" reads as something missing rather than something absent.
  if (questions.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-sm uppercase tracking-widest text-on-surface-variant">
          {questions.length === 1 ? 'Question' : 'Questions'}
        </p>
        <span className="text-label-sm text-on-surface-variant tabular-nums">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {/* One column, top to bottom. Answering should never mean tracking
          back and forth across the page. */}
      <div className="flex flex-col gap-4">
      {questions.map((q, qi) => {
        const picked = answers[q.id]
        const revealed = picked !== undefined && revealImmediately
        const answered = picked !== undefined

        return (
          <div key={q.id} className="bg-surface-container-lowest rounded-2xl px-5 py-5 flex flex-col gap-3.5">
            <p className="text-body-lg text-on-surface font-medium leading-snug">
              <span className="text-on-surface-variant tabular-nums mr-1.5">{qi + 1}.</span>
              {q.question}
            </p>

            {q.imageSrc && bySrc.has(q.imageSrc) && (
              <QuestionImage image={bySrc.get(q.imageSrc)!} />
            )}

            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const isAnswer = i === q.answer
                const isPicked = i === picked

                let cls = 'border-outline-variant/60 hover:border-secondary/50 hover:bg-surface-container-low'
                if (revealed && isAnswer) cls = 'border-transparent bg-tertiary-fixed/40'
                else if (revealed && isPicked) cls = 'border-transparent bg-error/10'
                else if (revealed) cls = 'border-outline-variant/30 opacity-55'
                else if (answered && isPicked) cls = 'border-transparent bg-secondary-fixed/40'
                else if (answered) cls = 'border-outline-variant/30 opacity-55'

                return (
                  <button
                    key={i}
                    onClick={() => choose(q, i)}
                    disabled={answered}
                    className={`flex items-center justify-between gap-3 text-left border rounded-xl px-4 py-3 transition-all ${cls}`}
                  >
                    <span className="text-body-md text-on-surface">{opt}</span>
                    {revealed && isAnswer && <Check size={16} style={{ color: '#1a6b3a' }} className="shrink-0" />}
                    {revealed && isPicked && !isAnswer && <X size={16} className="text-error shrink-0" />}
                  </button>
                )
              })}
            </div>

            {revealed && (
              <div className="bg-surface-container rounded-xl px-4 py-3">
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                  {picked === q.answer ? 'Right — here’s why' : 'Not quite — here’s why'}
                </p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">{q.why}</p>
              </div>
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}

/**
 * The lesson diagram, repeated beside the question that refers to it. Sized
 * well below the lesson's own copy — this is a reminder of the picture, not a
 * second presentation of it.
 */
function QuestionImage({ image }: { image: LessonImage }) {
  return (
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
  )
}
