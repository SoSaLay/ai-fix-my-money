import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { VideoReel, type ReelVideo } from '@/components/marketing/video-reel'
import { TrackTabs, type TrackSummary } from '@/components/marketing/track-tabs'
import {
  CTA_CLASS, CTA_SMALL_CLASS, Faq, FinalCta, Footer, HowItWorks, StatsStrip, Why, type LandingStats,
} from '@/components/marketing/landing-sections'
import { PASS_THRESHOLD, TRACKS } from '@/lib/learning/tracks'
import { liveVideos } from '@/lib/learning/video-pool/pool'

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
}))

const STATS: LandingStats = {
  tracks: LIVE_TRACKS.length,
  lessons: LIVE_TRACKS.reduce((sum, t) => sum + t.lessons.length, 0),
  practiceQuestions: LIVE_TRACKS.reduce((sum, t) => sum + t.lessons.reduce((n, l) => n + l.questions.length, 0), 0),
  reviewedVideos: LIVE_TRACKS.reduce((sum, t) => sum + liveVideos(t.id).length, 0),
}

/**
 * One track, start to finish. This one is a stated figure rather than a counted
 * one, which makes it the exception on this page — everything above is derived
 * so it cannot drift, and this is not.
 *
 * `trackMinutes` computes 41 on average today, because it costs a video question
 * at three minutes: watch a clip, think, then speak or type a few sentences.
 * That is the right allowance for someone meeting the video cold. Running the
 * whole curriculum end to end took closer to thirty a track, so thirty is what
 * the page claims — the brisker of the two honest readings, not a number the
 * model produces.
 *
 * Worth knowing what it papers over. Tracks actually range from about 35 to 50
 * minutes, Investing being the long one, so a single figure flatters the short
 * tracks and undersells the long. And `trackMinutes` undercounts reading: it
 * bills each lesson at `readSeconds`, which is a 5- or 10-second pause before
 * the questions unlock, not a reading estimate — the lessons run to 2,799
 * words, nearer 13 minutes of reading across the four tracks.
 *
 * Revisit this if the curriculum grows or the papers change size. It will not
 * correct itself.
 */
const MINUTES_PER_TRACK = 30

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <Link href="/" className="text-headline-lg text-on-surface">AI Fix My Money</Link>
        <Link href="/learning" className={CTA_SMALL_CLASS}>Get started</Link>
      </nav>

      {/* ── Hero ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 pt-12 sm:pt-16 pb-24 sm:pb-32 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left gap-8">
          <h1 className="text-display-xl text-on-surface">
            You and your money,{' '}
            <span style={{ background: 'linear-gradient(135deg, #4c49c9, #ff9817)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              finally intelligent.
            </span>
          </h1>

          <p className="text-title-lg text-on-surface-variant max-w-lg">
            Actionable learning platform to manage and grow your money. Then test your knowledge
            with finance content, see what you really know?
          </p>

          <Link href="/learning" className={CTA_CLASS}>
            Get started <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <VideoReel videos={REJECTED_VIDEOS} />
      </section>

      <StatsStrip stats={STATS} />

      <section id="tracks" className="px-6 pb-24 sm:pb-32 max-w-6xl mx-auto w-full scroll-mt-8">
        <TrackTabs tracks={TRACK_SUMMARIES} />
      </section>

      <HowItWorks minutesPerTrack={MINUTES_PER_TRACK} />
      <Why />
      <Faq passPercent={Math.round(PASS_THRESHOLD * 100)} />
      <FinalCta />
      <Footer tracks={TRACK_SUMMARIES} />

    </main>
  )
}
