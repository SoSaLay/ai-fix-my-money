# Roadmap

Work that is agreed and specified but not yet built. Each item is written so it
can be picked up cold.

---

# 1. Interactive final quiz — curated short-form video, free-form answers

Replaces the current final quiz (10 multiple-choice, fixed answer key) with an
assessment built on the short-form finance content people actually watch.

**The pedagogical point.** Most people get their money information from short
video. The quiz puts that content in front of the learner and asks whether they
can follow it *and judge it* — not just recall it. A question is as likely to be
"what is this creator claiming, and does it hold up?" as "what did they say."
That framing is also what keeps the platform on the right side of its own
disclosures: we are teaching people to assess content, not endorsing it.

## 1.0 Built so far

Phase 1 — the authoring half — is in the repo:

- `src/lib/learning/video-pool/types.ts` — `VideoCandidate` (what ingestion
  finds), `VideoReview` (what the reviewer writes), `PooledVideo` (both, plus
  status), `QueuedVideo` (a candidate mid-review), and `PublicVideoQuestion`
  (what a browser may see). Types only, so it is safe on both sides.
- `src/lib/learning/video-pool/pool.ts` — `server-only`. Loads the approved
  pools, projects public fields, reports pool health, and reads and writes the
  review queue. Writes throw outside development.
- `src/lib/learning/video-pool/<trackId>.json` and `<trackId>.candidates.json` —
  all eight files exist and are empty, awaiting ingestion.
- `src/app/admin/` — the dev-gated review area: a track index with pool health,
  and a per-track screen. `src/app/api/admin/review/route.ts` is its only write
  path and refuses outside development.
- `src/components/learning/video-embed.tsx` — TikTok's official embed, sandboxed,
  with a report-unavailable affordance. Shared by the review screen and, later,
  the quiz.

Phase 2 — ingestion and the health check — is in too:

- `scripts/ingest-videos.ts` (`npm run ingest -- --track accounts`). Searches
  TikHub, ranks by engagement, drops anything already known, screens captions,
  and appends drafts to the candidate queue. `--help` lists the options; nothing
  it writes is ever approved.
- `scripts/check-videos.ts` (`npm run check-videos`). Re-checks every approved
  embed against TikTok's public oEmbed endpoint and flips the dead ones to
  `unavailable`. Confirmed against live TikTok: 200 for a video that exists, 400
  for one that does not. No key and no cost — it does not touch TikHub.
- `scripts/lib/` — the TikHub client (the only thing in the repo that calls it)
  and the normaliser, which is defensive because TikHub types the response body
  as an untyped passthrough of TikTok's own shape.
- `src/lib/learning/video-pool/pool-files.ts` and `constants.ts` — split out of
  `pool.ts` because `server-only` throws in plain Node and the scripts need
  both. `pool.ts` re-exports them, so app code still has one import.

Confirmed against the live API on the first run: results come back under
`data.search_item_list` (its sibling `aweme_list` is present but always empty),
each row wrapping the video in `aweme_info`. `aweme_id` is a string,
`create_time` is unix seconds, and the counts sit under `statistics`. The
caption screen was tuned against twenty real captions — it flags eight of them
with no false positives, four for having no topic signal at all, which is the
share of search noise worth skipping before pressing play.

The Accounts queue holds 25 candidates awaiting review.

Phase 3 — serving and grading — is in:

- `src/lib/learning/quiz/attempt.ts` — the attempt is a signed token, not a
  session. The sampled ids travel inside it and an HMAC makes them unforgeable,
  so grading knows which reference answer belongs to which response with no
  store and no host requirements. Round trip and tamper rejection are tested.
- `src/lib/learning/quiz/sample.ts` — eight live videos plus two multiple
  choice, shuffled fresh per attempt, projected to public fields. A track whose
  live pool cannot fill a paper returns 503 rather than a short quiz.
- `src/lib/learning/quiz/rate-limit.ts` — per-IP, in-memory. Honest about being
  per-instance; move it to a shared store if the app scales horizontally.
- `src/lib/learning/grading/grader.ts` — Claude Sonnet 5 with structured
  outputs, so the response cannot be malformed JSON. Validates that score and
  verdict agree and drops any "missed" point the reviewer did not write, then
  retries once before failing.
- `src/app/api/quiz/[track]/route.ts` and `src/app/api/quiz/grade/route.ts`.
  An empty answer is scored without a model call.

Still to build: the learner-facing changes (§1.9).

**Before this can run:** `ANTHROPIC_API_KEY` in `.env.local` and in production.
`QUIZ_ATTEMPT_SECRET` is generated locally already; production needs its own.
See `.env.example`.

