// ============================================================================
// Writing the quiz down.
//
// The learner's own progress map still lives in their state — this is the
// durable, queryable copy next to it, and the only one the question bank's QA
// pass can read. Two different jobs, so two records rather than one.
//
// Every write here uses the service-role client. A learner who could insert
// their own grade could pass every quiz, so the row-level policies allow them
// to read these rows and nothing else.
//
// Bookkeeping never blocks the learner: a failed write is logged and swallowed,
// because a database hiccup must not read as a failed quiz.
// ============================================================================

import 'server-only'

import { adminConfigured, createAdminClient } from '@/lib/supabase/admin'
import type { TrackId } from '@/lib/learning/tracks'

export async function openAttempt(args: {
  userId: string
  trackId: TrackId
  videoIds: string[]
  choiceIds: string[]
}): Promise<string | null> {
  if (!adminConfigured()) return null

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: args.userId,
        track_id: args.trackId,
        video_ids: args.videoIds,
        choice_ids: args.choiceIds,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[quiz/record] openAttempt', error?.message)
      return null
    }
    return data.id
  } catch (error) {
    console.error('[quiz/record] openAttempt', error)
    return null
  }
}

export async function recordGrade(args: {
  attemptId: string | null
  userId: string
  trackId: string
  questionId: string
  answer: string
  score: 0 | 1 | 2
  verdict: 'missed' | 'partial' | 'full'
  reasoning: string
  missed: string[]
}): Promise<void> {
  if (!adminConfigured()) return

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('graded_answers').insert({
      attempt_id: args.attemptId,
      user_id: args.userId,
      track_id: args.trackId,
      question_id: args.questionId,
      answer_text: args.answer,
      score: args.score,
      verdict: args.verdict,
      reasoning: args.reasoning,
      missed: args.missed,
    })
    if (error) console.error('[quiz/record] recordGrade', error.message)
  } catch (error) {
    console.error('[quiz/record] recordGrade', error)
  }
}

export async function closeAttempt(args: {
  attemptId: string
  userId: string
  correct: number
  total: number
  passed: boolean
}): Promise<void> {
  if (!adminConfigured()) return

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('quiz_attempts')
      .update({
        correct: args.correct,
        total: args.total,
        passed: args.passed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', args.attemptId)
      // The token is signed, but the owner is checked anyway: a signature
      // proves the paper was issued by us, not who is holding it now.
      .eq('user_id', args.userId)

    if (error) console.error('[quiz/record] closeAttempt', error.message)
  } catch (error) {
    console.error('[quiz/record] closeAttempt', error)
  }
}

export async function recordVideoReport(args: {
  userId: string
  trackId: string
  videoId: string
}): Promise<void> {
  if (!adminConfigured()) return

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('video_reports').insert({
      user_id: args.userId,
      track_id: args.trackId,
      video_id: args.videoId,
    })
    if (error) console.error('[quiz/record] recordVideoReport', error.message)
  } catch (error) {
    console.error('[quiz/record] recordVideoReport', error)
  }
}
