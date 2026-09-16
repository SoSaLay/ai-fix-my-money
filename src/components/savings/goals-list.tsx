'use client'

import { useState, useEffect, useRef } from 'react'
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
  onUpdate,
  onDelete,
}: {
  goal: SavingsGoal
  monthlyIncome: number
  onUpdate: GoalsListProps['onUpdate']
  onDelete: GoalsListProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [form, setForm] = useState<EditingState>({
    name: goal.name,
    target_amount: String(goal.target_amount),
    allocation_pct: String(goal.allocation_pct),
  })

  const pct =
    goal.target_amount > 0
      ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
      : 0

  const monthlyContribution = Math.round((Number(goal.allocation_pct) / 100) * monthlyIncome)
  const monthsRemaining =
    monthlyContribution > 0
      ? Math.ceil((goal.target_amount - goal.current_amount) / monthlyContribution)
      : null

  const handleSave = async () => {
    setSaving(true)
    const targetNum = parseFloat(form.target_amount.replace(/,/g, ''))
    const allocNum = parseFloat(form.allocation_pct)
    if (isNaN(targetNum) || targetNum <= 0) { setSaving(false); return }
    const success = await onUpdate(goal.id, {
      name: form.name.trim() || goal.name,
      target_amount: targetNum,
      allocation_pct: isNaN(allocNum) ? goal.allocation_pct : Math.max(0, Math.min(100, allocNum)),
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
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md text-on-surface-variant">Goal name</label>
          <input
            className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Emergency Fund"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface-variant">Target amount</label>
            <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
              <span className="text-body-lg text-on-surface-variant">$</span>
              <input
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
            <label className="text-label-md text-on-surface-variant">Share of monthly income</label>
            <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
                value={form.allocation_pct}
                onChange={e => setForm(f => ({ ...f, allocation_pct: e.target.value }))}
                placeholder="10"
              />
              <span className="text-body-lg text-on-surface-variant">%</span>
            </div>
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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-action items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Check size={15} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
          >
            <X size={15} />
            Cancel
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full text-label-lg text-error hover:bg-error/[0.08] transition-colors"
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
    <div className="flex flex-col gap-2 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">💰</span>
          <p className="text-label-lg font-medium text-on-surface">{goal.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-label-lg font-semibold text-on-surface">{pct}%</p>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
            title="Edit goal"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
      <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#4c49c9' }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-label-sm text-on-surface-variant">
          ${goal.current_amount.toLocaleString()} of ${goal.target_amount.toLocaleString()}
        </p>
        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
          <span className="font-medium text-on-surface">
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
  onCreate,
  onClose,
  label = 'New Savings Goal',
}: {
  monthlyIncome: number
  onCreate: GoalsListProps['onCreate']
  onClose: (newId?: string) => void
  label?: string
}) {
  const [form, setForm] = useState({ name: '', target_amount: '', allocation_pct: '0' })
  const [saving, setSaving] = useState(false)

  const monthlyContrib = Math.round((parseFloat(form.allocation_pct || '0') / 100) * monthlyIncome)

  const handleCreate = async () => {
    const targetNum = parseFloat(form.target_amount.replace(/,/g, ''))
    const allocNum = parseFloat(form.allocation_pct)
    if (!form.name.trim() || isNaN(targetNum) || targetNum <= 0) return
    setSaving(true)
    const result = await onCreate({
      name: form.name.trim(),
      target_amount: targetNum,
      allocation_pct: isNaN(allocNum) ? 0 : Math.max(0, Math.min(100, allocNum)),
    })
    setSaving(false)
    if (result) onClose(result)
  }

  return (
    <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-5 sm:p-6">
      <p className="text-title-md text-on-surface">{label}</p>

      <div className="flex flex-col gap-1.5">
        <label className="text-label-md text-on-surface-variant">Goal name</label>
        <input
          className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Emergency Fund"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-label-md text-on-surface-variant">Target amount</label>
          <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
            <span className="text-body-lg text-on-surface-variant">$</span>
            <input
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
          <label className="text-label-md text-on-surface-variant">Share of monthly income</label>
          <div className="flex items-center gap-1 rounded-2xl border border-on-surface/15 px-4 py-3 focus-within:border-on-surface/40 transition-colors">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="w-full bg-transparent text-body-lg text-on-surface tabular-nums outline-none"
              value={form.allocation_pct}
              onChange={e => setForm(f => ({ ...f, allocation_pct: e.target.value }))}
            />
            <span className="text-body-lg text-on-surface-variant">%</span>
          </div>
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

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCreate}
          disabled={saving || !form.name.trim()}
          className="btn-action items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check size={15} />
          {saving ? 'Creating…' : 'Create goal'}
        </button>
        <button
          onClick={() => onClose()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
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

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim())
    onClose()
  }

  return (
    <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-3xl border border-on-surface/[0.06] shadow-card p-5 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-title-md text-on-surface">New parent goal</p>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          Group related savings goals under one project — e.g. &quot;Home Renovation&quot; with items for kitchen, bathroom, etc.
        </p>
      </div>

      <input
        className="w-full rounded-2xl border border-on-surface/15 bg-surface-container-lowest px-4 py-3 text-body-lg text-on-surface outline-none transition-colors focus:border-on-surface/40"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Project name (e.g. Home Renovation)"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="btn-action items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check size={15} />
          Create project
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06] transition-colors"
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
  onUpdate,
  onDelete,
  onCreate,
  onDeleteFolder,
  onGoalCreated,
}: {
  folder: GoalFolder
  goals: SavingsGoal[]
  monthlyIncome: number
  onUpdate: GoalsListProps['onUpdate']
  onDelete: GoalsListProps['onDelete']
  onCreate: GoalsListProps['onCreate']
  onDeleteFolder: (id: string) => void
  onGoalCreated: (goalId: string, folderId: string) => void
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
      <div className="flex items-center gap-3 px-5 py-4 bg-surface-container-low">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2.5 flex-1 text-left min-w-0"
        >
          {collapsed
            ? <ChevronRight size={16} className="text-on-surface-variant shrink-0" />
            : <ChevronDown size={16} className="text-on-surface-variant shrink-0" />}
          <span className="text-base leading-none shrink-0">🎯</span>
          <p className="text-title-md text-on-surface truncate">{folder.name}</p>
          <span className="text-label-md text-on-surface-variant shrink-0">
            {goals.length} goal{goals.length === 1 ? '' : 's'}
          </span>
        </button>
        {goals.length > 0 && (
          <span className="rounded-full bg-surface-container-lowest border border-on-surface/[0.06] px-3 py-1 text-label-md text-on-surface tabular-nums shrink-0">
            {overallPct}%
          </span>
        )}
        <button
          onClick={() => setConfirmingDelete(true)}
          className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/[0.08] transition-colors shrink-0"
          title="Remove project"
        >
          <Trash2 size={15} />
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
        <div className="flex flex-col gap-4 px-5 py-4">
          {goals.length > 1 && (
            <div className="flex flex-col gap-2 pb-3 border-b border-on-surface/[0.07]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-label-lg text-on-surface-variant">Overall</p>
                <p className="text-title-md text-on-surface tabular-nums">
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

          {goals.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              monthlyIncome={monthlyIncome}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {addingGoal ? (
            <NewGoalForm
              monthlyIncome={monthlyIncome}
              onCreate={onCreate}
              onClose={handleGoalClose}
              label="Add goal to project"
            />
          ) : (
            <button
              onClick={() => setAddingGoal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-on-surface/15 text-label-lg text-on-surface hover:bg-on-surface/[0.06] transition-colors self-start"
            >
              <Plus size={15} />
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
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-10 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high overflow-hidden"
      style={{ minWidth: 220 }}
    >
      <button
        onClick={() => onSelect('folder')}
        className="flex items-start gap-3 w-full px-4 py-3 hover:bg-surface-container transition-colors text-left"
      >
        <span className="text-base leading-none mt-0.5 shrink-0">🎯</span>
        <div>
          <p className="text-label-md font-semibold text-on-surface">Parent Goal</p>
          <p className="text-label-sm text-on-surface-variant">Group items under one project</p>
        </div>
      </button>
      <div className="h-px bg-surface-container-high mx-3" />
      <button
        onClick={() => onSelect('goal')}
        className="flex items-start gap-3 w-full px-4 py-3 hover:bg-surface-container transition-colors text-left"
      >
        <span className="text-base leading-none mt-0.5 shrink-0">💰</span>
        <div>
          <p className="text-label-md font-semibold text-on-surface">Individual Goal</p>
          <p className="text-label-sm text-on-surface-variant">A single standalone goal</p>
        </div>
      </button>
    </div>
  )
}

// ── GoalsList ──────────────────────────────────────────────────────────────

export function GoalsList({
  goals,
  monthlyIncome,
  onUpdate,
  onDelete,
  onCreate,
  updating,
}: GoalsListProps) {
  const [folders, setFolders] = useState<GoalFolder[]>(() => readLocal(FOLDERS_KEY, []))
  const [goalFolderMap, setGoalFolderMap] = useState<Record<string, string>>(() => readLocal(FOLDER_MAP_KEY, {}))
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

  const folderGoals = (folderId: string) =>
    goals.filter(g => goalFolderMap[g.id] === folderId)

  const standaloneGoals = goals.filter(
    g => !goalFolderMap[g.id] || !folders.find(f => f.id === goalFolderMap[g.id]),
  )

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-headline-sm text-on-surface">Savings Goals</h3>
        {addingType === null && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(m => !m)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-medium text-secondary hover:bg-secondary/8 transition-colors"
            >
              <Plus size={15} />
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

      <div className="flex flex-col gap-4">
        {goals.length === 0 && folders.length === 0 && addingType === null && (
          <p className="text-body-md text-on-surface-variant text-center py-4">
            No goals yet. Add one to start tracking your savings progress.
          </p>
        )}

        {folders.map(folder => (
          <FolderSection
            key={folder.id}
            folder={folder}
            goals={folderGoals(folder.id)}
            monthlyIncome={monthlyIncome}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreate={onCreate}
            onDeleteFolder={handleDeleteFolder}
            onGoalCreated={handleGoalCreated}
          />
        ))}

        {standaloneGoals.map(goal => (
          <GoalRow
            key={goal.id}
            goal={goal}
            monthlyIncome={monthlyIncome}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}

        {addingType === 'folder' && (
          <NewFolderForm
            onCreate={handleCreateFolder}
            onClose={() => setAddingType(null)}
          />
        )}
        {addingType === 'goal' && (
          <NewGoalForm
            monthlyIncome={monthlyIncome}
            onCreate={onCreate}
            onClose={() => setAddingType(null)}
          />
        )}
      </div>
    </div>
  )
}
