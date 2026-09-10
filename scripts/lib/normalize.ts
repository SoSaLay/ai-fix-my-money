// ============================================================================
// TikTok's raw search payload → our `VideoCandidate`.
//
// TikHub's OpenAPI spec types the `data` field as an untyped passthrough of
// TikTok's own app response, so nothing here can lean on a published schema.
// Every read is defensive, every unrecognised row is skipped rather than
// guessed at, and `--raw` on the ingest script dumps a real payload when the
// shape turns out to differ.
// ============================================================================

import type { TrackId } from '../../src/lib/learning/tracks'
import type { VideoCandidate } from '../../src/lib/learning/video-pool/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return 0
}

/**
 * Search results have been seen under several keys, and each row is sometimes
 * the video and sometimes a wrapper around it. Try each shape rather than
 * assuming one.
 */
export function extractRows(data: unknown): Record<string, unknown>[] {
  const root = asRecord(data)
  if (!root) return []

  // TikHub wraps TikTok's response one level deep more often than not.
  const containers = [root, asRecord(root.data)].filter(Boolean) as Record<string, unknown>[]

  for (const container of containers) {
    // `search_item_list` is what the video-search endpoint actually returns —
    // confirmed against a live response. Its sibling `aweme_list` is present
    // but empty. The rest are fallbacks for the endpoints we do not use yet.
    for (const key of ['search_item_list', 'aweme_list', 'data', 'videos', 'item_list', 'list']) {
      const value = container[key]
      if (!Array.isArray(value)) continue
      const rows = value.map(asRecord).filter(Boolean) as Record<string, unknown>[]
      if (rows.length > 0) return rows
    }
  }
  return []
}

/**
 * TikTok reports length in milliseconds on `video.duration`. A few rows carry
 * it only on the thumbnail sheet, which is in seconds instead. 0 means the
 * payload had neither, which shows on the review screen as unknown rather than
 * as a plausible-looking zero-second video.
 */
function durationSeconds(aweme: Record<string, unknown>): number {
  const video = asRecord(aweme.video) ?? {}

  const ms = num(video.duration) || num(aweme.duration)
  if (ms > 0) return Math.round(ms / 1000)

  const thumbs = Array.isArray(video.big_thumbs) ? asRecord(video.big_thumbs[0]) : null
  const seconds = num(thumbs?.duration)
  return seconds > 0 ? Math.round(seconds) : 0
}

/** A row is either the aweme itself or a search hit wrapping one. */
function unwrapAweme(row: Record<string, unknown>): Record<string, unknown> | null {
  const nested = asRecord(row.aweme_info) ?? asRecord(row.item) ?? asRecord(row.aweme)
  const candidate = nested ?? row
  return str(candidate.aweme_id) || str(candidate.id) ? candidate : null
}

export function toCandidate(
  row: Record<string, unknown>,
  trackId: TrackId,
  id: string,
): VideoCandidate | null {
  const aweme = unwrapAweme(row)
  if (!aweme) return null

  const videoId = str(aweme.aweme_id) || str(aweme.id)
  if (!videoId) return null

  const author = asRecord(aweme.author) ?? {}
  const handleRaw = str(author.unique_id) || str(author.uniqueId) || str(author.nickname)
  const creatorHandle = handleRaw ? `@${handleRaw.replace(/^@/, '')}` : '@unknown'

  const stats = asRecord(aweme.statistics) ?? asRecord(aweme.stats) ?? {}

  // TikTok timestamps are unix seconds. A missing one becomes the epoch, which
  // is visibly wrong on the review screen rather than quietly plausible.
  const createdSeconds = num(aweme.create_time) || num(aweme.createTime)

  const shareUrl =
    str(aweme.share_url) ||
    `https://www.tiktok.com/${creatorHandle}/video/${videoId}`

  return {
    id,
    trackId,
    platform: 'tiktok',
    videoId,
    shareUrl: shareUrl.split('?')[0],
    embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    creatorHandle,
    postedAt: new Date(createdSeconds * 1000).toISOString(),
    durationSeconds: durationSeconds(aweme),
    caption: str(aweme.desc) || str(aweme.title),
    engagement: {
      likes: num(stats.digg_count) || num(stats.diggCount),
      comments: num(stats.comment_count) || num(stats.commentCount),
      shares: num(stats.share_count) || num(stats.shareCount),
      plays: num(stats.play_count) || num(stats.playCount),
    },
  }
}

