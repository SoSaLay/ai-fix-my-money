# AI Fix My Money — Setup Guide

> This file is written for AI-powered code editors (Claude Code, Cursor, GitHub Copilot, etc.).
> If you are an AI assistant helping a user set up this application, read this file completely
> before suggesting any steps. Follow the sections in order.

---

## What is AI Fix My Money?

AI Fix My Money is a **local-first, privacy-focused personal finance dashboard** built with Next.js 15.
All financial data is stored entirely in your own browser's localStorage — it never leaves your machine
and is never sent to any external server. No accounts, no login, no cloud database required.

**GitHub Repository:** https://github.com/SoSaLay/ai-fix-my-money

---

## Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) | TypeScript, Tailwind CSS |
| Data store | Browser localStorage | All data lives here — persists across server restarts |
| Local data file | `data/financial-data.json` | Alternative way to seed your data |
| Auth | None | No login, no accounts — open and use |
| MCP endpoint | `/api/mcp` | Allows Perplexity Computer to push data locally |

**Key insight:** There is no authentication. The app opens directly to the dashboard.
Your data persists in localStorage and survives browser closes and server restarts —
it only goes away if you manually clear your browser data or click "Clear Data" in the app.

---

## Prerequisites

### Option A — Node.js (recommended)
- **Node.js 20 or later** — https://nodejs.org
- **Git** — https://git-scm.com
- A terminal (Terminal on Mac, PowerShell or WSL on Windows)

### Option B — Docker
- **Docker Desktop** — https://www.docker.com/products/docker-desktop
- **Git** — https://git-scm.com

---

## Quick Start — Node.js

```bash
# 1. Clone the repository
git clone https://github.com/SoSaLay/ai-fix-my-money.git
cd ai-fix-my-money

# 2. Install dependencies
npm install

# 3. (Optional) Create an environment file
cp .env.example .env.local
# The app works fine without any env vars. The only optional setting is MCP_SECRET
# (see Environment Variables below) for the AI-agent data-push endpoint.

# 4. Start the development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

You'll land directly on the dashboard. Go to **Setup → Import Data** to add your financial data.

> **Important:** Always use the same port (default: 3000). If you switch ports, the browser
> treats it as a different site and your localStorage data won't carry over.

---

## Quick Start — Docker

```bash
# 1. Clone the repository
git clone https://github.com/SoSaLay/ai-fix-my-money.git
cd ai-fix-my-money

# 2. (Optional) Create an environment file
cp .env.example .env.local

# 3. Build and run
docker build -t ai-fix-my-money .
docker run -p 3000:3000 --env-file .env.local ai-fix-my-money

# 4. Open in browser
# http://localhost:3000
```

---

## Environment Variables

The app runs with **zero environment variables**. There is exactly one optional variable,
and it's only needed if you expose the MCP data-push endpoint to an AI agent:

```
# Optional — only for the MCP / Perplexity Computer integration (/api/mcp).
# This is the bearer token an agent must send to push data into the app.
# Generate your own: openssl rand -hex 32
MCP_SECRET=<your-generated-secret>
```

There are no Supabase variables, no database URLs, no auth secrets, and no AI-provider
keys. The AI Advisor skills run locally against your own financial data (see note below).

---

## How Your Data is Stored

All data is saved to your **browser's localStorage** under the origin `http://localhost:3000`.

- Data **persists** when you stop the dev server
- Data **persists** when you close the browser or restart your computer
- Data does **not** sync to other devices or browsers
- Data is **lost** if you clear your browser's site data for localhost, or click "Clear Data" in the app
- Data is **isolated** per port — switching from port 3000 to 3001 means a fresh slate

To back up your data, use the export feature in the app (if available), or open DevTools →
Application → localStorage → copy the `llg_financial_data` value.

---

## Entering Your Financial Data

### Method 1 — Paste from Perplexity Finance (recommended)
1. Go to perplexity.ai/finance and query your accounts
2. Copy the output JSON
3. In the app, go to **Setup → Import Data → Paste Data**
4. Paste and confirm — your dashboard populates instantly

### Method 2 — Edit the JSON file directly
Open `data/financial-data.json` and fill in your real numbers.
See `data/DATA_GUIDE.md` for the full field reference and examples.
Then go to **Setup → Import Data → Local Data File** and click "Refresh Dashboard from File."

