// Grade one written answer.
//
// The attempt token says which questions were served, so a learner cannot ask
// for a grade against a question they were not given. The reference answer and
// rubric are read here and never leave the server.

import { NextResponse } from 'next/server'

import { readAttempt } from '@/lib/learning/quiz/attempt'
import { checkRateLimit, checkUserRateLimit, clientKey } from '@/lib/learning/quiz/rate-limit'
import { recordGrade } from '@/lib/learning/quiz/record'
import { gradeAnswer } from '@/lib/learning/grading/grader'
import { allVideos } from '@/lib/learning/video-pool/pool'
import { authConfigured } from '@/lib/supabase/env'
import { currentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Long enough for a considered answer, short enough to bound the bill. */
const MAX_ANSWER_CHARS = 2000

interface Body {
  attemptId?: string
  questionId?: string
  answer?: string
}

export async function POST(request: Request) {
  const user = authConfigured() ? await currentUser() : null
  if (authConfigured() && !user) {
    return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  }

  // Grading is the only paid path a visitor can trigger, so it is checked
  // before anything else happens. Per person where there is one; per IP only in
  // the local-development case, where there are no accounts.
  const limit = user
    ? await checkUserRateLimit(user.id)
    : checkRateLimit(clientKey(request))

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many answers graded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const { attemptId, questionId, answer } = body
  if (!attemptId || !questionId || typeof answer !== 'string') {
    return NextResponse.json({ error: 'Missing attempt, question, or answer.' }, { status: 400 })
  }

  const attempt = attemptId ? readAttempt(attemptId) : null
  if (!attempt) {
    return NextResponse.json(
      { error: 'This attempt has expired. Start the quiz again.' },
      { status: 401 },
    )
  }

  // The token is what stops a learner grading against a question they were not
  // served — including one they have already seen the reference answer for.
  if (!attempt.videoIds.includes(questionId)) {
    return NextResponse.json({ error: 'That question is not part of this attempt.' }, { status: 400 })
  }

  const trimmed = answer.trim()
  if (trimmed === '') {
    // No model call for an empty answer. There is nothing to grade and no
    // reason to pay for finding that out.
    return NextResponse.json({
      score: 0,
      verdict: 'missed',
      reasoning: 'You did not write an answer, so there was nothing to grade.',
      missed: [],
    })
  }
  if (trimmed.length > MAX_ANSWER_CHARS) {
    return NextResponse.json(
      { error: `Keep your answer under ${MAX_ANSWER_CHARS} characters.` },
      { status: 400 },
    )
  }

  const video = allVideos(attempt.trackId).find(v => v.id === questionId)
  if (!video) {
    return NextResponse.json({ error: 'That question is no longer available.' }, { status: 410 })
  }

  try {
    const result = await gradeAnswer({
      question: video.question,
      claimUnderTest: video.claimUnderTest,
      referenceAnswer: video.referenceAnswer,
      rubric: video.rubric,
      learnerAnswer: trimmed,
    })

    // Written after the grade exists, so a failed model call never leaves a
    // phantom row. This is also what the rate limiter counts.
    if (user) {
      await recordGrade({
        attemptId: attempt.recordId ?? null,
        userId: user.id,
        trackId: attempt.trackId,
        questionId,
        answer: trimmed,
        score: result.score,
        verdict: result.verdict,
        reasoning: result.reasoning,
        missed: result.missed,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    // A grader failure must never read as a wrong answer — the learner would be
    // penalised for our outage.
    console.error('[quiz/grade]', error)
    return NextResponse.json(
      { error: 'Could not grade that answer right now. Try again in a moment.' },
      { status: 502 },
    )
  }
}
