'use client'

import { useState, useEffect, useId, useRef, type ReactNode } from 'react'
import {
  Pencil, Trash2, Check, X, Plus,
  ChevronDown, ChevronRight, Target,
} from 'lucide-react'
import type { SavingsGoal } from '@/hooks/use-data'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

// ── Local types ────────────────────────────────────────────────────────────

interface GoalFolder {
  id: string
  name: string
}

// ── Storage helpers ────────────────────────────────────────────────────────

const FOLDERS_KEY    = 'llg_goal_folders'
const FOLDER_MAP_KEY = 'llg_goal_folder_map'
/** The shown order of the top level, holding both kinds of card. */
const LAYOUT_KEY     = 'llg_goal_layout'

const folderKey = (id: string) => `folder:${id}`
const goalKey   = (id: string) => `goal:${id}`

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── Props ──────────────────────────────────────────────────────────────────

interface GoalsListProps {
  goals: SavingsGoal[]
  monthlyIncome: number
  /**
   * The share of income savings may claim in total, after the spending limit
   * and investing have taken theirs. Goals are bound by it exactly as the
   * general-savings dial is — a goal that could claim 90% of an income with 7%
   * free was writing a plan the money could not pay for.
   */
  maxTotalSavingsPct: number
  /** What general savings already holds, which goals cannot have. */
  generalSavingsPct: number
  /** Swaps two goals in storage. A move is carried out as adjacent swaps. */
  onSwap: (idA: string, idB: string) => void
  onUpdate: (id: string, updates: { name?: string; target_amount?: number; allocation_pct?: number }) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onCreate: (goal: { name: string; target_amount: number; allocation_pct?: number }) => Promise<string | false>
  updating: boolean
}

interface EditingState {
  name: string
  target_amount: string
  allocation_pct: string
}

// ── GoalRow ────────────────────────────────────────────────────────────────

