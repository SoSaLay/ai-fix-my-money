'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import AccountsPage from '@/app/(app)/accounts/page'
import SpendingPage from '@/app/(app)/spending/page'
import SavingsPage from '@/app/(app)/savings/page'
import InvestingPage from '@/app/(app)/investing/page'
import { FinancialDataProvider } from '@/contexts/financial-data-context'
import { AccountTotals } from '@/components/accounts/account-totals'
import { PreviewProvider } from '@/contexts/preview-context'
import { CTA_CLASS, CTA_SMALL_CLASS } from '@/components/marketing/landing-sections'
import { DEMO_NAME, DEMO_PROFILE } from '@/lib/finance/demo-profile'

// ============================================================================
// "What can I unlock?" — every tool, open, with an example person's numbers.
//
// These are the real pages, not pictures of them. They run against a seeded
// provider that never touches local storage, so a visitor can drag and edit
// freely and their own figures stay exactly as they were.
// ============================================================================

const SECTIONS = [
  { id: 'accounts',  Page: AccountsPage },
  { id: 'spending',  Page: SpendingPage },
  { id: 'savings',   Page: SavingsPage },
  { id: 'investing', Page: InvestingPage },
] as const

export function PreviewShowcase() {
  return (
    <main className="min-h-screen bg-surface flex flex-col overflow-x-clip">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-5 max-w-6xl mx-auto w-full">
        <Link href="/" className="text-headline-md sm:text-headline-lg text-on-surface">AI Fix My Money</Link>
        <Link href="/learning" className={CTA_SMALL_CLASS}>Get started</Link>
      </nav>

      {/* ── Intro ── */}
      <header className="px-4 sm:px-8 pt-8 sm:pt-12 pb-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-4 max-w-2xl">
          <p className="text-label-md text-secondary font-semibold uppercase tracking-wider">Example profile</p>
          <h1 className="text-display-md sm:text-display-lg text-on-surface">What you can unlock</h1>
          <p className="text-title-lg text-on-surface-variant">
            Finish a track and its tool opens. Here is every one of them, filled in for {DEMO_NAME} — a
            made-up person. Try the controls; nothing here is saved.
          </p>
        </div>
      </header>

      {/* ── The tools ── */}
      <PreviewProvider>
        <FinancialDataProvider seed={DEMO_PROFILE}>
          <div className="max-w-6xl mx-auto w-full flex flex-col">
            <div className="px-4 sm:px-8">
              <AccountTotals />
            </div>
            {SECTIONS.map(({ id, Page }) => (
              <section key={id} id={id} className="scroll-mt-4 pt-6 border-b border-outline-variant/40 last:border-b-0">
                <Page />
              </section>
            ))}
          </div>
        </FinancialDataProvider>
      </PreviewProvider>

      {/* ── Close ── */}
      <section className="px-4 sm:px-6 py-20 sm:py-28 max-w-6xl mx-auto w-full flex flex-col items-center text-center gap-6">
        <h2 className="text-display-sm sm:text-display-md text-on-surface max-w-xl">
          Ready to see your own numbers here?
        </h2>
        <Link href="/learning" className={CTA_CLASS}>
          Get started <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    </main>
  )
}
