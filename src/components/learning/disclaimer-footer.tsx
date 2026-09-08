'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { DISCLAIMER_MEDIUM } from '@/lib/learning/disclaimer'
import { LEGAL_ROOT } from '@/lib/legal/documents'

/**
 * The standing notice that closes every learning screen.
 *
 * It sits below a rule that runs the full width of the content area, clear of
 * the last piece of the page, so it reads as a footnote about the platform
 * rather than as one more thing to read as part of a lesson.
 *
 * Collapsed by default: the heading alone says what it is, and the wording only
 * opens for someone who wants it. Left standing open, the paragraph was being
 * mistaken for course material.
 *
 * `inner` matches the width of whatever page it closes, so the heading lines up
 * with that page's column while the rule keeps running past it.
 */
export function DisclaimerFooter({
  inner = 'max-w-4xl',
  children,
}: {
  inner?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <footer className="mt-20 border-t border-outline-variant/40">
      <div className={`${inner} w-full mx-auto px-8 pt-5 pb-12 flex flex-col items-start`}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="group flex items-center gap-2 rounded-xl -mx-2 px-2 py-1.5 text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ChevronDown
            size={13}
            aria-hidden
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          Disclaimer
        </button>

        {open && (
          <div className="flex flex-col gap-3 items-start pt-3">
            <p className="text-body-sm text-on-surface-variant leading-relaxed max-w-2xl">
              {DISCLAIMER_MEDIUM}
            </p>

            {children}

            <Link
              href={LEGAL_ROOT}
              className="text-label-lg font-medium text-on-surface-variant underline underline-offset-4 decoration-outline-variant hover:text-on-surface hover:decoration-on-surface transition-colors"
            >
              Disclosures, terms, and privacy
            </Link>
          </div>
        )}
      </div>
    </footer>
  )
}
