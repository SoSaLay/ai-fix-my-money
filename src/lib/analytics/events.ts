// ============================================================================
// The event vocabulary.
//
// Small and fixed on purpose. Analytics rots when every call site invents its
// own name, and the questions this product needs answered are known: where do
// learners stall, which questions is everybody failing, and does the gate at
// the end of a track motivate people or stop them.
//
// A hard rule runs through every property below: no money. Not a balance, not a
// goal amount, not an income, not an email. This app holds people's finances,
// and none of that belongs in a third-party analytics store. Learning behaviour
// is what is useful here, and it is all that is collected.
// ============================================================================

import type { TrackId } from '@/lib/learning/tracks'

export type AnalyticsEvent =
  | { name: 'signed_up'; props: { method: 'password' | 'oauth' } }
  | { name: 'signed_in'; props: { method: 'password' | 'oauth' } }
  | { name: 'track_started'; props: { track_id: TrackId } }
  | { name: 'lesson_completed'; props: { track_id: TrackId; lesson_id: string; missed_count: number } }
  | { name: 'action_step_completed'; props: { track_id: TrackId } }
  | { name: 'quiz_started'; props: { track_id: TrackId; attempt_id?: string } }
  | {
      name: 'quiz_answer_graded'
      props: {
        track_id: TrackId | string
        question_id: string
        score: 0 | 1 | 2
        verdict: 'missed' | 'partial' | 'full'
      }
    }
  | {
      name: 'quiz_completed'
      props: {
        track_id: TrackId
        correct: number
        total: number
        passed: boolean
        attempt_number: number
      }
    }
  | { name: 'tool_unlocked'; props: { track_id: TrackId } }
  | { name: 'video_reported_unavailable'; props: { track_id: TrackId | string; video_id: string } }
  | { name: 'review_completed'; props: { track_id: TrackId; correct: boolean } }
