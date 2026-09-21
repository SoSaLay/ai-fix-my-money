'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'

import {
  INVESTMENT_CATEGORIES,
  type CategoryAllocations,
  type CustomAllocation,
  type InvestmentCategoryId,
} from '@/lib/investing/categories'
import { RISK_LABEL, RISK_RAMP, type RiskShade } from '@/lib/investing/risk-ramp'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

/** Other entries have no tier to colour them by, so they wear the brand's. */
const CUSTOM_SHADE: RiskShade = { tint: '#eeedfb', stripe: '#4c49c9' }

/**
 * The investments on offer, and what share of income the learner has put
 * behind each one. Every row carries its risk tier as a colour and as a word,
 * the same pairing the lesson table uses.
 *
 * Anything the list does not name goes under Other, where the learner writes
 * the investment in and allocates to it the same way.
 */
interface AllocationListProps {
  allocations: CategoryAllocations
  custom: CustomAllocation[]
  monthlyIncome: number
  /** What is still uncommitted, so a row cannot take more than exists. */
  headroomPct: number
  disabled?: boolean
  onChange: (id: InvestmentCategoryId, pct: number) => void
  onCustomChange: (custom: CustomAllocation[]) => void
}

/** A row's place in the list: funded first, biggest share first within that. */
function rankKeys(rows: Array<{ key: string; pct: number }>): string[] {
  return rows
    .map((row, i) => ({ ...row, i }))
    .sort((a, b) =>
      (b.pct > 0 ? 1 : 0) - (a.pct > 0 ? 1 : 0) ||  // funded rises above unfunded
      b.pct - a.pct ||                              // then the larger share leads
      a.i - b.i)                                    // then the catalog's own order
    .map(row => row.key)
}

interface Row {
  key: string
  name: string
  badge: string
  shade: RiskShade
  pct: number
  startOpen?: boolean
  onSet: (pct: number) => void
  onRemove?: () => void
}

