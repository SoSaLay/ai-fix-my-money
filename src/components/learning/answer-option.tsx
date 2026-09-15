'use client'

import { Check, X } from 'lucide-react'

const LETTERS = 'ABCDEFGH'

/**
 * One multiple-choice option, shared by lesson questions and the final test so
 * an answer looks and behaves the same wherever a learner meets it. Right is
 * green and wrong is red, the same language as the step rail.
 */
export function AnswerOption({
  index, label, picked, isAnswer, revealed, onPick,
}: {
  index: number
  label: string
  /** This option is the one chosen. */
  picked: boolean
  isAnswer: boolean
  /** An answer has been given, so the key is showing. */
  revealed: boolean
  onPick: () => void
}) {
  let tone = 'border-on-surface/10 bg-surface-container-lowest hover:border-on-surface/25 hover:bg-surface-container-low cursor-pointer'
  let badge = 'bg-surface-container text-on-surface-variant'
  if (revealed && isAnswer) {
    tone = 'border-success/35 bg-success/[0.07]'
    badge = 'bg-success text-white'
  } else if (revealed && picked) {
    tone = 'border-error/35 bg-error/[0.06]'
    badge = 'bg-error text-white'
  } else if (revealed) {
    tone = 'border-on-surface/[0.06] bg-surface-container-lowest opacity-55'
  }

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={revealed}
      className={`group flex w-full items-center gap-4 rounded-2xl border px-4 sm:px-5 py-4 text-left transition-colors duration-150 disabled:cursor-default ${tone}`}
    >
      <span
        aria-hidden
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-lg tabular-nums transition-colors ${badge}`}
      >
        {revealed && isAnswer ? <Check size={16} strokeWidth={2.5} /> : revealed && picked ? <X size={16} strokeWidth={2.5} /> : LETTERS[index]}
      </span>
      <span className="flex-1 text-body-lg text-on-surface">{label}</span>
      {revealed && (isAnswer || picked) && (
        <span className={`shrink-0 text-label-md ${isAnswer ? 'text-success' : 'text-error'}`}>
          {isAnswer ? 'Correct' : 'Your answer'}
        </span>
      )}
    </button>
  )
}

/** The reason, shown the moment an answer is given. */
export function WhyPanel({ correct, why }: { correct: boolean; why: string }) {
  return (
    <div className="animate-fade-in rounded-2xl bg-surface-container-low px-5 py-4 flex flex-col gap-1.5">
      <p className={`text-label-lg ${correct ? 'text-success' : 'text-error'}`}>
        {correct ? 'Right — here’s why' : 'Not quite — here’s why'}
      </p>
      <p className="text-body-lg text-on-surface-variant">{why}</p>
    </div>
  )
}