function GoalRow({
  goal,
  monthlyIncome,
  maxPct,
  onUpdate,
  onDelete,
}: {
  goal: SavingsGoal
  monthlyIncome: number
  /** The most this goal may claim: its own share plus whatever is still free. */
  maxPct: number
  onUpdate: GoalsListProps['onUpdate']
  onDelete: GoalsListProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  /** A share bigger than the income left. Saving it silently at the ceiling
      looked like the figure had been accepted. */
  const [shareTooBig, setShareTooBig] = useState(false)
  const [form, setForm] = useState<EditingState>({
    name: goal.name,
    target_amount: String(goal.target_amount),
    allocation_pct: String(goal.allocation_pct),
  })
  // Unique per row, so each edit form's labels point at their own fields.
  const fieldId = useId()

  /** How far along the goal is — drawn as the bar below. */
  const progressPct =
    goal.target_amount > 0
      ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
      : 0
  /** What it takes from each month's income — the figure the edit form sets. */
  const sharePct = Math.round(Number(goal.allocation_pct) || 0)

  const monthlyContribution = Math.round((Number(goal.allocation_pct) / 100) * monthlyIncome)
  const monthsRemaining =
    monthlyContribution > 0
      ? Math.ceil((goal.target_amount - goal.current_amount) / monthlyContribution)
      : null

  const handleSave = async () => {
    const targetNum = parseFloat(form.target_amount.replace(/,/g, ''))
    const allocNum = parseFloat(form.allocation_pct)
    if (isNaN(targetNum) || targetNum <= 0) return

    // More than there is: the form stays open, the field empties, and the
    // ceiling turns red — which is where the answer was all along.
    if (!isNaN(allocNum) && allocNum > maxPct) {
      setShareTooBig(true)
      setForm(f => ({ ...f, allocation_pct: '' }))
      return
    }

    setSaving(true)
    const success = await onUpdate(goal.id, {
      name: form.name.trim() || goal.name,
      target_amount: targetNum,
      allocation_pct: isNaN(allocNum) ? goal.allocation_pct : Math.max(0, allocNum),
    })
    setSaving(false)
    if (success) setEditing(false)
  }

  const handleDelete = async () => {
    setConfirmingDelete(false)
    await onDelete(goal.id)
  }

  const handleCancel = () => {
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      allocation_pct: String(goal.allocation_pct),
    })
    setShareTooBig(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-4 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-name`} className="text-label-md text-on-surface-variant">Goal name</label>
          <input
            id={`${fieldId}-name`}
            className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Emergency Fund"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${fieldId}-target`} className="text-label-md text-on-surface-variant">Target amount</label>
            <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
              <span className="text-body-lg text-on-surface-variant">$</span>
              <input
                id={`${fieldId}-target`}
                type="number"
                min="1"
                className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
                value={form.target_amount}
                onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                placeholder="10,000"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${fieldId}-share`} className="text-label-md text-on-surface-variant">Share of monthly income</label>
            <div className={`flex items-center gap-1 rounded-2xl border px-4 py-3 transition-colors ${
              shareTooBig
                ? 'border-error'
                : 'border-on-surface/15 focus-within:border-on-surface/40'
            }`}>
              <input
                id={`${fieldId}-share`}
                type="number"
                min="0"
                max={maxPct}
                step="1"
                aria-invalid={shareTooBig}
                className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
                value={form.allocation_pct}
                onChange={e => { setShareTooBig(false); setForm(f => ({ ...f, allocation_pct: e.target.value })) }}
                placeholder="10"
              />
              <span className="text-body-lg text-on-surface-variant">%</span>
            </div>
            <p className={`text-label-sm ${shareTooBig ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
              Up to {maxPct}% · ${Math.round((maxPct / 100) * monthlyIncome).toLocaleString()}/mo
            </p>
          </div>
        </div>

        {!isNaN(parseFloat(form.allocation_pct)) && parseFloat(form.allocation_pct) > 0 && (
          <div className="rounded-2xl bg-surface-container-low px-5 py-4 flex items-baseline justify-between gap-4 flex-wrap">
            <span className="text-body-lg text-on-surface-variant">Monthly contribution</span>
            <span className="text-headline-md sm:text-display-sm font-bold text-on-surface tabular-nums">
              ${Math.round((parseFloat(form.allocation_pct) / 100) * monthlyIncome).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-action flex-1 sm:flex-none items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Check size={15} />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 px-4 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
            >
              <X size={15} />
              Cancel
            </button>
          </div>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex sm:ml-auto min-h-11 items-center justify-center gap-1.5 px-4 rounded-full text-label-lg text-error hover:bg-error/[0.08] transition-colors"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>

        <ConfirmDialog
          open={confirmingDelete}
          title={`Delete "${goal.name}"?`}
          body="The goal and its progress are removed. This cannot be undone."
          confirmLabel="Delete goal"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base leading-tight shrink-0">💰</span>
          <p className="text-body-lg font-medium text-on-surface break-words">{goal.name}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Labelled, because a bare percentage next to a savings goal reads
              as progress — and the progress is the bar underneath. */}
          <p className="text-body-lg font-semibold text-on-surface tabular-nums">
            {sharePct}%
            <span className="text-label-sm font-normal text-on-surface-variant"> of income</span>
          </p>

          {/* Always reachable: a phone has no hover to reveal it with. */}
          <button
            onClick={() => setEditing(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label={`Edit ${goal.name}`}
            title="Edit goal"
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>
      <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, backgroundColor: '#4c49c9' }}
        />
      </div>
      <div className="flex items-center justify-between gap-x-3 gap-y-1 flex-wrap">
        <p className="text-label-md text-on-surface-variant tabular-nums">
          ${goal.current_amount.toLocaleString()} of ${goal.target_amount.toLocaleString()}
        </p>
        <div className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <span className="font-medium text-on-surface tabular-nums">
            +${monthlyContribution.toLocaleString()}/mo
          </span>
          {monthsRemaining !== null && monthsRemaining > 0 && (
            <span className="text-secondary">· {monthsRemaining}mo left</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── NewGoalForm ────────────────────────────────────────────────────────────

function NewGoalForm({
  monthlyIncome,
  maxPct,
  onCreate,
  onClose,
  label = 'New Savings Goal',
}: {
  monthlyIncome: number
  /** What is still free for a new goal to claim. */
  maxPct: number
  onCreate: GoalsListProps['onCreate']
  onClose: (newId?: string) => void
  label?: string
}) {
  const [form, setForm] = useState({ name: '', target_amount: '', allocation_pct: '0' })
  const [saving, setSaving] = useState(false)
  const [shareTooBig, setShareTooBig] = useState(false)
  const fieldId = useId()

  const monthlyContrib = Math.round((parseFloat(form.allocation_pct || '0') / 100) * monthlyIncome)

  const handleCreate = async () => {
    const targetNum = parseFloat(form.target_amount.replace(/,/g, ''))
    const allocNum = parseFloat(form.allocation_pct)
    if (!form.name.trim() || isNaN(targetNum) || targetNum <= 0) return

    // More than there is — say so rather than quietly saving the ceiling.
    if (!isNaN(allocNum) && allocNum > maxPct) {
      setShareTooBig(true)
      setForm(f => ({ ...f, allocation_pct: '' }))
      return
    }

    setSaving(true)
    const result = await onCreate({
      name: form.name.trim(),
      target_amount: targetNum,
      allocation_pct: isNaN(allocNum) ? 0 : Math.max(0, allocNum),
    })
    setSaving(false)
    if (result) onClose(result)
  }

  return (
    <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-4 sm:p-6">
      <p className="text-title-md text-on-surface">{label}</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-name`} className="text-label-md text-on-surface-variant">Goal name</label>
        <input
          id={`${fieldId}-name`}
          className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Emergency Fund"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-target`} className="text-label-md text-on-surface-variant">Target amount</label>
          <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
            <span className="text-body-lg text-on-surface-variant">$</span>
            <input
              id={`${fieldId}-target`}
              type="number"
              min="1"
              className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
              value={form.target_amount}
              onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
              placeholder="10,000"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${fieldId}-share`} className="text-label-md text-on-surface-variant">Share of monthly income</label>
          <div className={`flex items-center gap-1 rounded-2xl border px-4 py-3 transition-colors ${
            shareTooBig ? 'border-error' : 'border-on-surface/15 focus-within:border-on-surface/40'
          }`}>
            <input
              id={`${fieldId}-share`}
              type="number"
              min="0"
              max={maxPct}
              step="1"
              aria-invalid={shareTooBig}
              className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
              value={form.allocation_pct}
              onChange={e => { setShareTooBig(false); setForm(f => ({ ...f, allocation_pct: e.target.value })) }}
            />
            <span className="text-body-lg text-on-surface-variant">%</span>
          </div>
          <p className={`text-label-sm ${shareTooBig ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
            Up to {maxPct}% · ${Math.round((maxPct / 100) * monthlyIncome).toLocaleString()}/mo
          </p>
        </div>
      </div>

      {/* What that share is actually worth — the figure people are choosing by. */}
      {monthlyContrib > 0 && (
        <div className="rounded-2xl bg-surface-container-low px-5 py-4 flex items-baseline justify-between gap-4 flex-wrap">
          <span className="text-body-lg text-on-surface-variant">Monthly contribution</span>
          <span className="text-headline-md sm:text-display-sm font-bold text-on-surface tabular-nums">
            ${monthlyContrib.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleCreate}
          disabled={saving || !form.name.trim()}
          className="btn-action flex-1 sm:flex-none items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check size={15} />
          {saving ? 'Creating…' : 'Create goal'}
        </button>
        <button
          onClick={() => onClose()}
          className="flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 px-4 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── NewFolderForm ──────────────────────────────────────────────────────────

function NewFolderForm({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')
  const fieldId = useId()

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim())
    onClose()
  }

  return (
    <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-4 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-title-md text-on-surface">New parent goal</p>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Group related savings goals under one project — e.g. &quot;Home Renovation&quot; with items for kitchen, bathroom, etc.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${fieldId}-folder`} className="text-label-md text-on-surface-variant">
          Project name
        </label>
        <input
          id={`${fieldId}-folder`}
          className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3.5 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Home Renovation"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="btn-action flex-1 sm:flex-none items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check size={15} />
          Create project
        </button>
        <button
          onClick={onClose}
          className="flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 px-4 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
        >
          <X size={15} />
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── FolderSection ──────────────────────────────────────────────────────────

function FolderSection({
  folder,
  goals,
  monthlyIncome,
  ceilingFor,
  freePct,
  onUpdate,
  onDelete,
  onCreate,
  onDeleteFolder,
  onGoalCreated,
  onReorder,
}: {
  folder: GoalFolder
  goals: SavingsGoal[]
  monthlyIncome: number
  /** The most a given goal may claim. */
  ceilingFor: (goal: SavingsGoal) => number
  /** What a goal that holds nothing yet may claim. */
  freePct: number
  onUpdate: GoalsListProps['onUpdate']
  onDelete: GoalsListProps['onDelete']
  onCreate: GoalsListProps['onCreate']
  onDeleteFolder: (id: string) => void
  onGoalCreated: (goalId: string, folderId: string) => void
  onReorder: (orderedIds: string[]) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const overallPct = totalTarget > 0 ? Math.min(Math.round((totalCurrent / totalTarget) * 100), 100) : 0

  const handleGoalClose = (newId?: string) => {
    if (newId) onGoalCreated(newId, folder.id)
    setAddingGoal(false)
  }

  const handleDeleteFolder = () => {
    setConfirmingDelete(false)
    onDeleteFolder(folder.id)
  }

  return (
    <div className="flex flex-col rounded-3xl border border-on-surface/[0.06] bg-surface-container-lowest shadow-card overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 bg-surface-container-low">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-start gap-2.5 flex-1 text-left min-w-0 py-1"
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight size={18} className="text-on-surface-variant shrink-0 mt-0.5" />
            : <ChevronDown size={18} className="text-on-surface-variant shrink-0 mt-0.5" />}
          <span className="text-base leading-tight shrink-0">🎯</span>
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-title-md text-on-surface break-words">{folder.name}</span>
            <span className="flex items-center gap-2 flex-wrap text-label-md text-on-surface-variant">
              <span>{goals.length} goal{goals.length === 1 ? '' : 's'}</span>
              {/* Shut, this is all anyone can see of the project — so it
                  carries what the project is worth, not only how far along
                  it is. Open, the figures below say it already. */}
              {collapsed && totalTarget > 0 && (
                <span className="font-semibold text-on-surface tabular-nums">
                  ${totalTarget.toLocaleString()}
                </span>
              )}
              {goals.length > 0 && (
                <span className="rounded-full bg-surface-container-lowest border border-on-surface/[0.06] px-2 py-0.5 text-on-surface tabular-nums">
                  {overallPct}%
                </span>
              )}
            </span>
          </span>
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/[0.08] transition-colors"
          aria-label={`Remove ${folder.name}`}
          title="Remove project"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Remove "${folder.name}"?`}
        body="Goals inside it are kept — they become standalone goals."
        confirmLabel="Remove project"
        onConfirm={handleDeleteFolder}
        onCancel={() => setConfirmingDelete(false)}
      />

      {!collapsed && (
        <div className="flex flex-col gap-4 px-4 sm:px-5 py-4">
          {goals.length > 1 && (
            <div className="flex flex-col gap-2 pb-3 border-b border-on-surface/[0.07]">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-label-lg text-on-surface-variant">Overall</p>
                <p className="text-title-md text-on-surface tabular-nums text-right">
                  ${totalCurrent.toLocaleString()} / ${totalTarget.toLocaleString()}
                </p>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%`, backgroundColor: '#4c49c9' }}
                />
              </div>
            </div>
          )}

          {goals.length === 0 && !addingGoal && (
            <p className="text-body-md text-on-surface-variant text-center py-3">
              No goals yet — add one below.
            </p>
          )}

          <SortableList
            keys={goals.map(g => g.id)}
            labelFor={id => goals.find(g => g.id === id)?.name ?? 'Goal'}
            onReorder={onReorder}
            renderItem={id => {
              const goal = goals.find(g => g.id === id)
              if (!goal) return null
              return (
                <GoalRow
                  goal={goal}
                  monthlyIncome={monthlyIncome}
                  maxPct={ceilingFor(goal)}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              )
            }}
          />

          {addingGoal ? (
            <NewGoalForm
              monthlyIncome={monthlyIncome}
              maxPct={freePct}
              onCreate={onCreate}
              onClose={handleGoalClose}
              label="Add goal to project"
            />
          ) : (
            <button
              onClick={() => setAddingGoal(true)}
              className="flex w-full sm:w-auto sm:self-start min-h-11 items-center justify-center gap-1.5 px-4 rounded-full border border-on-surface/15 text-label-lg text-on-surface hover:bg-on-surface/[0.06] transition-colors"
            >
              <Plus size={16} />
              Add goal to project
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── AddMenu ────────────────────────────────────────────────────────────────

function AddMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: 'folder' | 'goal') => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as Node | null
      if (!ref.current || !target) return
      if (ref.current.contains(target)) return
      // The toggle closes the menu itself; closing here too would let its
      // click re-open what this handler just shut.
      if (target instanceof Element && target.closest('[data-add-menu-toggle]')) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 z-20 w-[min(17rem,calc(100vw-3rem))] bg-surface-container-lowest rounded-2xl shadow-float border border-surface-container-high overflow-hidden"
    >
      <button
        onClick={() => onSelect('folder')}
        className="flex items-start gap-3 w-full px-4 py-3.5 hover:bg-surface-container transition-colors text-left"
      >
        <span className="text-base leading-tight mt-0.5 shrink-0">🎯</span>
        <div className="min-w-0">
          <p className="text-label-lg font-semibold text-on-surface">Parent Goal</p>
          <p className="text-label-md text-on-surface-variant">Group items under one project</p>
        </div>
      </button>
      <div className="h-px bg-surface-container-high mx-3" />
      <button
        onClick={() => onSelect('goal')}
        className="flex items-start gap-3 w-full px-4 py-3.5 hover:bg-surface-container transition-colors text-left"
      >
        <span className="text-base leading-tight mt-0.5 shrink-0">💰</span>
        <div className="min-w-0">
          <p className="text-label-lg font-semibold text-on-surface">Individual Goal</p>
          <p className="text-label-md text-on-surface-variant">A single standalone goal</p>
        </div>
      </button>
    </div>
  )
}

/**
 * Cards that can be picked up and moved — a project or a single goal, since
 * both are cards and neither outranks the other in a list someone is ordering
 * by what matters to them.
 *
 * Hold one for a moment — mouse or finger — and it lifts; drag it past its
 * neighbours and they step aside; let go and the order is kept. A hold rather
 * than a straight drag so that a list taller than the screen can still be
 * scrolled by swiping across it, which is also why a move of more than a few
 * pixels before the hold lands cancels it.
 *
 * Nothing is on screen to grab, by design, so the gesture is named above the
 * list, and Alt with the arrow keys does the same thing without a pointer.
 */
const HOLD_MS = 350
const SCROLL_SLOP_PX = 8

function SortableList({
  keys, labelFor, onReorder, renderItem,
}: {
  keys: string[]
  labelFor: (key: string) => string
  /** The keys in the order they should now be kept. */
  onReorder: (orderedKeys: string[]) => void
  renderItem: (key: string) => ReactNode
}) {
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [preview, setPreview] = useState<string[] | null>(null)

  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  /** The slots as they were when the drag began — what the pointer is tested against. */
  const slots = useRef<{ top: number; height: number }[]>([])
  const startY = useRef(0)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const armed = useRef(false)

  const shown = preview ?? keys

  // A drag must not scroll the page under itself.
  useEffect(() => {
    if (!dragKey) return
    const block = (e: TouchEvent) => e.preventDefault()
    document.addEventListener('touchmove', block, { passive: false })
    return () => document.removeEventListener('touchmove', block)
  }, [dragKey])

  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current) }, [])

  const cancelHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    armed.current = false
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, key: string) => {
    // A goal inside a project sits in a list inside a list. Whichever card was
    // pressed is the one being moved, so the press stops here rather than
    // arming the project card around it too.
    e.stopPropagation()
    if (e.button !== 0) return
    // The pencil, the collapse arrow, and anything else pressable is not a handle.
    if ((e.target as HTMLElement).closest('button, input, a, label')) return
    if (keys.length < 2) return

    startY.current = e.clientY
    armed.current = true
    const el = e.currentTarget
    const pointerId = e.pointerId

    holdTimer.current = setTimeout(() => {
      holdTimer.current = null
      if (!armed.current) return
      slots.current = shown.map(rowKey => {
        const rect = itemRefs.current.get(rowKey)?.getBoundingClientRect()
        return { top: rect?.top ?? 0, height: rect?.height ?? 0 }
      })
      try { el.setPointerCapture(pointerId) } catch {}
      setDragKey(key)
      setPreview(shown)
    }, HOLD_MS)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!dragKey) {
      // Moved before the hold landed — they were scrolling, not lifting.
      if (armed.current && Math.abs(e.clientY - startY.current) > SCROLL_SLOP_PX) cancelHold()
      return
    }

    let target = slots.current.findIndex(slot => e.clientY < slot.top + slot.height / 2)
    if (target === -1) target = slots.current.length - 1

    setPreview(prev => {
      const current = prev ?? keys
      const from = current.indexOf(dragKey)
      if (from === -1 || from === target) return current
      const next = [...current]
      next.splice(target, 0, ...next.splice(from, 1))
      return next
    })
  }

  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    e?.stopPropagation()
    cancelHold()
    if (dragKey && preview && preview.some((key, i) => keys[i] !== key)) onReorder(preview)
    setDragKey(null)
    setPreview(null)
  }

  /** The same move, for anyone on a keyboard. */
  const nudge = (key: string, direction: -1 | 1) => {
    const from = keys.indexOf(key)
    const to = from + direction
    if (from === -1 || to < 0 || to >= keys.length) return
    const next = [...keys]
    next[from] = keys[to]
    next[to] = keys[from]
    onReorder(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {shown.map(key => {
        const dragging = dragKey === key

        return (
          <div
            key={key}
            ref={el => { if (el) itemRefs.current.set(key, el); else itemRefs.current.delete(key) }}
            tabIndex={0}
            aria-label={`${labelFor(key)}. Hold to move, or press Alt with the up and down arrows.`}
            onPointerDown={e => handlePointerDown(e, key)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={e => {
              if (!e.altKey) return
              if (e.key === 'ArrowUp') { e.preventDefault(); nudge(key, -1) }
              if (e.key === 'ArrowDown') { e.preventDefault(); nudge(key, 1) }
            }}
            className={`rounded-2xl outline-none transition-[transform,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-secondary/60 ${
              dragging
                // The padding and the margin cancel out: the lifted card grows
                // a border of white around what it holds without shifting it.
                ? 'p-3 -m-3 scale-[1.02] shadow-[0_12px_32px_rgba(0,0,0,0.16)] bg-surface-container-lowest relative z-10 cursor-grabbing'
                : dragKey
                  ? 'opacity-60'
                  : ''
            }`}
            style={{ touchAction: dragging ? 'none' : undefined }}
          >
            {renderItem(key)}
          </div>
        )
      })}
    </div>
  )
}

// ── GoalsList ──────────────────────────────────────────────────────────────

export function GoalsList({
  goals,
  monthlyIncome,
  maxTotalSavingsPct,
  generalSavingsPct,
  onUpdate,
  onDelete,
  onCreate,
  onSwap,
  updating,
}: GoalsListProps) {
  const [folders, setFolders] = useState<GoalFolder[]>(() => readLocal(FOLDERS_KEY, []))
  const [goalFolderMap, setGoalFolderMap] = useState<Record<string, string>>(() => readLocal(FOLDER_MAP_KEY, {}))
  const [layout, setLayout] = useState<string[]>(() => readLocal(LAYOUT_KEY, []))
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [addingType, setAddingType] = useState<'folder' | 'goal' | null>(null)

  const handleMenuSelect = (type: 'folder' | 'goal') => {
    setShowAddMenu(false)
    setAddingType(type)
  }

  const handleCreateFolder = (name: string) => {
    const newFolder: GoalFolder = { id: `folder_${Date.now()}`, name }
    setFolders(prev => {
      const next = [...prev, newFolder]
      writeLocal(FOLDERS_KEY, next)
      return next
    })
    setAddingType(null)
  }

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => {
      const next = prev.filter(f => f.id !== folderId)
      writeLocal(FOLDERS_KEY, next)
      return next
    })
    setGoalFolderMap(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(goalId => {
        if (next[goalId] === folderId) delete next[goalId]
      })
      writeLocal(FOLDER_MAP_KEY, next)
      return next
    })
  }

  const handleGoalCreated = (goalId: string, folderId: string) => {
    setGoalFolderMap(prev => {
      const next = { ...prev, [goalId]: folderId }
      writeLocal(FOLDER_MAP_KEY, next)
      return next
    })
  }

  // ── What is left to go round ────────────────────────────────────────────
  // Savings as a whole is capped by what the spending limit and investing
  // left behind. Inside that, every goal and the general-savings dial draw on
  // the same pot, so a goal's ceiling is its own share plus whatever is free.
  const allocatedToGoals = goals.reduce((sum, g) => sum + Number(g.allocation_pct || 0), 0)
  const freePct = Math.max(0, maxTotalSavingsPct - generalSavingsPct - allocatedToGoals)
  const ceilingFor = (goal: SavingsGoal) =>
    Math.round(freePct + Number(goal.allocation_pct || 0))

  // ── What the whole list comes to ────────────────────────────────────────
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0)

  /**
   * Storage holds one flat list; a folder shows a slice of it. Walking the
   * move as adjacent swaps keeps the goals this list cannot see where they
   * are, whichever slice was reordered.
   */
  const reorderWithin = (visible: SavingsGoal[]) => (orderedIds: string[]) => {
    const working = visible.map(g => g.id)
    orderedIds.forEach((id, target) => {
      const from = working.indexOf(id)
      if (from === -1 || from === target) return
      const step = from < target ? 1 : -1
      for (let i = from; i !== target; i += step) {
        onSwap(working[i], working[i + step])
        const held = working[i]
        working[i] = working[i + step]
        working[i + step] = held
      }
    })
  }

  const folderGoals = (folderId: string) =>
    goals.filter(g => goalFolderMap[g.id] === folderId)

  const standaloneGoals = goals.filter(
    g => !goalFolderMap[g.id] || !folders.find(f => f.id === goalFolderMap[g.id]),
  )

  // Projects and single goals are cards of the same standing, so they share
  // one order: a goal can sit above a project, or between two of them. The
  // stored order is filtered to what still exists, and anything made since —
  // a new goal, a new project — joins the end.
  const presentKeys = [
    ...folders.map(f => folderKey(f.id)),
    ...standaloneGoals.map(g => goalKey(g.id)),
  ]
  const orderedKeys = [
    ...layout.filter(key => presentKeys.includes(key)),
    ...presentKeys.filter(key => !layout.includes(key)),
  ]

  const handleReorder = (next: string[]) => {
    setLayout(next)
    writeLocal(LAYOUT_KEY, next)
  }

  const labelFor = (key: string) => {
    if (key.startsWith('folder:')) {
      return folders.find(f => folderKey(f.id) === key)?.name ?? 'Project'
    }
    return goals.find(g => goalKey(g.id) === key)?.name ?? 'Goal'
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 sm:p-6 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-headline-sm text-on-surface">Savings Goals</h3>
          {addingType === null && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowAddMenu(m => !m)}
                className="flex min-h-11 items-center gap-1.5 px-3 rounded-full text-label-lg font-medium text-secondary hover:bg-secondary/8 transition-colors"
                aria-expanded={showAddMenu}
                data-add-menu-toggle
              >
                <Plus size={16} />
                Add Goal
              </button>
              {showAddMenu && (
                <AddMenu
                  onSelect={handleMenuSelect}
                  onClose={() => setShowAddMenu(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Named once, at the top, for every card below it. */}
        {orderedKeys.length > 1 && (
          <p className="text-label-sm text-on-surface-variant -mt-2">
            Hold a card to move it up or down.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {goals.length === 0 && folders.length === 0 && addingType === null && (
            <p className="text-body-md text-on-surface-variant text-center py-4">
              No goals yet. Add one to start tracking your savings progress.
            </p>
          )}

          <SortableList
            keys={orderedKeys}
            labelFor={labelFor}
            onReorder={handleReorder}
            renderItem={key => {
              if (key.startsWith('folder:')) {
                const folder = folders.find(f => folderKey(f.id) === key)
                if (!folder) return null
                return (
                  <FolderSection
                    folder={folder}
                    goals={folderGoals(folder.id)}
                    monthlyIncome={monthlyIncome}
                    ceilingFor={ceilingFor}
                    freePct={Math.round(freePct)}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onCreate={onCreate}
                    onDeleteFolder={handleDeleteFolder}
                    onGoalCreated={handleGoalCreated}
                    onReorder={reorderWithin(folderGoals(folder.id))}
                  />
                )
              }

              const goal = goals.find(g => goalKey(g.id) === key)
              if (!goal) return null
              return (
                <GoalRow
                  goal={goal}
                  monthlyIncome={monthlyIncome}
                  maxPct={ceilingFor(goal)}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              )
            }}
          />

          {addingType === 'folder' && (
            <NewFolderForm
              onCreate={handleCreateFolder}
              onClose={() => setAddingType(null)}
            />
          )}
          {addingType === 'goal' && (
            <NewGoalForm
              monthlyIncome={monthlyIncome}
              maxPct={Math.round(freePct)}
              onCreate={onCreate}
              onClose={() => setAddingType(null)}
            />
          )}
        </div>
      </div>

      {/* Everything on the list, added up — its own card, so it reads as the
          sum of the list rather than another item on it. */}
      {goals.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card px-4 py-4 sm:px-6 flex items-baseline justify-between gap-3">
          <p className="text-title-md text-on-surface font-semibold">All goals</p>
          <p className="text-title-md font-bold text-on-surface tabular-nums">
            ${totalTarget.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
