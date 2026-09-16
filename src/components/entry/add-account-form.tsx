'use client'

import { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useFinancialData } from '@/contexts/financial-data-context'

// Whether a type counts as owed is decided by keywords in its value elsewhere
// ('credit', 'loan', 'mortgage', 'auto'…), so asset values must steer clear of
// those words — a car is 'vehicle', never 'auto'.
const ACCOUNT_TYPES: { value: string; label: string; group: string }[] = [
  { value: 'checking',     label: 'Checking',            group: 'Assets: cash' },
  { value: 'savings',      label: 'Savings',             group: 'Assets: cash' },
  { value: 'money_market', label: 'Money market',        group: 'Assets: cash' },
  { value: 'cash',         label: 'Cash / payment app',  group: 'Assets: cash' },
  { value: 'brokerage',    label: 'Brokerage',           group: 'Assets: investments' },
  { value: 'retirement',   label: 'Retirement (401k, IRA)', group: 'Assets: investments' },
  { value: 'real_estate',  label: 'Home or property',    group: 'Assets: things you own' },
  { value: 'vehicle',      label: 'Car or vehicle',      group: 'Assets: things you own' },
  { value: 'valuables',    label: 'Valuables (jewelry, collectibles)', group: 'Assets: things you own' },
  { value: 'other_asset',  label: 'Other asset',         group: 'Assets: things you own' },
  { value: 'credit_card',  label: 'Credit card',         group: 'Liabilities: money you owe' },
  { value: 'student_loan', label: 'Student loan',        group: 'Liabilities: money you owe' },
  { value: 'auto_loan',    label: 'Auto loan',           group: 'Liabilities: money you owe' },
  { value: 'mortgage',     label: 'Mortgage',            group: 'Liabilities: money you owe' },
  { value: 'personal_loan',label: 'Personal loan',       group: 'Liabilities: money you owe' },
]

const GROUPS = ['Assets: cash', 'Assets: investments', 'Assets: things you own', 'Liabilities: money you owe']

/**
 * Manual account entry. Typing each account out is the point — it is how
 * someone finds the ones they had forgotten.
 */
export function AddAccountForm() {
  const { addManualAccount } = useFinancialData()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('checking')
  const [balance, setBalance] = useState('')
  const [limit, setLimit] = useState('')

  const isCredit = type === 'credit_card'
  const group = ACCOUNT_TYPES.find(t => t.value === type)?.group
  const balanceLabel =
    group === 'Assets: things you own' ? 'What it’s worth today' :
    group === 'Liabilities: money you owe' ? 'Balance owed' : 'Current balance'

  const reset = useCallback(() => {
    setName(''); setType('checking'); setBalance(''); setLimit(''); setOpen(false)
  }, [])

  const submit = useCallback(() => {
    const amount = parseFloat(balance)
    if (!name.trim() || isNaN(amount)) return
    addManualAccount({
      name: name.trim(),
      type,
      balance: amount,
      ...(isCredit && limit.trim() ? { limit: parseFloat(limit) } : {}),
    })
    reset()
  }, [name, type, balance, limit, isCredit, addManualAccount, reset])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-on-surface/15 text-label-lg text-on-surface hover:bg-on-surface/[0.06] transition-colors w-fit"
      >
        <Plus size={16} /> Add an account
      </button>
    )
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-title-md text-on-surface font-semibold">Add an account</p>
        <button onClick={reset} className="text-on-surface-variant hover:text-on-surface" aria-label="Cancel">
          <X size={17} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Field label="What do you call it?">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Chase checking"
            className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40"
          />
        </Field>

        <Field label="What type is it?">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40"
          >
            {GROUPS.map(group => (
              <optgroup key={group} label={group}>
                {ACCOUNT_TYPES.filter(t => t.group === group).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={balanceLabel}>
            <input
              value={balance}
              onChange={e => setBalance(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40"
            />
          </Field>

          {isCredit && (
            <Field label="Credit limit">
              <input
                value={limit}
                onChange={e => setLimit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40"
              />
            </Field>
          )}
        </div>

        {isCredit && (
          <p className="text-label-sm text-on-surface-variant">
            Balance ÷ limit is your utilization on this card.
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!name.trim() || isNaN(parseFloat(balance))}
        className="btn-action self-start items-center justify-center disabled:opacity-35"
      >
        Add account
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-md text-on-surface-variant">{label}</span>
      {children}
    </label>
  )
}
