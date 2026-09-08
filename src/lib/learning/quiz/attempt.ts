// ============================================================================
// Attempt tokens.
//
// Grading has to know which reference answer belongs to which response, and the
// browser cannot be told — the mapping is the answer key's index. The usual fix
// is a server-side session store, but this app has no database and may end up
// on a serverless host where memory is not shared between requests.
//
// So the attempt is a signed token instead: the sampled ids travel in the
// token, and the signature is what makes them unforgeable. No storage, works on
// any host, and a learner cannot swap in a question whose answer they know.
// ============================================================================

import 'server-only'

import { createHmac, timingSafeEqual } from 'crypto'

import type { TrackId } from '@/lib/learning/tracks'

/** Attempts are short-lived. Long enough to sit and think, not to farm. */
const TTL_MS = 3 * 60 * 60 * 1000

export interface AttemptPayload {
  trackId: TrackId
  /** Pool ids of the sampled video questions, in the order served. */
  videoIds: string[]
  /** `QuizQuestion.id`s of the sampled multiple choice. */
  choiceIds: string[]
  /**
   * The `quiz_attempts` row this paper was written down as. Signed into the
   * token so a learner cannot attach their answers to somebody else's attempt —
   * or to an attempt they have already been graded on. Absent when the database
   * is not configured, which is the local-development case.
   */
  recordId?: string
  issuedAt: number
}

function secret(): string {
  const value = process.env.QUIZ_ATTEMPT_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error(
      'QUIZ_ATTEMPT_SECRET must be set to at least 32 characters. ' +
      'Generate one with: openssl rand -base64 32',
    )
  }
  return value
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64url')

function sign(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url')
}

export function issueAttempt(payload: Omit<AttemptPayload, 'issuedAt'>): string {
  const body = b64url(JSON.stringify({ ...payload, issuedAt: Date.now() }))
  return `${body}.${sign(body)}`
}

/**
 * Returns null for anything that is not a currently valid attempt — a bad
 * signature, a malformed token, or one that has expired. The caller does not
 * get to learn which, because the difference is only useful to an attacker.
 */
export function readAttempt(token: string): AttemptPayload | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = sign(body)
  // Both are base64url of a sha256 digest, so lengths match unless the token
  // was tampered with — and timingSafeEqual throws on a length mismatch.
  if (signature.length !== expected.length) return null
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

  let payload: AttemptPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AttemptPayload
  } catch {
    return null
  }

  if (typeof payload.issuedAt !== 'number') return null
  if (Date.now() - payload.issuedAt > TTL_MS) return null
  if (!Array.isArray(payload.videoIds) || !Array.isArray(payload.choiceIds)) return null

  return payload
}
