'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderOpen, Upload, FileText, Database, Copy, Check,
  AlertCircle, AlertTriangle, FileJson,
  ArrowRight, RotateCcw, CheckCircle2, XCircle,
  FilePlus, Plus, Pencil, Trash2, ChevronRight,
} from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { useFinancialData } from '@/contexts/financial-data-context'
import type { ManualAccount } from '@/contexts/financial-data-context'
import {
  SAMPLE_PERPLEXITY_JSON,
  type ParsedFinancialData,
} from '@/lib/perplexity/parser'

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportMethod = 'ai' | 'statement' | 'manual'

// AI sub-steps
type AIStep = 'prompt' | 'paste' | 'verify'
// Statement sub-step: just 'upload'
// Manual sub-step: just 'entry'

// ─── Method picker ────────────────────────────────────────────────────────────

const METHODS: {
  id: ImportMethod
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
}[] = [
  {
    id: 'ai',
    icon: <FolderOpen size={24} />,
    title: 'Local Data File',
    subtitle: 'Edit financial-data.json on your machine — refreshed with Perplexity Computer.',
    color: '#4c49c9',
  },
  {
    id: 'statement',
    icon: <FileText size={24} />,
    title: 'Upload Statement',
    subtitle: 'Import a CSV, OFX, or QFX export from your bank or credit card.',
    color: '#1a6b3a',
  },
  {
    id: 'manual',
    icon: <Database size={24} />,
    title: 'Enter Manually',
    subtitle: 'Add accounts and balances directly — no file needed.',
    color: '#ff9817',
  },
]

