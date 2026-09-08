# Deployment

How **AI Fix My Money** goes from a local-only app to a hosted product that real
users log into, work through, and come back to.

Written to be executed top to bottom. Every phase states what it changes, what
it depends on, and how you know it worked. Phases 1–5 are code work that can
start today; phases 6–8 are infrastructure and only need doing once.

**Target stack**

| Layer | Choice |
|---|---|
| Hosting | AWS Amplify Hosting (Next.js SSR / WEB_COMPUTE) |
| Domain + DNS | Route 53 |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth |
| Analytics | PostHog |
| Grading | Anthropic API (`claude-sonnet-5`) |
| Payments | None at launch |

Clerk is **out**. Supabase Auth covers sign-in, and keeping auth and data in one
system means the user id in a JWT is the same id in a row-level-security policy —
no webhook to keep two user tables in sync.

---

## Status

Code for phases 1–7 is written and type-checks. Nothing below has run against a
real Supabase project yet — that is the first thing to do, and §3 says how.

| Phase | State | What is in the repo |
|---|---|---|
| 1. Schema + RLS | ✅ written | `supabase/migrations/0001_init.sql`, `src/types/supabase.ts` |
| 2. Auth | ✅ written | `src/middleware.ts`, `src/lib/supabase/*`, `src/app/(auth)/*`, `src/app/auth/*`, `src/contexts/auth-context.tsx` |
| 3. State → Postgres | ✅ written | `src/lib/sync/*`, both contexts, `quiz_attempts` / `graded_answers` / `video_reports` writes |
| 4. Hardening | ✅ written | `rate-limit.ts` counts the database, security headers in `next.config.ts` |
| 5. PostHog | ✅ written | `src/lib/analytics/*`, `src/components/analytics/*`, `/ingest` rewrite |
| 6. Amplify | ✅ written | `amplify.yml` |
| 7. Health check | ✅ written | `.github/workflows/check-videos.yml` |
| — Supabase projects | ⬜ **yours** | Create staging + prod, apply the migration |
| — Amplify + Route 53 | ⬜ **yours** | Console work, §8 |
| — Question bank | ⬜ **yours** | In progress. Gate G1 |

**The app still runs with no configuration.** Leave the Supabase variables blank
and it behaves exactly as it did before accounts existed: no sign-in, everything
in local storage. That is what `authConfigured()` decides, and it is what keeps
a fresh clone working — and what lets you turn accounts on one environment at a
time.

**Not yet wired, because the screen does not exist yet.** The learner-facing
final quiz UI is still to be built (ROADMAP §1.6). Its two server endpoints are
live and its client helpers are in `src/lib/learning/quiz/client.ts` —
`completeAttempt()` and `reportVideoUnavailable()` — so building that screen is
a matter of calling them.

---

## Your work

Everything below needs your accounts, your judgment, or your content. The code
side is done.

### Accounts to open
- [ ] Supabase — two projects: `aifmm-staging`, `aifmm-prod`
- [ ] PostHog — one project per environment
- [ ] AWS — Amplify, Route 53, ACM (one account, existing is fine)
- [ ] Anthropic — API key, **and set a monthly spend cap**

### Supabase (§3, §4)
- [ ] Apply `supabase/migrations/0001_init.sql` to staging, then prod
- [ ] Copy URL, anon key, service-role key into `.env.local` for local testing
- [ ] Turn on email confirmation in prod
- [ ] Set Site URL and the redirect allowlist to the real domain — **not
      localhost**, or every confirmation email points at your laptop
- [ ] Enable Pro / point-in-time recovery before the first real tester
- [ ] Decide: Google sign-in, or email and password only

### Amplify + domain (§8)
- [ ] Connect the GitHub repo, branch `main` → production
- [ ] Confirm it provisioned **WEB_COMPUTE**, not a static build — a static
      build drops every `/api` route without failing loudly
- [ ] Set all seven environment variables; mark the three secrets as secret
- [ ] Register or delegate the domain in Route 53, map apex + `www`
- [ ] Go back and update the Supabase URLs to the live domain

### Content and product
- [ ] **Approve the video pools** — 8 per track minimum to serve a quiz, 25 for
      a healthy one. Currently 0 across all four. This is gate G1
