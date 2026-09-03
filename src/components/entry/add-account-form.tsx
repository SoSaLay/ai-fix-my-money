'use client'

import { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { useFinancialData } from '@/contexts/financial-data-context'

const ACCOUNT_TYPES: { value: string; label: string; group: string }[] = [
  { value: 'checking',     label: 'Checking',            group: 'Holds your money' },
  { value: 'savings',      label: 'Savings',             group: 'Holds your money' },
  { value: 'money_market', label: 'Money market',        group: 'Holds your money' },
  { value: 'cash',         label: 'Cash / payment app',  group: 'Holds your money' },
  { value: 'brokerage',    label: 'Brokerage',           group: 'Holds investments' },
  { value: 'retirement',   label: 'Retirement (401k, IRA)', group: 'Holds investments' },
  { value: 'credit_card',  label: 'Credit card',         group: 'Money you owe' },
  { value: 'student_loan', label: 'Student loan',        group: 'Money you owe' },
  { value: 'auto_loan',    label: 'Auto loan',           group: 'Money you owe' },
  { value: 'mortgage',     label: 'Mortgage',            group: 'Money you owe' },
  { value: 'personal_loan',label: 'Personal loan',       group: 'Money you owe' },
]

const GROUPS = ['Holds your money', 'Holds investments', 'Money you owe']

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
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-lg font-medium text-secondary bg-secondary-fixed/25 hover:bg-secondary-fixed/40 transition-colors w-fit"
      >
        <Plus size={16} /> Add an account
      </button>
    )
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col gap-4">
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
            className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </Field>

        <Field label="What type is it?">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
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
          <Field label={isCredit ? 'Balance owed' : 'Current balance'}>
            <input
              value={balance}
              onChange={e => setBalance(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
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
                className="w-full bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </Field>
          )}
        </div>

        {isCredit && (
          <p className="text-label-sm text-on-surface-variant">
            Balance ÷ limit is your utilisation on this card.
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!name.trim() || isNaN(parseFloat(balance))}
        className="self-start bg-secondary text-white rounded-xl px-5 py-2.5 text-label-lg font-medium disabled:opacity-35 transition-opacity"
      >
        Add account
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      {children}
    </label>
  )
}
