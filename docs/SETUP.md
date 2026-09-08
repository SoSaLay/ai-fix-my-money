# AI Fix My Money — Setup Guide

> Written for whoever — or whatever — is setting this repo up. Read it through
> before running anything; the sections are in order.

---

## What this is

A personal-finance **learning platform**. Four tracks — accounts, income vs.
spending, savings, investing — each a set of lessons, then a step where the
learner records their own figures in the real tool, then a final test. Passing
the test is what unlocks that section of the app permanently.

The final test is built on short-form finance video: the learner watches a clip
a human reviewer has already vetted, answers in their own words, and an AI
grades that answer against the reviewer's reference answer. The point is not
recall — it is whether someone can follow a finance video **and judge it**.

**Repository:** https://github.com/SoSaLay/ai-fix-my-money

---

## Two ways it runs

The app reads its own configuration and behaves differently depending on what is
set. Both modes are supported, and the difference matters for privacy.

### Local mode — no configuration

Leave the Supabase variables blank and the app runs the way it always has: no
sign-in, no accounts, and everything the learner enters stays in that browser's
local storage. Nothing leaves the machine except quiz grading, which sends the
learner's written answer to Anthropic.

This is the right mode for development and for trying the app out.

### Hosted mode — accounts and a database

Set the Supabase variables and the app grows accounts. Sign-in is required,
progress and figures are stored in Postgres under the learner's user id, and the
same account picks up where it left off on another device.

**Say this plainly to anyone using the hosted version:** their financial figures
are stored on our servers, not only in their browser. That is a real change from
local mode and the Terms and Privacy pages have to reflect it.

Row-level security is what keeps one account's data away from another's. It is
enabled on every table in `supabase/migrations/0001_init.sql`, and it is not
optional — the anon key ships in the browser bundle by design.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind |
| Server | Next.js route handlers on the Node runtime |
| Auth | Supabase Auth (optional — see above) |
| Database | Supabase Postgres with row-level security (optional) |
| Local cache | Browser local storage, scoped by user id |
| Grading | Anthropic API, `claude-sonnet-5` |
| Analytics | PostHog (optional) |
| Question bank | JSON files in the repo, reviewed by hand |
| Hosting | AWS Amplify — see [DEPLOYMENT.md](../DEPLOYMENT.md) |

---

## Prerequisites

- **Node.js 20 or later** — https://nodejs.org
- **Git**
- An **Anthropic API key**, if you want the written-answer grading to work
- A **Supabase project**, only if you want accounts

---

## Quick start

