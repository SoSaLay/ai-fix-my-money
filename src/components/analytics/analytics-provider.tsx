'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { capturePageview, initAnalytics } from '@/lib/analytics/posthog'

/**
 * App Router does not fire a page load between routes, so pageviews are sent
 * from a navigation effect instead of by the SDK.
 */
function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    const query = searchParams?.toString()
    capturePageview(`${window.location.origin}${pathname}${query ? `?${query}` : ''}`)
  }, [pathname, searchParams])

  return null
}

/**
 * There are no accounts, so nobody is ever identified: every visitor is one of
 * PostHog's own anonymous ids, which lives in this browser and nowhere else.
 * That is enough for the questions this product actually asks — where learners
 * stall, which questions everybody fails, whether the final test motivates or
 * blocks — and it is not enough to follow a person between their phone and
 * their laptop. Those are two visitors here.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  )
}
