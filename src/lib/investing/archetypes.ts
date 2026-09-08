// ============================================================================
// Investor archetypes
//
// A self-description, not a prescription. The learner picks the card that
// sounds like them, and the card reflects back the asset classes people who
// describe themselves that way commonly end up holding.
//
// The line this file walks: it never says "buy this". Every asset list is
// phrased as what is typically associated with that temperament, and every
// entry carries its own risk note so nothing reads as an endorsement. The
// tradeoffs are the point — see the DISCLAIMER copy in lib/learning.
// ============================================================================

export type ArchetypeId =
  | 'bricklayer'
  | 'gardener'
  | 'cartographer'
  | 'lifeguard'
  | 'stormchaser'

/** Internal only. The stored goal keeps a risk profile; the UI never says it. */
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'

export interface AssetClass {
  emoji: string
  name: string
  /** What it is, in one clause. */
  what: string
  /** The honest downside. Always present. */
  risk: string
}

export interface Archetype {
  id: ArchetypeId
  emoji: string
  name: string
  /** The card's one-line hook. */
  tagline: string
  /** 1–5. Drives the risk meter on the card face. */
  riskLevel: number
  /** Shown on the back: how this person actually behaves. */
  mindset: string
  horizon: string
  /** What this temperament is signing up for, in their own words. */
  accepts: string
  /** Commonly associated asset classes. Never framed as instructions. */
  assets: AssetClass[]
  risk: RiskProfile
}

const BROAD_ETF: AssetClass = {
  emoji: '🧺',
  name: 'Broad index ETFs',
  what: 'One purchase holding hundreds of companies at once',
  risk: 'Falls whenever the whole market falls',
}

const BONDS: AssetClass = {
  emoji: '🏛️',
  name: 'Bonds and bond funds',
  what: 'Lending money out in exchange for interest',
  risk: 'Loses value when interest rates rise; grows slowly',
}

const INTERNATIONAL: AssetClass = {
  emoji: '🌍',
  name: 'International funds',
  what: 'Companies based outside your own country',
  risk: 'Adds currency swings and country-specific risk',
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'lifeguard',
    emoji: '🛟',
    name: 'The Lifeguard',
    tagline: 'Keep it whole. The money has a job soon.',
    riskLevel: 1,
    mindset: 'Protecting what is already there matters more than growing it. A goal is close enough that a bad year would actually hurt.',
    horizon: 'Under 5 years',
    accepts: 'Returns that may barely beat inflation, in exchange for far smaller swings.',
    assets: [
      BONDS,
      { emoji: '💵', name: 'Cash and money market funds', what: 'Held stable and available at short notice', risk: 'Loses buying power to inflation over time' },
      { emoji: '🧾', name: 'Short-term treasuries', what: 'Lending to the government for a fixed period', risk: 'Low return; the money is committed for the term' },
    ],
    risk: 'conservative',
  },
  {
    id: 'bricklayer',
    emoji: '🧱',
    name: 'The Bricklayer',
    tagline: 'Same amount, same day, every month. Boring on purpose.',
    riskLevel: 2,
    mindset: 'Consistency does the work. Nothing gets picked, nothing gets timed, and the plan is designed to survive being ignored.',
    horizon: '10+ years',
    accepts: 'Never beating the market, because the whole point is not trying to.',
    assets: [
      BROAD_ETF,
      { emoji: '🎯', name: 'Target-date funds', what: 'One fund that shifts toward safer holdings as a date approaches', risk: 'Fees vary widely; you do not control the glide path' },
      BONDS,
    ],
    risk: 'conservative',
  },
  {
    id: 'gardener',
    emoji: '🌱',
    name: 'The Gardener',
    tagline: 'Plant it, water it, do not dig it up to check.',
    riskLevel: 3,
    mindset: 'Long horizon, broad exposure, and a willingness to sit through bad years without touching anything. Rebalances on a schedule, not on a feeling.',
    horizon: '15+ years',
    accepts: 'Watching the balance fall by a third some years and adding to it anyway.',
    assets: [
      BROAD_ETF,
      INTERNATIONAL,
      { emoji: '🌾', name: 'Mid and small cap funds', what: 'Smaller companies with more room to grow', risk: 'Swings harder in both directions than large companies' },
      { emoji: '🏘️', name: 'REITs', what: 'Pooled property, usually paying income', risk: 'Exposed to property markets and interest rates' },
    ],
    risk: 'moderate',
  },
  {
    id: 'cartographer',
    emoji: '🗺️',
    name: 'The Cartographer',
    tagline: 'Reads the filings. Wants to know what they own.',
    riskLevel: 4,
    mindset: 'Willing to do real research on specific businesses, and to be wrong about some of them. Usually keeps a broad core and picks around the edges.',
    horizon: '10+ years, per position',
    accepts: 'Hours of work with no guarantee it beats simply holding the index.',
    assets: [
      BROAD_ETF,
      { emoji: '🏢', name: 'Individual stocks', what: 'Direct ownership of specific companies you chose', risk: 'A single company can fall and never recover' },
      INTERNATIONAL,
      { emoji: '💸', name: 'Dividend-paying companies', what: 'Businesses that pay part of earnings to owners', risk: 'Dividends can be cut, and a high yield often signals trouble' },
    ],
    risk: 'moderate',
  },
  {
    id: 'stormchaser',
    emoji: '⚡',
    name: 'The Storm Chaser',
    tagline: 'Chases the big swing. Knows the swing goes both ways.',
    riskLevel: 5,
    mindset: 'Comfortable with severe volatility and total loss on a position. This is the temperament most likely to be wrong about its own risk tolerance.',
    horizon: 'Varies, often short',
    accepts: 'A real chance of losing the entire amount put in — the evidence on frequent trading is not kind.',
    assets: [
      { emoji: '🪙', name: 'Crypto', what: 'Digital assets with no earnings underneath them', risk: 'Falls of 70% or more have happened repeatedly; lightly regulated' },
      { emoji: '🚀', name: 'Growth and small cap stocks', what: 'Companies priced on what they might become', risk: 'Falls hardest when expectations are not met' },
      { emoji: '🎲', name: 'Options and futures', what: 'Time-limited, often leveraged contracts on a price', risk: 'Most options expire worthless; leverage can lose more than you put in' },
    ],
    risk: 'aggressive',
  },
]

export function getArchetype(id: string | null | undefined): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id)
}

/**
 * The risk meter runs grey → green → yellow → orange → red, so the colour says
 * what the count says. Read without a legend, which is the point: nobody should
 * have to work out that five pips is worse than one.
 */
export const RISK_COLORS = ['#9aa0a6', '#1a6b3a', '#e0a300', '#e06c00', '#ba1a1a']

/** Colour for a whole archetype's meter, from its 1–5 level. */
export function riskColor(level: number): string {
  return RISK_COLORS[Math.min(Math.max(level, 1), 5) - 1]
}

/** One-word label for the level, shown beside the pips. */
export const RISK_LABELS = ['Lowest risk', 'Lower risk', 'Medium risk', 'Higher risk', 'Highest risk']

export function riskLabel(level: number): string {
  return RISK_LABELS[Math.min(Math.max(level, 1), 5) - 1]
}
