# AI Fix My Money

Most people learn about money from a feed. This teaches you to judge what you
find there.

Four tracks — accounts, income vs. spending, savings, investing. Each is short
lessons, practice questions that explain themselves, a step where you use the
real tool with your own numbers, and a final test. The test is the point: you
watch actual short-form finance videos and explain them in your own words, and
a human-written reference answer is what your answer is marked against. Pass at
80% and that track's tool unlocks.

It teaches. It does not advise, and it never tells anyone what to do with their
money.

## Running it

```bash
npm install
npm run dev
```

That works with no configuration. Lessons, practice questions and the tools all
run; only the final test needs a key, because marking a written answer costs
money. Copy `.env.example` to `.env.local` and fill in two values to get it:

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Marks written answers. Without it the test loads but cannot grade. |
| `QUIZ_ATTEMPT_SECRET` | Signs attempt tokens. Any 32+ character random string. |

```bash
openssl rand -base64 32
```

## How it is put together

Next.js 15 App Router, React 18, Tailwind. Deployed on AWS Amplify, where the
route handlers run on Lambda.

**There is no database and no sign-in.** Everything a learner does — their
figures, their progress, their review queue — lives in that browser's local
storage. That keeps the whole thing free to run and means no one hands over
their finances to be stored. It also means the honest version of the trade:
clear your browser data and your progress is gone, and a phone and a laptop are
two different learners.

**The question pool is files in this repo.** `src/lib/learning/video-pool/*.json`
holds every approved video with the question, reference answer and rubric a
reviewer wrote for it. They are imported statically, so they ship inside the
build and the deployed app never reads them off disk. The review screen that
edits them runs in development only — approving a video produces a diff, and
merging it is the approval.

**The answer key never reaches a browser.** `pool.ts` is marked `server-only`,
so a client component importing it fails the build rather than shipping the
reference answers. `toPublicQuestion` is the only supported way to send a pool
item to the page.

### Where things live

```
src/
  app/
    (marketing)/       landing page
    (app)/             the learner's app — tracks, tools, review
    admin/review/      the video review screen (development only)
    api/quiz/          serve a paper, grade one written answer
  components/          by feature — learning, savings, spending, investing, ui
  contexts/            learning progress, financial data
  lib/
    learning/          curriculum, quiz sampling, grading, the video pool
    storage/           local storage, which is the whole storage layer
    analytics/         PostHog, anonymous
    finance/           the money model
    investing/         allocation maths
  types/
scripts/               video ingestion and the weekly embed health check
docs/                  design notes, roadmap, lesson question drafts
```

## Things worth knowing before you change it

**Papers currently draw the whole pool.** Each track's final test samples
exactly as many videos as it has approved, so a retake is the same set
reshuffled, and one embed dying takes that track's test offline. Both fix
themselves once the pools grow past their paper size — see
`TARGET_POOL_SIZE` in `video-pool/constants.ts`.

**The grading route is open.** With no accounts there is nobody to attribute a
request to, so `/api/quiz/grade` is rate limited per IP in one Lambda's memory,
which is worth very little. Set a monthly spend cap on the Anthropic key.

**The weekly health check** (`.github/workflows/check-videos.yml`) asks TikTok
whether each approved video still exists and commits the retirements. That is
why it runs in CI and not on Lambda — production cannot write the pool.

## Commands

```bash
npm run dev          # development server
npm run type-check   # tsc --noEmit
npm run build        # production build
npm run ingest       # pull candidate videos (needs TIKHUB_API_KEY)
npm run check-videos # retire embeds that have gone
```

## Licence

MIT. See [LICENSE](LICENSE).
