// ============================================================================
// Quiz shape. Plain values, no imports — the app and the scripts both need
// them, and `pool.ts` is `server-only`, which throws in plain Node.
// ============================================================================

/** Video questions per attempt. The rest of the ten are multiple choice. */
export const VIDEO_QUESTIONS_PER_QUIZ = 8

/** Hand-written multiple choice per attempt, drawn from `finalQuiz`. */
export const CHOICE_QUESTIONS_PER_QUIZ = 2

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
