// Close out an attempt with its result.
//
// The score is sent by the browser, which computed it from answers the browser
// was told the verdict of — so this is a record of what happened, not a
// authority on it. What makes it trustworthy enough is the signed token: the
// row it closes is the row that was opened when this exact paper was issued,
// and it can only be closed once, by the person it was issued to.

import { NextResponse } from 'next/server'

import { readAttempt } from '@/lib/learning/quiz/attempt'
import { closeAttempt } from '@/lib/learning/quiz/record'
import { authConfigured } from '@/lib/supabase/env'
import { currentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Body {
  attemptId?: string
  correct?: number
  total?: number
  passed?: boolean
}

export async function POST(request: Request) {
  const user = authConfigured() ? await currentUser() : null
  if (authConfigured() && !user) {
    return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  }
  if (!user) return NextResponse.json({ ok: true })

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const { attemptId, correct, total, passed } = body
  if (!attemptId || typeof correct !== 'number' || typeof total !== 'number' || typeof passed !== 'boolean') {
    return NextResponse.json({ error: 'Missing attempt or result.' }, { status: 400 })
  }

  const attempt = readAttempt(attemptId)
  if (!attempt) {
    return NextResponse.json({ error: 'This attempt has expired.' }, { status: 401 })
  }
  if (!attempt.recordId) {
    // Nothing was written when the paper was issued, so there is nothing to
    // close. Not an error — the learner's own progress is unaffected.
    return NextResponse.json({ ok: true })
  }

  await closeAttempt({
    attemptId: attempt.recordId,
    userId: user.id,
    correct,
    total,
    passed,
  })

  return NextResponse.json({ ok: true })
}