## 1.1 The model: a human-curated pool

Videos are pulled in batches, **watched by a reviewer**, and turned into a
question and a reference answer by hand. The AI does not generate questions and
does not read transcripts. It only grades a learner's written answer against the
reference answer a human wrote.

This was chosen over automated ingestion deliberately:

- **No transcript dependency.** TikHub has no TikTok subtitle endpoint (verified
  against all 1,063 paths in `https://api.tikhub.io/openapi.json`; captions exist
  only for YouTube and Bilibili). TikTok captions appear opportunistically inside
  `video.cla_info.caption_infos` and are frequently absent. A reviewer who
  watched the video removes the need for captions, speech-to-text, and any
  download of the media.
- **Screening.** Hashtag-sourced finance content is full of specific stock picks,
  get-rich-quick, MLM recruiting, and course funnels. None of that can reach a
  learner on a platform whose legal position is general, impersonal, and
  non-recommending. A human gate is stronger than an AI screening pass.
- **Question quality.** Generated questions come out mechanical. A reviewer who
  watched it writes the question worth asking.
- **Grading reliability.** Grading against a human-written reference is far
  narrower than grading against a raw transcript, so the false-fail rate drops.
- **Injection surface.** No untrusted creator transcript is fed to the grader.
  Only the learner's answer is untrusted.

Content is **not** refreshed on a schedule. It is refreshed manually when the
pool decays or the material goes stale.

## 1.2 Quiz shape

Per track, 10 questions:

- **2 multiple choice**, hand-written, from the existing `finalQuiz` bank. Same
  difficulty target as the rest.
- **8 video questions**, each one short-form video plus one open-ended written
  answer, graded by AI.

Difficulty target throughout: medium to semi-difficult. The learner should have
to comprehend, not pattern-match.

## 1.3 The content pool

Lives at `src/lib/learning/video-pool/<trackId>.json`, committed to the repo.
Versioned, reviewable in a diff, deploys with the app, no infrastructure.

```ts
interface PooledVideo {
  /** Our stable id, e.g. 'acc-v-001'. Never reused. */
  id: string
  trackId: TrackId
  platform: 'tiktok'
  /** Platform's own id, plus the URLs needed to embed and to health-check. */
  videoId: string
  shareUrl: string
  embedUrl: string
  creatorHandle: string
  postedAt: string          // ISO
  /** The creator's own caption. Reviewer context only, never shown as material. */
  caption: string
  engagement: { likes: number; comments: number; shares: number; plays: number }

  // ── Written by the reviewer, after watching ──
  question: string
  /** What the video actually claims. Powers the "does it hold up?" framing. */
  claimUnderTest?: string
  /** SERVER ONLY. Never sent to the browser. */
  referenceAnswer: string
  /** SERVER ONLY. The specific points an answer must hit, in order of weight. */
  rubric: string[]

  reviewedAt: string        // ISO
  status: 'draft' | 'approved' | 'unavailable' | 'retired'
  /** Last time the embed was confirmed to still load. */
  lastCheckedAt: string
}
```

**`referenceAnswer` and `rubric` must never reach the client.** Ship them and the
answer key is one View Source away — the same reason a transcript could not be
sent. Enforce it two ways: the pool module imports `server-only` so a client
import fails at build time, and the serving route projects only public fields.

Target **25–30 approved items per track**, so 8 can be sampled without the set
becoming memorisable. Answers will circulate; a pool three times the quiz size is
the mitigation.

## 1.4 Ingestion and review workflow

A script, run by hand, not a cron. It never writes an approved item — it only
fills a review queue.

1. **Pull candidates.** `GET /api/v1/tiktok/app/v3/fetch_video_search_result`
   (`keyword`, `region`, `sort_type`, `publish_time`) is the better primitive
   than the hashtag pair, because recency and sort are applied at the API instead
   of pulling everything and discarding most. The hashtag route, if needed, is
   two calls: `fetch_hashtag_search_result` resolves a keyword to a `ch_id`, then
   `fetch_hashtag_video_list` takes that id plus `region` and a cursor.
2. **Rank by engagement** and drop anything already in the pool or retired.
3. **Emit a review queue** — one row per candidate with the embed preview,
   engagement figures, posted date, creator, caption, and empty `question` /
   `claimUnderTest` / `referenceAnswer` / `rubric` fields.
4. **A human watches each video** and fills those fields, or rejects the
   candidate.
5. **Approval flips `status` to `approved`.** Nothing reaches a learner at
   `draft`. This gate is not optional.

