'use client'

import { useState } from 'react'
import {
  Pencil, Trash2, Plus, Check, X, RefreshCw,
  Home, Zap, Smartphone, Wifi, Shield, Smile, Heart, Tv, Car, PenLine,
} from 'lucide-react'
import { useFinancialData } from '@/contexts/financial-data-context'

function formatDollars(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: 'Rent',          Icon: Home       },
  { name: 'Utilities',     Icon: Zap        },
  { name: 'Cell Phone',    Icon: Smartphone },
  { name: 'Internet',      Icon: Wifi       },
  { name: 'Insurance',     Icon: Shield     },
  { name: 'Dental',        Icon: Smile      },
  { name: 'Health',        Icon: Heart      },
  { name: 'Subscriptions', Icon: Tv         },
  { name: 'Transportation',Icon: Car        },
] as const

// ─── Amount form (used after template selection or for custom entry) ──────────

function AmountForm({
  prefillName,
  isCustom,
  onSave,
  onBack,
}: {
  prefillName: string
  isCustom: boolean
  onSave: (name: string, amount: number) => void
  onBack: () => void
}) {
  const [name, setName] = useState(prefillName)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Enter a name.'); return }
    const amt = parseFloat(amount.replace(/[$,]/g, ''))
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    onSave(name.trim(), amt)
  }

  return (
    <div className="flex flex-col gap-3 pt-1">
      {isCustom && (
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Expense name…"
          autoFocus
          className="w-full rounded-xl px-4 py-2.5 text-body-sm outline-none border transition-all focus:border-secondary"
          style={{
            backgroundColor: 'var(--color-surface-container)',
            borderColor: error && !name.trim() ? '#ba1a1a' : 'rgba(172,173,177,0.35)',
            color: 'var(--color-on-surface)',
          }}
        />
      )}

      {!isCustom && (
        <div className="flex items-center gap-2 px-1">
          <RefreshCw size={13} className="text-on-surface-variant opacity-50 flex-shrink-0" />
          <p className="text-label-md font-medium text-on-surface">{name}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError('') }}
            placeholder="0.00"
            autoFocus={!isCustom}
            className="w-full rounded-xl pl-7 pr-4 py-2.5 text-body-sm outline-none border transition-all focus:border-secondary"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              borderColor: error && !amount ? '#ba1a1a' : 'rgba(172,173,177,0.35)',
              color: 'var(--color-on-surface)',
            }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-label-sm font-semibold text-white transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: '#4c49c9' }}
        >
          <Check size={13} /> Add
        </button>
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors flex-shrink-0"
          title="Back"
        >
          <X size={13} />
        </button>
      </div>

      {error && (
        <p className="text-label-sm px-1" style={{ color: '#ba1a1a' }}>{error}</p>
      )}
    </div>
  )
}

// ─── Template picker ──────────────────────────────────────────────────────────

function TemplatePicker({
  onSelect,
  onCustom,
  onClose,
}: {
  onSelect: (name: string) => void
  onCustom: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Quick select
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map(({ name, Icon }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-label-sm font-medium text-on-surface transition-all hover:opacity-80 active:scale-[0.97] text-left"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <Icon size={14} className="text-on-surface-variant flex-shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        ))}

        {/* Custom tile */}
        <button
          onClick={onCustom}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-label-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] text-left"
          style={{ backgroundColor: 'rgba(76,73,201,0.10)', color: '#4c49c9' }}
        >
          <PenLine size={14} className="flex-shrink-0" />
          <span>Custom</span>
        </button>
      </div>
    </div>
  )
}

// ─── Inline edit form ────────────────────────────────────────────────────────

