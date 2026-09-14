import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VideoReel, type ReelVideo } from '@/components/marketing/video-reel'
import { ArrowRight } from 'lucide-react'
import { PathFinder, type TrackSummary } from '@/components/marketing/path-finder'
import {
  Comparison, Faq, Features, FinalCta, Footer, HowItWorks, Offer, RankSection, StatsStrip, Trust,
  type LandingStats, type SampleQuestion,
} from '@/components/marketing/landing-sections'
import { PASS_THRESHOLD, TRACKS, readingMinutes } from '@/lib/learning/tracks'
import { liveVideos, quizMix } from '@/lib/learning/video-pool/pool'

// ─────────────────────────────────────────────────────────────────────────────
// REJECTED VIDEOS
// Placeholders from the review queue's rejects — to be swapped for a final pick.
// ─────────────────────────────────────────────────────────────────────────────

const REJECTED_VIDEOS: ReelVideo[] = [
  {
    id: 'spd-v-054',
    embedUrl: 'https://www.tiktok.com/player/v1/6864133021088451846?description=0&music_info=0&rel=0',
    creatorHandle: '@ok.debbah',
    durationSeconds: 59,
    caption: 'The best expense tracker 🤑',
  },
  {
    id: 'inv-v-059',
    embedUrl: 'https://www.tiktok.com/player/v1/7623808291436596494?description=0&music_info=0&rel=0',
    creatorHandle: '@daveramsey',
    durationSeconds: 42,
    caption: 'Day trading is just a dangerous shortcut dressed up like a strategy.',
  },
  {
    id: 'spd-v-040',
    embedUrl: 'https://www.tiktok.com/player/v1/7670588824619142414?description=0&music_info=0&rel=0',
    creatorHandle: '@financebronextdoor',
    durationSeconds: 46,
    caption: 'These percentages are based on your monthly net income (after taxes), not your gross paycheck.',
  },
  {
    id: 'inv-v-054',
    embedUrl: 'https://www.tiktok.com/player/v1/6964196434476322050?description=0&music_info=0&rel=0',
    creatorHandle: '@champchampgolf',
    durationSeconds: 16,
    caption: 'How much did you guys lose today? At least he only invested $400 😭😂',
  },
  {
    id: 'spd-v-055',
    embedUrl: 'https://www.tiktok.com/player/v1/7668042571058285838?description=0&music_info=0&rel=0',
    creatorHandle: '@sports.wrld34',
    durationSeconds: 21,
    caption: 'Where my money go 🫩🥀💔',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE DATA
// Counted from the curriculum and the approved video pool, so the page can't
// drift from what the product actually holds.
// ─────────────────────────────────────────────────────────────────────────────

const LIVE_TRACKS = TRACKS.filter(t => t.status === 'available' && t.lessons.length > 0)

const TRACK_SUMMARIES: TrackSummary[] = LIVE_TRACKS.map((track, i) => ({
  id: track.id,
  number: i + 1,
  title: track.title,
  outcome: track.outcome,
  lessons: track.lessons.map(l => l.title),
  minutes: readingMinutes(track),
  finalVideos: quizMix(track.id).videos,
}))

const STATS: LandingStats = {
  tracks: LIVE_TRACKS.length,
  lessons: LIVE_TRACKS.reduce((sum, t) => sum + t.lessons.length, 0),
  practiceQuestions: LIVE_TRACKS.reduce((sum, t) => sum + t.lessons.reduce((n, l) => n + l.questions.length, 0), 0),
  reviewedVideos: LIVE_TRACKS.reduce((sum, t) => sum + liveVideos(t.id).length, 0),
  minutes: LIVE_TRACKS.reduce((sum, t) => sum + readingMinutes(t), 0),
}

const SAMPLE_QUESTION: SampleQuestion | null = (() => {
  const track = LIVE_TRACKS[0]
  const question = track?.lessons[0]?.questions.find(q => !q.imageSrc)
  return track && question
    ? { track: track.title, question: question.question, options: question.options, answer: question.answer, why: question.why }
    : null
})()

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto w-full">
        <div>
          <p className="text-headline-sm text-on-surface font-bold">AI Fix My Money</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" className="px-5 py-2.5 text-label-lg">Open App</Button>
          </Link>
          <Link href="/learning">
            <Button variant="primary" className="px-5 py-2.5 text-label-lg">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 pt-16 pb-32 max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-8">
          <h1 className="text-display-lg text-on-surface">
            You and your money,{' '}
            <span style={{ background: 'linear-gradient(135deg, #4c49c9, #ff9817)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              finally intelligent.
            </span>
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-lg">
            Actionable learning platform to manage and grow your money. Then test your knowledge
            with finance content, see what you really know?
          </p>

          <div className="flex items-center gap-4">
            <Link href="/learning">
              <Button variant="primary" className="px-8 py-3.5 text-body-md flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" className="px-8 py-3.5 text-body-md">Open App</Button>
            </Link>
          </div>
        </div>

        <VideoReel videos={REJECTED_VIDEOS} />
      </section>

      <StatsStrip stats={STATS} />

      {/* ── Find your starting point ── */}
      <section id="tracks" className="px-6 pb-28 max-w-5xl mx-auto w-full scroll-mt-8">
        <div className="flex flex-col gap-3 mb-12 max-w-2xl">
          <p className="text-label-sm text-secondary uppercase tracking-widest">Find your starting point</p>
          <h2 className="text-display-md text-on-surface">Where are you with your money right now?</h2>
          <p className="text-body-lg text-on-surface-variant">
            Four tracks, each ending in a tool you unlock. Pick what sounds like you.
          </p>
        </div>
        <PathFinder tracks={TRACK_SUMMARIES} />
      </section>

      <HowItWorks />
      <Features sample={SAMPLE_QUESTION} minutes={STATS.minutes} />
      <RankSection />
      <Trust />
      <Comparison />
      <Offer tracks={TRACK_SUMMARIES.map(t => t.title)} />
      <Faq passPercent={Math.round(PASS_THRESHOLD * 100)} />
      <FinalCta />
      <Footer tracks={TRACK_SUMMARIES} />

    </main>
  )
}