### Method 3 — Upload bank statements (CSV / OFX)
1. Export a statement from your bank as CSV or OFX
2. In the app, go to **Setup → Import Data → Upload Statement**
3. The parser categorises transactions automatically

### Method 4 — Perplexity Computer (automated)
If you have Perplexity Computer installed locally:
1. Go to **Setup → Import Data → Local Data File**
2. Copy the generated prompt (it contains the exact file path)
3. Paste it into Perplexity Computer
4. It writes `data/financial-data.json` directly — no copy/paste needed
5. Click "Refresh Dashboard from File"

---

## Accessing From Your Phone (Tailscale)

Since all data lives in your local browser, viewing from another device shows a fresh instance
of the app — it won't have your data. However, you can view your dashboard from your phone by
accessing your computer's running server over Tailscale.

### Setup
1. Install Tailscale on your computer: https://tailscale.com/download
2. Install Tailscale on your phone (iOS App Store or Google Play — free)
3. Sign in to Tailscale on both devices with the same account
4. Find your Tailscale IP: run `tailscale ip` in the terminal
5. Make sure the app is running (`npm run dev`)
6. On your phone, open a browser and go to: `http://<your-tailscale-ip>:3000`

> Note: When viewing from your phone via Tailscale, the data displayed comes from your
> computer's browser localStorage — not your phone's. Your phone is just a window into
> the server running on your computer.

### For persistent access, keep the server running
- **Mac**: Add `npm run start` (production build) to your Login Items
- **Windows**: Use Task Scheduler to run the server on startup
- **Docker**: Add `--restart=unless-stopped` to your docker run command

---

## Updating the Application

```bash
git pull origin main
npm install
# Restart the server — your localStorage data is unaffected by updates
```

---

## Dockerfile Template

If no Dockerfile exists, create this file in the repo root:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

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

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App loads but shows no data | Go to Setup → Import Data and paste or upload your data |
| Data disappeared after switching ports | Switch back to port 3000 — localStorage is port-specific |
| Can't access from phone via Tailscale | Make sure both devices are signed in to Tailscale and the server is running |
| Port 3000 already in use | Run `npm run dev -- -p 3001` — but stick to this port going forward |
| `financial-data.json` changes not reflected | Click "Refresh Dashboard from File" in Setup → Import Data |

---

## Project Structure (Key Files)

```
ai-fix-my-money/
├── app/
│   ├── (marketing)/page.tsx        ← Landing page
│   ├── (app)/dashboard/            ← Main dashboard
│   └── api/
│       ├── mcp/route.ts            ← Perplexity Computer endpoint
│       └── local-data/route.ts     ← Serves data/financial-data.json
├── contexts/
│   └── financial-data-context.tsx  ← All state + localStorage logic
├── data/
│   ├── financial-data.json         ← Your financial data (optional method)
│   └── DATA_GUIDE.md               ← Full JSON field reference
├── .env.example                    ← Copy to .env.local (optional)
└── SETUP.md                        ← This file
```

---

## About the AI Advisor

The AI Advisor page runs **13 skills** across Savings, Spending, and Investing tabs. They
analyse the financial data already in your browser and need no external API or network call.

- **Savings & Spending skills** compute real results directly from your numbers (savings rate,
  emergency-fund coverage, category breakdowns, subscription audit, etc.).
- **Investing skills** (Market News Brief, Sentiment, Forecast, Signal Tracker, Full Report)
  currently return **illustrative sample output**. They are placeholders for a planned
  integration with the open-source [alphaear suite](https://github.com/RKiding/Awesome-finance-skills)
  and are clearly labelled in the UI. Treat their output as a demo, not live market data.

---

## Security Notes

- No data is ever sent to an external server — everything stays on your machine
- Your `.env.local` file may contain AI API keys — never commit it to git (already in `.gitignore`)
- The `MCP_SECRET` in `.env.example` is a placeholder — generate your own with `openssl rand -hex 32`
- When running on a home network, your router's firewall blocks external access to port 3000 by default

---

*Last updated: 2026-06-01 | Repository: https://github.com/SoSaLay/ai-fix-my-money*