- [ ] Build the learner-facing final quiz screen (ROADMAP §1.6). Endpoints and
      client helpers are already there
- [ ] Decide whether the three questions lost with the old "Your goal, your
      horizon, your risk" lesson get rewritten into a neighbouring lesson

### Legal (gate G6)
- [ ] Rewrite Terms and Privacy at `/learning/disclosures/{terms,privacy}` —
      they were written for a local-only app. They now need: data is stored on
      our servers, what analytics are collected, and how someone deletes their
      account. `docs/SETUP.md` is already updated

### Before you hand out the URL
- [ ] Sign up, finish a lesson, sign out, sign in on another device — see it all
- [ ] Two accounts in one browser — neither sees the other's figures
- [ ] Ten written answers across strong / partial / wrong — grades are sane
- [ ] Grade 41 answers in an hour — the 41st returns 429
- [ ] Walk the whole learning flow on a real phone

---

## 0. Where the app actually is today

Read this before planning dates. The gap between the current app and a
multi-user product is the bulk of the work, and it is all in phases 2–4.

**What is built and deploys as-is**

- Next.js 15 App Router, React 18, TypeScript, Tailwind. Node runtime.
- Four learning tracks with lessons, in-lesson questions, spaced review, and a
  final quiz — [tracks.ts](src/lib/learning/tracks.ts).
- The video-question pipeline end to end: ingestion (`npm run ingest`), the
  dev-gated review screen at `/admin/review`, the signed attempt token
  ([attempt.ts](src/lib/learning/quiz/attempt.ts)), fresh sampling per attempt
  ([sample.ts](src/lib/learning/quiz/sample.ts)), and AI grading against a
  human-written reference answer ([grader.ts](src/lib/learning/grading/grader.ts)).
- The dashboard, spending, savings, investing and accounts tools.

**What the gaps were, and where each one now stands**

| Gap | Status |
|---|---|
| No authentication | Closed — Supabase Auth, middleware gate, sign-in and sign-up screens |
| No database | Closed — schema and RLS in `supabase/migrations/0001_init.sql` |
| Per-browser state | Closed — mirrored to `user_state`, reconciled per key on sign-in |
| Rate limit reset on every cold start | Closed — counts `graded_answers` per user per hour |
| No analytics | Closed — PostHog, proxied, replay and autocapture off |
| Approved video pools are empty | **Open. The final quiz returns 503 on every track** |

The storage keys that are mirrored to Postgres:

```
llg_financial_data      llg_spending_limit    llg_savings_goals
llg_investing_goal      llg_general_savings   llg_manual_accounts
llg_ledger              llg_learning_progress_v2
llg_learning_review     llg_learning_ack      llg_learning_guided
```

**Pool status right now** — `npm run check-videos` reports it, and a quiz needs
8 approved videos to serve at all, 25 for a healthy pool:

| Track | Approved | In queue | Servable? |
|---|---|---|---|
| accounts | 0 | 25 | No |
| spending | 0 | 0 | No |
| savings | 0 | 0 | No |
| investing | 0 | 0 | No |

This is the QA and user-review work already in flight. It is a hard launch gate
(§9, gate G1) but it blocks nothing in phases 1–8 — build the platform while the
question bank fills.

---

## 1. Architecture

```
                    Route 53  (aifixmymoney.com)
                         │
                    ┌────▼─────────────────────────┐
                    │  AWS Amplify Hosting         │
                    │  ├── CloudFront + WAF        │
                    │  ├── static assets (S3)      │
                    │  └── SSR compute (Lambda)    │
                    │      • pages / RSC           │
                    │      • /api/quiz/[track]     │
                    │      • /api/quiz/grade       │
                    └────┬───────────────┬─────────┘
                         │               │
              ┌──────────▼─────┐   ┌─────▼──────────┐
              │   Supabase     │   │ Anthropic API  │
              │  Auth + Postgres│  │ (grading only) │
              │  RLS per user  │   └────────────────┘
              └────────────────┘
                         │
                    ┌────▼─────┐        ┌──────────────────┐
                    │ PostHog  │        │ TikTok oEmbed    │
                    │ (proxied)│        │ (iframe + health)│
                    └──────────┘        └──────────────────┘
```

