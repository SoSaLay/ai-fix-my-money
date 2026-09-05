// ============================================================================
// Re-check every approved embed and mark the dead ones.
//
//   npx tsx scripts/check-videos.ts [--track accounts] [--dry-run]
//
// A curated pool decays even when the content does not go stale: videos get
// deleted, go private, and creators quit. Sampling skips `unavailable`, so this
// script is what keeps a learner from ever drawing a dead embed.
//
// It uses TikTok's public oEmbed endpoint rather than TikHub — no key, no cost,
// and it answers the only question being asked. An iframe cannot answer it:
// the failure renders inside a cross-origin document we are not allowed to
// read, and `onError` never fires.
// ============================================================================

import { TRACK_ORDER, type TrackId } from '../src/lib/learning/tracks'
import { readApprovedFile, writeApprovedFile } from '../src/lib/learning/video-pool/pool-files'
import { REPLENISH_BELOW, TARGET_POOL_SIZE } from '../src/lib/learning/video-pool/constants'
import type { PooledVideo } from '../src/lib/learning/video-pool/types'

const OEMBED = 'https://www.tiktok.com/oembed'

/** TikTok's endpoint, not ours. Be a good guest. */
const MIN_MS_BETWEEN_CALLS = 250

type Liveness = 'live' | 'gone' | 'unknown'

async function checkOne(shareUrl: string): Promise<Liveness> {
  try {
    const url = new URL(OEMBED)
    url.searchParams.set('url', shareUrl)
    const response = await fetch(url, { headers: { Accept: 'application/json' } })

    if (response.ok) return 'live'
    // Deleted and private both come back as not-found here.
    if (response.status === 404 || response.status === 400 || response.status === 410) return 'gone'
    // Rate limiting or an outage is not evidence about the video.
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

interface Options {
  tracks: TrackId[]
  dryRun: boolean
}

function parseArgs(argv: string[]): Options {
  let track: string | undefined
  let dryRun = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') { dryRun = true; continue }
    if (arg === '--track') {
      track = argv[++i]
      if (!track) throw new Error('--track needs a value.')
      continue
    }
    if (arg === '--help') {
      console.log(
        'Re-check every approved embed and mark the dead ones.\n\n' +
        '  npx tsx scripts/check-videos.ts [--track <id>] [--dry-run]\n',
      )
      process.exit(0)
    }
    throw new Error(`Unknown argument ${arg}. Try --help.`)
  }

  if (track && !(TRACK_ORDER as string[]).includes(track)) {
    throw new Error(`Unknown track ${track}. One of: ${TRACK_ORDER.join(', ')}.`)
  }

  return { tracks: track ? [track as TrackId] : TRACK_ORDER, dryRun }
}

async function checkTrack(trackId: TrackId, dryRun: boolean) {
  const pool = await readApprovedFile(trackId)

  // `retired` is a human decision and `draft` never shipped, so neither is this
  // script's business. Previously-unavailable items are rechecked: a private
  // account going public again is a real thing, and the flag is mechanical.
  const toCheck = pool.filter(v => v.status === 'approved' || v.status === 'unavailable')

  if (toCheck.length === 0) {
    console.log(`${trackId}: nothing to check.`)
    return
  }

  const now = new Date().toISOString()
  const changes: string[] = []
  let unknown = 0

  const updated: PooledVideo[] = [...pool]

  for (const video of toCheck) {
    await new Promise(resolve => setTimeout(resolve, MIN_MS_BETWEEN_CALLS))
    const liveness = await checkOne(video.shareUrl)
    if (liveness === 'unknown') {
      unknown++
      continue
    }

    const status = liveness === 'live' ? 'approved' : 'unavailable'
    if (status !== video.status) {
      changes.push(
        `  ${video.id}  ${video.creatorHandle}  ${video.status} → ${status}`,
      )
    }

    const index = updated.findIndex(v => v.id === video.id)
    updated[index] = { ...video, status, lastCheckedAt: now }
  }

  const live = updated.filter(v => v.status === 'approved').length

  console.log(`\n${trackId}: ${live} live of ${TARGET_POOL_SIZE} target.`)
  if (changes.length > 0) console.log(changes.join('\n'))
  else console.log('  No status changes.')
  if (unknown > 0) {
    console.log(`  ${unknown} inconclusive (network or rate limit) — left as they were.`)
  }
  if (live < REPLENISH_BELOW) {
    console.log(
      `  ⚠ Below ${REPLENISH_BELOW} live. Run the ingest script for ${trackId}.`,
    )
  }

  if (dryRun) {
    console.log('  --dry-run: nothing written.')
    return
  }
  await writeApprovedFile(trackId, updated)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  for (const trackId of options.tracks) {
    await checkTrack(trackId, options.dryRun)
  }
  if (!options.dryRun) {
    console.log('\nCommit the diff to ship the status changes.')
  }
}

main().catch(error => {
  console.error(`\n${(error as Error).message}\n`)
  process.exit(1)
})
