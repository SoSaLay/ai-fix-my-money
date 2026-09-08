'use client'

import { getArchetype, riskColor, riskLabel, type ArchetypeId } from '@/lib/investing/archetypes'

/**
 * Sits under the allocation dial: once an archetype is chosen, this is what
 * that choice actually points at.
 *
 * Every row carries its risk alongside what it is, deliberately. A list of
 * asset classes with no downside attached would read as a shopping list, which
 * is the one thing this page must not be.
 */
export function ArchetypeAssets({ archetypeId }: { archetypeId: ArchetypeId | null }) {
  const archetype = getArchetype(archetypeId)

  if (!archetype) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-outline-variant/60 px-5 py-6 text-center">
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Choose an archetype to see the asset classes it points at.
        </p>
      </div>
    )
  }

  const color = riskColor(archetype.riskLevel)

  return (
    <div className="w-full bg-surface-container-low rounded-2xl p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Commonly held by {archetype.emoji} {archetype.name}
          </p>
          <span
            className="text-label-sm font-semibold px-2 py-0.5 rounded-lg shrink-0"
            style={{ color, background: `${color}1f` }}
          >
            {riskLabel(archetype.riskLevel)}
          </span>
        </div>
        <p className="text-label-sm text-on-surface-variant mt-1 leading-relaxed">
          What people who describe themselves this way tend to look at — with what
          each one risks.
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {archetype.assets.map(asset => (
          <li key={asset.name} className="flex gap-3">
            <span className="text-[20px] leading-none mt-0.5 shrink-0" aria-hidden>
              {asset.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-label-lg text-on-surface font-medium">{asset.name}</p>
              <p className="text-label-sm text-on-surface-variant leading-relaxed">
                {asset.what}
              </p>
              <p className="text-label-sm text-on-surface-variant leading-relaxed mt-0.5">
                <span className="font-semibold">Risk:</span> {asset.risk}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