**On Lambda.** Amplify's SSR compute *is* Lambda — every route handler and every
server component already runs there once deployed. No separate function is
needed for the app itself. The one genuinely scheduled job is the video health
check, and §8 covers why that belongs in CI rather than in a Lambda.

**What stays out of the browser.** Reference answers, rubrics, the answer key,
`ANTHROPIC_API_KEY`, `QUIZ_ATTEMPT_SECRET`, and the Supabase service-role key.
The `server-only` guard on [pool.ts](src/lib/learning/video-pool/pool.ts) already
enforces the first three at build time; keep it that way.

---

## 2. Prerequisites

Accounts and access to have in hand before phase 1:

- AWS account with permission for Amplify, Route 53, ACM, IAM.
- The domain — registered in Route 53, or registered elsewhere with the ability
  to change nameservers.
- Supabase account. One org, two projects: `aifmm-staging`, `aifmm-prod`.
- PostHog account (Cloud is fine). One project per environment.
- Anthropic API key with billing and a spend cap set.
- GitHub repo access for the Amplify connection.

Local tooling: Node 20+, `npm`, the Supabase CLI (`brew install supabase/tap/supabase`).

> Use `npm run type-check` while working. Do not run `npm run build` locally —
> it fights the dev server. Amplify runs the production build in CI.

---

## 3. Phase 1 — Supabase: schema and policies ✅

**Depends on:** nothing. Start here.

**Built as:** `supabase/migrations/0001_init.sql`, typed in `src/types/supabase.ts`. Apply it with `supabase db push`, or paste it into the SQL editor.

Create both projects, then apply the schema below to staging first. Keep it in
`supabase/migrations/0001_init.sql` so prod gets the identical thing.

### 3.1 Design

Two shapes, chosen for two different reasons.

`user_state` is a **verbatim mirror of the existing localStorage keys**. One row
per user per key, value as `jsonb`. The migration is then mechanical — no
reshaping of `FinancialProfile`, `ProgressMap`, or the review queue, and the
contexts keep their current types. This is what makes phase 3 a week and not a
month.

Everything else is a **real relational table**, because it is data you need to
query: quiz outcomes, the answers the grader saw, and reports of dead videos.
Those three feed the question-bank QA loop directly — after launch you can ask
"which video question does everyone fail?" and get an answer.

### 3.2 Migration

```sql
-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- A row per user, created the moment they sign up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── App state (mirrors the localStorage keys) ───────────────────────────────
create table public.user_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint user_state_key_allowed check (key in (
    'llg_financial_data', 'llg_spending_limit', 'llg_savings_goals',
    'llg_investing_goal', 'llg_general_savings', 'llg_manual_accounts',
    'llg_ledger', 'llg_learning_progress_v2', 'llg_learning_review',
    'llg_learning_ack', 'llg_learning_guided'
  ))
);

-- ── Quiz history ────────────────────────────────────────────────────────────
create table public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_id     text not null check (track_id in ('accounts','spending','savings','investing')),
  video_ids    text[] not null,
  choice_ids   text[] not null,
  correct      integer,
  total        integer,
  passed       boolean,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, started_at desc);

-- Every graded written answer. This is the QA corpus for the question bank,
-- and it is what the rate limit counts.
create table public.graded_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid references public.quiz_attempts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  track_id    text not null,
  question_id text not null,
  answer_text text not null,
  score       smallint not null check (score between 0 and 2),
  verdict     text not null check (verdict in ('missed','partial','full')),
  reasoning   text,
  missed      text[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index graded_answers_rate_idx on public.graded_answers (user_id, created_at desc);
create index graded_answers_question_idx on public.graded_answers (question_id, created_at desc);

-- A learner saying an embed will not play. Currently this signal is discarded.
create table public.video_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  track_id   text not null,
  video_id   text not null,
  created_at timestamptz not null default now()
);
create index video_reports_video_idx on public.video_reports (video_id, created_at desc);
```

### 3.3 Row-level security

Every table. No exceptions — RLS is the whole reason auth and data live in the
same system.

