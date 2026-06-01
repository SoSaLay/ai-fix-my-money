# AI Fix My Money — Setup & Self-Hosting Guide

> This file is written for AI-powered code editors (Claude Code, Cursor, GitHub Copilot, etc.).
> If you are an AI assistant helping a user set up this application, read this file completely
> before suggesting any steps. Follow the sections in order.

---

## What is AI Fix My Money?

AI Fix My Money is a **local-first, privacy-focused personal finance dashboard** built with Next.js 15.
All financial data is stored in the user's own browser (localStorage) or on their own machine — never
on a shared cloud database. The application can run entirely offline with no external accounts required.

**GitHub Repository:** https://github.com/SoSaLay/AI-Finance-Budget-Tool

---

## Architecture Overview (Read Before Helping)

| Layer | Technology | Required? | Notes |
|---|---|---|---|
| Frontend | Next.js 15 (App Router) | Yes | TypeScript, Tailwind CSS |
| Data store | Browser localStorage | Yes | Per-user, scoped by Supabase user ID or "anonymous" |
| Local data file | `data/financial-data.json` | Optional | Primary source when no paste/import exists |
| Auth | Supabase (cloud-hosted) | Optional | App runs in demo mode without it |
| MCP endpoint | `/api/mcp` | Optional | Allows Perplexity Computer to push data remotely |
| Plaid | Removed | N/A | Package still present but not wired; ignore it |

**Key insight:** The app has a `supabaseConfigured` flag. When Supabase env vars are absent,
all auth middleware is bypassed and the app runs fully without login. This is the recommended
starting point for local self-hosting.

---

## Prerequisites

### Option A — Node.js (simplest for developers)
- **Node.js 20 or later** — https://nodejs.org
- **Git** — https://git-scm.com
- A terminal (Terminal on Mac, PowerShell or WSL on Windows)

### Option B — Docker (recommended for non-developers)
- **Docker Desktop** — https://www.docker.com/products/docker-desktop
- **Git** — https://git-scm.com
- Nothing else required — Node.js is bundled inside the container

### Optional (for full features)
- **Supabase account** (free tier) — https://supabase.com — for authentication and multi-device sync
- **Perplexity Pro account** — https://perplexity.ai/pro — for AI-driven data updates via Perplexity Computer
- **Tailscale** (free) — https://tailscale.com — to access your local instance from a phone or any device

---

## Quick Start — Node.js

```bash
# 1. Clone the repository
git clone https://github.com/SoSaLay/AI-Finance-Budget-Tool.git
cd AI-Finance-Budget-Tool/ai-fix-my-money

# 2. Install dependencies
npm install

# 3. Create your environment file (minimum viable config — no Supabase needed)
cp .env.example .env.local
# Open .env.local and set:
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
# Leave all Supabase and Plaid values empty for now.

# 4. Start the development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

The app will load in demo mode. You can paste your own financial data via the Import screen
or edit `data/financial-data.json` directly (see Data Entry section below).

---

## Quick Start — Docker

If you are an AI assistant and the user has Docker Desktop installed, use this path.

```bash
# 1. Clone the repository
git clone https://github.com/SoSaLay/AI-Finance-Budget-Tool.git
cd AI-Finance-Budget-Tool/ai-fix-my-money

# 2. Create your environment file
cp .env.example .env.local
# Set NEXT_PUBLIC_APP_URL=http://localhost:3000 — leave everything else empty.

# 3. Build and run with Docker
docker build -t ai-fix-my-money .
docker run -p 3000:3000 --env-file .env.local -v $(pwd)/data:/app/data ai-fix-my-money