function MethodPicker({ onSelect }: { onSelect: (m: ImportMethod) => void }) {
  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      <div>
        <h2 className="text-headline-lg text-on-surface font-bold">Import your data</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Choose how you'd like to get started.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="w-full text-left rounded-2xl p-5 border transition-all duration-150 group hover:shadow-md active:scale-[0.99]"
            style={{ borderColor: 'rgba(172,173,177,0.25)', background: 'var(--md-sys-color-surface-container-lowest,#fffbfe)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${m.color}12`, color: m.color }}>
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg font-semibold text-on-surface mb-0.5">{m.title}</p>
                <p className="text-body-sm text-on-surface-variant">{m.subtitle}</p>
              </div>
              <ArrowRight size={16} className="text-on-surface-variant flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Already have data? Importing again will refresh and update your existing records.
      </p>
    </div>
  )
}

// ─── Local data file: Step 1 — Perplexity Computer instructions ───────────────
// The prompt uses project-relative paths so it works for anyone who clones the
// repo — no machine-specific absolute paths.

const PERPLEXITY_COMPUTER_PROMPT = `You have access to my local filesystem. Your job is to gather my current financial data and write it directly to a file inside the Luminous Ledger project — do NOT return JSON in this chat.

TASK:
1. Find the Luminous Ledger project folder on this machine (it was downloaded from GitHub — search for a folder named "luminous-ledger" containing a "data" subfolder).
2. Inside that project folder, locate the file at: data/financial-data.json
3. Access my financial accounts, bank statements, investment portfolio, and spending history using your computer access tools.
4. Compile everything into the exact JSON structure below. All amounts are monthly USD.
5. Write the complete JSON to data/financial-data.json, replacing ALL existing content.
6. Set "_last_updated" to today's date in YYYY-MM-DD format.
7. Confirm the file was written and give a brief summary of what you found.

Required JSON structure:
{
  "_last_updated": "YYYY-MM-DD",
  "income": {
    "total_monthly": <number>,
    "sources": [{ "name": "<source>", "amount": <monthly amount> }]
  },
  "expenses_fixed": [
    { "name": "<expense name>", "category": "<Housing|Utilities|Transportation|Insurance|Healthcare>", "amount": <monthly amount> }
  ],
  "expenses_variable": [
    { "category": "<Food & Dining|Shopping|Entertainment|Transportation|Healthcare|Other>", "amount": <monthly average> }
  ],
  "subscriptions": [
    { "name": "<service name>", "amount": <monthly amount>, "frequency": "monthly" }
  ],
  "accounts": [
    { "name": "<account name>", "type": "<checking|savings|brokerage|401k|roth_ira|credit|mortgage|auto>", "balance": <balance>, "institution": "<bank or broker>" }
  ],
  "summary": {
    "total_income": <number>,
    "total_expenses": <number>,
    "monthly_savings": <number>,
    "savings_rate": <integer percentage>
  }
}

Rules:
- Investment accounts (brokerage, 401k, IRA): use current market value as balance.
- Credit cards, mortgages, loans: use a NEGATIVE balance (e.g. -1200).
- Annual subscriptions: divide annual cost by 12 for the monthly amount.
- Write the file directly — do not output the JSON in chat.`

const LOCAL_FILE_STEPS = [
  { n: 1, text: 'Open Perplexity Computer on your machine.' },
  { n: 2, text: 'Copy the prompt below and paste it into Perplexity Computer.' },
  { n: 3, text: 'Perplexity Computer will find the project, access your accounts, and write the file directly — no copy/paste needed.' },
  { n: 4, text: 'Click "Refresh Dashboard" below once it confirms the file is written.' },
]

function AIStepPrompt({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { importData } = useFinancialData()
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<'success' | 'error' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PERPLEXITY_COMPUTER_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshResult(null)
    try {
      const res = await fetch('/api/local-data')
      const json = await res.json()
      if (json.ok && json.data) {
        const result = importData(json.data)
        setRefreshResult(result.success ? 'success' : 'error')
      } else {
        setRefreshResult('error')
      }
    } catch {
      setRefreshResult('error')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface mb-4 transition-colors">
          ← Back
        </button>
        <h2 className="text-headline-lg text-on-surface font-bold">Perplexity Computer Setup</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Perplexity Computer runs on your machine and writes your financial data directly into the project — no copy/paste needed.
        </p>
      </div>

      {/* File hint */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: 'rgba(76,73,201,0.08)' }}>
        <FolderOpen size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#4c49c9' }} />
        <div className="min-w-0">
          <p className="text-label-sm font-semibold mb-0.5" style={{ color: '#4c49c9' }}>Data file (relative to project root)</p>
          <p className="text-label-sm font-mono" style={{ color: '#4c49c9' }}>luminous-ledger/data/financial-data.json</p>
        </div>
      </div>

      {/* How-to steps */}
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: 'rgba(28,27,31,0.04)' }}>
        <p className="text-label-md font-semibold text-on-surface">How it works</p>
        <ol className="flex flex-col gap-2.5">
          {LOCAL_FILE_STEPS.map(({ n, text }) => (
            <li key={n} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#4c49c9', color: '#fff' }}
              >
                {n}
              </span>
              <p className="text-body-sm text-on-surface leading-snug">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Prompt box */}
      <div className="bg-surface-container rounded-2xl p-5 max-h-52 overflow-y-auto">
        <p className="text-on-surface font-mono whitespace-pre-wrap break-words leading-relaxed" style={{ fontSize: '0.68rem' }}>
          {PERPLEXITY_COMPUTER_PROMPT}
        </p>
      </div>

      {/* Copy prompt */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
        style={{ background: copied ? '#1a6b3a' : '#4c49c9', color: '#fff' }}
      >
        {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Prompt for Perplexity Computer</>}
      </button>

      {/* Refresh from file */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg border transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ borderColor: 'rgba(172,173,177,0.4)', color: '#1c1b1f', background: 'transparent' }}
        >
          {refreshing
            ? 'Reading file…'
            : refreshResult === 'success'
            ? <><CheckCircle2 size={18} style={{ color: '#1a6b3a' }} /> Dashboard Updated!</>
            : refreshResult === 'error'
            ? <><XCircle size={18} style={{ color: '#ba1a1a' }} /> File not ready yet</>
            : '↻  Refresh Dashboard from File'}
        </button>
        {refreshResult === 'success' && (
          <p className="text-label-sm text-center" style={{ color: '#1a6b3a' }}>
            Data loaded. Head to your dashboard to see the update.
          </p>
        )}
        {refreshResult === 'error' && (
          <p className="text-label-sm text-center" style={{ color: '#ba1a1a' }}>
            Could not read the file — make sure Perplexity Computer finished writing it.
          </p>
        )}
      </div>

      <button onClick={onNext}
        className="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors text-center">
        Prefer to paste JSON manually <ChevronRight size={13} className="inline" />
      </button>
    </div>
  )
}

// ─── AI path: Step 2 — Paste JSON ────────────────────────────────────────────

function AIStepPaste({
  onSuccess, onBack,
}: {
  onSuccess: (data: ParsedFinancialData, warnings: string[]) => void
  onBack: () => void
}) {
  const { importData } = useFinancialData()
  const [jsonText, setJsonText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [showSample, setShowSample] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(() => {
    setErrors([]); setWarnings([])
    let parsed: unknown
    try { parsed = JSON.parse(jsonText.trim()) }
    catch { setErrors(['Invalid JSON — make sure you copied the full output from Perplexity.']); return }
    const result = importData(parsed)
    if (result.success && result.data) {
      if (result.warnings.length) setWarnings(result.warnings)
      onSuccess(result.data, result.warnings)
    } else {
      setErrors(result.errors)
      if (result.warnings.length) setWarnings(result.warnings)
    }
  }, [jsonText, importData, onSuccess])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => setJsonText(e.target?.result as string)
    reader.readAsText(file)
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface mb-4 transition-colors">
          ← Back
        </button>
        <h2 className="text-headline-lg text-on-surface font-bold">Paste Your Data</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Copy the JSON from Perplexity and paste below, or drop a .json file.</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all"
        style={{ borderColor: isDragging ? '#4c49c9' : 'rgba(172,173,177,0.4)', backgroundColor: isDragging ? 'rgba(76,73,201,0.04)' : 'transparent' }}
      >
        <Upload size={22} className="mx-auto text-on-surface-variant mb-2" />
        <p className="text-body-sm text-on-surface-variant">Drop a <span className="font-semibold">.json</span> file or click to browse</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </div>

      <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
        placeholder="Or paste JSON here…" rows={9}
        className="w-full rounded-2xl p-4 text-body-sm font-mono resize-none outline-none border transition-all focus:border-secondary"
        style={{ backgroundColor: 'var(--color-surface-container)', borderColor: errors.length ? '#ba1a1a' : 'rgba(172,173,177,0.3)', color: 'var(--color-on-surface)' }} />

      {errors.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(186,26,26,0.08)' }}>
          {errors.map((e, i) => <div key={i} className="flex items-start gap-2 text-body-sm" style={{ color: '#ba1a1a' }}><AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{e}</div>)}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,152,23,0.08)' }}>
          {warnings.map((w, i) => <div key={i} className="flex items-start gap-2 text-body-sm" style={{ color: '#cc7a00' }}><AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />{w}</div>)}
        </div>
      )}

      <button onClick={handleImport} disabled={!jsonText.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#4c49c9', color: '#fff' }}>
        <FileJson size={18} /> Parse &amp; Verify Data
      </button>

      <button onClick={() => setShowSample(s => !s)} className="text-label-sm text-on-surface-variant hover:text-on-surface text-center transition-colors">
        {showSample ? 'Hide' : 'Show'} sample JSON template
      </button>
      {showSample && (
        <div className="relative">
          <pre className="text-body-sm font-mono rounded-2xl p-5 overflow-x-auto"
            style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', fontSize: '0.7rem' }}>
            {SAMPLE_PERPLEXITY_JSON}
          </pre>
          <button onClick={() => setJsonText(SAMPLE_PERPLEXITY_JSON)}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-label-sm font-medium"
            style={{ background: 'rgba(76,73,201,0.12)', color: '#4c49c9' }}>
            <RotateCcw size={12} /> Use sample
          </button>
        </div>
      )}
    </div>
  )
}