```sql
alter table public.profiles       enable row level security;
alter table public.user_state     enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.graded_answers enable row level security;
alter table public.video_reports  enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own state" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own attempts" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Read-only to the learner. Only the server (service role) writes a grade,
-- because a client that could write its own score could pass every quiz.
create policy "read own grades" on public.graded_answers
  for select using (auth.uid() = user_id);

create policy "report a video" on public.video_reports
  for insert with check (auth.uid() = user_id);
```

The service-role key bypasses RLS. It is used **only** in route handlers, never
in a client component, and never in a `NEXT_PUBLIC_` variable.

**Verify:** with the anon key and user A's session, `select * from user_state`
returns only A's rows. Attempting `insert into graded_answers` as A fails.

---

## 4. Phase 2 — Authentication ✅

**Depends on:** phase 1. **Built and installed.**

`@supabase/supabase-js` and `@supabase/ssr` are in `package.json`.

### 4.1 Clients

Three, because Next.js has three execution contexts:

- `src/lib/supabase/client.ts` — `createBrowserClient`, for client components.
- `src/lib/supabase/server.ts` — `createServerClient` wired to `cookies()`, for
  server components and route handlers.
- `src/lib/supabase/admin.ts` — service-role client, `server-only`, for grade
  writes. Guard it the way [pool.ts](src/lib/learning/video-pool/pool.ts) is guarded.

### 4.2 Middleware

Create `src/middleware.ts` (there is none today). It refreshes the session
cookie on every request and gates the app:

- Public: `/`, `/login`, `/signup`, `/auth/callback`, `/learning/disclosures/*`.
- Authenticated: everything under `(app)` — dashboard, spending, savings,
  investing, accounts, learning, settings.
- Authenticated: `/api/quiz/*`. Anonymous grading is a bill anyone can run up.
- `/admin/*` stays dev-only exactly as it is. Do not add a production admin role
  in this pass — the review flow's approval gate is a git commit, and that is
  the right design ([route.ts:1](src/app/api/admin/review/route.ts)).

### 4.3 Screens

- `/login` and `/signup` — email + password, plus Google OAuth if you want the
  friction gone for testers. Google needs the client id and secret in Supabase
  Auth → Providers, with `https://<project>.supabase.co/auth/v1/callback` as the
  redirect URI.
- `/auth/callback` — exchanges the code for a session.
- Sign-out in the sidebar, next to the existing nav.
- Email confirmations on in prod. Configure Site URL and the redirect allowlist
  in Supabase Auth → URL Configuration, or confirmation links point at localhost.

**Verify:** signed out, `/dashboard` redirects to `/login`. Signed in, it renders.
`curl` to `/api/quiz/accounts` without a cookie returns 401.

---

## 5. Phase 3 — Move state to Postgres ✅

**Depends on:** phase 2. **Built as** `src/lib/sync/local.ts` and `src/lib/sync/user-state.ts`, consumed by both contexts.

### 5.1 Approach: local-first, server-authoritative

Keep `localStorage` as a **cache**, not the store. The page paints instantly from
cache, then reconciles with the server. Losing the network degrades to
read-your-own-writes rather than a spinner.

1. **Keys are scoped by user.** `scopedKey()` turns `llg_ledger` into
   `llg_ledger::<uuid>`. Signed out, the bare key is used, which is what every
   existing install already holds. Without this, two accounts on one laptop
   read each other's cache.

2. **Hydrate on mount.** Paint from the scoped cache, then `select * from
   user_state where user_id = auth.uid()` and overwrite from the server.

3. **Write through, debounced.** Every setter writes cache immediately and
   `upsert`s to `user_state` after ~800ms of quiet. Batch the keys that change
   together.

4. **Last-write-wins on `updated_at`.** Two devices on the same account is the
   realistic conflict, not concurrent editing. Compare timestamps, take the
   newer, and do not build CRDTs for a learning app.

5. **One-time adoption.** On first authenticated load, if the *unscoped* legacy
   keys hold data and the server has none, upload them and mark them migrated.
   That way your own testing data survives the cutover.

### 5.2 Quiz history as rows

