// ============================================================================
// TikHub client — the only thing in the repo that talks to TikHub.
//
// It runs from scripts on a developer's machine and never from the app, so
// TIKHUB_API_KEY is a local secret and not a production environment variable.
// The deployed app makes no TikHub calls at all.
// ============================================================================

import { promises as fs } from 'fs'
import path from 'path'

const BASE = 'https://api.tikhub.io'

/** 10 QPS is the documented ceiling. Stay comfortably under it. */
const MIN_MS_BETWEEN_CALLS = 150

let lastCallAt = 0

/**
 * Next loads `.env.local` for the app; a plain script has to do it itself.
 * Deliberately minimal — `KEY=value`, `#` comments, optional surrounding
 * quotes. A value may contain `=`, so only the first one splits.
 */
export async function loadEnvLocal(): Promise<void> {
  const file = path.join(process.cwd(), '.env.local')
  let contents: string
  try {
    contents = await fs.readFile(file, 'utf8')
  } catch {
    return
  }
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const split = trimmed.indexOf('=')
    if (split === -1) continue
    const key = trimmed.slice(0, split).trim()
    if (process.env[key] !== undefined) continue
    process.env[key] = trimmed.slice(split + 1).trim().replace(/^["']|["']$/g, '')
  }
}

export function requireApiKey(): string {
  const key = process.env.TIKHUB_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'TIKHUB_API_KEY is not set. Add it to .env.local as TIKHUB_API_KEY=<your key>.',
    )
  }
  if (/your[_-]?key|_here|^xxx|changeme/i.test(key)) {
    throw new Error(
      `TIKHUB_API_KEY still looks like a placeholder ("${key}"). Replace it with the real key.`,
    )
  }
  return key
}

async function throttle(): Promise<void> {
  const wait = MIN_MS_BETWEEN_CALLS - (Date.now() - lastCallAt)
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
  lastCallAt = Date.now()
}

export interface TikHubResponse {
  code: number
  message?: string
  data?: unknown
}

export async function tikhubGet(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): Promise<TikHubResponse> {
  await throttle()

  const url = new URL(endpoint, BASE)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${requireApiKey()}`,
      Accept: 'application/json',
    },
  })

  const body = await response.text()
  if (!response.ok) {
    // The status alone rarely says what went wrong; TikHub puts the reason in
    // the body, and a truncated body is enough to act on.
    throw new Error(`TikHub ${endpoint} returned ${response.status}: ${body.slice(0, 300)}`)
  }

  try {
    return JSON.parse(body) as TikHubResponse
  } catch {
    throw new Error(`TikHub ${endpoint} returned unparseable JSON: ${body.slice(0, 200)}`)
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * TikTok's own search filter values. The OpenAPI spec types both as plain
 * integers and documents no enum, so these follow TikTok's published web
 * filters. Worth confirming against a live response on the first real run.
 */
export const SORT_TYPE = {
  relevance: 0,
  mostLiked: 1,
  mostRecent: 2,
} as const

export const PUBLISH_TIME = {
  anyTime: 0,
  pastDay: 1,
  pastWeek: 7,
  pastMonth: 30,
  pastThreeMonths: 90,
  pastSixMonths: 180,
  pastYear: 365,
} as const

export interface VideoSearchParams {
  keyword: string
  offset?: number
  count?: number
  sortType?: number
  publishTime?: number
  region?: string
}

export function fetchVideoSearch(params: VideoSearchParams): Promise<TikHubResponse> {
  return tikhubGet('/api/v1/tiktok/app/v3/fetch_video_search_result', {
    keyword: params.keyword,
    offset: params.offset ?? 0,
    count: params.count ?? 20,
    sort_type: params.sortType ?? SORT_TYPE.relevance,
    publish_time: params.publishTime ?? PUBLISH_TIME.anyTime,
    region: params.region ?? 'US',
  })
}
