'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Onboarding } from '@/components/learning/onboarding'
import { FinancialDataProvider } from '@/contexts/financial-data-context'
import { LearningProvider, useLearning } from '@/contexts/learning-context'
import { LEGAL_ROOT } from '@/lib/legal/documents'

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // Below md the sidebar is a drawer; this is whether it is out.
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => { setNavOpen(false) }, [pathname])

  return (
    <FinancialDataProvider>
      <LearningProvider>
        <OnboardingGate pathname={pathname}>
          <div className="min-h-screen bg-surface flex">
            <Sidebar pathname={pathname} open={navOpen} onClose={() => setNavOpen(false)} />

            {/* Main content area — offset by the sidebar once it is fixed open */}
            <main className="flex-1 flex flex-col min-h-screen min-w-0 md:ml-[220px]">
              {/* Phones and small tablets: a bar to open the drawer */}
              <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setNavOpen(true)}
                  aria-label="Open menu"
                  className="-ml-1 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-low"
                >
                  <Menu size={22} />
                </button>
                <Link href="/" className="text-title-md text-on-surface font-bold">
                  AI Fix My Money
                </Link>
              </div>

              {children}
            </main>
          </div>
        </OnboardingGate>
      </LearningProvider>
    </FinancialDataProvider>
  )
}

/**
 * Nothing in the app is reachable until onboarding is finished. The
 * disclosures stay readable throughout — onboarding links to them, and they
 * have to be open to someone who has not agreed to anything yet.
 */
function OnboardingGate({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { ready, acknowledged } = useLearning()

  if (pathname.startsWith(LEGAL_ROOT)) return <>{children}</>
  if (!ready) return <div className="min-h-screen bg-surface-container-lowest" />
  if (!acknowledged) return <Onboarding />
  return <>{children}</>
}
