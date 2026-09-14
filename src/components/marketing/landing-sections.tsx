import Link from 'next/link'
import {
  ArrowRight, BookOpen, Check, ChevronDown, Clapperboard, Clock, CreditCard, Eye, Github,
  GraduationCap, KeyRound, ListChecks, Minus, PenLine, PieChart, PiggyBank, RotateCcw,
  Sparkles, TrendingUp, Unlock,
} from 'lucide-react'

import { RANKS, POINTS_PER_CHOICE, POINTS_PER_WRITTEN, rankGradient } from '@/lib/learning/rank'
import { DISCLAIMER_SHORT } from '@/lib/learning/disclaimer'
import { LEGAL_ROOT } from '@/lib/legal/documents'

// ============================================================================
// Everything on the landing page below the hero.
//
// Every figure here is counted from the curriculum and the video pool at build
// time, and every claim describes something the product actually does. There
// are no testimonials, logos, ratings or paid plans because there are none to
// show yet — a landing page that invents proof loses the trust it is for.
// ============================================================================

const GITHUB_URL = 'https://github.com/SoSaLay/ai-fix-my-money'

const primaryCta =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-white px-6 py-3 text-label-lg font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary'

function SectionHeading({
  eyebrow, title, body, center = false,
}: {
  eyebrow: string
  title: React.ReactNode
  body?: React.ReactNode
  center?: boolean
}) {
  return (
    <div className={`flex flex-col gap-3 mb-12 ${center ? 'items-center text-center mx-auto' : ''} max-w-2xl`}>
      <p className="text-label-sm text-secondary uppercase tracking-widest">{eyebrow}</p>
      <h2 className="text-display-md text-on-surface">{title}</h2>
      {body && <p className="text-body-lg text-on-surface-variant">{body}</p>}
    </div>
  )
}

// ─── Proof in numbers ────────────────────────────────────────────────────────

export interface LandingStats {
  tracks: number
  lessons: number
  practiceQuestions: number
  reviewedVideos: number
  minutes: number
}

