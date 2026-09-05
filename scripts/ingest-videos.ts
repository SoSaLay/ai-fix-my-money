// ============================================================================
// Pull candidate videos into a track's review queue.
//
//   npx tsx scripts/ingest-videos.ts --track accounts
//
// Run by hand, never on a schedule. It writes only to
// `<track>.candidates.json`, and everything it writes is a draft: nothing here
// can approve anything, and nothing it produces reaches a learner until a human
// has watched the video and written the question by hand.
// ============================================================================

import {
  fetchVideoSearch,
  loadEnvLocal,
  PUBLISH_TIME,
  requireApiKey,
  SORT_TYPE,
} from './lib/tikhub'
import { engagementScore, extractRows, screenCaption, toCandidate } from './lib/normalize'
import { TRACK_ORDER, type TrackId } from '../src/lib/learning/tracks'
import { knownIds, readQueue, writeQueue } from '../src/lib/learning/video-pool/pool-files'
import { TARGET_POOL_SIZE } from '../src/lib/learning/video-pool/constants'
import type { QueuedVideo, VideoCandidate } from '../src/lib/learning/video-pool/types'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

/** Ids read as their track at a glance, and are never reused. */
const ID_PREFIX: Record<TrackId, string> = {
  accounts: 'acc',
  spending: 'spd',
  savings: 'sav',
  investing: 'inv',
}

/**
 * Starting points, not a fixed list — `--keyword` overrides them entirely.
 * Each one aims at how the topic is actually talked about on the platform
 * rather than at how the lessons name it.
 */
const DEFAULT_KEYWORDS: Record<TrackId, string[]> = {
  accounts: [
    'checking vs savings account',
    'credit score explained',
    'bank fees explained',
    'what is a credit utilization',
  ],
  spending: [
    'budgeting for beginners',
    'where my money goes',
    'cut monthly expenses',
    'lifestyle inflation',
  ],
  savings: [
    'emergency fund explained',
    'high yield savings account',
    'sinking funds budgeting',
    'how much should i save',
  ],
  investing: [
    'index funds explained',
    'what is a 401k',
    'compound interest explained',
    'roth ira for beginners',
  ],
}

/** Older than this and the reviewer gets told, so stale framing is not missed. */
const DEFAULT_STALE_AFTER_YEARS = 3

interface Options {
  track: TrackId
  keywords: string[]
  count: number
  region: string
  sortType: number
  publishTime: number
  staleAfterYears: number
  dryRun: boolean
  raw: boolean
}

function parseArgs(argv: string[]): Options {
  const keywords: string[] = []
  let track: string | undefined
  let count = 20
  let region = 'US'
  let sortType: number = SORT_TYPE.mostLiked
  let publishTime: number = PUBLISH_TIME.anyTime
  let staleAfterYears = DEFAULT_STALE_AFTER_YEARS
  let dryRun = false
  let raw = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = () => {
      const value = argv[++i]
      if (value === undefined) throw new Error(`${arg} needs a value.`)
      return value
    }

    switch (arg) {
      case '--track': track = next(); break
      case '--keyword': keywords.push(next()); break
      case '--count': count = Number(next()); break
      case '--region': region = next(); break
      case '--stale-after': staleAfterYears = Number(next()); break
      case '--dry-run': dryRun = true; break
      case '--raw': raw = true; break
      case '--sort': {
        const value = next()
        const map: Record<string, number> = {
          relevance: SORT_TYPE.relevance,
          liked: SORT_TYPE.mostLiked,
          recent: SORT_TYPE.mostRecent,
        }
        if (!(value in map)) throw new Error(`--sort must be relevance, liked, or recent.`)
        sortType = map[value]
        break
      }
      case '--max-age': {
        const value = next()
        if (value === 'all') { publishTime = PUBLISH_TIME.anyTime; break }
        const days = Number(value)
        const allowed = Object.values(PUBLISH_TIME) as number[]
        if (!allowed.includes(days)) {
          throw new Error(`--max-age must be 'all' or one of ${allowed.filter(Boolean).join(', ')} (days).`)
        }
        publishTime = days
        break
      }
      case '--help':
        console.log(USAGE)
        process.exit(0)
        break
      default:
        throw new Error(`Unknown argument ${arg}. Try --help.`)
    }
  }

  if (!track) throw new Error('--track is required. Try --help.')
  if (!(TRACK_ORDER as string[]).includes(track)) {
    throw new Error(`Unknown track ${track}. One of: ${TRACK_ORDER.join(', ')}.`)
  }
  if (!Number.isFinite(count) || count < 1) throw new Error('--count must be a positive number.')

  return {
    track: track as TrackId,
    keywords: keywords.length > 0 ? keywords : DEFAULT_KEYWORDS[track as TrackId],
    count,
    region,
    sortType,
    publishTime,
    staleAfterYears,
    dryRun,
    raw,
  }
}