**Where the review happens: a dev-only screen that writes to the repo.** Not a
hosted admin panel. Decided deliberately, and going live is the reason for it
rather than against it.

The pool is authored, not edited at runtime — live learners only read it, and
content is refreshed by hand when it decays rather than on a schedule. That makes
this a build-time job, and keeping it at build time is what keeps the answer key
out of reach: `referenceAnswer` and `rubric` sit in the repo behind `server-only`
instead of in a hosted database behind a login form on the public internet. A
panel would also mean building auth from nothing — the app has no accounts, no
sessions, and no store — and production content would immediately start drifting
from the repo.

Git supplies the approval gate for free. Flipping an item to `approved` is a diff
someone reads before it merges, and the commit already records who did it and
when.

The shape:

- **`/admin/review`, a route inside this app**, so it reuses the embed component,
  the `PooledVideo` type, and the existing styling instead of becoming a second
  tool to maintain.
- **Dev-only, gated twice.** The layout calls `notFound()` unless
  `NODE_ENV === 'development'`, and the route handler that writes refuses outside
  dev. A read-only production filesystem is a third layer that comes free.
- **Two files per track.** `<trackId>.candidates.json` is what the ingest script
  writes; `<trackId>.json` holds approved items only. Approving moves an item
  across.
- **One candidate per screen** — the video playing, engagement figures, creator,
  posted date, caption, and the four fields to type into. Approve writes to the
  working tree; then commit, push, deploy.

Hand-editing raw JSON is not an acceptable substitute. It will happen once and
never again, and the pool will rot.

**What would change this:** a non-technical reviewer who cannot run
`npm run dev`. The answer then is still not a CMS — it is a hosted form that
commits to a branch through the GitHub API, so the repo stays the source of truth
and no answer key lands in a production database. That costs an auth story, so
build it only once such a reviewer actually exists.

API facts, confirmed: base `https://api.tikhub.io`, header
`Authorization: Bearer <key>`, 10 QPS, ~$0.001 per request. A full four-track
candidate pull costs well under a dollar, so cost is not a design constraint.
Key goes in `.env.local` as `TIKHUB_API_KEY`. Because ingestion and review only
ever run locally, it is never a production environment variable — the deployed
app never talks to TikHub.

## 1.5 Dead videos

A curated pool decays on its own even when the content does not go stale.
TikToks get deleted, go private, and creators quit. **A video that no longer
loads must be replaced.**

- **Health check.** A script re-checks every `approved` item's embed and stamps
  `lastCheckedAt`. Anything failing flips to `unavailable`. Like ingestion, it is
  run by hand against the repo and its result is a commit, not a live write.
- **Never served.** Sampling skips `unavailable` items, so a learner never draws
  a dead embed.
- **Replenishment signal.** When a track's live pool drops below 2× the video
  question count (16), the track is flagged as needing new videos. That flag is
  the trigger for a manual ingestion round.
- **Runtime fallback.** If an embed fails to load in the browser despite the
  health check, the learner can swap that question for another from the pool
  without penalty, and the item is reported so it can be marked `unavailable`.
- **Replacement is manual**, following the same watch-and-write process. Retired
  items keep their id and move to `status: 'retired'` rather than being deleted,
  so history stays readable.

## 1.6 Serving

`GET /api/quiz/[track]` returns one attempt:

- 8 video items sampled from `approved` + live, plus 2 multiple choice.
- Public fields only — id, question, embed URL, creator, posted date. No
  reference answer, no rubric.
- A fresh sample on every attempt, so a retake is not the same paper.
- An opaque `attemptId` the server keys to the sampled item ids, so grading knows
  which reference answer belongs to which response.

## 1.7 Grading

`POST /api/quiz/grade` with `{ attemptId, questionId, answer }`.

The model receives the question, the reference answer, and the rubric, and
returns strict JSON:

```ts
{ score: 0 | 1 | 2, verdict: 'missed' | 'partial' | 'full',
  reasoning: string, missed: string[] }
```

`reasoning` is shown to the learner — the point is that they see *why*, not just
whether.

**Guardrails, all required:**

- The grader is scoped to one job: does this answer demonstrate understanding of
  the reference answer and rubric. It is explicitly barred from evaluating,
  commenting on, or advising about the learner's own finances. If an answer asks
  a personal question, it is ignored and only comprehension is graded.
- The learner's answer is untrusted text and is delimited as data, never as
  instruction.
- Rate limit per IP. Grading is the only paid path a visitor can trigger.
- Grader output is validated against the schema before it is trusted; a
  malformed response is a retry, not a pass.

## 1.8 Scoring