function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { name: string; amount: number }
  onSave: (name: string, amount: number) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [amount, setAmount] = useState(String(initial.amount))
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Enter a name.'); return }
    const amt = parseFloat(amount.replace(/[$,]/g, ''))
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    onSave(name.trim(), amt)
  }

  return (
    <div className="flex items-center gap-2 py-2 px-1">
      <RefreshCw size={14} className="text-on-surface-variant flex-shrink-0 opacity-40" />
      <input
        type="text"
        value={name}
        onChange={e => { setName(e.target.value); setError('') }}
        className="flex-1 min-w-0 rounded-lg px-3 py-1.5 text-body-sm outline-none border transition-all focus:border-secondary"
        style={{
          backgroundColor: 'var(--color-surface-container)',
          borderColor: error ? '#ba1a1a' : 'rgba(172,173,177,0.35)',
          color: 'var(--color-on-surface)',
        }}
      />
      <div className="relative flex-shrink-0">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError('') }}
          className="w-24 rounded-lg pl-6 pr-2 py-1.5 text-body-sm outline-none border transition-all focus:border-secondary"
          style={{
            backgroundColor: 'var(--color-surface-container)',
            borderColor: error ? '#ba1a1a' : 'rgba(172,173,177,0.35)',
            color: 'var(--color-on-surface)',
          }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </div>
      <button
        onClick={handleSave}
        className="p-1.5 rounded-lg text-white flex-shrink-0"
        style={{ background: '#4c49c9' }}
        title="Save"
      >
        <Check size={13} />
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors flex-shrink-0"
        title="Cancel"
      >
        <X size={13} />
      </button>
      {error && <p className="text-label-sm flex-shrink-0" style={{ color: '#ba1a1a' }}>{error}</p>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type AddStep = 'hidden' | 'templates' | 'amount'

export function RecurringCard() {
  const { financialData, addParsedSubscription, updateParsedSubscription, removeParsedSubscription } = useFinancialData()
  const subscriptions = financialData?.subscriptions ?? []

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [addStep, setAddStep] = useState<AddStep>('hidden')
  const [pendingName, setPendingName] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0)

  const openTemplates = () => {
    setAddStep('templates')
    setEditingIndex(null)
  }

  const handleTemplateSelect = (name: string) => {
    setPendingName(name)
    setIsCustom(false)
    setAddStep('amount')
  }

  const handleCustom = () => {
    setPendingName('')
    setIsCustom(true)
    setAddStep('amount')
  }

  const handleAddSave = (name: string, amount: number) => {
    addParsedSubscription({ name, amount, frequency: 'monthly' })
    setAddStep('hidden')
    setPendingName('')
  }

  const closeAdd = () => {
    setAddStep('hidden')
    setPendingName('')
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Recurring Expenses
          </p>
          <p className="text-display-md font-bold text-on-surface mt-1">
            {formatDollars(total)}
          </p>
          <p className="text-label-md text-on-surface-variant mt-0.5">
            {subscriptions.length} Active Subscription{subscriptions.length !== 1 ? 's' : ''}
          </p>
        </div>
        {addStep === 'hidden' && (
          <button
            onClick={openTemplates}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-label-sm font-semibold transition-all hover:opacity-80 flex-shrink-0"
            style={{ background: '#4c49c9', color: '#fff' }}
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {/* Template picker */}
      {addStep === 'templates' && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onCustom={handleCustom}
          onClose={closeAdd}
        />
      )}

      {/* Amount / custom form */}
      {addStep === 'amount' && (
        <AmountForm
          prefillName={pendingName}
          isCustom={isCustom}
          onSave={handleAddSave}
          onBack={() => setAddStep('templates')}
        />
      )}

      {/* Subscription rows */}
      <div className="flex flex-col gap-1 mt-1">
        {subscriptions.map((sub, i) =>
          editingIndex === i ? (
            <EditForm
              key={i}
              initial={{ name: sub.name, amount: sub.amount }}
              onSave={(name, amount) => {
                updateParsedSubscription(i, { name, amount })
                setEditingIndex(null)
              }}
              onCancel={() => setEditingIndex(null)}
            />
          ) : (
            <div key={i} className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-surface-container/50 transition-colors group">
              <RefreshCw size={14} className="text-on-surface-variant flex-shrink-0" />
              <p className="text-label-lg font-medium text-on-surface flex-1 truncate">{sub.name}</p>
              <p className="text-label-lg font-semibold text-on-surface flex-shrink-0">
                {formatDollars(sub.amount)}
              </p>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => { setEditingIndex(i); closeAdd() }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/8 transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => { removeParsedSubscription(i); if (editingIndex === i) setEditingIndex(null) }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        )}

        {subscriptions.length === 0 && addStep === 'hidden' && (
          <p className="text-body-sm text-on-surface-variant py-4 text-center">
            No subscriptions yet — click Add to get started.
          </p>
        )}
      </div>
    </div>
  )
}
