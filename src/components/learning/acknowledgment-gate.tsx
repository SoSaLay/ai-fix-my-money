'use client'

import Link from 'next/link'
import { ShieldCheck, Check } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { ACKNOWLEDGMENT_POINTS } from '@/lib/learning/disclaimer'
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