export function AllocationList({
  allocations, custom, monthlyIncome, headroomPct, disabled, onChange, onCustomChange,
}: AllocationListProps) {
  const setCustomPct = (id: string, pct: number) =>
    onCustomChange(custom.map(c => (c.id === id ? { ...c, pct } : c)))

  // Only a write-in the learner just typed opens ready to set. Restoring a
  // saved plan with its rows already open would hold the order still (below)
  // for as long as they stayed open.
  const justAdded = useRef<Set<string>>(new Set())

  // Which rows have their controls out. The order is held still while any of
  // them do — see the list below.
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const handleOpenChange = useCallback((key: string, isOpen: boolean) => {
    setOpenKeys(prev => {
      if (prev.includes(key) === isOpen) return prev
      return isOpen ? [...prev, key] : prev.filter(k => k !== key)
    })
  }, [])
  const interacting = openKeys.length > 0

  // Catalog order, then write-ins: what a row falls back to once nothing is
  // funded, and the tiebreak rankKeys sorts against.
  const rows: Row[] = [
    ...INVESTMENT_CATEGORIES.map(category => ({
      key: category.id,
      name: category.name,
      badge: RISK_LABEL[category.tier],
      shade: RISK_RAMP[category.tier],
      pct: allocations[category.id] ?? 0,
      onSet: (pct: number) => onChange(category.id, pct),
    })),
    ...custom.map(entry => ({
      key: entry.id,
      name: entry.name,
      badge: 'Your own',
      shade: CUSTOM_SHADE,
      pct: entry.pct,
      startOpen: justAdded.current.has(entry.id),
      onSet: (pct: number) => setCustomPct(entry.id, pct),
      onRemove: () => onCustomChange(custom.filter(c => c.id !== entry.id)),
    })),
  ]

  const [order, setOrder] = useState<string[]>(() => rankKeys(rows))
  const signature = rows.map(r => `${r.key}:${r.pct}`).join('|')

  // Re-rank only once every row is closed. Sorting the moment a slider passes
  // zero moved the row out from under the pointer mid-drag, which is why this
  // list used to be left in a fixed order.
  useEffect(() => {
    if (interacting) return
    setOrder(rankKeys(rows))
    // rows is rebuilt every render; `signature` is what actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interacting, signature])

  const byKey = new Map(rows.map(row => [row.key, row]))
  const ordered: Row[] = [
    // Ranked rows, minus any that have since been removed.
    ...order.map(key => byKey.get(key)).filter((row): row is Row => row !== undefined),
    // A row added while the order was held still sits at the end until it is.
    ...rows.filter(row => !order.includes(row.key)),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-headline-sm text-on-surface font-bold">Where it goes</h2>
        <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
          Select the investments you want and set the share of your monthly income behind
          each one. Drag the slider, or type the percent or the dollars a month. Whatever
          you fund moves to the top. Not listed? Add your own at the bottom.
        </p>
      </div>

      {/* Catalog rows and write-ins rank together, so a write-in you fund
          rises past the listed investments you have not. */}
      <div className="flex flex-col gap-2.5">
        {ordered.map(row => (
          <AllocationRow
            key={row.key}
            rowKey={row.key}
            name={row.name}
            badge={row.badge}
            shade={row.shade}
            pct={row.pct}
            monthlyIncome={monthlyIncome}
            headroomPct={headroomPct}
            disabled={disabled}
            startOpen={row.startOpen}
            onOpenChange={handleOpenChange}
            onSet={row.onSet}
            onRemove={row.onRemove}
          />
        ))}
      </div>

      {!disabled && (
        <div className="flex flex-col gap-2.5">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
            Not listed
          </p>
          <AddCustom
            onAdd={name => {
              const id = `custom_${Date.now()}`
              justAdded.current.add(id)
              onCustomChange([...custom, { id, name, pct: 0 }])
            }}
          />
        </div>
      )}
    </div>
  )
}

function AddCustom({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <div className="rounded-2xl border border-on-surface/15 pl-4 pr-2 py-1.5 flex items-center gap-2 focus-within:border-on-surface/40 transition-colors">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') add() }}
        maxLength={60}
        placeholder="Type your own investment"
        className="flex-1 min-w-0 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/70 outline-none"
        aria-label="Name of your own investment"
      />
      <button
        onClick={add}
        disabled={!name.trim()}
        className="shrink-0 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-label-lg text-on-surface hover:bg-on-surface/[0.06] transition-colors disabled:opacity-40"
      >
        <Plus size={16} /> Add
      </button>
    </div>
  )
}

function AllocationRow({
  rowKey, name, badge, shade, pct, monthlyIncome, headroomPct, disabled,
  startOpen = false, onOpenChange, onSet, onRemove,
}: {
  /** Identifies this row to the list, which ranks by it. */
  rowKey: string
  name: string
  badge: string
  shade: RiskShade
  pct: number
  monthlyIncome: number
  headroomPct: number
  disabled?: boolean
  /** A row the learner just wrote in opens ready to set. */
  startOpen?: boolean
  /** The list holds its order still while any row's controls are out. */
  onOpenChange: (key: string, open: boolean) => void
  onSet: (pct: number) => void
  /** Deletes the row itself, not just its share. Other entries only. */
  onRemove?: () => void
}) {
  const [open, setOpen] = useState(startOpen)
  const [draft, setDraft] = useState(String(pct || ''))
  /** The same share, typed as dollars a month rather than as a percent. */
  const [amountDraft, setAmountDraft] = useState('')
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const active = pct > 0
  const amount = Math.round((pct / 100) * monthlyIncome)

  /** This row's own share plus whatever is still free. */
  const ceiling = pct + headroomPct

  // A row clamped from outside — because another row took the headroom — has to
  // show the value that was actually kept, not the one that was typed.
  useEffect(() => {
    setDraft(String(pct || ''))
    setAmountDraft(pct > 0 ? String(Math.round((pct / 100) * monthlyIncome)) : '')
  }, [pct, monthlyIncome])

  const set = (value: number) => {
    onSet(Math.max(0, Math.min(Math.round(value), ceiling)))
  }

  const commitTyped = () => {
    const parsed = parseFloat(draft)
    set(isNaN(parsed) ? 0 : parsed)
  }

  // Dollars a month, for anyone who knows the figure they want to put in
  // rather than the share of income it works out to.
  const commitAmount = () => {
    if (monthlyIncome <= 0) return
    const parsed = parseFloat(amountDraft.replace(/[^0-9.]/g, ''))
    set(isNaN(parsed) ? 0 : (parsed / monthlyIncome) * 100)
  }

  // The tick confirms the row and puts the controls away. Without this it
  // committed a value the row already held, so it looked like nothing happened.
  const confirm = () => {
    commitTyped()
    setOpen(false)
  }

  // The X closes a row nobody has funded, clears one that is funded, and
  // deletes a write-in outright. A row that was opened by mistake needs a way
  // back out either way — leaving only the tick made "put it away" look like
  // "commit to it".
  const dismiss = () => {
    if (onRemove) setConfirmingRemove(true)
    else { if (active) set(0); setOpen(false) }
  }

  const dismissLabel = onRemove
    ? `Remove ${name}`
    : active ? `Clear ${name}` : `Close ${name}`

  const showControls = open && !disabled

  useEffect(() => {
    onOpenChange(rowKey, showControls)
  }, [rowKey, showControls, onOpenChange])

  // A row removed while open would otherwise hold the order still for good.
  useEffect(() => () => onOpenChange(rowKey, false), [rowKey, onOpenChange])

  return (
    <div
      className="rounded-2xl px-4 py-3 flex flex-col gap-2 transition-colors"
      style={{
        backgroundColor: active ? shade.tint : undefined,
        borderLeft: `3px solid ${active ? shade.stripe : 'transparent'}`,
        boxShadow: active ? undefined : 'inset 0 0 0 1px rgba(45,47,51,0.15)',
      }}
    >
      {/* Height is held while the controls are out: the percent and amount
          appear the moment the value passes zero, and without this the header
          grew and shunted the slider down under the pointer mid-drag. */}
      <div className={`flex items-start justify-between gap-2 ${showControls ? 'min-h-10' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
          <p className="text-body-md font-semibold text-on-surface break-words">{name}</p>
          <span
            className="text-label-sm font-semibold shrink-0 px-2.5 py-0.5 rounded-full"
            style={{ color: shade.stripe, backgroundColor: active ? 'rgba(255,255,255,0.6)' : shade.tint }}
          >
            {badge}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {active && (
            <div className="text-right">
              <span className="text-body-md font-semibold text-on-surface tabular-nums">
                {pct}%
              </span>
              <span className="block text-label-md text-on-surface-variant tabular-nums">
                ${amount.toLocaleString()}/mo
              </span>
            </div>
          )}

          {!showControls && !disabled && (
            <button
              onClick={() => setOpen(true)}
              className={active
                ? 'inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/[0.06] transition-colors'
                : 'inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-label-lg text-on-surface hover:bg-on-surface/[0.06] transition-colors'}
              aria-label={active ? `Edit ${name}` : `Select ${name}`}
            >
              {active ? <Pencil size={16} /> : <><Plus size={16} /> Select</>}
            </button>
          )}
        </div>
      </div>

      {showControls && (
        // Drag it or type it — the same value either way. A percentage is
        // easier to feel on a slider and easier to be exact about in a field,
        // and there is no reason to make someone pick one.
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <input
            type="range"
            min={0}
            max={Math.max(ceiling, 1)}
            step={1}
            value={pct}
            onChange={e => set(Number(e.target.value))}
            className="w-full sm:flex-1 min-w-0 h-1.5 cursor-pointer accent-secondary"
            aria-label={`Percent of income for ${name}`}
          />
          <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
            {/* The field sits on a tinted row and on a plain one, so it carries
                its own ground and its own outline rather than borrowing the
                row's. White on white is invisible on a row nobody has funded
                yet, which is exactly when the field matters most. */}
            <div className="flex flex-1 sm:flex-none items-center gap-0.5 rounded-xl border border-on-surface/20 bg-white pl-1.5 pr-2 py-1.5 focus-within:border-on-surface/45 transition-colors">
              <input
                type="number"
                min={0}
                max={ceiling}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commitTyped}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirm()
                  if (e.key === 'Escape') setDraft(String(pct || ''))
                }}
                // Centred, not right-aligned: the browser draws its stepper
                // arrows inside the right edge of the field, so right-aligned
                // digits end up underneath them. Centring puts clear space on
                // both sides of the number.
                className="w-full sm:w-16 bg-transparent text-body-md text-on-surface tabular-nums text-center outline-none"
                aria-label={`Percent of income for ${name}, typed`}
              />
              <span className="text-label-sm text-on-surface-variant">%</span>
            </div>

            {/* The same share in dollars a month. A percent is the unit the
                plan is kept in; a monthly figure is the one people actually
                think in, so either one can be typed. */}
            <div className="flex flex-1 sm:flex-none items-center gap-0.5 rounded-xl border border-on-surface/20 bg-white pl-2 pr-1.5 py-1.5 focus-within:border-on-surface/45 transition-colors">
              <span className="text-label-sm text-on-surface-variant">$</span>
              <input
                inputMode="decimal"
                value={amountDraft}
                onChange={e => setAmountDraft(e.target.value)}
                onBlur={commitAmount}
                onKeyDown={e => {
                  if (e.key === 'Enter') { commitAmount(); setOpen(false) }
                  if (e.key === 'Escape') {
                    setAmountDraft(pct > 0 ? String(Math.round((pct / 100) * monthlyIncome)) : '')
                  }
                }}
                placeholder="0"
                className="w-full sm:w-20 bg-transparent text-body-md text-on-surface tabular-nums text-center outline-none"
                aria-label={`Dollars a month for ${name}, typed`}
              />
              <span className="text-label-sm text-on-surface-variant">/mo</span>
            </div>

            {/* Nothing set yet means nothing to confirm, so the tick waits
                until the slider or the fields have put a figure in. */}
            {active && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={confirm}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17171c] text-white hover:bg-black transition-colors"
                aria-label={`Confirm ${name}`}
              >
                <Check size={16} />
              </button>
            )}

            <button
              onClick={dismiss}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/[0.06] transition-colors"
              aria-label={dismissLabel}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Deleting the row itself is not undoable — clearing its share is, so
          only the delete asks. */}
      <ConfirmDialog
        open={confirmingRemove}
        title={`Remove "${name}"?`}
        body="The investment and the share of income behind it come off your plan."
        confirmLabel="Remove"
        onConfirm={() => { setConfirmingRemove(false); onRemove?.() }}
        onCancel={() => setConfirmingRemove(false)}
      />
    </div>
  )
}
