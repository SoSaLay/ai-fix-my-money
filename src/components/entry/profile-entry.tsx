'use client'

import { useCallback, useState } from 'react'
import {
  Plus, X, Trash2, Pencil, Check, CircleDollarSign, MoreHorizontal,
  Home, Zap, Smartphone, Wifi, Shield, Car, Landmark, Tv, Baby, Dumbbell, Music,
  ShoppingCart, UtensilsCrossed, Fuel, Bus, ShoppingBag, Clapperboard,
  HeartPulse, Plane, PawPrint, Scissors,
  Briefcase, Laptop, Clock, Coins, Store, HeartHandshake, PiggyBank, Banknote,
  type LucideIcon,
} from 'lucide-react'
import { useFinancialData } from '@/contexts/financial-data-context'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { FinancialProfile } from '@/lib/finance/model'

type Section = 'income' | 'fixed' | 'variable'

const COPY: Record<Section, { title: string; blurb: string; nameLabel: string; namePlaceholder: string }> = {
  income: {
    title: 'Income',
    blurb: 'Take-home pay each month.',
    nameLabel: 'Source',
    namePlaceholder: 'Main job',
  },
  fixed: {
    title: 'Fixed costs',
    blurb: 'Bills that stay the same every month.',
    nameLabel: 'What is it',
    namePlaceholder: 'Rent',
  },
  variable: {
    title: 'Variable spending',
    blurb: 'Costs that change month to month.',
    nameLabel: 'Category',
    namePlaceholder: 'Groceries',
  },
}

/** Common entries, offered as one tap before anyone types anything. */
const TEMPLATES: Partial<Record<Section, { name: string; Icon: LucideIcon }[]>> = {
  income: [
    { name: 'Paycheck',        Icon: Briefcase  },
    { name: 'Business profit', Icon: Store      },
    { name: 'Freelance',       Icon: Laptop     },
    { name: 'Self-employed',   Icon: Coins      },
    { name: 'Tips',            Icon: Banknote   },
    { name: 'Second job',      Icon: Clock      },
    { name: 'Benefits',        Icon: Landmark       },
    { name: 'Pension',         Icon: PiggyBank      },
    { name: 'Rental income',   Icon: Home           },
    { name: 'Support',         Icon: HeartHandshake },
  ],
  fixed: [
    { name: 'Rent',          Icon: Home       },
    { name: 'Utilities',     Icon: Zap        },
    { name: 'Phone',         Icon: Smartphone },
    { name: 'Internet',      Icon: Wifi       },
    { name: 'Insurance',     Icon: Shield     },
    { name: 'Car payment',   Icon: Car        },
    { name: 'Loan payment',  Icon: Landmark   },
    { name: 'Subscriptions', Icon: Tv         },
    { name: 'Music',         Icon: Music      },
    { name: 'Childcare',     Icon: Baby       },
    { name: 'Gym',           Icon: Dumbbell   },
  ],
  variable: [
    { name: 'Groceries',     Icon: ShoppingCart    },
    { name: 'Eating out',    Icon: UtensilsCrossed },
    { name: 'Gas',           Icon: Fuel            },
    { name: 'Transit',       Icon: Bus             },
    { name: 'Shopping',      Icon: ShoppingBag     },
    { name: 'Entertainment', Icon: Clapperboard    },
    { name: 'Music',         Icon: Music           },
    { name: 'Health',        Icon: HeartPulse      },
    { name: 'Travel',        Icon: Plane           },
    { name: 'Pets',          Icon: PawPrint        },
    { name: 'Personal care', Icon: Scissors        },
  ],
}

/** Closed, picking a common entry, or filling in the amount. */
type AddStep = 'hidden' | 'picking' | 'amount'

