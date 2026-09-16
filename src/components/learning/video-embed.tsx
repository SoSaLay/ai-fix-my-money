'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, VideoOff } from 'lucide-react'

interface VideoEmbedProps {
  embedUrl: string
  shareUrl: string
  creatorHandle: string
  /** ISO. Shown so the learner can weigh how current the claim is. */
  postedAt?: string
  /**
   * Offered when the learner says the video will not play. A dead embed is a
   * question they should be able to walk away from without penalty.
   */
  onReportUnavailable?: () => void
  reportLabel?: string
}

/**
 * TikTok's own embed, never a direct media URL. Self-hosting the file would
 * break TikTok's terms and strip the creator's attribution, and the embed plays
 * inside our page regardless.
 *
 * A cross-origin iframe will not tell us that the video behind it was deleted —
 * `onError` does not fire, and the failure renders inside a document we cannot
 * read. Detection is therefore two other things: the health-check script, which
 * asks TikTok's oEmbed endpoint server-side, and the report button here, which
 * lets a learner flag what the script has not caught yet.
 *
 * The frame is not mounted until it comes near the viewport. A final paper holds
 * eight of these, and every one that mounts pulls down a player — several
 * megabytes before the learner has answered anything. `loading="lazy"` is meant
 * to cover this and mostly does, but Safari only honours it from 16.4 and the
 * heuristics are the browser's to change. Not rendering the element at all is
 * the version that does not depend on any of that.
 *
 * Once mounted it stays mounted: scrolling back to a question the learner has
 * already watched must not restart its download.
 */
export function VideoEmbed({
  embedUrl,
  shareUrl,
  creatorHandle,
  postedAt,
  onReportUnavailable,
  reportLabel = 'This video will not play',
}: VideoEmbedProps) {
  const [loaded, setLoaded] = useState(false)
  const [near, setNear] = useState(false)
  const frame = useRef<HTMLDivElement>(null)

  // One screen of margin, so the frame has started loading by the time it is
  // scrolled to rather than beginning then.
  useEffect(() => {
    const node = frame.current
    if (!node) return
    // No observer (older Safari, a test environment) means mount immediately —
    // the old behaviour, which is the safe direction to fail in.
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const posted = postedAt
    ? new Date(postedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full max-w-[325px] overflow-hidden rounded-2xl bg-surface-container-low">
        {/* 9:16, the shape short-form video is actually shot in. */}
        {/* The box holds its shape whether or not the frame is in it, so
            nothing moves when the video arrives. */}
        <div ref={frame} className="relative aspect-[9/16]">
          {(!loaded || !near) && (
            <div className="absolute inset-0 animate-pulse bg-surface-container" />
          )}
          {near && (
            <iframe
              src={embedUrl}
              title={`Video by ${creatorHandle}`}
              onLoad={() => setLoaded(true)}
              allow="encrypted-media; picture-in-picture; fullscreen"
              // The embed is untrusted third-party content: no same-origin access,
              // no top-level navigation, no downloads.
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          )}
        </div>
      </div>

      <div className="flex max-w-[325px] flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 text-label-lg text-on-surface hover:underline"
        >
          {creatorHandle}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {posted && (
          <span className="text-label-md text-on-surface-variant">Posted {posted}</span>
        )}
        {onReportUnavailable && (
          <button
            type="button"
            onClick={onReportUnavailable}
            className="ml-auto inline-flex items-center gap-1 text-label-md text-on-surface-variant hover:text-on-surface"
          >
            <VideoOff className="h-3 w-3" aria-hidden />
            {reportLabel}
          </button>
        )}
      </div>
    </div>
  )
}
