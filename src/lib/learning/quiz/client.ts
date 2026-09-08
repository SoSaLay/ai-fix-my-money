// ============================================================================
// The browser's side of the quiz endpoints.
//
// Both calls are bookkeeping: they record what happened for the question bank's
// QA pass and for the learner's own history. Neither is on the path of anything
// the learner is waiting for, so both swallow their failures — a lost record is
// worth less than a quiz that stops working because the database blinked.
// ============================================================================

'use client'

/** Close out an attempt with its result. Safe to call more than once. */
export async function completeAttempt(args: {
  attemptId: string
  correct: number
  total: number
  passed: boolean
}): Promise<void> {
  try {
    await fetch('/api/quiz/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
  } catch {
    // Offline, or the tab is going away. The learner's progress is stored
    // separately and is unaffected.
  }
}

/** Flag an embed that will not play, so a reviewer can retire the question. */
export async function reportVideoUnavailable(args: {
  trackId: string
  videoId: string
}): Promise<void> {
  try {
    await fetch('/api/videos/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
  } catch {
    // Same reasoning. The learner still walks away from the dead question.
  }
}