// ─── AI path: Step 3 — Verify ────────────────────────────────────────────────

function fmtUsd(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function VerifyRow({ label, count, amount, ok }: { label: string; count: number; amount?: number; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0">
      <div className="flex items-center gap-3">
        {ok ? <CheckCircle2 size={18} style={{ color: '#1a6b3a' }} /> : <XCircle size={18} style={{ color: '#ba1a1a' }} />}
        <span className="text-body-md text-on-surface">{label}</span>
      </div>
      <div className="text-right">
        {ok ? (
          <span className="text-label-md font-semibold text-on-surface">
            {count} item{count !== 1 ? 's' : ''}
            {amount !== undefined && amount > 0 && <span className="text-on-surface-variant font-normal ml-1.5">· {fmtUsd(amount)}/mo</span>}
          </span>
        ) : (
          <span className="text-label-md text-error">Not found</span>
        )}
      </div>
    </div>
  )
}

function AIStepVerify({
  data, warnings, onConfirm, onBack,
}: {
  data: ParsedFinancialData; warnings: string[]
  onConfirm: () => void; onBack: () => void
}) {
  const assetAccounts = data.accounts.filter(a =>
    ['checking','savings','depository','investment','brokerage','cd','money market','cash','bank','deposit','retirement','401k','ira'].some(k => a.type.toLowerCase().includes(k)))
  const debtAccounts = data.accounts.filter(a =>
    ['credit','loan','mortgage','auto','student','debt','liability','heloc'].some(k => a.type.toLowerCase().includes(k)))
  const unknownAccounts = data.accounts.length - assetAccounts.length - debtAccounts.length

  const fixedTotal = data.expenses_fixed.reduce((s, e) => s + e.amount, 0)
  const varTotal   = data.expenses_variable.reduce((s, e) => s + e.amount, 0)
  const subTotal   = data.subscriptions.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-6 max-w-lg w-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface mb-4 transition-colors">← Back</button>
        <h2 className="text-headline-lg text-on-surface font-bold">What We Found</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Review before loading your dashboard.</p>
      </div>

      <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(76,73,201,0.07)' }}>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Monthly Income</p>
        <p className="text-display-sm font-bold" style={{ color: '#4c49c9' }}>{fmtUsd(data.income.total_monthly)}</p>
        {data.income.sources.length > 0 && (
          <p className="text-label-sm text-on-surface-variant mt-1">from {data.income.sources.length} source{data.income.sources.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card px-6 py-2">
        <VerifyRow label="Fixed Expenses" count={data.expenses_fixed.length} amount={fixedTotal} ok={data.expenses_fixed.length > 0} />
        <VerifyRow label="Variable Spending" count={data.expenses_variable.length} amount={varTotal} ok={data.expenses_variable.length > 0} />
        <VerifyRow label="Subscriptions" count={data.subscriptions.length} amount={subTotal} ok={data.subscriptions.length > 0} />
        <VerifyRow label="Asset Accounts" count={assetAccounts.length + unknownAccounts} ok={assetAccounts.length + unknownAccounts > 0} />
        <VerifyRow label="Debt Accounts" count={debtAccounts.length} ok />
      </div>

      <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-surface-container">
        <span className="text-body-md text-on-surface-variant">Total Monthly Spending</span>
        <span className="text-headline-sm font-bold text-on-surface">{fmtUsd(data.summary.total_expenses)}</span>
      </div>

      {warnings.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,152,23,0.08)' }}>
          <p className="text-label-sm font-semibold" style={{ color: '#cc7a00' }}>Some data may be missing</p>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-body-sm" style={{ color: '#cc7a00' }}>
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />{w}
            </div>
          ))}
        </div>
      )}

      <button onClick={onConfirm}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
        style={{ background: '#4c49c9', color: '#fff' }}>
        Looks Good — Continue <ArrowRight size={18} />
      </button>
    </div>
  )
}

