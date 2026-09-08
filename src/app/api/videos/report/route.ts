// A learner saying an embed will not play.
//
// The weekly health check finds dead videos on its own schedule; this finds
// them in the minute somebody hits one. Both write to the same place a review
// pass reads.

import { NextResponse } from 'next/server'

import { TRACK_ORDER } from '@/lib/learning/tracks'
import { recordVideoReport } from '@/lib/learning/quiz/record'
import { authConfigured } from '@/lib/supabase/env'
import { currentUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Body {
  trackId?: string
  videoId?: string
}

export async function POST(request: Request) {
  const user = authConfigured() ? await currentUser() : null
  if (authConfigured() && !user) {
    return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const { trackId, videoId } = body
  if (!trackId || !videoId || !(TRACK_ORDER as string[]).includes(trackId)) {
    return NextResponse.json({ error: 'Missing track or video.' }, { status: 400 })
  }

  if (user) {
    await recordVideoReport({ userId: user.id, trackId, videoId })
  }

  // The learner's next step does not depend on the write landing, so this
  // always reports success. Walking away from a dead embed is the feature.
  return NextResponse.json({ ok: true })
}
