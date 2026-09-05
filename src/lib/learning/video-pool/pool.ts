// ============================================================================
// Curated video pool — loading, projection, and the review queue on disk
//
// `import 'server-only'` is load-bearing. Every item in this pool carries a
// reference answer and a rubric, and a client component that imports this file
// fails the build rather than shipping the answer key to the browser. The other
// half of that guarantee is `toPublicQuestion` — the only supported way to turn
// a pool item into something a learner may see.
//
// Approved pools are imported statically so they are bundled with the app and
// exist in production. The review queue is read off disk instead, because it is
// a working file the review screen rewrites, and it never ships anywhere.
// ============================================================================

import 'server-only'

import type { TrackId } from '@/lib/learning/tracks'
import type { PooledVideo, PublicVideoQuestion, VideoStatus } from './types'

import accountsPool from './accounts.json'
import spendingPool from './spending.json'
import savingsPool from './savings.json'
import investingPool from './investing.json'

// ─── Quiz shape ──────────────────────────────────────────────────────────────

// In `constants.ts` so the scripts can read them too. Re-exported here so app
// code has one place to import from.
export {
  CHOICE_QUESTIONS_PER_QUIZ,
  REPLENISH_BELOW,
  TARGET_POOL_SIZE,
  VIDEO_QUESTIONS_PER_QUIZ,
} from './constants'

import { REPLENISH_BELOW, VIDEO_QUESTIONS_PER_QUIZ } from './constants'

// ─── Loading ─────────────────────────────────────────────────────────────────

// JSON carries no literal types, so the import comes back structurally loose.
// `parsePool` is what actually decides an entry is usable.
const RAW_POOLS: Record<TrackId, unknown> = {
  accounts: accountsPool,
  spending: spendingPool,
  savings: savingsPool,
  investing: investingPool,
}

const STATUSES: VideoStatus[] = ['draft', 'approved', 'unavailable', 'retired']

function isUsable(row: unknown): row is PooledVideo {
  if (typeof row !== 'object' || row === null) return false
  const v = row as Record<string, unknown>
  return (
    typeof v.id === 'string' && v.id !== '' &&
    typeof v.videoId === 'string' &&
    typeof v.embedUrl === 'string' &&
    typeof v.question === 'string' && v.question !== '' &&
    typeof v.referenceAnswer === 'string' && v.referenceAnswer !== '' &&
    Array.isArray(v.rubric) &&
    typeof v.status === 'string' &&
    STATUSES.includes(v.status as VideoStatus)
  )
}

/**
 * A malformed row is dropped rather than served. The review screen is the only
 * thing that should be writing these files, but a bad hand-edit should cost one
 * question, not the whole quiz.
 */
function parsePool(trackId: TrackId, raw: unknown): PooledVideo[] {
  if (!Array.isArray(raw)) return []
  const kept = raw.filter(isUsable)
  if (kept.length !== raw.length) {
    const dropped = raw.length - kept.length
    console.warn(
      `[video-pool] ${trackId}: dropped ${dropped} malformed ` +
      `${dropped === 1 ? 'entry' : 'entries'}`,
    )
  }
  return kept
}

/** Everything in a track's pool, whatever its status. */
export function allVideos(trackId: TrackId): PooledVideo[] {
  return parsePool(trackId, RAW_POOLS[trackId])
}

/**
 * The items a learner can actually draw. `unavailable` covers embeds that no
 * longer load, so filtering on `approved` is what keeps a dead video off the
 * page.
 */
export function liveVideos(trackId: TrackId): PooledVideo[] {
  return allVideos(trackId).filter(v => v.status === 'approved')
}

export interface PoolHealth {
  trackId: TrackId
  live: number
  unavailable: number
  retired: number
  total: number
  /** Live count has fallen far enough to warrant a new ingestion round. */
  needsReplenishment: boolean
  /** Live count cannot fill one attempt. */
  belowQuizSize: boolean
}

export function poolHealth(trackId: TrackId): PoolHealth {
  const all = allVideos(trackId)
  const live = all.filter(v => v.status === 'approved').length
  return {
    trackId,
    live,
    unavailable: all.filter(v => v.status === 'unavailable').length,
    retired: all.filter(v => v.status === 'retired').length,
    total: all.length,
    needsReplenishment: live < REPLENISH_BELOW,
    belowQuizSize: live < VIDEO_QUESTIONS_PER_QUIZ,
  }
}

// ─── Projection ──────────────────────────────────────────────────────────────

/**
 * The only supported way to send a pool item to a browser. Anything absent from
 * the return type is deliberately absent — `referenceAnswer`, `rubric`, the
 * reviewer's name, and the creator's caption all stay on this side.
 */
export function toPublicQuestion(video: PooledVideo): PublicVideoQuestion {
  return {
    id: video.id,
    trackId: video.trackId,
    kind: 'video',
    question: video.question,
    embedUrl: video.embedUrl,
    shareUrl: video.shareUrl,
    creatorHandle: video.creatorHandle,
    postedAt: video.postedAt,
  }
}

// ─── The review queue on disk ────────────────────────────────────────────────

// Lives in `pool-files.ts` so the scripts can use it too — `server-only` throws
// in plain Node. Re-exported here so app code has one place to import from.
export {
  knownIds,
  readApprovedFile,
  readQueue,
  writeApprovedFile,
  writeQueue,
} from './pool-files'
