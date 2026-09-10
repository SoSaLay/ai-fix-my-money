// ============================================================================
// The review screen's only write path. Development only.
//
// Approving an item moves it out of the candidate queue and into the track's
// approved pool, both of which are files in the repo. The output of a review
// pass is therefore a diff, and merging that diff is the approval gate — the
// commit records who approved what and when.
// ============================================================================

import { NextResponse } from 'next/server'

import { TRACK_ORDER, type TrackId } from '@/lib/learning/tracks'
import {
  readApprovedFile,
  readQueue,
  writeApprovedFile,
  writeQueue,
} from '@/lib/learning/video-pool/pool'
import { isReviewComplete, type PooledVideo, type QueuedVideo } from '@/lib/learning/video-pool/types'

/** Second gate. The layout hides the screen; this refuses the write. */
function devOnly(): NextResponse | null {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

type Action =
  | 'save'
  | 'approve'
  | 'reject'
  | 'unreject'
  | 'update-approved'
  | 'retire'
  | 'unretire'

/** Actions that act on the approved file rather than the candidate queue. */
const APPROVED_ACTIONS: Action[] = ['update-approved', 'retire', 'unretire']

interface Body {
  trackId?: string
  action?: Action
  id?: string
  /** The reviewer's fields, as typed so far. */
  review?: {
    question?: string
    claimUnderTest?: string
    referenceAnswer?: string
    rubric?: string[]
  }
  reason?: string
}

function isTrackId(value: unknown): value is TrackId {
  return typeof value === 'string' && (TRACK_ORDER as string[]).includes(value)
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function POST(request: Request) {
  const blocked = devOnly()
  if (blocked) return blocked

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return bad('Malformed request body.')
  }

  const { trackId, action, id } = body
  if (!isTrackId(trackId)) return bad('Unknown track.')
  if (!id) return bad('Missing candidate id.')

  // Anything acting on an already-approved video reads the other file entirely
  // — it is no longer a candidate and is not in the queue.
  if (action && APPROVED_ACTIONS.includes(action)) {
    const pool = await readApprovedFile(trackId)
    const at = pool.findIndex(item => item.id === id)
    if (at === -1) return bad(`No approved video ${id} in ${trackId}.`)
    const existing = pool[at]

    let updated: PooledVideo

    if (action === 'retire') {
      // Retired, never deleted. The row keeps the id spoken for and keeps
      // ingestion from offering the same video back as a fresh candidate.
      updated = {
        ...existing,
        status: 'retired',
        retiredReason: body.reason?.trim() || undefined,
      }
    } else if (action === 'unretire') {
      const { retiredReason: _reason, ...rest } = existing
      updated = { ...rest, status: 'approved' }
    } else {
      const review = body.review ?? {}
      updated = {
        ...existing,
        question: (review.question ?? existing.question).trim(),
        claimUnderTest: (review.claimUnderTest ?? existing.claimUnderTest)?.trim() || undefined,
        referenceAnswer: (review.referenceAnswer ?? existing.referenceAnswer).trim(),
        rubric: (review.rubric ?? existing.rubric).map(point => point.trim()).filter(Boolean),
        reviewedAt: new Date().toISOString(),
      }

      // This one is already in front of learners. Emptying a field here would
      // break a live question, so the same completeness gate applies.
      if (!isReviewComplete(updated)) {
        return bad('A question, a reference answer, and at least one rubric point are required.')
      }
    }

    pool[at] = updated
    await writeApprovedFile(trackId, pool)
    return NextResponse.json({ ok: true, item: updated })
  }

  const queue = await readQueue(trackId)
  const index = queue.findIndex(item => item.id === id)
  if (index === -1) return bad(`No candidate ${id} in the ${trackId} queue.`)
  const candidate = queue[index]

  switch (action) {
    case 'save': {
      queue[index] = mergeReview(candidate, body)
      await writeQueue(trackId, queue)
      return NextResponse.json({ ok: true, item: queue[index] })
    }

    case 'reject': {
      queue[index] = {
        ...candidate,
        rejected: true,
        rejectedReason: body.reason?.trim() || undefined,
      }
      await writeQueue(trackId, queue)
      return NextResponse.json({ ok: true, item: queue[index] })
    }

    case 'unreject': {
      const { rejected: _rejected, rejectedReason: _reason, ...rest } = candidate
      queue[index] = rest
      await writeQueue(trackId, queue)
      return NextResponse.json({ ok: true, item: queue[index] })
    }

    case 'approve': {
      const merged = mergeReview(candidate, body)
      // Nothing half-written reaches a learner. This gate is not optional.
      if (!isReviewComplete(merged)) {
        return bad('A question, a reference answer, and at least one rubric point are required.')
      }

      const now = new Date().toISOString()
      const approved: PooledVideo = {
        id: merged.id,
        trackId: merged.trackId,
        platform: merged.platform,
        videoId: merged.videoId,
        shareUrl: merged.shareUrl,
        embedUrl: merged.embedUrl,
        creatorHandle: merged.creatorHandle,
        postedAt: merged.postedAt,
        durationSeconds: merged.durationSeconds,
        caption: merged.caption,
        engagement: merged.engagement,
        question: merged.question!.trim(),
        claimUnderTest: merged.claimUnderTest?.trim() || undefined,
        referenceAnswer: merged.referenceAnswer!.trim(),
        rubric: (merged.rubric ?? []).map(point => point.trim()).filter(Boolean),
        reviewedAt: now,
        status: 'approved',
        lastCheckedAt: now,
      }

      const pool = await readApprovedFile(trackId)
      // An id is never reused, so a collision means something is wrong upstream
      // rather than that this is an edit.
      if (pool.some(v => v.id === approved.id)) {
        return bad(`${approved.id} is already in the approved pool.`)
      }

      await writeApprovedFile(trackId, [...pool, approved])
      await writeQueue(trackId, queue.filter(item => item.id !== id))

      return NextResponse.json({ ok: true, approvedId: approved.id, item: approved })
    }

    default:
      return bad('Unknown action.')
  }
}

/** Only the reviewer's fields are writable. Everything ingestion found is not. */
function mergeReview(candidate: QueuedVideo, body: Body): QueuedVideo {
  const review = body.review ?? {}
  return {
    ...candidate,
    question: review.question ?? candidate.question,
    claimUnderTest: review.claimUnderTest ?? candidate.claimUnderTest,
    referenceAnswer: review.referenceAnswer ?? candidate.referenceAnswer,
    rubric: review.rubric ?? candidate.rubric,
  }
}
