// ============================================================================
// Curated video pool — shapes
//
// The final quiz puts real short-form finance content in front of the learner
// and asks whether they can follow it and judge it. Every video in the pool was
// watched by a human, who wrote the question and the reference answer by hand.
// No AI generates questions and nothing reads a transcript; the model only
// grades a written answer against what the reviewer wrote.
//
// This file is types only, so it is safe on both sides of the network. The data
// is not — see `pool.ts`, which is server-only for the reason spelled out on
// `referenceAnswer` below.
// ============================================================================

import type { TrackId } from '@/lib/learning/tracks'

export type VideoStatus = 'draft' | 'approved' | 'unavailable' | 'retired'

/** What the ingest script can know before a human has watched anything. */
export interface VideoCandidate {
  /** Our stable id, e.g. 'acc-v-001'. Never reused, even after retirement. */
  id: string
  trackId: TrackId
  platform: 'tiktok'
  /** The platform's own id, plus the URLs to embed and to health-check. */
  videoId: string
  shareUrl: string
  embedUrl: string
  creatorHandle: string
  /** ISO. */
  postedAt: string
  /** The creator's own caption. Reviewer context only, never shown as material. */
  caption: string
  engagement: {
    likes: number
    comments: number
    shares: number
    plays: number
  }
}

/** Everything the reviewer writes after watching. */
export interface VideoReview {
  question: string
  /** What the video actually claims. Powers the "does it hold up?" framing. */
  claimUnderTest?: string
  /**
   * SERVER ONLY. Ship this to the browser and the answer key is one View Source
   * away — the same reason a transcript could never be sent.
   */
  referenceAnswer: string
  /** SERVER ONLY. The points an answer must hit, in order of weight. */
  rubric: string[]
  /** ISO. Who did it is on the approving commit, which is the real record. */
  reviewedAt: string
}

/** A fully reviewed pool item. Only `approved` ones are ever served. */
export interface PooledVideo extends VideoCandidate, VideoReview {
  status: VideoStatus
  /** ISO. Last time the embed was confirmed to still load. */
  lastCheckedAt: string
}

/**
 * A candidate sitting in the review queue. The reviewer's fields are partial
 * until they have been filled in, and `status` is pinned to 'draft' so nothing
 * half-written can be mistaken for servable.
 */
export interface QueuedVideo extends VideoCandidate, Partial<VideoReview> {
  status: 'draft'
  /**
   * Patterns the ingest script noticed in the caption — specific stock picks,
   * get-rich-quick, MLM recruiting, course funnels. A flag, never a filter: the
   * script has only the caption to go on, and the reviewer has the video. It
   * exists so the obvious rejects are obvious before you press play.
   */
  concerns?: string[]
  /** Set when the reviewer rejects the candidate, so it is never pulled again. */
  rejected?: boolean
  rejectedReason?: string
}

/**
 * What a learner's browser is allowed to see. The projection in `pool.ts` is
 * the only way to build one, and it is what the serving route returns.
 */
export interface PublicVideoQuestion {
  id: string
  trackId: TrackId
  kind: 'video'
  question: string
  embedUrl: string
  shareUrl: string
  creatorHandle: string
  postedAt: string
}

/** The reviewer's fields are all present and non-empty. */
export function isReviewComplete(item: QueuedVideo): boolean {
  return Boolean(
    item.question?.trim() &&
    item.referenceAnswer?.trim() &&
    item.rubric?.some(point => point.trim()),
  )
}