/** Rows of name + monthly amount, written straight onto the profile. */
export function ProfileEntry({ section }: { section: Section }) {
  const { financialData, saveProfile } = useFinancialData()
  const [step, setStep] = useState<AddStep>('hidden')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  /** True when the name came from a template, so it isn't asked for again. */
  const [prefilled, setPrefilled] = useState(false)
  /** A template name is a starting point — this opens it for editing. */
  const [editingName, setEditingName] = useState(false)
  /** The row open for editing, and the figures being typed into it. */
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState({ name: '', amount: '' })
  /** A delete waits here until it is confirmed. */
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)

  const copy = COPY[section]
  const templates = TEMPLATES[section]
  const rows = readRows(financialData, section)
  const total = rows.reduce((s, r) => s + r.amount, 0)

  const reset = useCallback(() => {
    setName(''); setAmount(''); setPrefilled(false); setEditingName(false); setStep('hidden')
  }, [])

  const add = useCallback(() => {
    const value = parseFloat(amount)
    if (!name.trim() || isNaN(value)) return
    saveProfile(profile => writeRow(profile, section, name.trim(), value))
    reset()
  }, [name, amount, section, saveProfile, reset])

  const remove = useCallback((index: number) => {
    saveProfile(profile => removeRow(profile, section, index))
  }, [section, saveProfile])

  // ── Editing a row already recorded ──────────────────────────────────────
  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditDraft({ name: rows[index].name, amount: String(rows[index].amount) })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditDraft({ name: '', amount: '' })
  }

  const saveEdit = () => {
    if (editingIndex === null) return
    const value = parseFloat(editDraft.amount)
    const trimmed = editDraft.name.trim()
    if (!trimmed || isNaN(value)) return
    const index = editingIndex
    saveProfile(profile => updateRow(profile, section, index, trimmed, value))
    cancelEdit()
  }

  // Sections without templates go straight to the form.
  const openAdd = () => {
    setStep(templates ? 'picking' : 'amount')
    setPrefilled(false)
    setEditingName(false)
  }

  const pickTemplate = (templateName: string) => {
    setName(templateName)
    setPrefilled(true)
    setEditingName(false)
    setStep('amount')
  }

  const pickCustom = () => {
    setName('')
    setPrefilled(false)
    setEditingName(false)
    setStep('amount')
  }

  const backToPicking = () => {
    setStep('picking'); setName(''); setPrefilled(false); setEditingName(false)
  }

  const pendingRow = pendingDelete !== null ? rows[pendingDelete] : undefined

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
              className="flex flex-col gap-2 py-2.5 border-b border-outline-variant/30 last:border-0"
            >
              {editingIndex === i ? (
                // Edit in place. The fields stack on a phone and sit side by
                // side once there is room, and the buttons are full tap targets
                // rather than something to hit with a mouse.
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                    <input
                      autoFocus
                      value={editDraft.name}
                      onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      placeholder={copy.namePlaceholder}
                      className="rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40 min-w-0"
                      aria-label={`${copy.nameLabel} for ${row.name}`}
                    />
                    <input
                      value={editDraft.amount}
                      onChange={e => setEditDraft(d => ({ ...d, amount: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface tabular-nums outline-none transition-colors focus:border-on-surface/40 w-full min-w-0"
                      aria-label={`Monthly amount for ${row.name}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={!editDraft.name.trim() || isNaN(parseFloat(editDraft.amount))}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-label-lg font-semibold text-white bg-[#17171c] hover:bg-black transition-colors disabled:opacity-35"
                    >
                      <Check size={15} /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <RowIcon section={section} name={row.name} />
                    <span className="text-body-md text-on-surface truncate">{row.name}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-body-md text-on-surface tabular-nums mr-1">
                      ${row.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                    {/* Always on screen: on a phone there is no hover to
                        reveal them with. */}
                    <button
                      onClick={() => startEdit(i)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant/70 hover:text-secondary hover:bg-on-surface/[0.06] transition-colors"
                      aria-label={`Edit ${row.name}`}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(i)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant/70 hover:text-error hover:bg-error/[0.08] transition-colors"
                      aria-label={`Remove ${row.name}`}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 'picking' && templates && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              Quick select (monthly)
            </p>
            <button
              onClick={reset}
              className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
              aria-label="Cancel"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {templates.map(({ name: templateName, Icon }) => (
              <button
                key={templateName}
                onClick={() => pickTemplate(templateName)}
                className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2.5 text-label-md font-medium text-on-surface text-left hover:opacity-80 active:scale-[0.97] transition-all"
              >
                <Icon size={14} className="text-on-surface-variant shrink-0" />
                <span className="truncate">{templateName}</span>
              </button>
            ))}

            <button
              onClick={pickCustom}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-label-md font-medium text-secondary text-left hover:opacity-80 active:scale-[0.97] transition-all bg-secondary/10"
            >
              <MoreHorizontal size={14} className="shrink-0" />
              <span className="truncate">Something else</span>
            </button>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <div className="flex flex-col gap-3">
          {/* A template name shows as a label until you click the pencil. */}
          {prefilled && !editingName && (
            <div className="flex items-center gap-2.5">
              <RowIcon section={section} name={name} />
              <p className="text-body-md text-on-surface font-medium truncate">{name}</p>
              <button
                onClick={() => setEditingName(true)}
                className="text-on-surface-variant/60 hover:text-secondary transition-colors shrink-0"
                aria-label={`Rename ${name}`}
                title="Rename"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}

          <div className={prefilled && !editingName ? '' : 'grid grid-cols-[1fr_130px] gap-2'}>
            {(!prefilled || editingName) && (
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
                placeholder={copy.namePlaceholder}
                className="rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-on-surface/40 min-w-0"
                aria-label={copy.nameLabel}
              />
            )}
            <input
              autoFocus={prefilled && !editingName}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
              inputMode="decimal"
              placeholder="0.00"
              className="rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface tabular-nums outline-none transition-colors focus:border-on-surface/40 w-full min-w-0"
              aria-label="Monthly amount"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={add}
              disabled={!name.trim() || isNaN(parseFloat(amount))}
              className="btn-action items-center justify-center disabled:opacity-35"
            >
              Add
            </button>
            {templates && (
              <button
                onClick={backToPicking}
                className="text-label-lg text-on-surface-variant hover:text-on-surface px-2 py-2.5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={reset}
              className="text-on-surface-variant hover:text-on-surface p-2.5"
              aria-label="Cancel"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      {step === 'hidden' && (
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-label-lg font-medium text-secondary hover:opacity-80 transition-opacity w-fit"
        >
          <Plus size={15} /> Add {section === 'income' ? 'a source' : section === 'fixed' ? 'a fixed cost' : 'a category'}
        </button>
      )}

      {/* Nothing is removed on a single tap — the row is named back here first. */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingRow ? `Remove "${pendingRow.name}"?` : 'Remove this entry?'}
        body="It comes off your monthly figures right away. You can add it again at any time."
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingDelete !== null) remove(pendingDelete)
          setPendingDelete(null)
          // Every row below the removed one shifts up, so an open editor is
          // no longer pointing at the row it was opened on.
          cancelEdit()
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

/**
 * The template icon for a row, when its name matches one. Anything written in
 * by hand wears a plain money mark — not a pencil, which reads as "edit me".
 */
function RowIcon({ section, name }: { section: Section; name: string }) {
  const match = TEMPLATES[section]?.find(t => t.name.toLowerCase() === name.trim().toLowerCase())
  const Icon = match?.Icon ?? CircleDollarSign
  return <Icon size={14} className="text-on-surface-variant/70 shrink-0" />
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

function updateRow(
  profile: FinancialProfile, section: Section, index: number, name: string, amount: number,
): FinancialProfile {
  if (section === 'income') {
    return {
      ...profile,
      income: {
        ...profile.income,
        sources: profile.income.sources.map((s, i) => (i === index ? { ...s, name, amount } : s)),
      },
    }
  }
  if (section === 'fixed') {
    return {
      ...profile,
      expenses_fixed: profile.expenses_fixed.map((e, i) => (i === index ? { ...e, name, amount } : e)),
    }
  }
  return {
    ...profile,
    expenses_variable: profile.expenses_variable.map((e, i) =>
      i === index ? { ...e, category: name, amount } : e),
  }
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
