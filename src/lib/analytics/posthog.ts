// ============================================================================
// PostHog, wired for a product that holds financial data.
//
// Three deliberate choices:
//
// 1. Requests go through this app's own /ingest path, rewritten in
//    next.config.ts. A third-party analytics domain is blocked by ordinary
//    content blockers, and the audience most likely to run one is the audience
//    being tested with.
// 2. Session replay is off. Replaying a page where someone types their salary
//    is not a trade worth making for funnel data.
// 3. Autocapture is off. It records the text of what was clicked, which on
//    these screens is account names and amounts.
// ============================================================================

'use client'

import posthog from 'posthog-js'

import type { AnalyticsEvent } from './events'

let started = false

export function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

export function initAnalytics(): void {
  if (started || !analyticsEnabled() || typeof window === 'undefined') return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.posthog.com',
    capture_pageview: false, // Sent by the provider, which knows about App Router navigation.
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
  })

  started = true
}

/** One typed door in. An event not in the union does not get sent. */
export function track<E extends AnalyticsEvent>(name: E['name'], props: E['props']): void {
  if (!started) return
  posthog.capture(name, props)
}

export function identify(userId: string): void {
  if (!started) return
  posthog.identify(userId)
}

/** On sign-out, so the next person on this browser is not the last one. */
export function resetAnalytics(): void {
  if (!started) return
  posthog.reset()
}

export function capturePageview(url: string): void {
  if (!started) return
  posthog.capture('$pageview', { $current_url: url })
}
