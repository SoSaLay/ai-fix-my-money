// One attempt at a track's final quiz: eight video questions and two multiple
// choice, sampled fresh. Public fields only — no reference answer, no rubric,
// and no answer key for the multiple choice either.

import { NextResponse } from 'next/server'

import { issueAttempt } from '@/lib/learning/quiz/attempt'
import { openAttempt } from '@/lib/learning/quiz/record'
import { samplePaper } from '@/lib/learning/quiz/sample'
import { currentUser } from '@/lib/supabase/server'
import { authConfigured } from '@/lib/supabase/env'
import type { TrackId } from '@/lib/learning/tracks'

/** Every attempt is a new sample, so nothing about this may be cached. */
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ track: string }> },
) {
  const { track } = await params

  // The middleware already turns anonymous callers away; this is the second
  // gate, so the route is safe on its own terms rather than by configuration.
  const user = authConfigured() ? await currentUser() : null
  if (authConfigured() && !user) {
    return NextResponse.json({ error: 'Sign in to take the quiz.' }, { status: 401 })
  }

  const paper = samplePaper(track)

  if (!paper.ok) {
    if (paper.reason === 'unknown-track') {
      return NextResponse.json({ error: 'Unknown track.' }, { status: 404 })
    }
    // A track whose pool has decayed below one paper is an operator problem,
    // not a learner one. Say so plainly rather than serving a short quiz.
    return NextResponse.json(
      {
        error: 'This quiz is not available right now.',
        detail: `${paper.live} of ${paper.needed} videos available.`,
      },
      { status: 503 },
    )
  }

  // Written down before the paper is handed over, so an abandoned attempt is
  // still visible. That is the drop-off signal, and it is only observable here.
  const recordId = user
    ? await openAttempt({
        userId: user.id,
        trackId: track as TrackId,
        videoIds: paper.videoIds,
        choiceIds: paper.choiceIds,
      })
    : null

  return NextResponse.json({
    trackId: track,
    attemptId: issueAttempt({
      trackId: track as TrackId,
      videoIds: paper.videoIds,
      choiceIds: paper.choiceIds,
      ...(recordId ? { recordId } : {}),
    }),
    videos: paper.videos,
    choices: paper.choices,
  })
}
