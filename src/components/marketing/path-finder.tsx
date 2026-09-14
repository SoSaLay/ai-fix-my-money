'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Clock, CreditCard, PieChart, PiggyBank, TrendingUp, Unlock, Clapperboard,
} from 'lucide-react'

export interface TrackSummary {
  id: string
  number: number
  title: string
  outcome: string
  lessons: string[]
  minutes: number
  finalVideos: number
}

/** The goal a visitor recognises themselves in, mapped onto the track that answers it. */
const GOALS: Record<string, string> = {
  accounts: 'I don’t know where all my money is',
  spending: 'My paycheck disappears every month',
  savings: 'I want to save on purpose',
  investing: 'I’m ready to start investing',
}

const ICONS: Record<string, React.ReactNode> = {
  accounts: <CreditCard size={18} aria-hidden />,
  spending: <PieChart size={18} aria-hidden />,
  savings: <PiggyBank size={18} aria-hidden />,
  investing: <TrendingUp size={18} aria-hidden />,
}

/**
 * "Where are you starting?" — the audience switcher, pointed at goals rather
 * than job titles, because everyone here is one kind of user at a different
 * point. Each goal opens the track that answers it.
 */
export function PathFinder({ tracks }: { tracks: TrackSummary[] }) {
  const [selected, setSelected] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const track = tracks[selected]

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (selected + step + tracks.length) % tracks.length
    setSelected(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
      <div role="tablist" aria-label="Where are you starting?" aria-orientation="vertical" className="flex flex-col gap-2">
        {tracks.map((t, i) => {
          const active = i === selected
          return (
            <button
              key={t.id}
              ref={el => { tabs.current[i] = el }}
              role="tab"
              id={`goal-${t.id}`}
              aria-selected={active}
              aria-controls={`goal-panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={onKeyDown}
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-left cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                active
                  ? 'bg-surface-container-lowest shadow-float'
                  : 'bg-transparent hover:bg-surface-container-lowest/60'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  active ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {ICONS[t.id]}
              </span>
              <span className="flex flex-col min-w-0">
                <span className={`text-body-lg font-medium ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {GOALS[t.id] ?? t.title}
                </span>
                <span className="text-label-md text-on-surface-variant">Track {String(t.number).padStart(2, '0')} · {t.title}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`goal-panel-${track.id}`}
        aria-labelledby={`goal-${track.id}`}
        className="bg-surface-container-lowest rounded-3xl shadow-card p-7 sm:p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-label-sm text-secondary uppercase tracking-widest">
            Start with {track.title}
          </p>
          <p className="text-headline-lg text-on-surface">{track.outcome}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">What you’ll cover</p>
          <ol className="flex flex-wrap gap-2">
            {track.lessons.map((lesson, i) => (
              <li
                key={lesson}
                className="text-label-lg text-on-surface bg-surface-container-low rounded-full px-3.5 py-1.5"
              >
                <span className="text-on-surface-variant tabular-nums mr-1.5">{i + 1}</span>
                {lesson}
              </li>
            ))}
          </ol>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <li className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Clock size={15} className="text-secondary shrink-0" aria-hidden /> About {track.minutes} min of reading
          </li>
          <li className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Clapperboard size={15} className="text-secondary shrink-0" aria-hidden /> {track.finalVideos}-video final test
          </li>
          <li className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Unlock size={15} className="text-secondary shrink-0" aria-hidden /> Unlocks the {track.title} tool
          </li>
        </ul>

        <div className="flex items-center gap-4 flex-wrap pt-1">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary text-white px-6 py-3 text-label-lg font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
          >
            Start learning <ArrowRight size={15} aria-hidden />
          </Link>
          {selected > 0 && (
            // Tracks open in order; the final test is the one way past that.
            <Link
              href={`/learning/${track.id}?step=final`}
              className="text-label-lg font-medium text-on-surface-variant underline underline-offset-4 cursor-pointer transition-colors duration-200 hover:text-on-surface"
            >
              Already know this? Test out
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
