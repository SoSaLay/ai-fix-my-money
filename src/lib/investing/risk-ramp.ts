// ============================================================================
// The risk colour ramp: pale yellow at tier 1 up to deep red at tier 5.
//
// Shared by the lesson table and the investing tool so a learner meets the same
// colour for the same tier in both places. A tier that looked one way while
// reading and another way while allocating would teach the wrong thing.
//
// Each tier is a very light tint carrying a saturated stripe. A background dark
// enough to read as a warning would take the text contrast with it; the stripe
// puts full-strength colour where nothing has to stay legible through it.
//
// Colour is always a second reading of something already stated in words. A
// learner who cannot separate the shades must lose only the speed of the scan.
// ============================================================================

import type { RiskLevel } from '@/lib/learning/tracks'

export interface RiskShade {
  tint: string
  stripe: string
}

export const RISK_RAMP: Record<RiskLevel, RiskShade> = {
  1: { tint: '#fdf8e6', stripe: '#d9a520' },
  2: { tint: '#fdf1dd', stripe: '#dd8b28' },
  3: { tint: '#fbe9dc', stripe: '#d1662a' },
  4: { tint: '#f9e1dc', stripe: '#bf4527' },
  5: { tint: '#f7d9d7', stripe: '#9c241c' },
}

/** What a tier is called, for the places that need the word rather than the hue. */
export const RISK_LABEL: Record<RiskLevel, string> = {
  1: 'Lower risk',
  2: 'Lower risk',
  3: 'Higher risk',
  4: 'High risk',
  5: 'Highest risk',
}
