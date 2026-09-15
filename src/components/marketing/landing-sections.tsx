import Link from 'next/link'
import { ArrowRight, Github, Plus } from 'lucide-react'

import { RANKS, POINTS_PER_CHOICE, POINTS_PER_WRITTEN } from '@/lib/learning/rank'
import { DISCLAIMER_SHORT } from '@/lib/learning/disclaimer'
import { LEGAL_ROOT } from '@/lib/legal/documents'

// ============================================================================
// Everything on the landing page below the hero.
//
// One idea per section, a line or two of copy, one button. Every figure is
// counted from the curriculum and the video pool at build time, and every
// claim describes something the product actually does.
// ============================================================================

const GITHUB_URL = 'https://github.com/SoSaLay/ai-fix-my-money'

/** The one call to action. Near-black, so it is never mistaken for the brand's accent. */
const CTA_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#17171c] text-white text-label-lg cursor-pointer transition-colors duration-200 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#17171c]'
export const CTA_CLASS = `${CTA_BASE} px-7 py-3.5`
export const CTA_SMALL_CLASS = `${CTA_BASE} px-5 py-2.5`

// ─── Numbers ─────────────────────────────────────────────────────────────────

export interface LandingStats {
  tracks: number
  lessons: number
  practiceQuestions: number
  reviewedVideos: number
}

