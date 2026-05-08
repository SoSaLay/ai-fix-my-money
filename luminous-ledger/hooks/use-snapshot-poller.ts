'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { ParsedFinancialData } from '@/lib/perplexity/parser'

interface SnapshotPollerOptions {
  /** How often to poll in ms. Default 5000. */
  intervalMs?: number
  /** Called when a newer snapshot is detected. */
  onNewSnapshot: (data: ParsedFinancialData, updatedAt: string) => void
  /** Called while a new snapshot is being applied. */
  onRefreshing?: (refreshing: boolean) => void
  /** Skip polling when false (e.g. user not logged in). */
  enabled?: boolean
}

export function useSnapshotPoller({
  intervalMs = 5000,
  onNewSnapshot,
  onRefreshing,
  enabled = true,
}: SnapshotPollerOptions) {
  const lastUpdatedAt = useRef<string | null>(null)
  const onNewSnapshotRef = useRef(onNewSnapshot)
  const onRefreshingRef = useRef(onRefreshing)

  useEffect(() => { onNewSnapshotRef.current = onNewSnapshot }, [onNewSnapshot])
  useEffect(() => { onRefreshingRef.current = onRefreshing }, [onRefreshing])

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/latest-snapshot', { credentials: 'include' })
      if (!res.ok) return

      const json = await res.json()
      const { updated_at, data } = json.data ?? {}

      if (!updated_at || !data) return

      // Only fire when we see a timestamp strictly newer than the last known one.
      if (lastUpdatedAt.current !== null && updated_at <= lastUpdatedAt.current) return

      lastUpdatedAt.current = updated_at
      onRefreshingRef.current?.(true)
      onNewSnapshotRef.current(data as ParsedFinancialData, updated_at as string)
      onRefreshingRef.current?.(false)
    } catch {
      // Network errors are silent — we just try again next tick.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(poll, intervalMs)
    return () => clearInterval(id)
  }, [enabled, intervalMs, poll])
}