Alongside `user_state`, write the real tables:

- `GET /api/quiz/[track]` — insert a `quiz_attempts` row with the sampled ids at
  issue time, and put its id in the signed attempt token.
- `POST /api/quiz/grade` — after grading, insert `graded_answers` with the
  service-role client.
- Quiz completion — update the attempt row with `correct`, `total`, `passed`,
  `completed_at`.

`recordFinal` in the learning context stays as-is for the progress map; the rows
are the durable, queryable record next to it.

### 5.3 Video reports

Wire `onReportUnavailable` in [video-embed.tsx](src/components/learning/video-embed.tsx)
to `insert into video_reports`. Right now that button is a dead end. Reports are
the fastest signal that an approved question has rotted.

**Verify:** complete a lesson, sign out, sign in in a private window, see the
same progress. Two accounts on one browser see different data. Airplane mode,
answer a question, reconnect — it lands.

---

## 6. Phase 4 — Server hardening ✅

**Depends on:** phases 2–3. **Built.** `checkUserRateLimit` counts the table; headers are in `next.config.ts`.

### 6.1 Rate limiting that survives Lambda

The current limiter is a `Map` in one Node process. Amplify runs many Lambda
instances and recycles them; the limit effectively disappears. Its own comment
already says to move it to a shared store when the app scales horizontally
([rate-limit.ts:8](src/lib/learning/quiz/rate-limit.ts)).

Replace the IP key with the **user id**, and the `Map` with a count:

```sql
select count(*) from graded_answers
where user_id = $1 and created_at > now() - interval '1 hour';
```

Over 40 → 429 with `Retry-After`. No extra table, no extra service, and the
limit is now per-person rather than per-IP — which also fixes shared-NAT
testers throttling each other. Keep the `clientKey` helper for any route that
stays anonymous.

Also set a hard **monthly spend cap** in the Anthropic console. The limiter
bounds one user; the cap bounds the blast radius.

### 6.2 Secrets

| Variable | Where | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Amplify (secret) | Server only. Never `NEXT_PUBLIC_` |
| `QUIZ_ATTEMPT_SECRET` | Amplify (secret) | 32+ chars, `openssl rand -base64 32`. Rotating invalidates in-flight attempts |
| `SUPABASE_SERVICE_ROLE_KEY` | Amplify (secret) | Bypasses RLS. Route handlers only |
| `NEXT_PUBLIC_SUPABASE_URL` | Amplify | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Amplify | Public by design; RLS is what protects the data |
| `NEXT_PUBLIC_POSTHOG_KEY` | Amplify | Public by design |
| `TIKHUB_API_KEY` | **local only** | Ingestion is a laptop job. Never set in Amplify |

Separate keys per environment. Staging never points at the prod database.

### 6.3 Headers

Add to `next.config.ts`: HSTS, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.

A CSP has to allow the TikTok embed — `frame-src https://www.tiktok.com` — plus
PostHog and Supabase in `connect-src`. Ship it `Report-Only` first for a week;
a CSP that breaks the quiz embed is worse than no CSP.

**Verify:** grade 41 answers as one user inside an hour — the 41st is a 429.
`curl -I` on the domain shows the headers.

---

## 7. Phase 5 — PostHog ✅

**Depends on:** phase 2. **Built as** `src/lib/analytics/posthog.ts`, `src/lib/analytics/events.ts`, and `src/components/analytics/analytics-provider.tsx`. `posthog-js` is installed.

**Proxy it.** Add a rewrite in `next.config.ts` from `/ingest/*` to the PostHog
host and point the SDK at your own domain. Otherwise a routine ad blocker eats
the analytics from exactly the audience you are testing with.

**Privacy — decide this deliberately.** This app holds people's money. Turn
session replay **off**, or on with aggressive masking (`maskAllInputs: true`) and
never on the dashboard, spending, savings, or accounts routes. Never put a
balance, a goal amount, or an email into an event property. Learning behaviour is
what you need; income is not.

**Identify** with the Supabase user id on login, `posthog.reset()` on logout.

**Event taxonomy** — keep it small and stable:

| Event | Properties | Answers |
|---|---|---|
| `signed_up` / `signed_in` | method | Funnel top |
| `track_started` | track_id | Which track people pick first |
| `lesson_completed` | track_id, lesson_id, missed_count | Where lessons lose people |
| `quiz_started` | track_id, attempt_id | |
| `quiz_answer_graded` | track_id, question_id, score, verdict | **Which questions are broken** |
| `quiz_completed` | track_id, correct, total, passed, attempt_number | Pass rate per track |
| `video_reported_unavailable` | track_id, video_id | Pool rot |
| `tool_unlocked` | track_id | Does the gate motivate or block? |
| `action_step_completed` | track_id | Do people enter real data? |

`quiz_answer_graded` is the one that pays for the whole integration — cross that
with `graded_answers` and you get the question-level QA loop you are doing by
hand today.

Dashboards to build on day one: signup→first-lesson funnel, per-track pass rate,
per-question score distribution, drop-off by lesson.

**Verify:** events land in PostHog Live with the right `distinct_id`, and
`/ingest/*` returns 200 with an ad blocker on.

---

## 8. Phase 6 — Amplify, Route 53, and the video health check — build spec ✅, console work ⬜

**Depends on:** phases 1–5 merged to `main`. **`amplify.yml` and the workflow are written**; the console work below is not.

### 8.1 Build spec

`amplify.yml` in the repo root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run type-check
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

`type-check` before `build` means a type error fails the deploy in seconds
rather than after a full compile.

### 8.2 App setup

1. Amplify Console → **Create new app** → GitHub → `SoSaLay/ai-fix-my-money`.
2. Branch `main` → production. Amplify detects Next.js 15 and provisions
   **WEB_COMPUTE** (SSR on Lambda). Confirm it did — a static build silently
   breaks every route handler.
3. Set the environment variables from §6.2. Mark the three secrets as secret.
4. Optional but recommended: a `staging` branch pointing at `aifmm-staging`.
   Same pipeline, throwaway data.
5. Turn on **branch auto-build** so a push to `main` deploys. That matches how
   this repo already works.

**Node runtime.** The route handlers use `crypto` and `fs` and are `server-only`.
They must run on the Node runtime, not Edge. They do today; do not add
`export const runtime = 'edge'` to anything under `src/app/api/`.

### 8.3 Domain

1. Route 53 → register or transfer the domain (or delegate nameservers to it).
2. Amplify → **Domain management** → add domain → pick the Route 53 hosted zone.
   Amplify creates the ACM certificate and the validation records itself.
3. Map `main` → `aifixmymoney.com` and `www` → redirect to apex.
4. Wait for `AVAILABLE`. DNS propagation is minutes, occasionally an hour.
5. Update **Supabase Auth → URL Configuration** with the real Site URL and
   redirect allowlist, and the Google OAuth origins if used. Skipping this is the
   most common cause of "login worked in staging, breaks in prod".

### 8.4 The scheduled video health check

`npm run check-videos` re-checks every approved embed against TikTok's oEmbed
endpoint and flips dead ones to `unavailable`. It writes **repo files**, and
`assertWritable()` throws in production by design
([pool-files.ts:26](src/lib/learning/video-pool/pool-files.ts)) — so it cannot
run as a production Lambda without breaking the model where the pool's source of
truth is the git history.

**Do this instead:** a scheduled GitHub Action, weekly.

```yaml
# .github/workflows/check-videos.yml
on:
  schedule: [{ cron: '0 9 * * 1' }]   # Mondays, 09:00 UTC
  workflow_dispatch:
```

It runs the script, and if the JSON changed, commits straight to `main` — which
triggers an Amplify deploy carrying the corrected pool. The dead video is out of
circulation without anyone opening a console. A Lambda would need write access
to the repo to achieve the same thing, at more moving parts.

**Verify:** a push to `main` deploys green; `https://aifixmymoney.com` serves over
HTTPS; sign-up → email → dashboard works on the real domain.

---

## 9. Phase 7 — Launch gates

Go/no-go. Do not open the URL to testers with any of these red.