export function StatsStrip({ stats }: { stats: LandingStats }) {
  const items = [
    { value: stats.tracks, label: 'Tracks' },
    { value: stats.lessons, label: 'Short lessons' },
    { value: stats.practiceQuestions, label: 'Practice questions' },
    { value: stats.reviewedVideos, label: 'Reviewed videos' },
    { value: '$0', label: 'To start' },
  ]

  return (
    <section aria-label="At a glance" className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full">
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
        {items.map(item => (
          <div key={item.label} className="flex flex-col-reverse gap-1">
            <dt className="text-body-lg text-on-surface-variant">{item.label}</dt>
            <dd className="text-display-lg text-on-surface tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────

/** Each picture is a drawn illustration in public/landing/steps — swap the file to change it. */
const STEPS = [
  { title: 'Read', body: 'Short lessons, a few minutes each.', image: '/landing/steps/read.svg' },
  { title: 'Answer', body: 'Every answer comes with the reason.', image: '/landing/steps/answer.svg' },
  { title: 'Do it', body: 'Use the tools with your own numbers.', image: '/landing/steps/do-it.svg' },
  { title: 'Prove it', body: 'Explain real finance videos in your own words.', image: '/landing/steps/prove-it.svg' },
]

/** `minutesPerTrack` is estimated from the curriculum itself, not typed in. */
export function HowItWorks({ minutesPerTrack }: { minutesPerTrack: number }) {
  return (
    <section id="how-it-works" className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full scroll-mt-8">
      <h2 className="text-display-md sm:text-display-lg text-on-surface max-w-3xl mb-10 sm:mb-14">
        About {minutesPerTrack} minutes a track,{' '}
        <span className="text-on-surface-variant">start to finish.</span>
      </h2>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col overflow-hidden rounded-3xl bg-surface-container-lowest border border-on-surface/[0.06]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimise */}
            <img src={step.image} alt="" className="w-full aspect-[4/3] object-cover" />
            <div className="flex flex-col gap-2 p-5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-surface-container flex items-center justify-center text-label-md text-on-surface tabular-nums">
                  {i + 1}
                </span>
                <h3 className="text-headline-md text-on-surface">{step.title}</h3>
              </div>
              <p className="text-body-lg text-on-surface-variant">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── The why ─────────────────────────────────────────────────────────────────

const WHY = [
  { lead: 'Feel at home with your money.', rest: 'Know how to manage it, and how to grow it over the long run.' },
  { lead: 'Most money advice now comes from a feed.', rest: 'That isn’t changing, so we don’t pretend it will.' },
  { lead: 'So we test you on it.', rest: 'Real short-form finance videos, explained in your own words.' },
  { lead: 'The next one that comes up, you’ll know.', rest: 'Worth your time, or worth a swipe.' },
]

export function Why() {
  return (
    <section id="why" className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full scroll-mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-16">
        <h2 className="text-display-md text-on-surface">The why.</h2>
        <ul className="flex flex-col">
          {WHY.map(item => (
            <li key={item.lead} className="border-t border-on-surface/10 last:border-b py-6">
              <p className="text-headline-lg sm:text-display-sm text-on-surface-variant">
                <span className="text-on-surface">{item.lead}</span> {item.rest}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function Faq({ passPercent }: { passPercent: number }) {
  const faqs: { q: string; a: string }[] = [
    {
      q: 'Is it really free?',
      a: 'Yes. Every track, final test and tool is free, and there’s no card to enter.',
    },
    {
      q: 'Is this financial advice?',
      a: 'No. It explains how money works so you can make your own decisions. Nothing here tells you to buy, sell or hold anything.',
    },
    {
      q: 'Do I need to connect my bank?',
      a: 'No. Nothing connects to your bank. You type in your own figures.',
    },
    {
      q: 'How is the final test marked?',
      a: `You explain real finance videos in your own words. AI compares your answer to one a person wrote after watching, and tells you what you missed. You need ${passPercent}% to pass.`,
    },
    {
      q: 'What if I don’t pass?',
      a: 'Take it again whenever you like. Each retake uses different videos, and there’s no limit.',
    },
    {
      q: 'How does my rank work?',
      a: `${POINTS_PER_CHOICE} points for each lesson question right first time, up to ${POINTS_PER_WRITTEN} for each written answer. Points move you from ${RANKS[0].name} to ${RANKS[RANKS.length - 1].name}.`,
    },
  ]

  return (
    <section id="faq" className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full scroll-mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-16">
        <h2 className="text-display-md text-on-surface">Questions, answered.</h2>
        <div className="flex flex-col">
          {faqs.map(faq => (
            <details key={faq.q} className="group border-t border-on-surface/10 last:border-b">
              <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <span className="text-headline-md text-on-surface">{faq.q}</span>
                <Plus size={20} className="text-on-surface shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="pb-6 -mt-1 max-w-xl text-body-lg text-on-surface-variant">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCta() {
  return (
    <section className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-[2rem] bg-sunset px-8 py-20 sm:px-14 sm:py-28 flex flex-col items-center text-center gap-8">
        {/* White on the orange end of the gradient falls short of contrast; a
            light shade underneath brings it back without losing the colour. */}
        <div aria-hidden className="absolute inset-0 bg-black/15" />
        <h2 className="relative text-display-md sm:text-display-lg text-white max-w-2xl">
          Find out what you really know about money.
        </h2>
        <Link
          href="/learning"
          className="relative inline-flex items-center gap-2 rounded-full bg-white text-[#17171c] px-7 py-3.5 text-label-lg cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Get started <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function Footer({ tracks }: { tracks: { id: string; title: string }[] }) {
  const columns = [
    {
      title: 'Learn',
      links: tracks.map(t => ({ label: t.title, href: `/learning/${t.id}` })),
    },
    {
      title: 'Help',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Open the app', href: '/dashboard' },
        { label: 'Log in', href: '/login' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Disclosures', href: LEGAL_ROOT },
        { label: 'Terms of use', href: `${LEGAL_ROOT}/terms` },
        { label: 'Privacy', href: `${LEGAL_ROOT}/privacy` },
      ],
    },
  ]

  return (
    <footer className="border-t border-on-surface/10">
      <div className="px-6 pt-16 pb-10 max-w-6xl mx-auto w-full flex flex-col gap-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 flex flex-col gap-4">
            <p className="text-headline-lg text-on-surface">AI Fix My Money</p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AI Fix My Money on GitHub"
              className="inline-flex items-center gap-2 text-body-md text-on-surface-variant w-fit cursor-pointer transition-colors duration-200 hover:text-on-surface"
            >
              <Github size={16} aria-hidden /> Open source on GitHub
            </a>
          </div>

          {columns.map(column => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <p className="text-body-md text-on-surface-variant/70">{column.title}</p>
              <ul className="flex flex-col gap-2">
                {column.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-lg text-on-surface cursor-pointer transition-colors duration-200 hover:text-on-surface-variant"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-on-surface/10">
          <p className="text-label-md text-on-surface-variant">{DISCLAIMER_SHORT}</p>
          <p className="text-label-md text-on-surface-variant">© {new Date().getFullYear()} AI Fix My Money</p>
        </div>
      </div>
    </footer>
  )
}
