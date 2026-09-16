'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Image from 'next/image'
import type { QuizQuestion, LessonImage } from '@/lib/learning/tracks'
import { shuffleOptions } from '@/lib/learning/shuffle-options'
import { AnswerOption, WhyPanel } from '@/components/learning/answer-option'
import { Calculator } from '@/components/learning/calculator'

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
  questions: given,
  images,
  revealImmediately = true,
  onChange,
}: QuestionStackProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Options are reordered so the right one is not always in the same place.
  const questions = useMemo(() => given.map(shuffleOptions), [given])

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
    <section className="flex flex-col gap-5 animate-fade-in" aria-label="Questions">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-display-sm text-on-surface">
          {questions.length === 1 ? 'Your question' : 'Your questions'}
        </h2>
        <span className="rounded-full bg-surface-container-lowest border border-on-surface/[0.06] px-3.5 py-1.5 text-label-lg text-on-surface tabular-nums">
          {answeredCount} of {questions.length} answered
        </span>
      </div>

      {/* One column, top to bottom. Answering should never mean tracking
          back and forth across the page. */}
      <ol className="flex flex-col gap-4">
        {questions.map((q, qi) => {
          const picked = answers[q.id]
          const answered = picked !== undefined
          const revealed = answered && revealImmediately

          return (
            <li
              key={q.id}
              className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] p-6 sm:p-8 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <p className="text-label-lg text-on-surface-variant tabular-nums">
                  Question {qi + 1}
                </p>
                <p className="text-headline-lg text-on-surface">{q.question}</p>
              </div>

              {q.imageSrc && bySrc.has(q.imageSrc) && (
                <QuestionImage image={bySrc.get(q.imageSrc)!} />
              )}

              <div className="flex flex-col gap-2.5" role="group" aria-label={`Answers for question ${qi + 1}`}>
                {q.options.map((opt, i) => (
                  <AnswerOption
                    key={i}
                    index={i}
                    label={opt}
                    picked={i === picked}
                    isAnswer={i === q.answer}
                    revealed={revealed}
                    onPick={() => choose(q, i)}
                  />
                ))}
              </div>

              {revealed && <WhyPanel correct={picked === q.answer} why={q.why} />}
            </li>
          )
        })}
      </ol>

      {questions.some(q => q.calculator) && <Calculator />}
    </section>
  )
}

/**
 * The lesson diagram, repeated beside the question that refers to it. Sized
 * well below the lesson's own copy — this is a reminder of the picture, not a
 * second presentation of it.
 */
function QuestionImage({ image }: { image: LessonImage }) {
  return (
    <figure className="w-full max-w-[420px] rounded-2xl overflow-hidden bg-surface-container-low">
      {/* Sized by the diagram's own proportions, so a short one leaves no band. */}
      <Image
        src={image.src}
        alt={image.alt}
        width={0}
        height={0}
        sizes="420px"
        unoptimized={image.src.endsWith('.svg')}
        className="w-full h-auto"
      />
    </figure>
  )
}
