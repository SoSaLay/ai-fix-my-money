'use client'

import { useState } from 'react'
import { Check, RotateCw } from 'lucide-react'
import {
  ARCHETYPES, riskColor, riskLabel, type Archetype, type ArchetypeId,
} from '@/lib/investing/archetypes'

/**
 * The archetype picker: a grid of two-sided cards.
 *
 * Clicking a card turns it over — the face is the hook, the back is what that
 * temperament actually signs up for. Choosing happens on the back, so nobody
 * selects one without having read what it costs them.
 *
 * These are self-descriptions. The card reflects back what people who describe
 * themselves this way commonly hold; it never tells anyone to hold it.
 */
export function ArchetypeCards({
  selected,
  onSelect,
}: {
  selected: ArchetypeId | null
  onSelect: (id: ArchetypeId) => void
}) {
  const [flipped, setFlipped] = useState<ArchetypeId | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Choose your archetype
        </p>
        <p className="text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
          Pick the one that sounds like you, not the one that sounds impressive.
          Tap a card to turn it over.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ARCHETYPES.map(archetype => (
          <Card
            key={archetype.id}
            archetype={archetype}
            isSelected={selected === archetype.id}
            isFlipped={flipped === archetype.id}
            onFlip={() => setFlipped(f => (f === archetype.id ? null : archetype.id))}
            onChoose={() => {
              onSelect(archetype.id)
              setFlipped(null)
            }}
          />
        ))}
      </div>

      <p className="text-label-sm text-on-surface-variant leading-relaxed">
        These describe temperaments, not portfolios. Nothing here is a recommendation
        to buy or hold anything.
      </p>
    </div>
  )
}

function Card({
  archetype, isSelected, isFlipped, onFlip, onChoose,
}: {
  archetype: Archetype
  isSelected: boolean
  isFlipped: boolean
  onFlip: () => void
  onChoose: () => void
}) {
  const color = riskColor(archetype.riskLevel)

  return (
    <div className="flip-scene min-h-[228px]">
      <div className={`flip-inner h-full ${isFlipped ? 'is-flipped' : ''}`}>
        {/* Face */}
        <button
          type="button"
          onClick={onFlip}
          aria-hidden={isFlipped}
          tabIndex={isFlipped ? -1 : 0}
          className={`flip-face w-full h-full text-left rounded-2xl px-5 py-5 flex flex-col gap-2 transition-shadow ${
            isSelected ? 'ring-2' : 'bg-surface-container-lowest hover:shadow-card'
          }`}
          style={isSelected ? { background: `${color}14`, borderColor: color, boxShadow: `0 0 0 2px ${color}` } : undefined}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-[30px] leading-none" aria-hidden>{archetype.emoji}</span>
            {isSelected && (
              <span className="flex items-center gap-1 text-label-sm font-semibold shrink-0" style={{ color }}>
                <Check size={13} /> Chosen
              </span>
            )}
          </div>

          <p className="text-headline-sm text-on-surface font-semibold mt-0.5">{archetype.name}</p>
          <p className="text-body-md text-on-surface-variant leading-relaxed flex-1">
            {archetype.tagline}
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <RiskPips level={archetype.riskLevel} />
            <span className="flex items-center gap-1 text-label-sm text-on-surface-variant shrink-0">
              <RotateCw size={11} aria-hidden /> Flip
            </span>
          </div>
        </button>

        {/* Back */}
        <div
          aria-hidden={!isFlipped}
          className="flip-face is-back w-full h-full rounded-2xl px-5 py-5 flex flex-col gap-3 bg-surface-container"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-body-lg text-on-surface font-semibold">{archetype.name}</p>
            <span className="text-label-sm text-on-surface-variant shrink-0">{archetype.horizon}</span>
          </div>

          <RiskPips level={archetype.riskLevel} showLabel />

          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {archetype.mindset}
          </p>

          <div className="flex flex-col gap-1">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              What you accept
            </p>
            <p className="text-body-md text-on-surface leading-relaxed">{archetype.accepts}</p>
          </div>

          <div className="flex items-center gap-2 mt-auto pt-1">
            <button
              type="button"
              onClick={onChoose}
              tabIndex={isFlipped ? 0 : -1}
              className="flex-1 rounded-xl py-2 text-label-lg font-medium text-white hover:opacity-90 transition-opacity"
              style={{ background: color }}
            >
              {isSelected ? 'Keep this one' : 'This is me'}
            </button>
            <button
              type="button"
              onClick={onFlip}
              tabIndex={isFlipped ? 0 : -1}
              aria-label={`Turn ${archetype.name} back over`}
              className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Five pips for risk. Both the count and the colour carry the same message —
 * grey at the bottom through to red at the top — so the meter reads at a glance
 * without anyone having to compare it against another card.
 */
function RiskPips({ level, showLabel = false }: { level: number; showLabel?: boolean }) {
  const color = riskColor(level)
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-label-sm font-semibold" style={{ color }}>
        {showLabel ? riskLabel(level) : 'Risk'}
      </span>
      <span className="flex items-center gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: i <= level ? color : 'rgba(28,27,31,0.14)' }}
          />
        ))}
      </span>
      <span className="sr-only">{riskLabel(level)} — {level} of 5</span>
    </span>
  )
}