// ─── Statement upload path ────────────────────────────────────────────────────

const STMT_ACCOUNT_TYPES = [
  { value: 'checking',    label: 'Checking' },
  { value: 'savings',     label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'brokerage',   label: 'Brokerage / Investment' },
  { value: 'other',       label: 'Other' },
]

const INSTRUCTIONS = [
  { n: 1, text: 'Open your bank app or website and log in.' },
  { n: 2, text: 'Go to Statements or Transaction History — usually under Account Details.' },
  { n: 3, text: 'Download up to 6 months of statements in CSV format. More history = better insights.' },
  { n: 4, text: 'Upload each file below. Works from your phone, or AirDrop files to your Mac first.' },
]

function StatementUpload({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { importStatement, removeStatement, statements } = useFinancialData()
  const fileRef = useRef<HTMLInputElement>(null)

  // Account naming step
  const [acctName, setAcctName]   = useState('')
  const [acctType, setAcctType]   = useState('checking')
  const [activeAcct, setActiveAcct] = useState<string | null>(null)
  const [acctError, setAcctError]   = useState('')

  // Upload feedback
  const [errors, setErrors]       = useState<string[]>([])
  const [warnings, setWarnings]   = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleSetAccount = () => {
    if (!acctName.trim()) { setAcctError('Enter an account name to continue.'); return }
    setAcctError('')
    setActiveAcct(acctName.trim())
    setErrors([]); setWarnings([]); setSuccessMsg('')
  }

  const handleFile = useCallback(async (file: File) => {
    if (!activeAcct) return
    setErrors([]); setWarnings([]); setSuccessMsg('')
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.csv') && !lower.endsWith('.ofx') && !lower.endsWith('.qfx')) {
      setErrors(['Only CSV, OFX, and QFX files are supported. Export as CSV from your bank portal.'])
      return
    }
    const text = await file.text()
    const result = importStatement(text, file.name, activeAcct)
    if (result.success && result.statement) {
      setSuccessMsg(`✓ ${result.statement.transactionCount} transactions imported from ${result.statement.bank}.`)
      if (result.warnings.length) setWarnings(result.warnings)
    } else {
      setErrors(result.errors)
      if (result.warnings.length) setWarnings(result.warnings)
    }
  }, [activeAcct, importStatement])

  // Group uploaded statements by account name for display
  const grouped = statements.reduce<Record<string, typeof statements>>((acc, s) => {
    const key = s.accountName ?? s.filename
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const totalFiles = statements.length

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface mb-4 transition-colors">
          ← Back
        </button>
        <h2 className="text-headline-lg text-on-surface font-bold">Upload Statements</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Import CSV exports from your bank to see your real spending history.
        </p>
      </div>

      {/* How-to instructions */}
      <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ backgroundColor: 'rgba(76,73,201,0.06)' }}>
        <p className="text-label-md font-semibold text-on-surface">How to get your statements</p>
        <ol className="flex flex-col gap-2.5">
          {INSTRUCTIONS.map(({ n, text }) => (
            <li key={n} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-label-sm font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#4c49c9', color: '#fff' }}
              >
                {n}
              </span>
              <p className="text-body-sm text-on-surface leading-snug">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Step 1 — Name the account */}
      {!activeAcct ? (
        <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-label-md font-semibold text-on-surface">Step 1 — Name this account</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Give it a name you'll recognise, e.g. "Chase Sapphire" or "Discover Checking."
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Account Name</label>
            <input
              type="text"
              value={acctName}
              onChange={e => { setAcctName(e.target.value); setAcctError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSetAccount()}
              placeholder="e.g. Chase Sapphire Reserve, Discover Checking…"
              className="w-full rounded-xl px-4 py-3 text-body-md outline-none border transition-all focus:border-secondary"
              style={{
                backgroundColor: 'var(--color-surface-container-lowest,#fffbfe)',
                borderColor: acctError ? '#ba1a1a' : 'rgba(172,173,177,0.35)',
                color: 'var(--color-on-surface)',
              }}
            />
            {acctError && <p className="text-label-sm" style={{ color: '#ba1a1a' }}>{acctError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Account Type</label>
            <select
              value={acctType}
              onChange={e => setAcctType(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-body-md outline-none border transition-all appearance-none"
              style={{
                backgroundColor: 'var(--color-surface-container-lowest,#fffbfe)',
                borderColor: 'rgba(172,173,177,0.35)',
                color: 'var(--color-on-surface)',
              }}
            >
              {STMT_ACCOUNT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSetAccount}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
            style={{ background: '#1a6b3a', color: '#fff' }}
          >
            <Check size={16} /> Set Account &amp; Upload Files
          </button>
        </div>
      ) : (
        <>
          {/* Active account badge + Step 2 upload */}
          <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-md font-semibold text-on-surface">Step 2 — Upload files</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-label-sm font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26,107,58,0.12)', color: '#1a6b3a' }}>
                    {activeAcct}
                  </span>
                  <p className="text-label-sm text-on-surface-variant">Upload all statements for this account</p>
                </div>
              </div>
              <button
                onClick={() => { setActiveAcct(null); setErrors([]); setWarnings([]); setSuccessMsg('') }}
                className="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
              >
                Change
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all"
              style={{
                borderColor: isDragging ? '#1a6b3a' : 'rgba(172,173,177,0.4)',
                backgroundColor: isDragging ? 'rgba(26,107,58,0.04)' : 'transparent',
              }}
            >
              <FilePlus size={26} className="mx-auto text-on-surface-variant mb-2" />
              <p className="text-body-sm font-medium text-on-surface">Drop a file here or click to browse</p>
              <p className="text-label-sm text-on-surface-variant mt-1">
                <span className="font-semibold">.csv</span> · <span className="font-semibold">.ofx</span> · <span className="font-semibold">.qfx</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.ofx,.qfx"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
              />
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(26,107,58,0.08)' }}>
                <CheckCircle2 size={15} style={{ color: '#1a6b3a' }} />
                <p className="text-body-sm font-medium" style={{ color: '#1a6b3a' }}>{successMsg}</p>
              </div>
            )}
            {errors.length > 0 && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ backgroundColor: 'rgba(186,26,26,0.08)' }}>
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-body-sm" style={{ color: '#ba1a1a' }}>
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{e}
                  </div>
                ))}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,152,23,0.08)' }}>
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-body-sm" style={{ color: '#cc7a00' }}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />{w}
                  </div>
                ))}
              </div>
            )}

            {/* "Add another account" link */}
            <button
              onClick={() => { setActiveAcct(null); setAcctName(''); setAcctType('checking'); setErrors([]); setWarnings([]); setSuccessMsg('') }}
              className="flex items-center justify-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Plus size={13} /> Add another account
            </button>
          </div>
        </>
      )}

      {/* Uploaded files grouped by account */}
      {totalFiles > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-4 flex flex-col gap-4">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            {totalFiles} file{totalFiles !== 1 ? 's' : ''} imported
          </p>
          {Object.entries(grouped).map(([acct, stmts]) => (
            <div key={acct}>
              <p className="text-label-sm font-semibold text-on-surface mb-2">{acct}</p>
              <div className="flex flex-col gap-2 pl-3 border-l-2" style={{ borderColor: 'rgba(172,173,177,0.25)' }}>
                {stmts.map(s => (
                  <div key={s.filename} className="flex items-center gap-3">
                    <FileText size={13} className="text-on-surface-variant flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-on-surface truncate">{s.filename}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {s.bank} · {s.transactionCount} txns · {s.dateRange.start} → {s.dateRange.end}
                      </p>
                    </div>
                    <button
                      onClick={() => removeStatement(s.filename)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
        style={{ background: '#1a6b3a', color: '#fff' }}
      >
        {totalFiles > 0 ? 'Continue to Dashboard' : 'Skip for Now'}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

// ─── Manual entry path ────────────────────────────────────────────────────────

const ACCOUNT_TYPE_GROUPS: Array<{ group: string; types: Array<{ value: string; label: string }> }> = [
  {
    group: 'Banking',
    types: [
      { value: 'checking', label: 'Checking' },
      { value: 'savings', label: 'Savings' },
      { value: 'money_market', label: 'Money Market' },
      { value: 'cd', label: 'CD (Certificate of Deposit)' },
      { value: 'cash', label: 'Cash' },
    ],
  },
  {
    group: 'Investing',
    types: [
      { value: 'brokerage', label: 'Brokerage / Investment' },
      { value: 'roth_ira', label: 'Roth IRA' },
      { value: 'traditional_ira', label: 'Traditional IRA' },
      { value: '401k', label: '401(k)' },
      { value: '403b', label: '403(b)' },
      { value: 'hsa', label: 'HSA' },
      { value: 'crypto', label: 'Crypto Wallet' },
    ],
  },
  {
    group: 'Debt',
    types: [
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'mortgage', label: 'Mortgage' },
      { value: 'auto_loan', label: 'Auto Loan' },
      { value: 'student_loan', label: 'Student Loan' },
      { value: 'personal_loan', label: 'Personal Loan' },
      { value: 'heloc', label: 'HELOC' },
      { value: 'medical_debt', label: 'Medical Debt' },
    ],
  },
]

const DEBT_TYPE_VALUES = new Set([
  'credit_card','mortgage','auto_loan','student_loan',
  'personal_loan','heloc','medical_debt',
])

function typeLabel(value: string) {
  for (const g of ACCOUNT_TYPE_GROUPS) {
    const t = g.types.find(t => t.value === value)
    if (t) return t.label
  }
  return value
}

function ManualEntry({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { manualAccounts, addManualAccount, updateManualAccount, removeManualAccount } = useFinancialData()
  const [name, setName]     = useState('')
  const [type, setType]     = useState('checking')
  const [balance, setBalance] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError]   = useState('')
  const isDebt = DEBT_TYPE_VALUES.has(type)

  const handleSubmit = useCallback(() => {
    setError('')
    if (!name.trim()) { setError('Please enter an account name.'); return }
    const amt = parseFloat(balance.replace(/[$,]/g, ''))
    if (isNaN(amt) || amt < 0) { setError('Enter a valid balance (e.g. 5000).'); return }
    if (editingId) {
      updateManualAccount(editingId, { name: name.trim(), type, balance: amt })
      setEditingId(null)
    } else {
      addManualAccount({ name: name.trim(), type, balance: amt })
    }
    setName(''); setBalance(''); setType('checking')
  }, [name, type, balance, editingId, addManualAccount, updateManualAccount])

  const handleEdit = useCallback((acc: ManualAccount) => {
    setEditingId(acc.id); setName(acc.name); setType(acc.type); setBalance(String(acc.balance))
  }, [])

  const handleCancel = useCallback(() => {
    setEditingId(null); setName(''); setType('checking'); setBalance(''); setError('')
  }, [])

  const assets = manualAccounts.filter(a => !DEBT_TYPE_VALUES.has(a.type))
  const debts  = manualAccounts.filter(a =>  DEBT_TYPE_VALUES.has(a.type))

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-on-surface mb-4 transition-colors">← Back</button>
        <h2 className="text-headline-lg text-on-surface font-bold">Enter Accounts Manually</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Add any account — bank, brokerage, credit card, loan — just select the type and enter the balance.</p>
      </div>

      {/* Entry form */}
      <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-label-md font-semibold text-on-surface">{editingId ? 'Edit Account' : 'Add an Account'}</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Account Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Fidelity Roth IRA, Chase Checking…"
            className="w-full rounded-xl px-4 py-3 text-body-md outline-none border transition-all focus:border-secondary"
            style={{ backgroundColor: 'var(--color-surface-container-lowest,#fffbfe)', borderColor: 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Account Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-body-md outline-none border transition-all focus:border-secondary appearance-none"
            style={{ backgroundColor: 'var(--color-surface-container-lowest,#fffbfe)', borderColor: 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }}>
            {ACCOUNT_TYPE_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </optgroup>
            ))}
          </select>
          {isDebt && <p className="text-label-sm" style={{ color: '#ff9817' }}>⚠ Debt account — enter the amount owed.</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{isDebt ? 'Balance Owed' : 'Current Balance'}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
            <input type="text" inputMode="decimal" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0"
              className="w-full rounded-xl pl-8 pr-4 py-3 text-body-md outline-none border transition-all focus:border-secondary"
              style={{ backgroundColor: 'var(--color-surface-container-lowest,#fffbfe)', borderColor: error ? '#ba1a1a' : 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }} />
          </div>
        </div>

        {error && <div className="flex items-center gap-2 text-body-sm" style={{ color: '#ba1a1a' }}><AlertCircle size={14} />{error}</div>}

        <div className="flex gap-3">
          <button onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
            style={{ background: '#ff9817', color: '#fff' }}>
            {editingId ? <><Check size={16} /> Save</> : <><Plus size={16} /> Add Account</>}
          </button>
          {editingId && (
            <button onClick={handleCancel}
              className="px-4 py-3 rounded-xl font-semibold text-label-lg border transition-all hover:bg-surface-container"
              style={{ borderColor: 'rgba(172,173,177,0.3)', color: 'var(--color-on-surface-variant)' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Account list */}
      {manualAccounts.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          {assets.length > 0 && (
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-5 pt-4 pb-2">Assets</p>
              {assets.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/15 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{acc.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{typeLabel(acc.type)}</p>
                  </div>
                  <p className="text-label-lg font-semibold flex-shrink-0" style={{ color: '#1a6b3a' }}>
                    ${Math.round(acc.balance).toLocaleString()}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => removeManualAccount(acc.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {debts.length > 0 && (
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider px-5 pt-4 pb-2">Debts</p>
              {debts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/15 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{acc.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{typeLabel(acc.type)}</p>
                  </div>
                  <p className="text-label-lg font-semibold flex-shrink-0" style={{ color: '#ba1a1a' }}>
                    −${Math.round(acc.balance).toLocaleString()}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => removeManualAccount(acc.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3 bg-surface-container">
            <p className="text-label-md text-on-surface-variant">{manualAccounts.length} account{manualAccounts.length !== 1 ? 's' : ''} added</p>
            <p className="text-label-md font-semibold text-on-surface">
              Net: ${Math.round(assets.reduce((s, a) => s + a.balance, 0) - debts.reduce((s, a) => s + a.balance, 0)).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <button onClick={onDone}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-label-lg transition-all active:scale-[0.98]"
        style={{ background: '#ff9817', color: '#fff' }}>
        {manualAccounts.length > 0 ? 'Continue to Dashboard' : 'Skip for Now'}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter()

  // Which method was chosen
  const [method, setMethod] = useState<ImportMethod | null>(null)

  // AI sub-step state
  const [aiStep, setAiStep] = useState<AIStep>('prompt')
  const [parsedData, setParsedData]     = useState<ParsedFinancialData | null>(null)
  const [importWarnings, setImportWarnings] = useState<string[]>([])

  const handleMethodSelect = (m: ImportMethod) => {
    setMethod(m)
    setAiStep('prompt')
  }

  const handleAISuccess = useCallback((data: ParsedFinancialData, warnings: string[]) => {
    setParsedData(data)
    setImportWarnings(warnings)
    setAiStep('verify')
  }, [])

  const goToDashboard = () => router.push('/dashboard')

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Import Financial Data" />

      <div className="flex-1 px-8 pb-10 flex flex-col items-center justify-center gap-6 py-10">

        {/* Method picker */}
        {method === null && (
          <MethodPicker onSelect={handleMethodSelect} />
        )}

        {/* ── AI path ── */}
        {method === 'ai' && aiStep === 'prompt' && (
          <AIStepPrompt
            onNext={() => setAiStep('paste')}
            onBack={() => setMethod(null)}
          />
        )}
        {method === 'ai' && aiStep === 'paste' && (
          <AIStepPaste
            onSuccess={handleAISuccess}
            onBack={() => setAiStep('prompt')}
          />
        )}
        {method === 'ai' && aiStep === 'verify' && parsedData && (
          <AIStepVerify
            data={parsedData}
            warnings={importWarnings}
            onConfirm={goToDashboard}
            onBack={() => setAiStep('paste')}
          />
        )}

        {/* ── Statement path ── */}
        {method === 'statement' && (
          <StatementUpload
            onBack={() => setMethod(null)}
            onDone={goToDashboard}
          />
        )}

        {/* ── Manual path ── */}
        {method === 'manual' && (
          <ManualEntry
            onBack={() => setMethod(null)}
            onDone={goToDashboard}
          />
        )}

        {/* "Try another method" link once inside a flow */}
        {method !== null && (
          <button
            onClick={() => setMethod(null)}
            className="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Try a different import method
          </button>
        )}
      </div>
    </div>
  )
}
