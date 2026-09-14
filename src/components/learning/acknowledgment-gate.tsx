'use client'

import Link from 'next/link'
import { ShieldCheck, Check, Medal } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { ACKNOWLEDGMENT_POINTS } from '@/lib/learning/disclaimer'
import { RANKS } from '@/lib/learning/rank'
import { LEGAL_ROOT } from '@/lib/legal/documents'

/**
 * Shown once, before anyone starts a track. It is an explicit acknowledgment
 * rather than a link to a page nobody opens, and the answer is recorded.
 */
export function AcknowledgmentGate({ children }: { children: React.ReactNode }) {
  const { ready, acknowledged, acknowledge } = useLearning()

  if (!ready) return null
  if (acknowledged) return <>{children}</>

  return (
    <div className="flex-1 flex items-center justify-center px-8 py-16">
      <div className="max-w-lg w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
            <ShieldCheck size={20} className="text-on-surface-variant" />
          </div>
          <h1 className="text-headline-sm text-on-surface font-bold">
            Before you start
          </h1>
        </div>

        <p className="text-body-lg text-on-surface-variant leading-relaxed">
          Read this once. It sets out what this platform is and what it deliberately is not.
        </p>

        <ul className="flex flex-col gap-3">
          {ACKNOWLEDGMENT_POINTS.map(point => (
            <li key={point} className="flex items-start gap-3">
              <Check size={15} className="text-on-surface-variant mt-1 shrink-0" />
              <span className="text-body-md text-on-surface leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>

        <div className="bg-surface-container-lowest rounded-2xl px-5 py-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Medal size={15} className="text-secondary" />
            <p className="text-title-sm text-on-surface font-semibold">Your progress is governed by your rank</p>
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Every question you answer counts. Right answers to the lesson questions earn points,
            and written answers on each final test earn more. Answer them right and you rank up —
            from “{RANKS[0].line}” all the way to {RANKS[RANKS.length - 1].name}.
          </p>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <button
            onClick={acknowledge}
            className="btn-action items-center justify-center gap-1.5"
          >
            I understand — start learning
          </button>
          {/* Readable before agreeing, not only after. */}
          <Link
            href={LEGAL_ROOT}
            className="text-label-lg font-medium text-on-surface-variant underline underline-offset-4 hover:text-on-surface transition-colors"
          >
            Read the full disclosures first
          </Link>
        </div>
      </div>
    </div>
  )
}
