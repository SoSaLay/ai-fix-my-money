// ============================================================================
// Progress uses the colours everyone already reads without a legend: red for
// not started, yellow for under way, green for done. Kept in one place so the
// track cards and the step rail cannot drift apart.
// ============================================================================

export const PROGRESS_RED = '#ba1a1a'
export const PROGRESS_YELLOW = '#e0a300'
export const PROGRESS_GREEN = '#1a6b3a'

/** The colour for a track that is untouched, part-done, or finished. */
export function progressColor(done: number, total: number): string {
  if (total > 0 && done >= total) return PROGRESS_GREEN
  if (done > 0) return PROGRESS_YELLOW
  return PROGRESS_RED
}
