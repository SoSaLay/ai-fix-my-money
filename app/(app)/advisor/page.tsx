'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles, Upload, PiggyBank, PieChart, BarChart2,
  CheckCircle2, AlertTriangle, Info, ArrowRight,
  Loader2, RotateCcw, Zap, ExternalLink,
} from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { useFinancialData } from '@/contexts/financial-data-context'
import {
  getSkillsByTab,
  type SkillTab,
  type SkillStatus,
  type SkillResult,
  type SkillBullet,
  type ResultSeverity,
} from '@/lib/ai-skills'

// ─── Types ────────────────────────────────────────────────────────────────────

type RunState = {
  status: SkillStatus
  result?: SkillResult
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: SkillTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'spending',
    label: 'Spending',
    icon: <PieChart size={15} />,
    description: 'Audit categories, subscriptions, and fixed-cost burden.',
  },
  {
    key: 'savings',
    label: 'Savings',
    icon: <PiggyBank size={15} />,
    description: 'Analyse your savings rate, emergency fund, and cash flow.',
  },
  {
    key: 'investing',
    label: 'Investing',
    icon: <BarChart2 size={15} />,
    description: 'Track market news, sentiment, forecasts, and portfolio health.',
  },
]

// ─── Severity helpers ─────────────────────────────────────────────────────────

function resultColors(s: ResultSeverity) {
  switch (s) {
    case 'critical': return { bg: 'rgba(186,26,26,0.07)', border: 'rgba(186,26,26,0.2)', accent: '#ba1a1a', Icon: AlertTriangle }
    case 'warning':  return { bg: 'rgba(255,152,23,0.07)', border: 'rgba(255,152,23,0.2)', accent: '#ff9817', Icon: AlertTriangle }
    case 'positive': return { bg: 'rgba(26,107,58,0.07)', border: 'rgba(26,107,58,0.2)',  accent: '#1a6b3a', Icon: CheckCircle2 }
    default:         return { bg: 'rgba(76,73,201,0.06)', border: 'rgba(76,73,201,0.15)', accent: '#4c49c9', Icon: Info }
  }
}

function bulletColor(type: SkillBullet['type']): string {
  switch (type) {
    case 'positive': return '#1a6b3a'
    case 'warning':  return '#ff9817'
    case 'tip':      return '#4c49c9'
    default:         return 'var(--md-sys-color-on-surface-variant,#49454f)'
  }
}