export function StatsStrip({ stats }: { stats: LandingStats }) {
  const items = [
    { value: stats.tracks, label: 'learning tracks, from accounts to investing' },
    { value: stats.lessons, label: 'short lessons, about ' + stats.minutes + ' minutes of reading in all' },
    { value: stats.practiceQuestions, label: 'practice questions, each with the reason explained' },
    { value: stats.reviewedVideos, label: 'real finance videos, every one watched by a person' },
    { value: '$0', label: 'to start. No card, no bank login' },
  ]

  return (
    <section aria-label="At a glance" className="px-6 pb-28 max-w-5xl mx-auto w-full">
      <dl className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-5 flex flex-col gap-1.5">
            <dt className="sr-only">{item.label}</dt>
            <dd className="text-display-sm text-on-surface tabular-nums">{item.value}</dd>
            <dd className="text-label-lg text-on-surface-variant leading-snug">{item.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────

const STEPS = [
  { icon: BookOpen, title: 'Read', body: 'A short lesson, with a timer so you actually read it.' },
  { icon: ListChecks, title: 'Answer', body: 'Multiple choice, with the reason shown the moment you pick.' },
  { icon: PenLine, title: 'Do it', body: 'Open the real tool and work through it with your own numbers.' },
  { icon: Clapperboard, title: 'Prove it', body: 'Watch real finance videos and explain them in your own words.' },
  { icon: Unlock, title: 'Unlock', body: 'The tool is yours for good, and anything you missed comes back in review.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 pb-28 max-w-5xl mx-auto w-full scroll-mt-8">
      <SectionHeading
        eyebrow="How it works"
        title="From reading about money to deciding with it."
        body="Every track follows the same five steps. Getting a question wrong never holds you back — it just shows you what to look at again."
      />

      <ol className="relative grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* The path itself, behind the numbered steps. */}
        <div
          aria-hidden
          className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 rounded-full bg-sunset opacity-30"
        />
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-3 md:text-center">
            <span className="relative z-10 w-12 h-12 rounded-2xl bg-surface-container-lowest shadow-float flex items-center justify-center text-secondary shrink-0">
              <step.icon size={20} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-label-sm text-on-surface-variant tabular-nums">Step {i + 1}</p>
              <p className="text-headline-sm text-on-surface">{step.title}</p>
              <p className="text-body-md text-on-surface-variant">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─── What's inside ───────────────────────────────────────────────────────────

export interface SampleQuestion {
  track: string
  question: string
  options: string[]
  answer: number
  why: string
}

function Tile({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-surface-container-lowest rounded-3xl shadow-card p-7 flex flex-col gap-5 ${className}`}>
      {children}
    </div>
  )
}

function TileHeading({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="w-10 h-10 rounded-xl bg-secondary-fixed/30 text-secondary flex items-center justify-center">
        <Icon size={18} aria-hidden />
      </span>
      <p className="text-headline-md text-on-surface">{title}</p>
      <p className="text-body-md text-on-surface-variant">{body}</p>
    </div>
  )
}

export function Features({ sample, minutes }: { sample: SampleQuestion | null; minutes: number }) {
  return (
    <section id="features" className="bg-surface-container-low py-28 scroll-mt-8">
      <div className="px-6 max-w-5xl mx-auto w-full">
        <SectionHeading
          eyebrow="What’s inside"
          title="Built to check you understood, not that you scrolled past."
        />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Written answers, marked — the thing nothing else here does. */}
          <Tile className="md:col-span-4">
            <TileHeading
              icon={Sparkles}
              title="Explain real videos. Get marked on what you understood."
              body="Final tests put real short-form finance content in front of you and ask you to explain it or judge whether it holds up. AI marks your answer against a reference a person wrote after watching, and tells you exactly what you missed."
            />
            <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3" aria-label="Example of a marked answer">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Example</p>
              <p className="text-body-md text-on-surface font-medium">
                The creator splits a paycheck into percentages. Which paycheck are they working from, and why does that change the numbers?
              </p>
              <p className="text-body-md text-on-surface-variant bg-surface-container-lowest rounded-xl px-4 py-3">
                Your take-home pay, after taxes. If you used the bigger number before tax, every percentage would be more than you actually have.
              </p>
              <div className="rounded-xl bg-secondary-fixed/40 px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">Partly there</span>
                  <span className="text-label-lg text-on-surface font-semibold tabular-nums">1 / 2</span>
                </div>
                <p className="text-body-md text-on-surface">
                  Right that it’s take-home pay, and why that matters. Not covered: the video says the split is a starting point, not a rule.
                </p>
              </div>
            </div>
          </Tile>

          <Tile className="md:col-span-2">
            <TileHeading
              icon={Eye}
              title="Judge, don’t just watch"
              body="Some questions ask you to explain a video. Others ask whether what it claims actually holds up — the skill a feed never tests."
            />
          </Tile>

          {sample && (
            <Tile className="md:col-span-3">
              <TileHeading
                icon={ListChecks}
                title="Questions that teach"
                body={`Every lesson ends in questions, and every answer comes with the reason. This one is from ${sample.track}.`}
              />
              <div className="flex flex-col gap-2">
                <p className="text-body-md text-on-surface font-medium">{sample.question}</p>
                {sample.options.map((option, i) => (
                  <div
                    key={option}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-body-md ${
                      i === sample.answer
                        ? 'bg-tertiary-fixed/30 text-on-surface'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {option}
                    {i === sample.answer && <Check size={15} className="shrink-0" style={{ color: '#1a6b3a' }} aria-label="Correct answer" />}
                  </div>
                ))}
                <p className="text-body-md text-on-surface-variant pt-1">{sample.why}</p>
              </div>
            </Tile>
          )}

          <Tile className="md:col-span-3">
            <TileHeading
              icon={Unlock}
              title="Tools that open as you learn"
              body="Finish a track and its tool unlocks for good, already holding the figures you entered along the way."
            />
            <ul className="grid grid-cols-2 gap-2">
              {[
                { icon: CreditCard, label: 'Accounts' },
                { icon: PieChart, label: 'Income vs. Spending' },
                { icon: PiggyBank, label: 'Savings' },
                { icon: TrendingUp, label: 'Investing' },
              ].map(tool => (
                <li key={tool.label} className="flex items-center gap-2.5 bg-surface-container-low rounded-xl px-3.5 py-3 text-label-lg text-on-surface">
                  <tool.icon size={16} className="text-secondary shrink-0" aria-hidden /> {tool.label}
                </li>
              ))}
            </ul>
          </Tile>

          <Tile className="md:col-span-3">
            <TileHeading
              icon={RotateCcw}
              title="Review that sticks"
              body="What you answer comes back on a schedule, and what you miss comes back sooner. Practise any time from the review screen."
            />
            <ol className="flex items-center gap-2 flex-wrap" aria-label="Review schedule">
              {['1 day', '3 days', '1 week'].map((gap, i) => (
                <li key={gap} className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-container-low px-3.5 py-1.5 text-label-lg text-on-surface">{gap}</span>
                  {i < 2 && <ArrowRight size={14} className="text-on-surface-variant" aria-hidden />}
                </li>
              ))}
            </ol>
          </Tile>

          <Tile className="md:col-span-3">
            <TileHeading
              icon={Clock}
              title="At your own pace"
              body={`Self-paced and in your browser. About ${minutes} minutes of reading across every track — the rest is answering, doing and reviewing.`}
            />
          </Tile>
        </div>
      </div>
    </section>
  )
}

// ─── Rank ────────────────────────────────────────────────────────────────────

export function RankSection() {
  return (
    <section id="rank" className="px-6 py-28 max-w-5xl mx-auto w-full scroll-mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Your rank"
            title="Know exactly where you and your money stand."
            body="Your rank is earned from how you answer — not from how long you spend here. It starts where everyone starts, and it only moves when you show you understand."
          />
          <ul className="flex flex-col gap-3 -mt-6">
            <li className="flex items-start gap-3">
              <ListChecks size={18} className="text-secondary mt-0.5 shrink-0" aria-hidden />
              <p className="text-body-lg text-on-surface-variant">
                <span className="text-on-surface font-semibold">{POINTS_PER_CHOICE} points</span> for each lesson question right on your first try.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <PenLine size={18} className="text-secondary mt-0.5 shrink-0" aria-hidden />
              <p className="text-body-lg text-on-surface-variant">
                <span className="text-on-surface font-semibold">Up to {POINTS_PER_WRITTEN} points</span> for each written answer on a final test.
                Explaining something shows more than picking it.
              </p>
            </li>
          </ul>
        </div>

        <ol className="flex flex-col gap-2" aria-label="Ranks, highest first">
          {[...RANKS].reverse().map(rank => (
            <li key={rank.level} className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-4 flex items-center gap-4">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-label-lg font-semibold text-on-surface tabular-nums"
                style={{ background: rankGradient(rank, 0.28), border: `1px solid ${rank.colors[0]}59` }}
              >
                {rank.level}
              </span>
              <div className="min-w-0">
                <p className="text-headline-sm text-on-surface">{rank.name}</p>
                <p className="text-body-md text-on-surface-variant">“{rank.line}”</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── Trust ───────────────────────────────────────────────────────────────────

const TRUST = [
  {
    icon: Eye,
    title: 'Every video watched by a person',
    body: 'No AI picks the videos or writes the questions. A reviewer watched each one and wrote the question and answer key by hand.',
  },
  {
    icon: GraduationCap,
    title: 'Education, not advice',
    body: 'It explains how money works so you can make your own decisions. It never tells you what to buy, sell or hold.',
  },
  {
    icon: KeyRound,
    title: 'No bank logins',
    body: 'Nothing connects to your bank. You type in your own figures, and only the ones you choose to.',
  },
  {
    icon: Github,
    title: 'Open source',
    body: 'Every line of code is public, so how it works is never a mystery.',
    href: GITHUB_URL,
    linkLabel: 'View on GitHub',
  },
]

export function Trust() {
  return (
    <section id="trust" className="bg-surface-container-low py-28 scroll-mt-8">
      <div className="px-6 max-w-5xl mx-auto w-full">
        <SectionHeading
          eyebrow="Why trust it"
          title="Honest about what it is, and what it isn’t."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST.map(item => (
            <div key={item.title} className="bg-surface-container-lowest rounded-3xl shadow-card p-6 flex flex-col gap-3">
              <span className="w-10 h-10 rounded-xl bg-secondary-fixed/30 text-secondary flex items-center justify-center">
                <item.icon size={18} aria-hidden />
              </span>
              <p className="text-headline-sm text-on-surface">{item.title}</p>
              <p className="text-body-md text-on-surface-variant">{item.body}</p>
              {item.href && (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-label-lg font-medium text-secondary cursor-pointer transition-opacity duration-200 hover:opacity-75"
                >
                  {item.linkLabel} <ArrowRight size={14} aria-hidden />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Comparison ──────────────────────────────────────────────────────────────

type Cell = true | false | 'Varies'

const COMPARISON: { row: string; us: Cell; feed: Cell; course: Cell }[] = [
  { row: 'Short, real-world finance content', us: true, feed: true, course: 'Varies' },
  { row: 'Checks that you actually understood', us: true, feed: false, course: true },
  { row: 'Teaches you to judge what creators claim', us: true, feed: false, course: 'Varies' },
  { row: 'Tells you exactly what you missed', us: true, feed: false, course: 'Varies' },
  { row: 'Put it to use with your own numbers', us: true, feed: false, course: 'Varies' },
  { row: 'Free', us: true, feed: true, course: 'Varies' },
]

function CellMark({ value }: { value: Cell }) {
  if (value === 'Varies') return <span className="text-label-lg text-on-surface-variant">Varies</span>
  return value ? (
    <>
      <Check size={18} className="mx-auto" style={{ color: '#1a6b3a' }} aria-hidden />
      <span className="sr-only">Yes</span>
    </>
  ) : (
    <>
      <Minus size={18} className="mx-auto text-on-surface-variant/60" aria-hidden />
      <span className="sr-only">No</span>
    </>
  )
}

export function Comparison() {
  return (
    <section id="compare" className="px-6 py-28 max-w-5xl mx-auto w-full scroll-mt-8">
      <SectionHeading
        eyebrow="Compare"
        title="Not another feed. Not another course."
        body="Finance videos are everywhere, and courses are long. This sits between them: the content you already watch, and a way to find out what you took from it."
      />
      <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-5 text-label-md text-on-surface-variant uppercase tracking-wider font-medium">
                <span className="sr-only">Feature</span>
              </th>
              <th scope="col" className="px-4 py-5 text-center">
                <span className="inline-block rounded-full bg-secondary text-white px-3.5 py-1.5 text-label-lg font-semibold">AI Fix My Money</span>
              </th>
              <th scope="col" className="px-4 py-5 text-center text-label-lg text-on-surface-variant font-medium">Finance videos on social media</th>
              <th scope="col" className="px-4 py-5 text-center text-label-lg text-on-surface-variant font-medium">A typical online course</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((r, i) => (
              <tr key={r.row} className={i % 2 === 0 ? 'bg-surface-container-low/60' : ''}>
                <th scope="row" className="px-6 py-4 text-body-md text-on-surface font-medium">{r.row}</th>
                <td className="px-4 py-4 text-center bg-secondary-fixed/15"><CellMark value={r.us} /></td>
                <td className="px-4 py-4 text-center"><CellMark value={r.feed} /></td>
                <td className="px-4 py-4 text-center"><CellMark value={r.course} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Offer ───────────────────────────────────────────────────────────────────

export function Offer({ tracks }: { tracks: string[] }) {
  const included = [
    `All ${tracks.length} tracks: ${tracks.join(', ')}`,
    'Every final test, with written feedback on each answer',
    'Retakes whenever you want, with a fresh set of videos',
    'Your rank, and spaced review of everything you’ve covered',
    'The Accounts, Spending, Savings and Investing tools',
  ]

  return (
    <section id="pricing" className="bg-surface-container-low py-28 scroll-mt-8">
      <div className="px-6 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <SectionHeading
          eyebrow="Pricing"
          title="Free. All of it."
          body="There’s no paid tier and nothing held back. Create an account so your progress is saved, and start with the first lesson."
        />

        <div className="bg-surface-container-lowest rounded-3xl shadow-float p-8 flex flex-col gap-6">
          <div className="flex items-end gap-2">
            <span className="text-display-lg text-on-surface">$0</span>
            <span className="text-body-lg text-on-surface-variant pb-2">No card needed</span>
          </div>
          <ul className="flex flex-col gap-3">
            {included.map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-tertiary-fixed/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} style={{ color: '#1a6b3a' }} aria-hidden />
                </span>
                <span className="text-body-lg text-on-surface">{item}</span>
              </li>
            ))}
          </ul>
          <Link href="/learning" className={`${primaryCta} w-full py-3.5`}>
            Start learning free <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function Faq({ passPercent }: { passPercent: number }) {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: 'Is it really free?',
      a: 'Yes. Every track, final test and tool is free, and there’s no card to enter. You create an account so your progress is saved.',
    },
    {
      q: 'Is this financial advice?',
      a: 'No. It’s education: it explains how accounts, spending, saving and investing work so you can make your own decisions. Nothing here is a recommendation to buy, sell or hold anything.',
    },
    {
      q: 'Do I need to connect my bank?',
      a: 'No. Nothing connects to your bank. When a lesson asks you to use a tool, you type in your own figures.',
    },
    {
      q: 'How is the final test marked?',
      a: `You watch real finance videos and answer each question in your own words. AI compares your answer to a reference answer and checklist that a person wrote after watching, then gives full, partial or no marks and tells you what you left out. You need ${passPercent}% to pass.`,
    },
    {
      q: 'What if I don’t pass?',
      a: 'Take it again whenever you like. Each retake draws a different set of videos, there’s no limit on attempts, and anything you didn’t get full marks on goes into your review.',
    },
    {
      q: 'Can I skip what I already know?',
      a: 'Tracks open in order, because each builds on the last. If you already know a topic, you can test out by taking its final test instead of the lessons.',
    },
    {
      q: 'Where do the videos come from?',
      a: 'They’re public TikTok videos from finance creators, played through TikTok’s own player. Including a video isn’t an endorsement — part of the test is judging whether what it says holds up.',
    },
    {
      q: 'How does my rank work?',
      a: `You earn ${POINTS_PER_CHOICE} points for each lesson question right on your first try, and up to ${POINTS_PER_WRITTEN} for each written answer on a final test. Points move you up five ranks, from ${RANKS[0].name} to ${RANKS[RANKS.length - 1].name}.`,
    },
  ]

  return (
    <section id="faq" className="px-6 py-28 max-w-3xl mx-auto w-full scroll-mt-8">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." center />
      <div className="flex flex-col gap-3">
        {faqs.map(faq => (
          <details key={faq.q} className="group bg-surface-container-lowest rounded-2xl shadow-card">
            <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              <span className="text-headline-sm text-on-surface">{faq.q}</span>
              <ChevronDown size={18} className="text-on-surface-variant shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden />
            </summary>
            <p className="px-6 pb-5 -mt-1 text-body-lg text-on-surface-variant">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

export function FinalCta() {
  return (
    <section className="px-6 pb-28 max-w-5xl mx-auto w-full">
      <div className="relative overflow-hidden rounded-3xl bg-sunset px-8 py-16 sm:px-14 flex flex-col items-center text-center gap-6">
        {/* White on the orange end of the gradient falls short of contrast; a
            light shade underneath brings it back without losing the colour. */}
        <div aria-hidden className="absolute inset-0 bg-black/15" />
        <h2 className="relative text-display-md text-white max-w-xl">Find out what you really know about money.</h2>
        <p className="relative text-body-lg text-white/90 max-w-lg">
          Start with the first lesson. It takes a few minutes, and it’s free.
        </p>
        <div className="relative flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-secondary px-7 py-3.5 text-label-lg font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            Get started <ArrowRight size={15} aria-hidden />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-xl px-5 py-3.5 text-label-lg font-medium text-white cursor-pointer transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            See how it works
          </a>
        </div>
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
      title: 'Product',
      links: [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Your rank', href: '#rank' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Open the app', href: '/dashboard' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Log in', href: '/login' },
        { label: 'Create an account', href: '/signup' },
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
    <footer className="bg-surface-container-low">
      <div className="px-6 pt-16 pb-10 max-w-5xl mx-auto w-full flex flex-col gap-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2 flex flex-col gap-3">
            <p className="text-headline-sm text-on-surface font-bold">AI Fix My Money</p>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              Learn how money works, then find out what you really know.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AI Fix My Money on GitHub"
              className="w-10 h-10 rounded-xl bg-surface-container-lowest shadow-card flex items-center justify-center text-on-surface cursor-pointer transition-opacity duration-200 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <Github size={18} aria-hidden />
            </a>
          </div>

          {columns.map(column => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <p className="text-label-md text-on-surface uppercase tracking-wider font-semibold">{column.title}</p>
              <ul className="flex flex-col gap-2">
                {column.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-body-md text-on-surface-variant cursor-pointer transition-colors duration-200 hover:text-on-surface"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-outline-variant/20">
          <p className="text-label-md text-on-surface-variant">{DISCLAIMER_SHORT}</p>
          <p className="text-label-md text-on-surface-variant">© {new Date().getFullYear()} AI Fix My Money</p>
        </div>
      </div>
    </footer>
  )
}
