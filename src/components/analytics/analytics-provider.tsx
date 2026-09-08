'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'
import { capturePageview, identify, initAnalytics, resetAnalytics } from '@/lib/analytics/posthog'

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

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready } = useAuth()
  const identified = useRef<string | null>(null)

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (!ready) return

    if (userId && identified.current !== userId) {
      identify(userId)
      identified.current = userId
      return
    }

    // Signed out after having been signed in: clear the id so the next person
    // on this browser is a different person.
    if (!userId && identified.current) {
      resetAnalytics()
      identified.current = null
    }
  }, [ready, userId])

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  )
}