function bulletPrefix(type: SkillBullet['type']): string {
  switch (type) {
    case 'positive': return '✓'
    case 'warning':  return '⚠'
    case 'tip':      return '💡'
    default:         return '·'
  }
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onDismiss }: { result: SkillResult; onDismiss: () => void }) {
  const cfg = resultColors(result.severity)
  const { Icon } = cfg

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon size={18} style={{ color: cfg.accent, flexShrink: 0 }} />
          <p className="text-label-lg font-semibold text-on-surface">{result.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {result.poweredBy && (
            <span className="text-label-sm px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(76,73,201,0.1)', color: '#4c49c9', fontSize: '0.65rem' }}>
              {result.poweredBy}
            </span>
          )}
          <button onClick={onDismiss}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
            title="Dismiss">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <p className="text-body-sm text-on-surface-variant leading-relaxed">{result.summary}</p>

      <div className="flex flex-col gap-2">
        {result.bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-sm font-bold flex-shrink-0 mt-px w-4 text-center leading-5"
              style={{ color: bulletColor(b.type) }}>
              {bulletPrefix(b.type)}
            </span>
            <p className="text-body-sm leading-relaxed"
              style={{ color: b.type === 'tip' ? '#4c49c9' : 'var(--md-sys-color-on-surface,#1c1b1f)' }}>
              {b.text}
            </p>
          </div>
        ))}
      </div>

      {result.learnMoreHref && (
        <a href={result.learnMoreHref} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-label-sm font-semibold self-start"
          style={{ color: cfg.accent }}>
          About this skill <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  state,
  onRun,
}: {
  skill: ReturnType<typeof getSkillsByTab>[number]
  state: RunState
  onRun: () => void
}) {
  const isRunning = state.status === 'running'
  const isDone = state.status === 'done'

  return (
    <button
      onClick={onRun}
      disabled={isRunning}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 border group active:scale-[0.98]"
      style={{
        background: isDone
          ? 'rgba(76,73,201,0.05)'
          : 'var(--md-sys-color-surface-container,#f3eff4)',
        borderColor: isRunning
          ? '#4c49c9'
          : isDone
          ? 'rgba(76,73,201,0.25)'
          : 'rgba(172,173,177,0.2)',
        cursor: isRunning ? 'not-allowed' : 'pointer',
        boxShadow: isRunning ? '0 0 0 2px rgba(76,73,201,0.15)' : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{skill.emoji}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-label-lg font-semibold text-on-surface">{skill.title}</p>
            {skill.alphaearSkill && (
              <span className="px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                style={{ background: 'rgba(76,73,201,0.1)', color: '#4c49c9', fontSize: '0.62rem', lineHeight: '1.4' }}>
                {skill.alphaearSkill}
              </span>
            )}
          </div>

          <p className="text-body-sm text-on-surface-variant leading-relaxed">{skill.description}</p>

          <div className="mt-3 flex items-center gap-2">
            {isRunning ? (
              <>
                <Loader2 size={13} className="animate-spin" style={{ color: '#4c49c9' }} />
                <span className="text-label-sm font-medium" style={{ color: '#4c49c9' }}>Running…</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 size={13} style={{ color: '#1a6b3a' }} />
                <span className="text-label-sm font-medium" style={{ color: '#1a6b3a' }}>Done · re-run</span>
              </>
            ) : (
              <>
                <Zap size={13} style={{ color: '#4c49c9' }} />
                <span className="text-label-sm font-semibold group-hover:underline" style={{ color: '#4c49c9' }}>
                  Run skill
                </span>
                <ArrowRight size={12} style={{ color: '#4c49c9' }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const { financialData, statementMonths, hasData } = useFinancialData()
  const [activeTab, setActiveTab] = useState<SkillTab>('spending')
  const [runStates, setRunStates] = useState<Record<string, RunState>>({})
  const [resultOrder, setResultOrder] = useState<Record<SkillTab, string[]>>({
    savings: [], spending: [], investing: [],
  })

  const handleRun = useCallback((skillId: string) => {
    if (!financialData) return
    const allSkills = getSkillsByTab(activeTab)
    const skill = allSkills.find(s => s.id === skillId)
    if (!skill) return

    setRunStates(prev => ({ ...prev, [skillId]: { status: 'running' } }))
    setResultOrder(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(id => id !== skillId),
    }))

    setTimeout(() => {
      const result = skill.generate(financialData, statementMonths)
      setRunStates(prev => ({ ...prev, [skillId]: { status: 'done', result } }))
      setResultOrder(prev => ({
        ...prev,
        [activeTab]: [skillId, ...prev[activeTab].filter(id => id !== skillId)],
      }))
    }, skill.runDuration)
  }, [financialData, statementMonths, activeTab])

  const handleDismiss = useCallback((skillId: string, tab: SkillTab) => {
    setRunStates(prev => ({ ...prev, [skillId]: { status: 'idle' } }))
    setResultOrder(prev => ({
      ...prev,
      [tab]: prev[tab].filter(id => id !== skillId),
    }))
  }, [])

  if (!hasData || !financialData) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="AI Finance Assistant" />
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={28} className="text-secondary" />
            </div>
            <p className="text-headline-sm text-on-surface font-semibold mb-2">No data yet</p>
            <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Import your financial data first — then the AI Finance Assistant can run personalised analysis on your actual numbers.
            </p>
            <Link href="/setup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-label-lg transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}>
              <Upload size={16} /> Import Financial Data
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tabSkills = getSkillsByTab(activeTab)
  const currentResults = resultOrder[activeTab]
    .map(id => ({ id, state: runStates[id] }))
    .filter(({ state }) => state?.status === 'done' && !!state.result)

  const activeTabConfig = TABS.find(t => t.key === activeTab)!

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="AI Finance Assistant" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">

        {/* ── Tabs ── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-1.5 flex gap-1">
          {TABS.map(tab => {
            const doneCount = resultOrder[tab.key].filter(id => runStates[id]?.status === 'done').length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-label-md font-semibold transition-all duration-150 relative"
                style={{
                  background: activeTab === tab.key ? '#4c49c9' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--md-sys-color-on-surface-variant,#49454f)',
                }}
              >
                {tab.icon}
                {tab.label}
                {doneCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                    style={{ background: '#1a6b3a', fontSize: '0.6rem', fontWeight: 700 }}>
                    {doneCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab description ── */}
        <div className="flex items-center gap-3 px-1">
          <p className="text-body-sm text-on-surface-variant flex-1">{activeTabConfig.description}</p>
          {currentResults.length > 0 && (
            <span className="text-label-sm font-medium px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: 'rgba(26,107,58,0.1)', color: '#1a6b3a' }}>
              {currentResults.length} result{currentResults.length !== 1 ? 's' : ''} ready
            </span>
          )}
        </div>

        {/* ── Skill grid ── */}
        <div className="grid grid-cols-2 gap-4">
          {tabSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              state={runStates[skill.id] ?? { status: 'idle' }}
              onRun={() => handleRun(skill.id)}
            />
          ))}
        </div>

        {/* ── Results ── */}
        {currentResults.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-outline-variant/30" />
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-2">Results</p>
              <div className="flex-1 h-px bg-outline-variant/30" />
            </div>
            {currentResults.map(({ id, state }) => (
              <ResultCard
                key={id}
                result={state.result!}
                onDismiss={() => handleDismiss(id, activeTab)}
              />
            ))}
          </div>
        )}


      </div>
    </div>
  )
}
