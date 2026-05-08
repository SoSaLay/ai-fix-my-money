import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Zap, BarChart2, BrainCircuit,
  Link2, Upload, CheckCircle2, PieChart, PiggyBank,
  TrendingUp, Sparkles, ExternalLink,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// UI MOCKUP COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(76,73,201,0.12), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ background: '#ececec', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
      </div>
      {children}
    </div>
  )
}

function DashboardMockup() {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
  const bars   = [58, 72, 48, 85, 63, 78, 54, 90]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transactions = [
    { name: 'Direct Deposit',  cat: 'Income',       amt: '+$4,100', color: '#1a6b3a' },
    { name: 'Whole Foods',      cat: 'Groceries',    amt: '-$84',    color: '#5a5b60' },
    { name: 'Netflix',          cat: 'Subscription', amt: '-$16',    color: '#5a5b60' },
    { name: 'Shell Gas Station',cat: 'Transport',    amt: '-$62',    color: '#5a5b60' },
  ]
  const navItems = ['Dashboard', 'Accounts', 'Spending', 'Savings', 'Investing', 'AI Adviser']

  return (
    <BrowserChrome>
      <div style={{ display: 'flex', background: '#f6f6fb', height: 380 }}>

        {/* Sidebar */}
        <div style={{ width: 150, background: '#fff', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2, borderRight: '1px solid #e7e8ee', flexShrink: 0 }}>
          <div style={{ padding: '4px 10px 14px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2d2f33', lineHeight: 1.2 }}>Luminous Ledger</div>
            <div style={{ fontSize: '0.52rem', color: '#acadb1', letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>Premium AI Finance</div>
          </div>
          {navItems.map(item => (
            <div key={item} style={{ padding: '6px 10px', borderRadius: 10, fontSize: '0.67rem', fontWeight: 500, background: item === 'Dashboard' ? 'rgba(76,73,201,0.1)' : 'transparent', color: item === 'Dashboard' ? '#4c49c9' : '#5a5b60' }}>
              {item}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2d2f33' }}>Dashboard</span>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e7e8ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#5a5b60' }}>U</div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Net Cash Flow',    value: '+$4,358', trend: '↑ 12% vs last mo', color: '#1a6b3a' },
              { label: 'Monthly Income',   value: '$8,200',  trend: '↑ $300 vs last mo', color: '#4c49c9' },
              { label: 'Monthly Spending', value: '$3,842',  trend: '↓ 8% vs last mo',  color: '#ff9817' },
            ].map(c => (
              <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', boxShadow: '0 2px 12px rgba(76,73,201,0.05)' }}>
                <div style={{ fontSize: '0.57rem', color: '#acadb1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: '0.55rem', color: '#5a5b60', marginTop: 3 }}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Chart + recent transactions side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>

            {/* Bar chart */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 12px rgba(76,73,201,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#2d2f33' }}>Spending Trend</span>
                <span style={{ fontSize: '0.55rem', color: '#acadb1', background: '#f0f0f6', padding: '2px 7px', borderRadius: 5 }}>8 months</span>
              </div>
              <svg width="100%" height="90" viewBox="0 0 240 90">
                <defs>
                  <linearGradient id="mg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c7ae8" />
                    <stop offset="100%" stopColor="#ff9817" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                {bars.map((h, i) => (
                  <rect key={i} x={i * 30 + 2} y={90 - h} width={22} height={h} rx={5}
                    fill={i === bars.length - 1 ? 'url(#mg1)' : 'rgba(76,73,201,0.13)'} />
                ))}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {months.map(m => <span key={m} style={{ fontSize: '0.52rem', color: '#acadb1' }}>{m}</span>)}
              </div>
            </div>

            {/* Recent transactions */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 2px 12px rgba(76,73,201,0.05)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#2d2f33', marginBottom: 6 }}>Recent Activity</span>
              {transactions.map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f6' }}>
                  <div>
                    <div style={{ fontSize: '0.63rem', fontWeight: 500, color: '#2d2f33' }}>{t.name}</div>
                    <div style={{ fontSize: '0.55rem', color: '#acadb1' }}>{t.cat}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: t.color }}>{t.amt}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// PAGE DATA
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    icon: <Link2 size={20} />,
    title: 'Connect via Perplexity Finance',
    body: 'Perplexity Finance uses Plaid to securely link your bank accounts and cards, letting you query balances and transactions in plain English.',
    note: 'Works best with a Perplexity Pro account.',
    color: '#4c49c9',
  },
  {
    number: '02',
    icon: <Upload size={20} />,
    title: 'Import Your Data',
    body: 'Export your statements from Perplexity Finance and upload them here. Transactions, balances, and categories are parsed automatically.',
    note: null,
    color: '#ff9817',
  },
  {
    number: '03',
    icon: <BrainCircuit size={20} />,
    title: 'Get AI Insights',
    body: 'Specialised AI workflows analyse your spending, savings, and investments — every insight grounded in your real numbers.',
    note: null,
    color: '#1a6b3a',
  },
]

const BENEFITS = [
  { icon: <PieChart size={20} />,   label: 'Spending',   benefit: 'See exactly where every dollar goes — categories, subscriptions, and waste.' },
  { icon: <PiggyBank size={20} />,  label: 'Savings',    benefit: 'Track your savings rate and emergency fund health at a glance.' },
  { icon: <TrendingUp size={20} />, label: 'Investing',  benefit: 'Real-time market signals and portfolio analysis, no guesswork.' },
  { icon: <BarChart2 size={20} />,  label: 'Budgeting',  benefit: 'Set limits, track categories, and stay in control — no spreadsheets.' },
]

const PROOF_POINTS = [
  'Plaid-grade bank connectivity via Perplexity Finance',
  'AI analysis grounded in your real transactions',
  'Spending, savings & investing — one unified view',
  'Your data stays private — never shared or sold',
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto w-full">
        <div>
          <p className="text-headline-sm text-on-surface font-bold">Luminous Ledger</p>
          <p className="text-label-sm text-on-surface-variant tracking-widest uppercase">AI Finance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="secondary" className="px-5 py-2.5 text-label-lg">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" className="px-5 py-2.5 text-label-lg">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center gap-6 px-6 pt-14 pb-16 max-w-3xl mx-auto w-full">
        <span className="rounded-full px-4 py-1.5 text-label-sm font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(76,73,201,0.08)', color: '#4c49c9' }}>
          Inspired by Perplexity Finance + Plaid
        </span>

        <h1 className="text-display-lg text-on-surface">
          Your money,{' '}
          <span style={{ background: 'linear-gradient(135deg, #4c49c9, #ff9817)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            finally intelligent.
          </span>
        </h1>

        <p className="text-body-lg text-on-surface-variant max-w-lg">
          Connect your financial accounts through Perplexity Finance, import your data,
          and let AI handle the rest — budgeting, saving, and investing in one place.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/signup">
            <Button variant="primary" className="px-8 py-3.5 text-body-md flex items-center gap-2">
              Get Started <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="px-8 py-3.5 text-body-md">Sign In</Button>
          </Link>
        </div>

        <div className="flex items-center gap-5 mt-1">
          {['Plaid-Connected', 'AI-Powered', 'Privacy-First'].map((label) => (
            <div key={label} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} style={{ color: '#1a6b3a' }} />
              <span className="text-label-sm text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── App Preview ── */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <DashboardMockup />
      </section>

      {/* ── How it works ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">The Process</p>
          <h2 className="text-display-sm text-on-surface">Three steps to financial clarity</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {STEPS.map((step) => (
            <div key={step.number}
              className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${step.color}12`, color: step.color }}>
                  {step.icon}
                </div>
                <span className="text-display-sm font-bold tabular-nums"
                  style={{ color: `${step.color}15`, letterSpacing: '-0.03em' }}>
                  {step.number}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-headline-sm text-on-surface">{step.title}</p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">{step.body}</p>
                {step.note && (
                  <p className="text-label-sm font-medium" style={{ color: step.color }}>✦ {step.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <p className="text-body-sm text-on-surface-variant text-center max-w-lg">
            While Luminous Ledger works as a standalone budgeting tool, connecting your accounts
            through Perplexity Finance unlocks its full potential.{' '}
            <a href="https://www.perplexity.ai/pro" target="_blank" rel="noopener noreferrer"
              className="font-medium inline-flex items-center gap-1 hover:underline"
              style={{ color: '#4c49c9' }}>
              Perplexity Pro <ExternalLink size={11} />
            </a>{' '}
            gives you the best experience.
          </p>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container-lowest rounded-3xl shadow-card overflow-hidden">
          <div className="px-8 pt-7 pb-5 border-b border-surface-container">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-widest mb-1.5">Why It Matters</p>
            <h2 className="text-headline-lg text-on-surface">Features that work for you</h2>
          </div>
          <div className="grid grid-cols-2">
            {BENEFITS.map((item, i) => (
              <div key={item.label}
                className="p-7 flex gap-4 items-start"
                style={{
                  borderRight: i % 2 === 0 ? '1px solid var(--md-sys-color-surface-container, #e7e8ee)' : 'none',
                  borderBottom: i < 2 ? '1px solid var(--md-sys-color-surface-container, #e7e8ee)' : 'none',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(76,73,201,0.08)', color: '#4c49c9' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-label-md font-semibold uppercase tracking-wider mb-1"
                    style={{ color: '#4c49c9' }}>{item.label}</p>
                  <p className="text-body-md text-on-surface leading-snug">{item.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl p-8 grid grid-cols-2 gap-10 items-center"
          style={{ background: 'linear-gradient(135deg, rgba(76,73,201,0.05) 0%, rgba(255,152,23,0.05) 100%)', border: '1px solid rgba(76,73,201,0.1)' }}>
          <div className="flex flex-col gap-4">
            <h2 className="text-display-sm text-on-surface leading-tight">
              Intelligence that respects your privacy.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Your financial data is processed locally and never shared with advertisers or third parties.
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-label-lg w-fit transition-all hover:opacity-90"
              style={{ background: '#4c49c9', color: '#fff' }}>
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {PROOF_POINTS.map((point) => (
              <div key={point}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-4 py-3.5 shadow-card">
                <CheckCircle2 size={15} style={{ color: '#1a6b3a', flexShrink: 0 }} />
                <p className="text-body-sm text-on-surface font-medium">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-16 max-w-2xl mx-auto w-full text-center flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4c49c9, #ff9817)' }}>
          <Sparkles size={22} className="text-white" />
        </div>
        <h2 className="text-display-sm text-on-surface">Ready to take control?</h2>
        <p className="text-body-lg text-on-surface-variant">
          Import your data and let AI guide every financial decision.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/signup">
            <Button variant="primary" className="px-10 py-4 text-body-md flex items-center gap-2">
              Get Started <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="px-10 py-4 text-body-md">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* ── Independence disclaimer ── */}
      <section className="px-6 pb-10 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl px-6 py-5"
          style={{ background: 'var(--md-sys-color-surface-container, #e7e8ee)' }}>
          <p className="text-body-sm text-on-surface-variant text-center leading-relaxed">
            Luminous Ledger is an independent, community-built tool and is not affiliated with,
            endorsed by, or otherwise connected to Perplexity AI or any of its products.
            Perplexity Finance and Perplexity Pro are trademarks of their respective owners.
            This application was built to help individuals manage their personal finances more
            intelligently — nothing more.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-container px-8 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div>
          <p className="text-label-lg font-semibold text-on-surface">Luminous Ledger</p>
          <p className="text-label-sm text-on-surface-variant">Premium AI Finance Insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: '#4c49c9' }} />
          <p className="text-label-sm text-on-surface-variant">Inspired by Perplexity Finance & Plaid</p>
        </div>
      </footer>

    </main>
  )
}
