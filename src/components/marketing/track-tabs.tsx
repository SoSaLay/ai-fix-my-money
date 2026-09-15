'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

export interface TrackSummary {
  id: string
  number: number
  title: string
}

/** One short line per track — what it gets you, not what it contains. */
const LINES: Record<string, string> = {
  accounts: 'Know where all your money is.',
  spending: 'See where your paycheck actually goes.',
  savings: 'Save on purpose, not by accident.',
  investing: 'Understand your investing choices.',
}

const IMAGES: Record<string, { src: string; alt: string }> = {
  accounts: { src: '/landing/accounts.svg', alt: 'The Accounts tool listing checking, savings, a credit card and a car loan' },
  spending: { src: '/landing/spending.svg', alt: 'The spending limit slider showing what is left each month' },
  savings: { src: '/landing/savings.svg', alt: 'The savings dial showing the share of income saved each month' },
  investing: { src: '/landing/investing.svg', alt: 'The investing tool splitting a monthly amount across investments' },
}

/**
 * The tracks as a vertical tab list, each opening a picture of the tool it
 * unlocks. The picture does the explaining; the tab holds one line.
 */
export function TrackTabs({ tracks }: { tracks: TrackSummary[] }) {
  const [selected, setSelected] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const track = tracks[selected]
  const image = IMAGES[track.id]

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (selected + step + tracks.length) % tracks.length
    setSelected(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-16 items-center">
      <div role="tablist" aria-label="Tracks" aria-orientation="vertical" className="flex flex-col">
        {tracks.map((t, i) => {
          const active = i === selected
          return (
            <button
              key={t.id}
              ref={el => { tabs.current[i] = el }}
              role="tab"
              id={`track-${t.id}`}
              aria-selected={active}
              aria-controls={`track-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={onKeyDown}
              className="group flex items-baseline gap-4 border-t border-on-surface/10 last:border-b py-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span className={`text-label-md tabular-nums transition-colors ${active ? 'text-on-surface' : 'text-on-surface-variant/60'}`}>
                {String(t.number).padStart(2, '0')}
              </span>
              <span className="flex flex-col gap-1.5 min-w-0">
                <span
                  className={`text-display-sm sm:text-display-md transition-colors duration-200 ${
                    active ? 'text-on-surface' : 'text-on-surface-variant/45 group-hover:text-on-surface-variant'
                  }`}
                >
                  {t.title}
                </span>
                {active && (
                  <span className="text-title-lg text-on-surface-variant animate-fade-in">
                    {LINES[t.id]}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`track-panel-${track.id}`}
        aria-labelledby={`track-${track.id}`}
        className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-surface-container"
      >
        {image && (
          <Image
            key={track.id}
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            unoptimized
            className="object-cover animate-fade-in"
          />
        )}
      </div>
    </div>
  )
}
