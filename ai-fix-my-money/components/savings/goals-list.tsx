'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Pencil, Trash2, Check, X, Plus,
  ChevronDown, ChevronRight, Target,
} from 'lucide-react'
import type { SavingsGoal } from '@/hooks/use-data'

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
    if (!confirm(`Delete "${goal.name}"?`)) return
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
      <div className="flex flex-col gap-3 bg-surface-container rounded-xl p-4">
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">Goal name</label>
          <input
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Emergency Fund"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Target ($)</label>
            <input
              type="number"
              min="1"
              className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
              value={form.target_amount}
              onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
              placeholder="10000"
            />
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">% of monthly income</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
              value={form.allocation_pct}
              onChange={e => setForm(f => ({ ...f, allocation_pct: e.target.value }))}
              placeholder="10"
            />
          </div>
        </div>
        {!isNaN(parseFloat(form.allocation_pct)) && parseFloat(form.allocation_pct) > 0 && (
          <p className="text-label-sm text-on-surface-variant">
            ≈ ${Math.round((parseFloat(form.allocation_pct) / 100) * monthlyIncome).toLocaleString()} / month contribution
          </p>
        )}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg text-label-md font-semibold disabled:opacity-50"
          >
            <Check size={14} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-error rounded-lg text-label-md hover:bg-error/8"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
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
    <div className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 border border-secondary/20">
      <p className="text-label-md font-semibold text-on-surface">{label}</p>
      <input
        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Goal name (e.g. Emergency Fund)"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">Target ($)</label>
          <input
            type="number"
            min="1"
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
            value={form.target_amount}
            onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
            placeholder="10000"
          />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">% of monthly income</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
            value={form.allocation_pct}
            onChange={e => setForm(f => ({ ...f, allocation_pct: e.target.value }))}
          />
        </div>
      </div>
      {monthlyContrib > 0 && (
        <p className="text-label-sm text-on-surface-variant">
          ≈ ${monthlyContrib.toLocaleString()} / month contribution
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg text-label-md font-semibold disabled:opacity-50"
        >
          <Check size={14} />
          {saving ? 'Creating…' : 'Create Goal'}
        </button>
        <button
          onClick={() => onClose()}
          className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md"
        >
          <X size={14} />
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
    <div className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 border border-secondary/20">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">🎯</span>
        <p className="text-label-md font-semibold text-on-surface">New Parent Goal</p>
      </div>
      <p className="text-label-sm text-on-surface-variant">
        Group related savings goals under one project — e.g. &quot;Home Renovation&quot; with items for kitchen, bathroom, etc.
      </p>
      <input
        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-secondary"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Project name (e.g. Home Renovation)"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg text-label-md font-semibold disabled:opacity-50"
        >
          <Check size={14} />
          Create Project
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-label-md"
        >
          <X size={14} />
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

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const overallPct = totalTarget > 0 ? Math.min(Math.round((totalCurrent / totalTarget) * 100), 100) : 0

  const handleGoalClose = (newId?: string) => {
    if (newId) onGoalCreated(newId, folder.id)
    setAddingGoal(false)
  }

  const handleDeleteFolder = () => {
    if (!confirm(`Remove project "${folder.name}"? Goals inside will become standalone goals.`)) return
    onDeleteFolder(folder.id)
  }

  return (
    <div className="flex flex-col rounded-xl border border-surface-container-high overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-container-low">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {collapsed
            ? <ChevronRight size={14} className="text-on-surface-variant shrink-0" />
            : <ChevronDown size={14} className="text-on-surface-variant shrink-0" />}
          <span className="text-base leading-none shrink-0">🎯</span>
          <p className="text-label-lg font-semibold text-on-surface truncate">{folder.name}</p>
          <span className="text-label-sm text-on-surface-variant shrink-0">({goals.length})</span>
        </button>
        {goals.length > 0 && (
          <span className="text-label-sm font-medium text-on-surface shrink-0">{overallPct}%</span>
        )}
        <button
          onClick={handleDeleteFolder}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors shrink-0"
          title="Remove project"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3 px-4 py-3">
          {goals.length > 1 && (
            <div className="flex flex-col gap-1.5 pb-1 border-b border-surface-container-high">
              <div className="flex items-center justify-between">
                <p className="text-label-sm text-on-surface-variant">Overall</p>
                <p className="text-label-sm font-medium text-on-surface">
                  ${totalCurrent.toLocaleString()} / ${totalTarget.toLocaleString()}
                </p>
              </div>
              <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%`, backgroundColor: '#4c49c9' }}
                />
              </div>
            </div>
          )}

          {goals.length === 0 && !addingGoal && (
            <p className="text-label-sm text-on-surface-variant text-center py-2">
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
              label="Add Goal to Project"
            />
          ) : (
            <button
              onClick={() => setAddingGoal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-sm text-secondary hover:bg-secondary/8 transition-colors self-start mt-1"
            >
              <Plus size={13} />
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