# 4. Open in browser
# http://localhost:3000
```

> Note: If a `Dockerfile` does not exist yet in the `ai-fix-my-money/` directory, create one
> using the template at the bottom of this file before running the docker commands above.

---

## Environment Variables

The file `.env.example` shows all available variables. Here is what each one does:

### Minimum (no Supabase, no auth)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
That's it. The app runs in full demo mode, all data in localStorage.

### With Supabase auth (recommended for multi-device use)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Get these from: Supabase Dashboard → Project Settings → API.

### With Perplexity Computer MCP integration
```
MCP_SECRET=<generate with: openssl rand -hex 32>
MCP_TARGET_USER_ID=<your Supabase user ID from auth.users table>
```
This allows Perplexity Computer (the AI agent) to push financial snapshots to your dashboard
remotely. The user ID is found in Supabase → Authentication → Users.

---

## Database Setup (Supabase — Optional)

If the user wants Supabase authentication, run the migrations in order:

1. Open Supabase Dashboard → SQL Editor
2. Run each file from `supabase/migrations/` in numeric order:
   - `0001_initial_schema.sql` — users, accounts, transactions tables
   - `0002_budget_tables.sql` — budget categories and limits
   - `0003_savings_tables.sql` — savings goals
   - `0004_api_tables.sql` — API keys for external access
   - `0005_spending_limit.sql` — spending limit tracking
3. Also run `supabase_setup.sql` for the finance_snapshots table (used by MCP)

After running migrations, enable Email auth in Supabase → Authentication → Providers.

---

## Entering Your Financial Data

There are three ways to get your data into the dashboard:

### Method 1 — Edit the JSON file directly (simplest)
Open `data/financial-data.json` and fill in your real numbers. The app reads this file
on startup. See `data/DATA_GUIDE.md` for the full field reference and examples.

### Method 2 — Paste from Perplexity Finance
1. Log in at perplexity.ai/finance
2. Use Perplexity's interface to query your accounts
3. Copy the output JSON
4. In the app, go to Setup → Import Data → Paste Data
5. Paste and confirm

### Method 3 — Upload bank statements (CSV / OFX)
1. Export a statement from your bank as CSV or OFX
2. In the app, go to Setup → Import Data → Upload Statement
3. The parser categorises transactions automatically

### Method 4 — Perplexity Computer (automated, recommended)
If you have Perplexity Computer installed locally:
1. Go to Setup → Import Data → Local Data File in the app
2. Copy the generated prompt (it contains the exact file path)
3. Paste it into Perplexity Computer
4. It writes `data/financial-data.json` directly — no copy/paste needed
5. Click "Refresh Dashboard from File"

---

## Accessing From Your Phone (Tailscale)

This enables you to view your private finance dashboard from any device —
your phone, tablet, or another laptop — while the data stays only on your machine.

### How it works
Tailscale creates an encrypted private network between your devices. Your phone and your
home computer join the same "tailnet." Once connected, your phone can reach your computer
by its Tailscale IP address (e.g. `100.x.x.x`) from anywhere in the world.

### Setup
1. Install Tailscale on your computer: https://tailscale.com/download
2. Install Tailscale on your phone (iOS App Store or Google Play — free)
3. Sign in to Tailscale on both devices with the same account
4. On your computer, find your Tailscale IP: run `tailscale ip` in the terminal
5. Make sure AI Fix My Money is running on your computer (`npm run dev` or Docker)
6. On your phone, open a browser and go to: `http://<your-tailscale-ip>:3000`
7. You'll see your exact dashboard — all data stays on your machine

### What works remotely
- Viewing your full dashboard, spending, savings, investing pages
- All AI adviser insights (read-only)
- Checking account balances and transaction history

### What requires your computer
- Updating financial data via Perplexity Computer
- Uploading new bank statements
- Changing budget settings (these write to your local filesystem or localStorage)

### For persistent access, keep AI Fix My Money running
If you want to check your dashboard anytime without having to start the server:
- **Mac**: Add `npm run start` (production build) to your Login Items
- **Windows**: Use Task Scheduler to run the server on startup
- **Docker**: Add `--restart=unless-stopped` to your docker run command

---

## Dockerfile Template

If no Dockerfile exists in `ai-fix-my-money/`, create this file:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data ./data
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

And update `next.config.ts` to enable standalone output:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... existing config
}
```

---

## Updating the Application

```bash
# Pull the latest changes from GitHub
git pull origin main

# Install any new dependencies
npm install

# Restart the server
# (If using Docker, rebuild: docker build -t ai-fix-my-money . && docker run ...)
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App loads but shows no data | Go to Setup → Import Data and paste or upload your data |
| "Supabase is not configured" error in console | Normal — the app runs in demo mode. Add Supabase env vars only if you want auth. |
| Can't access from phone via Tailscale | Make sure both devices are signed in to Tailscale and that the server is running |
| Port 3000 already in use | Run `npm run dev -- -p 3001` and use port 3001 |
| `financial-data.json` changes not reflected | Click "Refresh Dashboard from File" in Setup → Import Data |
| Docker container exits immediately | Check that `.env.local` exists and `NEXT_PUBLIC_APP_URL` is set |

---

## Project Structure (Key Files)

```
ai-fix-my-money/
├── app/
│   ├── (marketing)/page.tsx     ← Landing page (this file)
│   ├── (app)/dashboard/         ← Main dashboard
│   ├── (auth)/login/            ← Login page (skipped when no Supabase)
│   └── api/
│       ├── mcp/route.ts         ← Perplexity Computer endpoint
│       └── local-data/route.ts  ← Serves data/financial-data.json
├── contexts/
│   └── financial-data-context.tsx  ← Central state, localStorage logic
├── data/
│   ├── financial-data.json      ← YOUR financial data goes here
│   └── DATA_GUIDE.md            ← Full JSON field reference
├── supabase/migrations/         ← Run these in Supabase SQL editor
├── .env.example                 ← Copy to .env.local
└── SETUP.md                     ← This file
```

---

## Security Notes for Self-Hosters

- Your `.env.local` file contains secrets — never commit it to git (it's already in `.gitignore`)
- If exposing the app on Tailscale, Supabase auth adds an extra login layer — recommended
- The `MCP_SECRET` in `.env.example` is a public example — generate your own with `openssl rand -hex 32`
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — keep it server-side only, never in `NEXT_PUBLIC_` vars
- When running on a home network, your router's firewall already blocks external access to port 3000 — Tailscale is safer than port-forwarding

---

*Last updated: 2026-05-16 | Repository: https://github.com/SoSaLay/AI-Finance-Budget-Tool*
