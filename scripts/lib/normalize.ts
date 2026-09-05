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
    for (const key of ['data', 'aweme_list', 'videos', 'item_list', 'list']) {
      const value = container[key]
      if (!Array.isArray(value)) continue
      const rows = value.map(asRecord).filter(Boolean) as Record<string, unknown>[]
      if (rows.length > 0) return rows
    }
  }
  return []
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
    label: 'Names a specific ticker or stock pick',
    pattern: /\$[A-Z]{1,5}\b|\b(buy|sell|load up on|all in on)\s+(NVDA|TSLA|AAPL|SPY|QQQ|BTC|ETH)\b/i,
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
    pattern: /\b(pump|moon|to the moon|1000x|altcoin|day trading signals|forex signals|copy my trades)\b/i,
  },
  {
    label: 'Personalised advice framing',
    pattern: /\b(you should (buy|invest|put)|what you need to do with your money|tell me your (income|salary))\b/i,
  },
]

export function screenCaption(caption: string): string[] {
  if (!caption.trim()) return []
  return CONCERN_PATTERNS.filter(({ pattern }) => pattern.test(caption)).map(({ label }) => label)
}
