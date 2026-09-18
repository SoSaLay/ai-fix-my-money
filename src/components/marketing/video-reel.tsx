'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const TIKTOK_ORIGIN = 'https://www.tiktok.com'

/** How much of each video the feed shows before moving on. A preview, not the whole thing. */
const PREVIEW_SECONDS = 9

/** Allowance on top of the preview for the player to load and start. */
const LOAD_ALLOWANCE_MS = 2_000

export interface ReelVideo {
  id: string
  embedUrl: string
  creatorHandle: string
  caption: string
  /** Whole seconds. A video shorter than the preview moves on when it ends. */
  durationSeconds?: number
}

/**
 * A feed of short videos, scrolled one at a time like the real thing. Uses
 * TikTok's player rather than its post embed, so the frame holds only the
 * video — no caption card below it to crop.
 *
 * The feed runs itself. Only the video on screen holds a player, loaded with
 * autoplay, which the player starts muted. Scrolling away unmounts it, so two
 * videos can never be heard at once. After a short preview the feed moves on,
 * back to the top after the last.
 *
 * The preview is timed from when the player mounts. The player does post
 * progress and an ended event, and those tighten the timing when they arrive,
 * but they don't arrive reliably — so the feed never waits on them.
 *
 * Wheel events over a cross-origin iframe don't reliably reach this page, so
 * the arrows and the keyboard move the feed as well as the scroll itself.
 */
export function VideoReel({ videos }: { videos: ReelVideo[] }) {
  const scroller = useRef<HTMLDivElement>(null)
  const player = useRef<HTMLIFrameElement>(null)
  const [active, setActive] = useState(0)

  const activeRef = useRef(0)
  const advanced = useRef(false)
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((index: number) => {
    const root = scroller.current
    if (!root) return
    const clamped = Math.max(0, Math.min(videos.length - 1, index))
    root.scrollTo({ top: clamped * root.clientHeight, behavior: 'smooth' })
  }, [videos.length])

  const advance = useCallback(() => {
    if (advanced.current) return
    advanced.current = true
    goTo((activeRef.current + 1) % videos.length)
  }, [goTo, videos.length])

  const moveOnIn = useCallback((ms: number) => {
    if (dwellTimer.current) clearTimeout(dwellTimer.current)
    // A background tab doesn't run the smooth scroll, so advancing there would
    // mark the move done without it ever happening, and the feed would stop.
    // Hold until the tab is back instead.
    const tick = () => {
      if (document.hidden) { dwellTimer.current = setTimeout(tick, 1_000); return }
      advance()
    }
    dwellTimer.current = setTimeout(tick, ms)
  }, [advance])

  useEffect(() => {
    activeRef.current = active
    advanced.current = false
    const seconds = Math.min(videos[active]?.durationSeconds || PREVIEW_SECONDS, PREVIEW_SECONDS)
    moveOnIn(seconds * 1000 + LOAD_ALLOWANCE_MS)
    return () => { if (dwellTimer.current) clearTimeout(dwellTimer.current) }
  }, [active, videos, moveOnIn])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== TIKTOK_ORIGIN) return
      if (event.source !== player.current?.contentWindow) return

      let data = event.data
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { return }
      }
      if (!data?.['x-tiktok-player']) return

      if (data.type === 'onPlayerReady') {
        // Muted is the player's autoplay default; asked for anyway so it
        // never depends on that.
        player.current?.contentWindow?.postMessage(
          { type: 'mute', 'x-tiktok-player': true },
          TIKTOK_ORIGIN,
        )
      }

      if (data.type === 'onCurrentTime') {
        // The player's own clock is better than the estimate: it knows how
        // long loading actually took.
        const { currentTime, duration } = data.value ?? {}
        const end = duration > 0 ? Math.min(duration, PREVIEW_SECONDS) : PREVIEW_SECONDS
        if (typeof currentTime === 'number') moveOnIn(Math.max(0, end - currentTime) * 1000 + 300)
      }

      // 0 is ended.
      if (data.type === 'onStateChange' && data.value === 0) advance()
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [advance, moveOnIn])

  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      { root, threshold: 0.6 },
    )
    for (const slide of Array.from(root.children)) observer.observe(slide)
    return () => observer.disconnect()
  }, [videos.length])

  return (
    // On a phone the controls sit under the video rather than beside it: a
    // column of arrows alongside pushed the video off-centre and squeezed it
    // narrower than its own 300px.
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
      <div
        className="rounded-2xl overflow-hidden bg-black"
        style={{ boxShadow: '0 20px 60px rgba(76,73,201,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}
      >
        <div
          ref={scroller}
          tabIndex={0}
          aria-label="Finance videos"
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); goTo(active + 1) }
            if (event.key === 'ArrowUp') { event.preventDefault(); goTo(active - 1) }
          }}
          className="relative w-[300px] sm:w-[340px] aspect-[9/16] overflow-y-auto snap-y snap-mandatory bg-black focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((video, i) => (
            <div
              key={video.id}
              data-index={i}
              className="relative h-full w-full snap-start snap-always"
            >
              {i === active ? (
                <iframe
                  ref={player}
                  // Permissions before `src`: React applies props in order, and
                  // a frame that starts loading before `allow` is set never
                  // gets autoplay.
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  // The player stalls on its loading logo without its own
                  // origin's storage. That origin is TikTok's, not ours, so
                  // this grants it nothing on this page.
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={withAutoplay(video.embedUrl)}
                  title={`Video by ${video.creatorHandle}`}
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col justify-end gap-1 p-5 text-white">
                  <p className="text-label-lg font-semibold">{video.creatorHandle}</p>
                  <p className="text-body-sm text-white/70 line-clamp-3">{video.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-row sm:flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Previous video"
          className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-card flex items-center justify-center text-on-surface disabled:opacity-30 transition-opacity"
        >
          <ChevronUp size={18} />
        </button>
        <div className="flex flex-row sm:flex-col items-center gap-1.5">
          {videos.map((video, i) => (
            <button
              key={video.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Video ${i + 1}`}
              className={`rounded-full transition-all ${
                i === active
                  ? 'w-5 h-1.5 sm:w-1.5 sm:h-5 bg-secondary'
                  : 'w-1.5 h-1.5 bg-outline-variant'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === videos.length - 1}
          aria-label="Next video"
          className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-card flex items-center justify-center text-on-surface disabled:opacity-30 transition-opacity"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  )
}

/** Autoplay on, looping off — the feed, not the player, decides what comes next. */
function withAutoplay(url: string): string {
  const next = new URL(url)
  next.searchParams.set('autoplay', '1')
  next.searchParams.set('loop', '0')
  return next.toString()
}