Each question scores 0 / 1 / 2 — missed, partial, full. Ten questions, 20 points,
**pass at 16 (80%)**, preserving `PASS_THRESHOLD`.

The three-point scale is deliberate. Binary pass/fail across 8 AI-graded
questions at an 80% bar means a single grader misfire fails an attempt, and the
retake loop becomes punishing. Partial credit keeps the bar demanding without
making it brittle.

`passMark()` becomes points-based for tracks with a video quiz.

## 1.9 What this touches

- **`QuizQuestion` becomes a discriminated union** — `ChoiceQuestion` (today's
  `options` + `answer`) and `FreeFormQuestion` (video id, no options). This is a
  breaking type change.
- **`question-stack.tsx`** needs a free-form branch: video embed, textarea,
  submit, then the returned verdict and reasoning in place of the option list.
- **`learning-context.tsx`** — `recordFinal(correct, total, missed)` becomes
  points-based.
- **Spaced review** currently assumes multiple choice throughout. In v1, exclude
  free-form items from the review queue; revisit once the format is proven.
- **The app gains a server.** Until now it is entirely client-side with no
  secrets. Route handlers cover it, but the final quiz will no longer work
  offline, and the app needs a Node deploy target rather than a static export.

## 1.10 Playback

Use TikTok's official embed, not any direct media URL TikHub returns.
Self-hosting the file breaks TikTok's terms and strips creator attribution. The
embed still plays inside our page. Needs a CSP/frame allowance in
`next.config.ts`.

## 1.11 Legal alignment — already written

The disclosures added alongside the lesson imagery were written ahead of this
feature and already cover it:

- `DISCLOSURES` — "AI-assisted features" and "Third-party content"
- `TERMS` — "Automated feedback"
- `PRIVACY` — "Third-party processing", which names what is sent to a model and
  states that accounts, balances, and goals are not

Check those against what actually ships and correct anything that drifts. The
privacy claim that financial data never leaves the device stays true under this
design — only the learner's written answer is sent.

## 1.12 Open questions

- **Recency.** Resolved as a default, still open to change. The ingest script
  applies no age cap (`publish_time = 0`), sorts on engagement, and flags
  anything older than three years as a concern on the review screen. That serves
  both halves of the original tension — a popular older video still surfaces,
  and stale framing is visible rather than silent. `--max-age` and
  `--stale-after` override it per run if the flags turn out to be noise.
- **Pool size per track.** 25–30 is the recommendation above; confirm.
- **Grading model.** Settled: Claude Sonnet 5 (`claude-sonnet-5`), with
  structured outputs and adaptive thinking at medium effort. The key lives in
  `ANTHROPIC_API_KEY` — unlike the TikHub key, this one is a production
  environment variable, because grading happens at runtime.
- **Deploy target.** Needs to be a Node target, not a static export. The only
  secret it carries is the grading key — `TIKHUB_API_KEY` stays local — and there
  is no scheduled job to host, since the health check runs by hand.

Settled: **review tooling.** A dev-only `/admin/review` screen writing to the
repo, per 1.4. No hosted admin panel, no database, no auth.

---

## Done, with follow-ups

### Disclosures page behind the info icon — built

`/learning/disclosures`, with `/terms` and `/privacy` beneath it. The bar in
`src/components/learning/disclaimer-bar.tsx` is now the whole control and opens
the hub; the acknowledgment gate and the learning hub link there too.

Content lives in `src/lib/legal/documents.ts` and renders through
`src/components/legal/legal-document-view.tsx`.

**Still to do**

- Fill in `OPERATOR` at the top of `src/lib/legal/documents.ts` — legal entity
  name, contact email, postal address, and governing state are all placeholders,
  and they are interpolated throughout all three documents.
- Have a lawyer review the documents before the platform is public. They were
  drafted against the common requirements for an educational finance platform
  and are a starting point, not advice.
- Decide whether the documents should also be reachable from the marketing page
  footer, not only from inside `/learning`.

### Reference images in lessons and questions — built

Every lesson in Accounts, Spending, and Savings has a diagram in the right-hand
column, and ten questions point back at one through the new `imageSrc` field on
`QuizQuestion`. Spaced review shows the same diagram beside a question that used
it.

**Still to do**

- The 15 files in `public/learning/` are hand-drawn SVG diagrams built to hold
  the layout and be legible on their own. Swap in final art whenever it exists —
  the `images` arrays in `src/lib/learning/tracks.ts` are the only thing that
  needs to change, and `LessonImages` and `QuestionImage` already fall back to
  the optimizer for raster formats.
- The Investing track has no lessons yet, so it has no imagery either.
