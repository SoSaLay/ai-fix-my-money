'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, X } from 'lucide-react'

import { useLearning } from '@/contexts/learning-context'
import { LEGAL_ROOT } from '@/lib/legal/documents'

// ============================================================================
// First run. Four screens, one idea each, and nothing else in the app is
// reachable until the last one is finished — that last tap is the recorded
// acknowledgment that this is education, not advice.
// ============================================================================

interface Screen {
  image: string
  title: string
  body: string
  /** Set only on the screen that carries the disclosures. */
  disclosures?: boolean
}

const SCREENS: Screen[] = [
  {
    image: '/onboarding/learn.svg',
    title: 'Learn how your money works.',
    body: 'Short lessons, then tools that use your own numbers.',
  },
  {
    image: '/onboarding/prove.svg',
    title: 'Prove what you know.',
    body: 'Explain real finance videos in your own words. We mark what you understood.',
  },
  {
    image: '/onboarding/disclosure.svg',
    title: 'Education, not advice.',
    body: 'Nobody here is a licensed adviser, and nothing here tells you to buy, sell or hold anything. Your money decisions stay yours.',
    disclosures: true,
  },
  {
    image: '/onboarding/rank.svg',
    title: 'Rank up as you learn.',
    body: 'Every right answer earns points, and written answers earn the most. Start as strangers, finish as one!',
  },
]

export function Onboarding() {
  const { acknowledge } = useLearning()
  const router = useRouter()
  const [step, setStep] = useState(0)

  const screen = SCREENS[step]
  const last = step === SCREENS.length - 1

  const next = () => {
    if (!last) {
      setStep(step + 1)
      return
    }
    acknowledge()
    router.push('/learning')
  }

  return (
    <div className="min-h-[100dvh] bg-surface-container-lowest flex flex-col">
      <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 pt-5 pb-8">
        {/* Top bar: back, how far along, and a way out */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            aria-label="Back"
            className="w-11 h-11 -ml-2.5 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors disabled:invisible"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={SCREENS.length}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${SCREENS.length}`}
          >
            <div
              className="h-full rounded-full bg-[#17171c] transition-[width] duration-300 ease-out"
              style={{ width: `${((step + 1) / SCREENS.length) * 100}%` }}
            />
          </div>

          <Link
            href="/"
            aria-label="Back to home"
            title="Back to home"
            className="w-11 h-11 -mr-2.5 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <X size={20} />
          </Link>
        </div>

        {/* The screen. Keyed so each one fades in fresh. */}
        <div key={step} className="flex-1 flex flex-col items-center text-center animate-fade-in">
          <div className="flex-1 w-full flex items-center justify-center py-6 min-h-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimise */}
            <img src={screen.image} alt="" className="w-full max-w-[300px] aspect-square" />
          </div>

          <h1 className="text-display-md text-on-surface">{screen.title}</h1>
          <p className="mt-4 text-title-lg text-on-surface-variant">{screen.body}</p>

          {screen.disclosures && (
            <a
              href={LEGAL_ROOT}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-label-lg text-on-surface underline underline-offset-4 hover:text-on-surface-variant transition-colors"
            >
              Read the full disclosures <ArrowUpRight size={14} aria-hidden />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={next}
          className="mt-10 w-full rounded-full bg-[#17171c] text-white py-4 text-title-md cursor-pointer transition-colors duration-200 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#17171c]"
        >
          {last ? 'Let’s get my money organized' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
