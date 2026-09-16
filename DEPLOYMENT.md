# Deploying

AWS Amplify Hosting, with Route 53 for the domain. Amplify detects Next.js and
provisions **WEB_COMPUTE**, which runs the route handlers on Lambda.

There is no database and no auth provider to set up. Two environment variables
and a domain is the whole of it.

## 1. Connect the repo

Amplify Console → **Create new app** → connect this GitHub repo → branch `main`.

Amplify reads [`amplify.yml`](amplify.yml), which runs `npm ci`, then
`type-check`, then `build`. The type check is first so a type error fails in
seconds rather than after a full compile.

**Confirm the first build provisions WEB_COMPUTE, not a static export.** A
static build drops every `/api` route without failing loudly, and the symptom
is a final test that loads and then cannot fetch a paper.

## 2. Environment variables

Amplify Console → your app → **Hosting → Environment variables**. These only
take effect on a new build, so redeploy after adding them.

| Variable | Secret | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Marks written answers. Without it the final test cannot grade. |
| `QUIZ_ATTEMPT_SECRET` | yes | 32+ chars, `openssl rand -base64 32`. Rotating it invalidates in-flight attempts. |
| `NEXT_PUBLIC_POSTHOG_KEY` | no | Optional. Leave unset to collect nothing. |
| `NEXT_PUBLIC_POSTHOG_HOST` | no | Optional, defaults to `https://us.i.posthog.com`. |

Never set `TIKHUB_API_KEY` here. Ingestion is a laptop job; the deployed app
makes no TikHub calls.

**Never set `NODE_ENV`.** Next sets it to `production` itself during the build
and on Lambda. The `/admin` review area is gated on it in three separate places
— the layout, the write route, and `assertWritable()` — so setting it to
`development` in the console would open all three at once.

## 3. Set the spend cap

Anthropic Console → **Settings → Limits** → a monthly cap on the key.

This is not optional housekeeping. There are no accounts, so `/api/quiz/grade`
cannot tell one visitor from another; the rate limiter is a `Map` in one Lambda
process, keyed on a client-supplied `x-forwarded-for`, and it resets every time
an instance recycles. The cap is the only thing that actually bounds the bill.

## 4. Domain

Amplify Console → **Hosting → Custom domains** → add the domain. If the hosted
zone is in the same account, Amplify writes the Route 53 records and issues the
certificate itself. DNS propagation is usually minutes.

## After deploying

Walk one track end to end on the live site:

- A lesson reads, and its questions unlock after the timer.
- The tool step accepts numbers and the dashboard reflects them.
- The final test draws a paper, a written answer comes back marked with its
  reasoning, and passing unlocks that track's tool.
- Reload. Progress is still there — it is in local storage.

Then `curl -I` the domain and confirm HSTS, `X-Content-Type-Options`,
`X-Frame-Options` and `Permissions-Policy` are present. They are set in
[`next.config.ts`](next.config.ts).

## What is not set up

**A Content-Security-Policy.** There isn't one yet. It has to allow the TikTok
embed (`frame-src https://www.tiktok.com`) plus PostHog in `connect-src`. Ship
it `Report-Only` for a week first — a CSP that silently breaks the embeds is
worse than no CSP.

**Anything that outlives a browser.** No accounts, no server copy of progress,
no record of who passed what. If that changes, it is a database and a sign-in
flow, and the storage layer in `src/lib/storage/local.ts` is the seam it would
go behind.

## The weekly job

[`.github/workflows/check-videos.yml`](.github/workflows/check-videos.yml) asks
TikTok's oEmbed endpoint whether each approved video still exists and commits
the retirements on Mondays. That commit triggers an Amplify deploy carrying the
corrected pool.

It runs in CI rather than on Lambda because the pool is files in the repo and
production cannot write them. Its output is a diff, which is also the record of
what changed and when.
