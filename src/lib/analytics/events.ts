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
//
// Nobody is identified, so these describe an anonymous browser rather than a
// person. `video_reported_unavailable` is the one that is not just curiosity:
// with no database it is the only way a learner can tell us an embed has died
// between weekly health checks, so it is worth watching.
// ============================================================================

import type { TrackId } from '@/lib/learning/tracks'

export type AnalyticsEvent =
  | { name: 'track_started'; props: { track_id: TrackId } }
  | { name: 'lesson_completed'; props: { track_id: TrackId; lesson_id: string; missed_count: number } }
  | { name: 'action_step_completed'; props: { track_id: TrackId } }
  | { name: 'quiz_started'; props: { track_id: TrackId } }
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
  // The browser's own error code, so a device that refuses voice input can be
  // told apart from one with no microphone.
  | { name: 'dictation_failed'; props: { error: string; microphone: string } }
  | { name: 'review_completed'; props: { track_id: TrackId; correct: boolean } }