```bash
git clone https://github.com/SoSaLay/ai-fix-my-money.git
cd ai-fix-my-money
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With an empty `.env.local` you land straight in the
app, signed out and local.

> Stick to one port. Local storage is per-origin, so port 3001 is a different
> site with a different set of data.

---

## Environment variables

Every one of these is optional; each unset variable turns off the feature that
needs it rather than breaking the app.

| Variable | Needed for | Secret? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Grading written quiz answers | **Yes** |
| `QUIZ_ATTEMPT_SECRET` | Signing attempt tokens. 32+ chars | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | Accounts | No — public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts | No — RLS is the protection |
| `SUPABASE_SERVICE_ROLE_KEY` | Writing quiz scores and grades | **Yes — bypasses RLS** |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | No |
| `TIKHUB_API_KEY` | `npm run ingest` only | **Yes — local only** |

Generate the attempt secret with `openssl rand -base64 32`. Rotating it
invalidates every quiz attempt currently in flight.

`TIKHUB_API_KEY` must never be set in production. Ingestion is a job you run on
your own machine; the deployed app makes no TikHub calls at all.

---

## Turning on accounts locally

1. Create a project at https://supabase.com.
2. Apply the schema — either `supabase db push`, or paste
   `supabase/migrations/0001_init.sql` into the SQL editor.
3. Copy the URL, the anon key, and the service-role key from
   **Project Settings → API** into `.env.local`.
4. Restart the dev server. `/dashboard` now redirects to `/login`.
5. Sign up. Confirmation email is on by default in a new project; turn it off in
   **Authentication → Providers → Email** if you would rather not wait.

Anything you entered before signing up is adopted into the new account the first
time it signs in on that browser, so you do not lose your test data.

---

## The question bank

The final quiz draws from a pool of reviewed videos. Both halves live in
`src/lib/learning/video-pool/`:

- `<track>.candidates.json` — what ingestion found, awaiting a human
- `<track>.json` — approved, and eligible to be served

```bash
npm run ingest -- --track accounts   # find candidates (needs TIKHUB_API_KEY)
npm run check-videos                 # retire embeds that have gone (no key)
```

Review candidates at `/admin/review` — development only, and the API route
behind it refuses to write outside development. Approving an item produces a
**diff**, and merging that diff is the approval gate: the commit records who
approved what, and when.

**A track needs 8 approved videos to serve a quiz at all, and 25 for a healthy
pool.** Below 8 the API returns 503 and the learner hits a wall at the end of a
track they just finished.

---

## Commands

```bash
npm run dev           # dev server
npm run type-check    # tsc --noEmit — use this, not a production build
npm run build         # production build (Amplify runs this in CI)
npm run ingest        # pull video candidates
npm run check-videos  # retire dead embeds
```

---

## Project structure

```
ai-fix-my-money/
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx     ← landing page
│   │   ├── (auth)/                  ← sign in, sign up
│   │   ├── (app)/                   ← dashboard, tools, learning
│   │   ├── admin/                   ← video review, development only
│   │   └── api/
│   │       ├── quiz/[track]/        ← serves one sampled paper
│   │       ├── quiz/grade/          ← grades one written answer
│   │       ├── quiz/complete/       ← records the result
│   │       └── videos/report/       ← "this video will not play"
│   ├── contexts/                    ← auth, financial data, learning progress
│   ├── lib/
│   │   ├── learning/                ← tracks, quiz, grading, video pool
│   │   ├── supabase/                ← browser, server, and admin clients
│   │   ├── sync/                    ← local cache ⇄ database
│   │   └── analytics/               ← PostHog
│   └── middleware.ts                ← session refresh and the auth gate
├── supabase/migrations/             ← schema and row-level security
├── DEPLOYMENT.md                    ← how this goes to production
└── docs/ROADMAP.md                  ← what is specified but not built
```

---

## Security notes

- The service-role key bypasses row-level security. Server-side only, never in a
  `NEXT_PUBLIC_` variable, never in a client component. `src/lib/supabase/admin.ts`
  is marked `server-only`, so importing it from the client fails the build.
- Reference answers, rubrics and answer keys never reach a browser. The
  `server-only` guard on `video-pool/pool.ts` is what enforces that.
- The learner's answer is untrusted input. The grader is told so explicitly and
  is barred from commenting on anyone's actual finances.
- `.env.local` is gitignored. Keep it that way.
- Session replay and autocapture are off in PostHog on purpose — this app has
  people's balances on screen.

---

## Troubleshooting

| Problem | Cause |
|---|---|
| `/dashboard` redirects to `/login` | Accounts are on. Sign up, or blank the Supabase variables |
| Quiz returns 503 | That track has fewer than 8 approved videos |
| Grading returns 502 | `ANTHROPIC_API_KEY` missing or the API is down |
| "This attempt has expired" | Attempts last three hours, or `QUIZ_ATTEMPT_SECRET` changed |
| Data vanished after signing in | Different account. Each user id gets its own storage |
| Data vanished after a port change | Local storage is per-origin. Go back to port 3000 |
| `/admin/review` is a 404 | Development only, by design |

---

*Last updated: 2026-09-08 · See [DEPLOYMENT.md](../DEPLOYMENT.md) for production.*
