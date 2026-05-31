<!-- HEADER -->
<div align="center">

```
██╗     ██╗   ██╗███╗   ███╗██╗███╗   ██╗ ██████╗ ██╗   ██╗███████╗
██║     ██║   ██║████╗ ████║██║████╗  ██║██╔═══██╗██║   ██║██╔════╝
██║     ██║   ██║██╔████╔██║██║██╔██╗ ██║██║   ██║██║   ██║███████╗
██║     ██║   ██║██║╚██╔╝██║██║██║╚██╗██║██║   ██║██║   ██║╚════██║
███████╗╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║╚██████╔╝╚██████╔╝███████║
╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝
                    L E D G E R
```

**A local-first, AI-powered personal finance dashboard.**  
Your data stays on your machine. No subscriptions. No cloud lock-in.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-optional-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[**→ Live Demo**](https://github.com/SoSaLay/AI-Finance-Budget-Tool) · [**→ Setup Guide**](luminous-ledger/SETUP.md)

</div>

---

## ✨ What is this?

Luminous Ledger is a **self-hosted personal finance dashboard** built on Next.js 15. It gives you:

- 📊 **Spending, savings, and investing dashboards** with real-time charts
- 🤖 **AI Finance Advisor** with 13 runnable skills across spending, savings, and investing
- 🏦 **Bank statement import** — paste from Perplexity Finance, upload CSV/OFX, or edit JSON directly
- 🔒 **Privacy-first** — all data lives in your browser (localStorage) or local filesystem, never on a shared server
- 📡 **MCP endpoint** — lets AI agents (Claude, Perplexity Computer) push data to your dashboard automatically

---

## 🚀 Quickstart — 4 steps

> **Prerequisites:** Node.js 20+ and Git. That's it.

```bash
# 1. Clone the repo
git clone https://github.com/SoSaLay/AI-Finance-Budget-Tool.git
cd AI-Finance-Budget-Tool/luminous-ledger

# 2. Install dependencies
npm install

# 3. Set up your environment file
cp .env.example .env.local
# → Open .env.local and fill in your values (see section below)

# 4. Start the app
npm run dev
```

Open **http://localhost:3000** — you're live.

> Want Docker instead? See [SETUP.md → Docker Quickstart](luminous-ledger/SETUP.md#quick-start--docker).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill it in. Here's what each variable does:

### `luminous-ledger/.env.example`

```env
# ─── Supabase (optional — only needed for login + multi-device sync) ──────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get all three from: Supabase Dashboard → Project Settings → API
# Leave blank to run in demo mode (no login required).

# ─── App URL ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── MCP secret (optional — only needed for AI agent data push) ───────────────
# This is the bearer token AI agents send when pushing data to your dashboard.
# Generate your own: openssl rand -hex 32
MCP_SECRET=replace_with_your_own_generated_secret

# This is your Supabase user ID (find it in Supabase → Authentication → Users).
MCP_TARGET_USER_ID=replace_with_your_supabase_user_uuid
```

### `mcp-server/.env.example` (Financial Datasets MCP server — optional)

```env
# Get your key from https://financialdatasets.ai/
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
```

### `mcp-local/.env.example` (Local MCP bridge — optional)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MCP_TARGET_USER_ID=your-supabase-user-uuid
```

> **The simplest setup:** set only `NEXT_PUBLIC_APP_URL=http://localhost:3000` and leave everything else blank. The app runs in full demo mode with no login.

---

## 🤖 Deploy with an AI Agent (Claude Code / Cursor / Copilot)

If you use an AI coding agent, you can have it set up and deploy the entire project for you.

**Just paste this into your agent:**

```
Clone https://github.com/SoSaLay/AI-Finance-Budget-Tool.git, read luminous-ledger/SETUP.md
completely, then set up and run the app following the Node.js quickstart. Use only the minimum
env vars (NEXT_PUBLIC_APP_URL=http://localhost:3000). Open the app at http://localhost:3000 and
confirm it loads.
```

The `SETUP.md` file is written specifically for AI agents — it contains full architecture context, all setup steps in order, a Dockerfile template, database migration instructions, and troubleshooting. Your agent will read it and handle everything end-to-end.

> **For Supabase + MCP setup:** provide your Supabase URL, anon key, service role key, and user ID in the prompt above. The agent will wire them up correctly.

---

## 📁 Project Structure

```
AI-Finance-Budget-Tool/
├── luminous-ledger/          ← Main Next.js app (start here)
│   ├── app/
│   │   ├── (marketing)/      ← Landing page
│   │   ├── (app)/            ← Dashboard, spending, savings, investing, advisor
│   │   └── api/mcp/          ← MCP endpoint for AI agent data push
│   ├── components/           ← UI components
│   ├── lib/ai-skills.ts      ← All 13 AI advisor skills
│   ├── data/financial-data.json  ← Your financial data goes here
│   ├── .env.example          ← Copy → .env.local
│   └── SETUP.md              ← Full self-hosting guide (also used by AI agents)
│
├── mcp-server/               ← Financial Datasets MCP server (stock/crypto data)
│   ├── server.py
│   └── .env.example
│
└── mcp-local/                ← Local MCP bridge (Supabase data push)
    └── .env.example
```

---

## 🧠 AI Finance Skills

The **AI Advisor** has 13 runnable skills across three tabs:

| Tab | Skill | What it does |
|---|---|---|
| 💰 Savings | Savings Rate Analysis | Benchmarks your rate against 20% and shows the gap |
| 💰 Savings | Emergency Fund Check | How many months of expenses you have covered |
| 💰 Savings | Cash Flow Deep Dive | Breaks income into fixed / variable / subs / saved |
| 💰 Savings | Goal Pacing Report | Projects your annual savings and 5-year trajectory |
| 🛒 Spending | Spending Breakdown | Ranks every category and spots the biggest leaks |
| 🛒 Spending | Subscription Audit | Flags unused or redundant subscriptions to cut |
| 🛒 Spending | Fixed Cost Ratio | How much income is locked in non-negotiable expenses |
| 🛒 Spending | Cost Reduction Tips | Personalized cuts based on your actual spend pattern |
| 📈 Investing | Market News Brief | Aggregates latest headlines from 10+ financial sources |
| 📈 Investing | Market Sentiment | FinBERT sentiment score across financial news |
| 📈 Investing | Market Forecast | Kronos time-series 30-day projection with volatility overlay |
| 📈 Investing | Investment Signal Tracker | Tracks whether your thesis signals are strengthening or weakening |
| 📈 Investing | Full Investment Report | Portfolio grade, net worth trajectory, and next steps |

---

## 📖 Full Documentation

For detailed setup instructions, Docker, database migrations, Tailscale access from your phone, and troubleshooting — see the full guide:

**[luminous-ledger/SETUP.md](luminous-ledger/SETUP.md)**

---

<div align="center">

Built by [SoSaLay](https://github.com/SoSaLay) · MIT License

</div>
