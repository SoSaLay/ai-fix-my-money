// ============================================================================
// What a learner can allocate to.
//
// These are the same instruments the Investment choices lesson puts in front of
// them, in the same order and at the same risk tiers. The tool is where the
// lesson gets used, so the two lists have to stay identical — a category here
// that the lesson never described would be a thing we asked someone to commit
// money to without teaching it first.
//
// Day trading is deliberately absent. It appears in the lesson because it
// belongs in a conversation about risk, but it is an activity rather than a
// holding, and there is no coherent "percent of income allocated to day
// trading" for this tool to record.
//
// Nothing here is a recommendation. The order is the lesson's order, which is
// risk ascending, and the descriptions say what a thing is rather than whether
// anyone should hold it.
// ============================================================================

import type { RiskLevel } from '@/lib/learning/tracks'

export type InvestmentCategoryId =
  | 'etfs'
  | 'index_funds'
  | 'mutual_funds'
  | 'bonds'
  | 'reits'
  | 'stocks'
  | 'crypto'
  | 'options'
  | 'futures'

export interface InvestmentCategory {
  id: InvestmentCategoryId
  name: string
  /** One line, taken from the lesson's Definition column. */
  blurb: string
  /** One line, taken from the lesson's Risk column. */
  risk: string
  tier: RiskLevel
}

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  {
    id: 'etfs',
    name: 'ETFs',
    blurb: 'Funds you can buy and sell like a stock, often holding many investments at once.',
    risk: 'Risk depends on what it holds; broad ETFs are generally more diversified than narrow ones.',
    tier: 1,
  },
  {
    id: 'index_funds',
    name: 'Index funds',
    blurb: 'Funds that track a market index instead of trying to pick individual winners.',
    risk: 'Diversification spreads your risk across many companies.',
    tier: 1,
  },
  {
    id: 'mutual_funds',
    name: 'Mutual funds',
    blurb: 'Pools of investments managed together.',
    risk: 'Risk depends on what the fund owns; diversified funds are generally less risky.',
    tier: 1,
  },
  {
    id: 'bonds',
    name: 'Bonds & bond funds',
    blurb: 'Lending money in exchange for interest.',
    risk: 'Generally less risky than stocks, but you can still lose money.',
    tier: 1,
  },
  {
    id: 'reits',
    name: 'REITs',
    blurb: 'A way to invest in real estate without buying property yourself.',
    risk: 'Your returns can fall when property values, rents, or interest rates move against you.',
    tier: 2,
  },
  {
    id: 'stocks',
    name: 'Individual stocks',
    blurb: 'Buying a piece of one company.',
    risk: 'Your money depends heavily on one company, so you can lose a large portion of it.',
    tier: 3,
  },
  {
    id: 'crypto',
    name: 'Crypto',
    blurb: 'Digital assets that can rise or fall dramatically in price.',
    risk: 'Prices can swing dramatically, so large losses can happen quickly.',
    tier: 4,
  },
  {
    id: 'options',
    name: 'Options',
    blurb: 'Contracts based on the future price of another investment.',
    risk: 'You can lose your entire investment, and some strategies can lose more than you put in.',
    tier: 5,
  },
  {
    id: 'futures',
    name: 'Futures',
    blurb: 'Contracts to buy or sell something at a future date, usually using leverage.',
    risk: 'Leverage can magnify losses, potentially costing you more than you invested.',
    tier: 5,
  },
]

export const CATEGORY_IDS: InvestmentCategoryId[] = INVESTMENT_CATEGORIES.map(c => c.id)

export function getCategory(id: string | null | undefined): InvestmentCategory | undefined {
  if (!id) return undefined
  return INVESTMENT_CATEGORIES.find(c => c.id === id)
}

/** Percent of monthly income committed to each category. Sparse by design. */
export type CategoryAllocations = Partial<Record<InvestmentCategoryId, number>>

export function totalCategoryPct(allocations: CategoryAllocations | undefined): number {
  if (!allocations) return 0
  return CATEGORY_IDS.reduce((sum, id) => sum + (Number(allocations[id]) || 0), 0)
}

/**
 * The weighted risk tier of a whole plan, used to keep the stored
 * `risk_profile` meaningful now that nobody picks one directly.
 */
export function riskProfileFor(
  allocations: CategoryAllocations | undefined,
): 'conservative' | 'moderate' | 'aggressive' {
  const total = totalCategoryPct(allocations)
  if (total <= 0) return 'moderate'

  const weighted = INVESTMENT_CATEGORIES.reduce(
    (sum, c) => sum + c.tier * (Number(allocations?.[c.id]) || 0),
    0,
  )
  const average = weighted / total

  if (average <= 1.5) return 'conservative'
  if (average <= 3) return 'moderate'
  return 'aggressive'
}
