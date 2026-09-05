import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getTrack } from '@/lib/learning/tracks'
import { poolHealth, readQueue, TARGET_POOL_SIZE } from '@/lib/learning/video-pool/pool'
import { ReviewQueue } from '@/components/admin/review-queue'

export default async function TrackReviewPage({
  params,
}: {
  params: Promise<{ track: string }>
}) {
  const { track: trackParam } = await params
  const track = getTrack(trackParam)
  if (!track) notFound()

  const queue = await readQueue(track.id)
  const health = poolHealth(track.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Link
          href="/admin/review"
          className="inline-flex items-center gap-1.5 text-label-lg text-secondary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All tracks
        </Link>
        <span className="text-label-md tabular-nums text-on-surface-variant">
          {track.title} · {health.live} of {TARGET_POOL_SIZE} approved
        </span>
      </div>

      <ReviewQueue trackId={track.id} trackTitle={track.title} initialQueue={queue} />
    </div>
  )
}
