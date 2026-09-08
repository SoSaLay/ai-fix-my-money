'use client'

import { useState, useCallback } from 'react'
import {
  Plus, X, Trash2, PenLine, Pencil,
  Home, Zap, Smartphone, Wifi, Shield, Car, Landmark, Tv, Baby, Dumbbell,
  ShoppingCart, UtensilsCrossed, Fuel, Bus, ShoppingBag, Clapperboard,
  HeartPulse, Plane, PawPrint, Scissors,
  Briefcase, Laptop, Clock, Coins, Store, HeartHandshake, PiggyBank, TrendingUp, Banknote,
  type LucideIcon,
} from 'lucide-react'
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
    blurb: 'Think recurring — the bills that come back every month for about the same amount, whether you use them or not.',
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
    { name: 'Investments',     Icon: TrendingUp     },
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
              <span className="flex items-center gap-2.5 min-w-0">
                <RowIcon section={section} name={row.name} />
                <span className="text-body-md text-on-surface truncate">{row.name}</span>
              </span>
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
              <PenLine size={14} className="shrink-0" />
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
                className="bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40 min-w-0"
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
              className="bg-surface-container rounded-xl px-3.5 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary/40 w-full min-w-0"
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
    </div>
  )
}

/** The template icon for a row, when its name matches one. */
function RowIcon({ section, name }: { section: Section; name: string }) {
  const match = TEMPLATES[section]?.find(t => t.name.toLowerCase() === name.trim().toLowerCase())
  const Icon = match?.Icon ?? PenLine
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

function removeRow(profile: FinancialProfile, section: Section, index: number): FinancialProfile {
  if (section === 'income') {
    return { ...profile, income: { ...profile.income, sources: profile.income.sources.filter((_, i) => i !== index) } }
  }
  if (section === 'fixed') {
    return { ...profile, expenses_fixed: profile.expenses_fixed.filter((_, i) => i !== index) }
  }
  return { ...profile, expenses_variable: profile.expenses_variable.filter((_, i) => i !== index) }
}