/**
 * Rank by engagement rather than by TikTok's relevance order. Plays dominate
 * raw counts, so weight the signals that take effort — a share is worth far
 * more than a view as evidence that a video landed.
 */
export function engagementScore(candidate: VideoCandidate): number {
  const { likes, comments, shares, plays } = candidate.engagement
  return plays * 0.1 + likes + comments * 3 + shares * 5
}

// ─── Screening ───────────────────────────────────────────────────────────────

/**
 * Caption patterns worth a second look. These flag, they never filter: the
 * script has only the caption, the reviewer has the video, and the human gate
 * is what actually keeps this content off the platform. The point is that the
 * obvious rejects are obvious before you press play.
 */
const CONCERN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  {
    // Case-sensitive on purpose. Ticker shape IS upper case, and matching it
    // case-insensitively turns every "in stock" into a stock pick.
    label: 'Names a specific ticker or stock pick',
    pattern: /\$[A-Z]{1,5}\b|\b[A-Z][A-Za-z]{1,4}\s+stocks?\b/,
  },
  {
    label: 'Names a specific ticker or stock pick',
    pattern: /\b(buy|sell|load up on|all in on)\s+(NVDA|TSLA|AAPL|SPY|QQQ|BTC|ETH)\b/i,
  },
  {
    label: 'Get-rich-quick framing',
    pattern: /\b(get rich|quick money|easy money|passive income hack|\d+k? (a|per) (day|week|month) from|financial freedom in \d+)\b/i,
  },
  {
    label: 'Possible MLM or recruiting',
    pattern: /\b(join my team|dm me to start|be your own boss|ground floor opportunity|downline|recruit)\b/i,
  },
  {
    label: 'Course or funnel',
    pattern: /\b(link in bio|dm me ["“]?\w+["”]?|my course|free (masterclass|webinar|training)|sign up now|limited spots)\b/i,
  },
  {
    label: 'Crypto or trading promotion',
    pattern: /\b(pump|to the moon|1000x|altcoin|day trading signals|forex signals|copy my trades)\b/i,
  },
  {
    // The platform's whole legal position is that it does not tell anyone what
    // to do with their money. A video that does is not automatically unusable —
    // "is this creator telling you what to do, and should they?" is a good
    // question — but the reviewer should go in knowing.
    label: 'Tells the viewer what to do with their money',
    pattern: /\b(you (need|have) to (move|switch|open|stop|start)|you should (buy|invest|put|open|move)|(it'?s|it may be) time to (move|switch|open)|move your money|stop (keeping|leaving) your money|do this (now|today)|what you need to do with your money)\b/i,
  },
  {
    label: 'Recommends specific products',
    pattern: /\b((the )?\d+ best|top \d+|best .{0,20}(accounts?|cards?|banks?|funds?)|i recommend|my favorite (bank|card|account))\b/i,
  },
  {
    label: 'Asks the viewer for personal financial details',
    pattern: /\b(tell me your (income|salary|credit score)|comment your (income|salary|score)|how much do you (make|have))\b/i,
  },
]

/**
 * Search returns a fair amount of content that merely mentions a keyword. A
 * caption with no financial vocabulary at all is usually one of those, and
 * saying so up front saves the reviewer from opening it.
 */
const TOPIC_SIGNAL =
  /\b(account|bank|credit|debit|savings?|checking|interest|apr|apy|hysa|budget|money|debt|loan|invest|fund|ira|401k|roth|tax|score|fee|cash|income|salary|spend|balance|deposit)/i

/** Capitalised words that precede "stock" in ordinary prose, not as tickers. */
const NOT_A_TICKER = /^(The|This|That|My|Your|Our|A|An|In|On|Of|Is|It|If|Why|How|What|When|Best|Top|New|One|Two|Buy|Sell|Own|Hot|Big)$/

export function screenCaption(caption: string): string[] {
  const trimmed = caption.trim()
  if (!trimmed) return ['No caption — no signal either way about what this is']

  const concerns = [
    ...new Set(
      CONCERN_PATTERNS
        .filter(({ pattern }) => {
          const match = trimmed.match(pattern)
          if (!match) return false
          // "The stock market" is prose; "UBL stock" is a pick.
          const leading = match[0].match(/^([A-Z][A-Za-z]{1,4})\s+stocks?$/)
          return !leading || !NOT_A_TICKER.test(leading[1])
        })
        .map(({ label }) => label),
    ),
  ]

  if (!TOPIC_SIGNAL.test(trimmed)) {
    concerns.push('Caption gives no sign the video is about the topic')
  }
  return concerns
}
