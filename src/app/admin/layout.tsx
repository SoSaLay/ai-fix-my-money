// ============================================================================
// The admin area exists only in development.
//
// The pool it edits carries every reference answer and rubric in the app, so it
// is deliberately not something that can be reached on a deployed host. Two
// gates: this one hides the screens, and the write route refuses the request. A
// read-only production filesystem is a third that comes for free.
// ============================================================================

import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

export const metadata = { robots: { index: false, follow: false } }

/** Never prerendered — the gate is decided per request, not at build time. */
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant/40 bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl items-baseline gap-3 px-6 py-4">
          <span className="text-headline-sm text-on-surface">Pool review</span>
          <span className="rounded-full bg-tertiary/15 px-2 py-0.5 text-label-sm uppercase tracking-widest text-tertiary">
            Local only
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
