'use client'

import { useState, useCallback } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { useFinancialData } from '@/contexts/financial-data-context'
import type { FinancialProfile } from '@/lib/finance/model'

type Section = 'income' | 'fixed' | 'variable'

const COPY: Record<Section, { title: string; blurb: string; nameLabel: string; namePlaceholder: string }> = {
  income: {
    title: 'Income',
    blurb: 'What actually lands in your account each month, after deductions.',
    nameLabel: 'Source',
    namePlaceholder: 'Main job',
  },
  fixed: {
    title: 'Fixed costs',
    blurb: 'Obligations that arrive on a schedule at roughly the same amount.',
    nameLabel: 'What is it',
    namePlaceholder: 'Rent',
  },
  variable: {
    title: 'Variable spending',
    blurb: 'Category totals from last month — read them off a statement, not memory.',
    nameLabel: 'Category',
    namePlaceholder: 'Groceries',
  },
}

/** Rows of name + monthly amount, written straight onto the profile. */
export function ProfileEntry({ section }: { section: Section }) {
  const { financialData, saveProfile } = useFinancialData()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const copy = COPY[section]
  const rows = readRows(financialData, section)
  const total = rows.reduce((s, r) => s + r.amount, 0)

  const reset = useCallback(() => { setName(''); setAmount(''); setAdding(false) }, [])

  const add = useCallback(() => {
    const value = parseFloat(amount)
    if (!name.trim() || isNaN(value)) return
    saveProfile(profile => writeRow(profile, section, name.trim(), value))
    reset()
  }, [name, amount, section, saveProfile, reset])

  const remove = useCallback((index: number) => {
    saveProfile(profile => removeRow(profile, section, index))
  }, [section, saveProfile])

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-title-md text-on-surface font-semibold">{copy.title}</p>
          <span className="text-title-md text-on-surface font-semibold tabular-nums">
            ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            <span className="text-label-sm text-on-surface-variant font-normal">/mo</span>
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">{copy.blurb}</p>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col">
          {rows.map((row, i) => (
            <div
              key={`${row.name}-${i}`}
              className="flex items-center justify-between gap-3 py-2.5 border-b border-outline-variant/30 last:border-0 group"
            >
              <span className="text-body-md text-on-surface truncate">{row.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-body-md text-on-surface tabular-nums">
                  ${row.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => remove(i)}
                  className="text-on-surface-variant/50 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Remove ${row.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_130px] gap-2">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={copy.namePlaceholder}
              className="bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
              aria-label={copy.nameLabel}
            />
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
              inputMode="decimal"
              placeholder="0.00"
              className="bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
              aria-label="Monthly amount"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={add}
              disabled={!name.trim() || isNaN(parseFloat(amount))}
              className="bg-secondary text-white rounded-xl px-5 py-2.5 text-label-lg font-medium disabled:opacity-35 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={reset}
              className="text-on-surface-variant hover:text-on-surface p-2.5"
              aria-label="Cancel"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-label-lg font-medium text-secondary hover:opacity-80 transition-opacity w-fit"
        >
          <Plus size={15} /> Add {section === 'income' ? 'a source' : section === 'fixed' ? 'a fixed cost' : 'a category'}
        </button>
      )}
    </div>
  )
}

// ─── Profile read/write ──────────────────────────────────────────────────────

function readRows(profile: FinancialProfile | null, section: Section): { name: string; amount: number }[] {
  if (!profile) return []
  if (section === 'income') return profile.income.sources
  if (section === 'fixed') return profile.expenses_fixed.map(e => ({ name: e.name, amount: e.amount }))
  return profile.expenses_variable.map(e => ({ name: e.category, amount: e.amount }))
}

function writeRow(profile: FinancialProfile, section: Section, name: string, amount: number): FinancialProfile {
  if (section === 'income') {
    return { ...profile, income: { ...profile.income, sources: [...profile.income.sources, { name, amount }] } }
  }
  if (section === 'fixed') {
    return { ...profile, expenses_fixed: [...profile.expenses_fixed, { name, amount }] }
  }
  return { ...profile, expenses_variable: [...profile.expenses_variable, { category: name, amount }] }
}

function removeRow(profile: FinancialProfile, section: Section, index: number): FinancialProfile {
  if (section === 'income') {
    return { ...profile, income: { ...profile.income, sources: profile.income.sources.filter((_, i) => i !== index) } }
  }
  if (section === 'fixed') {
    return { ...profile, expenses_fixed: profile.expenses_fixed.filter((_, i) => i !== index) }
  }
  return { ...profile, expenses_variable: profile.expenses_variable.filter((_, i) => i !== index) }
}
