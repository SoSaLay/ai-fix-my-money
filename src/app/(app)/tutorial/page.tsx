'use client'

import Link from 'next/link'
import {
  CheckCircle2,
  ArrowRight,
  Upload,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Copy,
  ExternalLink,
  PieChart,
  PiggyBank,
  TrendingUp,
} from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  number: string
  title: string
  description: string
  detail: React.ReactNode
  color: string
  icon: React.ReactNode
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    number: '01',
    icon: <CheckCircle2 size={22} />,
    color: '#1a6b3a',
    title: "You're already in",
    description: 'The app is running on your machine. Your data never leaves it.',
    detail: (
      <div className="flex flex-col gap-2">
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          AI Fix My Money runs entirely on <strong className="text-on-surface">localhost</strong>, your own computer.
          No cloud, no accounts, no subscriptions needed for the app itself.
          Everything you do here stays in your browser's local storage.
        </p>
        <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl" style={{ background: 'rgba(26,107,58,0.08)' }}>
          <ShieldCheck size={14} style={{ color: '#1a6b3a' }} className="flex-shrink-0" />
          <p className="text-label-sm" style={{ color: '#1a6b3a' }}>
            Your financial data is stored only on this device. Nobody else can see it.
          </p>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: <ExternalLink size={22} />,
    color: '#4c49c9',
    title: 'Get Perplexity Pro',
    description: 'Perplexity Computer is what pulls your real financial data automatically.',
    detail: (
      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          To automatically import your real accounts, balances, and transactions, you need access to{' '}
          <strong className="text-on-surface">Perplexity Computer</strong>, an AI agent that can
          browse your financial accounts on your behalf and write the data directly into this app.
        </p>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Perplexity Computer is included with a <strong className="text-on-surface">Perplexity Pro</strong> subscription.
          And it's worth knowing: Pro gives you a lot more than just this app. You get access to
          a powerful suite of AI tools, the ability to query financial data across your accounts,
          real-time research, and deep integrations with services like Plaid for a complete view
          of your finances. It's genuinely one of the most useful AI subscriptions available right now.
        </p>
        <a
          href="https://www.perplexity.ai/hub/blog/plaid-integration-provides-full-view-of-personal-finances"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-label-sm font-medium transition-all hover:opacity-70 w-fit"
          style={{ color: '#4c49c9' }}
        >
          See what Perplexity Finance can do
          <ExternalLink size={13} />
        </a>
        <div className="flex gap-3">
          <a
            href="https://perplexity.ai/pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-semibold w-fit transition-all hover:opacity-80"
            style={{ background: '#4c49c9', color: '#fff' }}
          >
            Get Perplexity Pro
            <ExternalLink size={14} />
          </a>
        </div>
        <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(76,73,201,0.07)' }}>
          <p className="text-label-sm text-on-surface-variant">
            <strong className="text-on-surface">Don't have Perplexity Pro yet?</strong> You can still
            manually enter your data. Go to <strong>Import Data &rsaquo; Enter Manually</strong> in the sidebar.
            You won't get the automated flow, but the rest of the app works exactly the same.
          </p>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    icon: <Copy size={22} />,
    color: '#ff9817',
    title: 'Grab the import prompt',
    description: 'One click copies everything Perplexity Computer needs to know.',
    detail: (
      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          In the sidebar, click <strong className="text-on-surface">Import Data</strong>.
          On the next screen, select <strong className="text-on-surface">Local Data File</strong>.
        </p>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          You'll see a pre-written prompt that tells Perplexity Computer exactly what to do:
          which accounts to look at, how to format the data, and where to save it on your machine.
          Click <strong className="text-on-surface">"Copy Prompt for Perplexity Computer"</strong>.
        </p>
        <div className="flex items-start gap-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,152,23,0.08)' }}>
          <Sparkles size={14} style={{ color: '#ff9817' }} className="flex-shrink-0 mt-0.5" />
          <p className="text-label-sm" style={{ color: '#b36200' }}>
            The prompt already includes the exact file path where data should be saved.
            you don't need to change anything. Just copy and paste it as-is.
          </p>
        </div>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-semibold w-fit transition-all hover:opacity-80"
          style={{ background: '#ff9817', color: '#fff' }}
        >
          <Upload size={14} />
          Go to Import Data
        </Link>
      </div>
    ),
  },
  {
    number: '04',
    icon: <BrainCircuit size={22} />,
    color: '#4c49c9',
    title: 'Run it in Perplexity Computer',
    description: 'Paste the prompt and let the AI do the heavy lifting.',
    detail: (
      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Open <strong className="text-on-surface">Perplexity Computer</strong> on your machine and paste the prompt you just copied.
          Perplexity will:
        </p>
        <ol className="flex flex-col gap-2">
          {[
            'Find this project folder on your computer',
            'Access your financial accounts (bank, credit cards, investments)',
            'Compile your balances, income, expenses, and subscriptions',
            'Write the data directly into the app. No copy/paste from you.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5"
                style={{ background: '#4c49c9', color: '#fff', fontSize: '0.65rem' }}
              >
                {i + 1}
              </span>
              <p className="text-body-sm text-on-surface-variant leading-snug">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Once it confirms the file is written, go back to{' '}
          <strong className="text-on-surface">Import Data → Local Data File</strong> and click{' '}
          <strong className="text-on-surface">"Refresh Dashboard from File"</strong>.
          Your real numbers will appear instantly.
        </p>
      </div>
    ),
  },
  {
    number: '05',
    icon: <Sparkles size={22} />,
    color: '#1a6b3a',
    title: "You're set. Here's what to explore.",
    description: "Your full financial picture is now live. Here's how to get the most out of it.",
    detail: (
      <div className="flex flex-col gap-4">
        {[
          {
            icon: <PieChart size={16} />,
            color: '#ff9817',
            href: '/spending',
            label: 'Spending',
            desc: 'See exactly where your money goes every month. Spot subscriptions you forgot about and categories that are quietly draining you.',
          },
          {
            icon: <PiggyBank size={16} />,
            color: '#1a6b3a',
            href: '/savings',
            label: 'Savings',
            desc: 'Set savings goals and allocate a percentage of your income toward each one. Lock in your targets so the app tracks your progress.',
          },
          {
            icon: <TrendingUp size={16} />,
            color: '#4c49c9',
            href: '/investing',
            label: 'Investing',
            desc: 'Allocate a portion of your income to investments and see how your portfolio is positioned relative to your goals.',
          },
          {
            icon: <BrainCircuit size={16} />,
            color: '#4c49c9',
            href: '/advisor',
            label: 'AI Adviser',
            desc: 'Ask anything about your money. It knows your real numbers, not generic advice. Ask things like "Am I saving enough?" or "Where can I cut back?"',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm group"
            style={{ borderColor: 'rgba(172,173,177,0.25)', background: 'var(--md-sys-color-surface-container-lowest,#fffbfe)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${item.color}12`, color: item.color }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-lg font-semibold text-on-surface mb-0.5 group-hover:text-secondary transition-colors">{item.label}</p>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
            <ArrowRight size={15} className="text-on-surface-variant flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Tutorial" />

      <div className="flex-1 px-8 pb-16 pt-8 max-w-2xl w-full mx-auto flex flex-col gap-3">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-display-sm text-on-surface font-bold leading-tight mb-2">
            Get up and running
          </h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">
            AI Fix My Money turns your real financial data into a clear, private dashboard.
            no banks, no subscriptions, no third-party access. Here's how to make it work for you.
          </p>
        </div>

        {/* Steps */}
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'rgba(172,173,177,0.2)' }}
          >
            {/* Step header */}
            <div
              className="flex items-center gap-4 px-6 py-5"
              style={{ background: `${step.color}08` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${step.color}18`, color: step.color }}
              >
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-label-sm font-bold tracking-widest uppercase"
                    style={{ color: step.color, opacity: 0.7 }}
                  >
                    Step {step.number}
                  </span>
                </div>
                <p className="text-title-md text-on-surface font-semibold leading-snug">{step.title}</p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{step.description}</p>
              </div>
            </div>

            {/* Step detail */}
            <div className="px-6 py-5 bg-surface-container-lowest/60">
              {step.detail}
            </div>

            {/* Connector line between steps */}
            {index < STEPS.length - 1 && (
              <div className="flex justify-center py-1" style={{ background: 'rgba(172,173,177,0.08)' }}>
                <div className="w-px h-4" style={{ background: 'rgba(172,173,177,0.3)' }} />
              </div>
            )}
          </div>
        ))}

        {/* Footer CTA */}
        <div
          className="mt-6 rounded-2xl p-6 flex flex-col gap-4 text-center"
          style={{ background: 'rgba(76,73,201,0.06)', border: '1px solid rgba(76,73,201,0.12)' }}
        >
          <p className="text-title-md text-on-surface font-semibold">Ready to see your real numbers?</p>
          <p className="text-body-sm text-on-surface-variant">
            Import your data now and your full financial dashboard goes live in minutes.
          </p>
          <div className="flex justify-center">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-label-lg transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}
            >
              <Upload size={16} />
              Import My Data
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
