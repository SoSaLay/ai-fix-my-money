// ============================================================================
// Quiz shape. Plain values, no imports — the app and the scripts both need
// them, and `pool.ts` is `server-only`, which throws in plain Node.
// ============================================================================

/** How one paper is made up. Ten questions, however they are split. */
export interface QuizMix {
  /** Video questions, answered in writing and graded against a reference. */
  videos: number
  /** Hand-written multiple choice, drawn from the track's `finalQuiz`. */
  choices: number
}

export const DEFAULT_QUIZ_MIX: QuizMix = { videos: 8, choices: 2 }

/**
 * Tracks whose paper is not the default split.
 *
 * Three of the four are all video. Their lessons are about reading what someone
 * actually claims — about earning and spending, about what an account pays,
 * about what an investment can do — and judging it. That is what a written
 * answer tests and a multiple choice cannot.
 *
 * Investing draws twelve rather than ten, so its paper is scored out of 24.
 * The pass fraction is applied to the paper's own total, so the bar moves with
 * it rather than being pinned to ten questions.
 */
const QUIZ_MIX_BY_TRACK: Record<string, QuizMix> = {
  spending: { videos: 10, choices: 0 },
  savings: { videos: 10, choices: 0 },
  investing: { videos: 12, choices: 0 },
}

export function quizMix(trackId: string): QuizMix {
  return QUIZ_MIX_BY_TRACK[trackId] ?? DEFAULT_QUIZ_MIX
}

/** The default split, for copy and for health reporting across all tracks. */
export const VIDEO_QUESTIONS_PER_QUIZ = DEFAULT_QUIZ_MIX.videos
export const CHOICE_QUESTIONS_PER_QUIZ = DEFAULT_QUIZ_MIX.choices

/**
 * What a healthy track holds. Three times the sampled count, so answers
 * circulating does not make the paper memorisable.
 */
export const TARGET_POOL_SIZE = 25

/**
 * Below twice the sampled count, a track needs a new ingestion round. This is
 * the replenishment signal, not a hard floor — the quiz still runs.
 */
export const REPLENISH_BELOW = VIDEO_QUESTIONS_PER_QUIZ * 2