const USAGE = `
Pull candidate videos into a track's review queue.

  npx tsx scripts/ingest-videos.ts --track <track> [options]

  --track <id>        accounts | spending | savings | investing   (required)
  --keyword <text>    Search term. Repeatable. Overrides the track defaults.
  --count <n>         How many candidates to keep, after ranking.   (20)
  --region <code>     US, GB, FR, JP, VN, SG.                       (US)
  --sort <mode>       relevance | liked | recent.                   (liked)
  --max-age <days>    all | 1 | 7 | 30 | 90 | 180 | 365.            (all)
  --stale-after <yrs> Flag anything older than this for the reviewer. (3)
  --dry-run           Print what would be written; write nothing.
  --raw               Dump the first raw response to a file, for shape checks.

Nothing this writes is approved. A human still has to watch every video.
`.trim()

/** Ids are never reused, so numbering continues past anything retired. */
function nextIdFactory(prefix: string, taken: Set<string>) {
  let highest = 0
  const pattern = new RegExp(`^${prefix}-v-(\\d+)$`)
  for (const id of taken) {
    const match = id.match(pattern)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  return () => `${prefix}-v-${String(++highest).padStart(3, '0')}`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  await loadEnvLocal()
  requireApiKey()

  const { ids, videoIds } = await knownIds(options.track)
  const nextId = nextIdFactory(ID_PREFIX[options.track], ids)

  console.log(
    `Searching ${options.keywords.length} ${options.keywords.length === 1 ? 'term' : 'terms'} ` +
    `for ${options.track}, region ${options.region}.`,
  )

  const seen = new Set(videoIds)
  const found: VideoCandidate[] = []
  let rawDumped = false

  for (const keyword of options.keywords) {
    let response
    try {
      response = await fetchVideoSearch({
        keyword,
        count: 20,
        region: options.region,
        sortType: options.sortType,
        publishTime: options.publishTime,
      })
    } catch (error) {
      // One bad term should not lose the terms that worked.
      console.warn(`  ✗ "${keyword}": ${(error as Error).message}`)
      continue
    }

    if (options.raw && !rawDumped) {
      const file = path.join(os.tmpdir(), `tikhub-raw-${options.track}.json`)
      await fs.writeFile(file, JSON.stringify(response, null, 2))
      console.log(`  ↳ raw response written to ${file}`)
      rawDumped = true
    }

    const rows = extractRows(response.data)
    let kept = 0
    for (const row of rows) {
      // The id is provisional until the candidate survives ranking; issuing it
      // here would burn numbers on videos that get dropped.
      const candidate = toCandidate(row, options.track, '')
      if (!candidate || seen.has(candidate.videoId)) continue
      seen.add(candidate.videoId)
      found.push(candidate)
      kept++
    }

    console.log(
      `  ✓ "${keyword}": ${rows.length} results, ${kept} new` +
      (rows.length === 0 ? '  (no rows parsed — try --raw)' : ''),
    )
  }

  if (found.length === 0) {
    console.log('\nNothing new found. Nothing written.')
    return
  }

  const ranked = found
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, options.count)

  const staleBefore = new Date()
  staleBefore.setFullYear(staleBefore.getFullYear() - options.staleAfterYears)

  const queued: QueuedVideo[] = ranked.map(candidate => {
    const concerns = screenCaption(candidate.caption)
    if (new Date(candidate.postedAt) < staleBefore) {
      concerns.push(`Older than ${options.staleAfterYears} years — check the framing still holds`)
    }
    return {
      ...candidate,
      id: nextId(),
      status: 'draft',
      ...(concerns.length > 0 ? { concerns } : {}),
    }
  })

  console.log(`\n${queued.length} candidates, best first:\n`)
  for (const item of queued) {
    const plays = item.engagement.plays.toLocaleString()
    const posted = item.postedAt.slice(0, 7)
    console.log(`  ${item.id}  ${item.creatorHandle.padEnd(20)} ${posted}  ${plays.padStart(12)} plays`)
    if (item.concerns) {
      for (const concern of item.concerns) console.log(`            ⚠ ${concern}`)
    }
  }

  const flagged = queued.filter(item => item.concerns).length
  if (flagged > 0) {
    console.log(`\n${flagged} flagged for a closer look. Flags are hints, not verdicts.`)
  }

  if (options.dryRun) {
    console.log('\n--dry-run: nothing written.')
    return
  }

  const queue = await readQueue(options.track)
  await writeQueue(options.track, [...queue, ...queued])

  const waiting = queue.filter(item => !item.rejected).length + queued.length
  console.log(
    `\nWritten to src/lib/learning/video-pool/${options.track}.candidates.json.\n` +
    `${waiting} now awaiting review. Target is ${TARGET_POOL_SIZE} approved per track.\n` +
    `Next: npm run dev, then http://localhost:3000/admin/review/${options.track}`,
  )
}

main().catch(error => {
  console.error(`\n${(error as Error).message}\n`)
  process.exit(1)
})
