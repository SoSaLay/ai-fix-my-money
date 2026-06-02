<!-- HEADER -->
<div align="center">

```
 █████╗ ██╗    ███████╗██╗██╗  ██╗    ███╗   ███╗██╗   ██╗
██╔══██╗██║    ██╔════╝██║╚██╗██╔╝    ████╗ ████║╚██╗ ██╔╝
███████║██║    █████╗  ██║ ╚███╔╝     ██╔████╔██║ ╚████╔╝ 
██╔══██║██║    ██╔══╝  ██║ ██╔██╗     ██║╚██╔╝██║  ╚██╔╝  
██║  ██║██║    ██║     ██║██╔╝ ██╗    ██║ ╚═╝ ██║   ██║   
╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝   ╚═╝   
          M O N E Y
```

**A local-first, AI-powered personal finance dashboard.**  
Your data stays on your machine. No subscriptions. No cloud lock-in.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Local-first](https://img.shields.io/badge/data-stays_local-1a6b3a?style=flat-square)](#-what-is-this)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[**→ Setup Guide**](docs/SETUP.md) · [**→ AI Skills**](#-ai-finance-skills)

</div>

---

## ✨ What is this?

**AI Fix My Money** is a self-hosted personal finance dashboard built on Next.js 15. It gives you:

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
git clone https://github.com/SoSaLay/ai-fix-my-money.git
cd ai-fix-my-money

# 2. Install dependencies
npm install

# 3. (Optional) create an env file — only for opt-in integrations
cp .env.example .env.local   # safe to skip; the app needs no env vars

# 4. Start the app
npm run dev
```

Open **http://localhost:3000** — you're live.

> Want Docker instead? See [SETUP.md → Docker Quickstart](docs/SETUP.md#quick-start--docker).

---

## 🔑 Environment Variables

**The app runs with zero environment variables.** There are no accounts, no database, and no
cloud services — your data lives entirely in your browser. Copying `.env.example` to `.env.local`
is optional and only matters for the two opt-in integrations below.

### `.env.example` (main app)

```env
# Informational only — the URL the app runs on.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — only needed if you let an AI agent push data into the app via /api/mcp.
# This is the bearer token the agent must send. Generate your own:
#   openssl rand -hex 32
MCP_SECRET=replace_with_your_own_secret_openssl_rand_hex_32
```

### `mcp-server/.env.example` (Financial Datasets MCP server — optional)

```env
# Get your key from https://financialdatasets.ai/
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
```

> **Simplest setup:** skip the env file entirely and just run `npm run dev`. Everything works.

---

## 🤖 Deploy with an AI Agent (Claude Code / Cursor / Copilot)

If you use an AI coding agent, you can have it set up and deploy the entire project for you.

**Just paste this into your agent:**

```
Clone https://github.com/SoSaLay/ai-fix-my-money.git, read docs/SETUP.md
completely, then set up and run the app following the Node.js quickstart. Use only the minimum
env vars (NEXT_PUBLIC_APP_URL=http://localhost:3000). Open the app at http://localhost:3000 and
confirm it loads.
```

The `SETUP.md` file is written specifically for AI agents — it contains full architecture context, all setup steps in order, a Dockerfile template, and troubleshooting. Your agent will read it and handle everything end-to-end.

---

## 📁 Project Structure

```
ai-fix-my-money/              ← repo root
├── src/                      ← All app source
│   ├── app/                  ← Routes: landing, dashboard, advisor, api/mcp…
│   ├── components/           ← UI components
│   ├── lib/ai-skills.ts      ← All 13 AI advisor skills
│   └── contexts · hooks · types
├── data/financial-data.json  ← Your financial data goes here
├── public/                   ← Static assets
├── docs/                     ← SETUP.md, design.md, sample reports
├── mcp-server/               ← Financial Datasets MCP server (optional)
└── .env.example              ← Copy → .env.local (optional)
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

> **Note:** Savings and Spending skills compute real results from your own data. The Investing
> skills currently return **illustrative sample output** — they're placeholders for a planned
> integration with the open-source [alphaear suite](https://github.com/RKiding/Awesome-finance-skills)
> and are labelled as such in the UI. Treat them as a demo, not live market data.

---

## 📖 Full Documentation

For detailed setup instructions, Docker, Tailscale access from your phone, and troubleshooting — see the full guide:

**[docs/SETUP.md](docs/SETUP.md)**

---

<div align="center">

Built by [SoSaLay](https://github.com/SoSaLay) · MIT License

</div>
