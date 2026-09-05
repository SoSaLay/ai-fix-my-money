'use client'

import { useState } from 'react'
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

  const posted = postedAt
    ? new Date(postedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full max-w-[325px] overflow-hidden rounded-xl bg-surface-container-low">
        {/* 9:16, the shape short-form video is actually shot in. */}
        <div className="relative aspect-[9/16]">
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-surface-container" />
          )}
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
        </div>
      </div>

      <div className="flex max-w-[325px] flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline"
        >
          {creatorHandle}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {posted && (
          <span className="text-label-sm text-on-surface-variant">Posted {posted}</span>
        )}
        {onReportUnavailable && (
          <button
            type="button"
            onClick={onReportUnavailable}
            className="ml-auto inline-flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-on-surface"
          >
            <VideoOff className="h-3 w-3" aria-hidden />
            {reportLabel}
          </button>
        )}
      </div>
    </div>
  )
}
