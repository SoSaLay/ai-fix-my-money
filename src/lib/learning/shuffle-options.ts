// ============================================================================
// Shuffling the multiple-choice options.
//
// The question bank was written with the right answer in second place far more
// often than anywhere else, which is a pattern a learner picks up long before
// they learn the material. Options are therefore reordered before they are
// shown, and the answer index is moved with them.
//
// The order is derived from the question's own id rather than drawn fresh, so
// a question looks the same every time it appears — in a lesson, in review, and
// on a retake — and an explanation that refers to "the other three" still holds.
// ============================================================================

/** A small deterministic generator. Same seed, same sequence, every time. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface ShuffledQuestion<T> {
  options: string[]
  answer: number
  question: T
}

/**
 * The same question with its options reordered and `answer` pointing at the
 * same option it did before. Anything that scores a pick must use the returned
 * `answer`, not the original one.
 */
export function shuffleOptions<T extends { id: string; options: string[]; answer: number }>(
  question: T,
): T {
  const random = seeded(hash(question.id))
  const order = question.options.map((_, i) => i)

  // Fisher-Yates, drawing from the seeded generator.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  return {
    ...question,
    options: order.map(i => question.options[i]),
    answer: order.indexOf(question.answer),
  }
}
