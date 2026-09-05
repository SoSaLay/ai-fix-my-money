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

  reviewedBy: string
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

Build the review queue as something usable — video, numbers, and typing fields on
one screen. If the review pass means hand-editing raw JSON it will happen once
and never again, and the pool will rot.

API facts, confirmed: base `https://api.tikhub.io`, header
`Authorization: Bearer <key>`, 10 QPS, ~$0.001 per request. A full four-track
candidate pull costs well under a dollar, so cost is not a design constraint.
Key goes in `.env.local` as `TIKHUB_API_KEY`, server-side only.

## 1.5 Dead videos

A curated pool decays on its own even when the content does not go stale.
TikToks get deleted, go private, and creators quit. **A video that no longer
loads must be replaced.**

- **Health check.** A script re-checks every `approved` item's embed and stamps
  `lastCheckedAt`. Anything failing flips to `unavailable`.
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

- **Recency.** "Not 2007 content" and "popular older videos are fine if
  engagement is high" pull the candidate query in different directions. Decide
  whether `publish_time` caps age at all, or whether it sorts purely on
  engagement and the reviewer judges.
- **Pool size per track.** 25–30 is the recommendation above; confirm.
- **Grading model.** Recommend Claude. Confirm which, and where the key lives.
- **Deploy target.** Decides the env-var and scheduled-health-check story.

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
