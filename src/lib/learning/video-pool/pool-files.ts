// ============================================================================
// The pool's files on disk.
//
// Split out of `pool.ts` so the ingestion and health-check scripts can use it.
// `pool.ts` is `server-only`, which throws outside a React server context, and
// these helpers have to work from plain Node too.
//
// Nothing here is a leak risk on its own: it imports `fs`, so a client
// component that reached for it would fail to bundle. The static pool imports
// and the public projection — the things that could actually put a reference
// answer in a browser — stay behind the guard in `pool.ts`.
// ============================================================================

import { promises as fs } from 'fs'
import path from 'path'

import type { TrackId } from '@/lib/learning/tracks'
import type { PooledVideo, QueuedVideo } from './types'

export const POOL_DIR = path.join(process.cwd(), 'src', 'lib', 'learning', 'video-pool')

export const approvedPath = (trackId: TrackId) => path.join(POOL_DIR, `${trackId}.json`)
export const queuePath = (trackId: TrackId) => path.join(POOL_DIR, `${trackId}.candidates.json`)

/**
 * Writing the pool is a development-time job whose output is a commit. On a
 * deployed host the filesystem is read-only anyway, but failing here means the
 * mistake surfaces at the call site rather than as an fs error.
 *
 * Scripts run with NODE_ENV unset, which is not production, so they pass.
 */
export function assertWritable() {
  if (process.env.NODE_ENV === 'production') {
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
