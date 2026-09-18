'use client'

import Link from 'next/link'
import { Medal } from 'lucide-react'
import { useLearning } from '@/contexts/learning-context'
import { rankGradient, rankStanding } from '@/lib/learning/rank'

/**
 * Sits beside the review button at the same size, but wears the colours of the
 * learner's rank rather than the yellow action style — it is a standing, not a
 * call to action. The bar is progress through the current rank to the next.
 */
export function RankButton() {
  const { progress } = useLearning()
  const { rank, next, pctToNext, pointsToNext } = rankStanding(progress)
  const top = next === null

  return (
    <Link
      href="/learning/rank"
      title={next ? `${pointsToNext} points to ${next.name}` : 'Top rank reached'}
      className={`inline-flex items-center justify-center gap-1.5 shrink-0 h-10 sm:h-[31px] px-[11px] rounded-lg whitespace-nowrap text-[13px] font-medium text-[#0F1111] backdrop-blur-sm transition-[filter] hover:brightness-95 ${
        top ? 'rank-shimmer' : ''
      }`}
      style={{
        background: rankGradient(rank, 0.22, 90),
        backgroundSize: top ? '300% 100%' : undefined,
        border: `1px solid ${rank.colors[0]}59`,
        boxShadow: `0 2px 8px 0 ${rank.colors[rank.colors.length - 1]}33`,
      }}
    >
      <Medal size={13} aria-hidden style={{ color: rank.colors[0] }} />
      Rank: <span className="font-semibold">{rank.name}</span>
      <span
        className="ml-1 w-10 h-1.5 rounded-full bg-black/10 overflow-hidden"
        role="progressbar"
        aria-label={next ? `Progress to ${next.name}` : 'Top rank'}
        aria-valuenow={pctToNext}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pctToNext}%`, background: rankGradient(rank, 1, 90) }}
        />
      </span>
    </Link>
  )
}