**G1 — Question bank (yours, in progress).** Every track needs **≥ 8 approved
videos** to serve a quiz at all, and **25** is the healthy target
([constants.ts](src/lib/learning/video-pool/constants.ts)). Below 8 the API
returns 503 and the learner hits a wall at the end of a track they just
finished. Current state: 0 approved across all four. Run `npm run check-videos`
and confirm zero `unavailable` in the approved set before the final deploy.

**G2 — Persistence.** Sign up, complete a lesson, pass a quiz, sign out, sign in
on a different device, and see it all. This is the entire promise of the release.

**G3 — Isolation.** Two accounts, same browser. Neither sees the other's
financial data. Confirmed at the RLS layer, not just visually.

**G4 — Grading.** Ten written answers spanning strong, partial and wrong. Scores
are sane, `reasoning` is written to the learner, and the guardrails hold — no
personal financial advice, no product recommendation, prompt injection in an
answer field ignored ([grader.ts](src/lib/learning/grading/grader.ts) SYSTEM).

**G5 — Cost.** Anthropic spend cap set. Rate limit verified against a live
deploy. One user cannot exceed 40 graded answers per hour.

**G6 — Legal.** [SETUP.md](docs/SETUP.md) is rewritten ✅ — it now states both
modes and says plainly that hosted figures live on our servers. **Still yours:**
Terms and Privacy at `/learning/disclosures/{terms,privacy}` say the same. They
were written for a local-only app; with accounts on, they need to cover stored
data, the analytics that are collected, and how someone deletes their account.

**G7 — Mobile.** The whole learning flow on a real phone. The quiz is 9:16 video;
most testers will be on a phone.

**G8 — Errors.** [error.tsx](src/app/error.tsx) and
[global-error.tsx](src/app/global-error.tsx) render something human on a 500.
Grader outages already fail soft as "could not grade right now" rather than as a
wrong answer — keep it that way.

---

## 10. Rollback

- **Bad deploy.** Amplify Console → the previous build → **Redeploy this
  version**. Under a minute.
- **Bad migration.** Roll forward with a corrective migration; never
  `drop table` on live user data. Supabase Pro keeps PITR — enable it before
  the first real tester, not after.
- **Grader on fire.** Unset `ANTHROPIC_API_KEY` in Amplify and redeploy: grading
  returns 502 and the learner is told to try again shortly. Nobody is scored
  wrongly.
- **Compromised secret.** Rotate in Amplify, redeploy. Rotating
  `QUIZ_ATTEMPT_SECRET` invalidates in-flight attempts — do it off-peak.

---

## 11. Running costs

Order-of-magnitude, for a tester cohort in the low hundreds:

| Service | Tier | Monthly |
|---|---|---|
| Amplify Hosting | Build minutes + SSR requests | $5–20 |
| Route 53 | Hosted zone + domain | ~$1 + registration |
| Supabase | Free → Pro when you need PITR | $0–25 |
| PostHog | Free tier covers 1M events | $0 |
| Anthropic | ~10 grades per quiz attempt, Sonnet | $10–50 |
| **Total** | | **~$15–95** |

Grading is the only cost that scales with usage, and it is bounded by the rate
limit and the spend cap.

---

## 12. Order of work

The code is written. What remains is the work that needs your accounts and your
question bank:

| # | Step | Blocks | Rough size |
|---|---|---|---|
| 1 | Create the two Supabase projects, apply `0001_init.sql` | everything | 1 hour |
| 2 | Put the keys in `.env.local`, sign up, click through | G2, G3 | 1 hour |
| 3 | Turn on email confirmation, set Site URL and redirects | G6 | 30 min |
| 4 | Create the PostHog project, drop the key in | — | 30 min |
| 5 | Connect Amplify to the repo, set the env vars | launch | 1 hour |
| 6 | Route 53 domain, ACM cert, update Supabase URLs | launch | 1 hour |
| 7 | Build the learner-facing quiz screen (ROADMAP §1.6) | G1, G4 | 2–3 days |
| 8 | **Question bank QA and approvals** | **G1** | in progress, yours |

Steps 1–6 are configuration and can be done in an afternoon. Step 7 is the last
piece of product work. Step 8 is what actually sets the launch date.

---

*Repository: https://github.com/SoSaLay/ai-fix-my-money*
