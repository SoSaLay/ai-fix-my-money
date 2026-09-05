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

import { promises as fs } from 'fs'
import path from 'path'

import type { TrackId } from '@/lib/learning/tracks'
import type {
  PooledVideo,
  PublicVideoQuestion,
  QueuedVideo,
  VideoStatus,
} from './types'

import accountsPool from './accounts.json'
import spendingPool from './spending.json'
import savingsPool from './savings.json'
import investingPool from './investing.json'

// ─── Quiz shape ──────────────────────────────────────────────────────────────

/** Video questions per attempt. The rest of the ten are multiple choice. */
export const VIDEO_QUESTIONS_PER_QUIZ = 8

/** Hand-written multiple choice per attempt, drawn from `finalQuiz`. */
export const CHOICE_QUESTIONS_PER_QUIZ = 2

/**
 * What a healthy track holds. Three times the sampled count, so answers
 * circulating does not make the paper memorisable.
 */
export const TARGET_POOL_SIZE = 25

/**
 * Below twice the sampled count, a track needs a new ingestion round. This is
 * the replenishment signal, not a hard floor — the quiz still runs.
 */
export const REPLENISH_BELOW = VIDEO_QUESTIONS_PER_QUIZ * 2

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

const POOL_DIR = path.join(process.cwd(), 'src', 'lib', 'learning', 'video-pool')

const approvedPath = (trackId: TrackId) => path.join(POOL_DIR, `${trackId}.json`)
const queuePath = (trackId: TrackId) => path.join(POOL_DIR, `${trackId}.candidates.json`)

/**
 * Writing the pool is a development-time job whose output is a commit. On a
 * deployed host the filesystem is read-only anyway, but failing here means the
 * mistake surfaces at the call site rather than as an fs error.
 */
function assertWritable() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('The video pool is only editable in development.')
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

// Two-space indent and a trailing newline, so a review pass produces a diff a
// person can read.
async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

/** Candidates awaiting a human. Rejected ones stay, so they are not re-pulled. */
export async function readQueue(trackId: TrackId): Promise<QueuedVideo[]> {
  return readJson<QueuedVideo[]>(queuePath(trackId), [])
}

export async function writeQueue(trackId: TrackId, queue: QueuedVideo[]): Promise<void> {
  assertWritable()
  await writeJson(queuePath(trackId), queue)
}

/**
 * Read the approved file off disk rather than through the static import. The
 * import is a build-time snapshot; a review pass needs what is on disk right
 * now, including its own last write.
 */
export async function readApprovedFile(trackId: TrackId): Promise<PooledVideo[]> {
  return readJson<PooledVideo[]>(approvedPath(trackId), [])
}

export async function writeApprovedFile(trackId: TrackId, pool: PooledVideo[]): Promise<void> {
  assertWritable()
  await writeJson(approvedPath(trackId), pool)
}

/** Ids already spoken for, so ingestion never re-offers a video or reuses an id. */
export async function knownIds(
  trackId: TrackId,
): Promise<{ ids: Set<string>; videoIds: Set<string> }> {
  const [approved, queue] = await Promise.all([readApprovedFile(trackId), readQueue(trackId)])
  const rows = [...approved, ...queue]
  return {
    ids: new Set(rows.map(r => r.id)),
    videoIds: new Set(rows.map(r => r.videoId)),
  }
}
