'use client'

import { useCallback, useId, useState } from 'react'
import { CreditCard, AlertCircle, Trash2, Pencil, Check, X } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { useAccounts, useDebts, type Account } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'
import { SectionGate } from '@/components/learning/section-gate'
import { AddAccountForm } from '@/components/entry/add-account-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePreview } from '@/contexts/preview-context'

const money = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Inline edit form ──────────────────────────────────────────────────────────

interface EditState {
  name: string
  balance: string
}

function EditForm({
  initial,
  onSave,
  onCancel,
  balanceLabel,
  balanceReadOnly,
}: {
  initial: EditState
  onSave: (name: string, balance: number) => void
  onCancel: () => void
  balanceLabel: string
  balanceReadOnly?: boolean
}) {
  const [name, setName] = useState(initial.name)
  const [balance, setBalance] = useState(initial.balance)
  const [error, setError] = useState('')
  // Several of these forms can be open at once, so the ids have to be per-form.
  const fieldId = useId()

  const handleSave = () => {
    const amt = parseFloat(balance.replace(/[$,]/g, ''))
    if (isNaN(amt) || amt < 0) { setError('Enter a valid balance.'); return }
    onSave(name.trim() || initial.name, amt)
  }

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20 mt-3">
      {/* Two fields side by side only once there is room for them. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${fieldId}-name`} className="text-label-sm text-on-surface-variant uppercase tracking-wider">Name</label>
          <input
            id={`${fieldId}-name`}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-body-sm outline-none border transition-all focus:border-secondary"
            style={{ backgroundColor: 'var(--color-surface-container)', borderColor: 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${fieldId}-balance`} className="text-label-sm text-on-surface-variant uppercase tracking-wider">{balanceLabel}</label>
          {balanceReadOnly ? (
            <p className="text-body-sm text-on-surface-variant px-3 py-2">
              Auto-calculated from uploaded transactions — re-upload to update.
            </p>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
              <input
                id={`${fieldId}-balance`}
                type="text"
                inputMode="decimal"
                value={balance}
                onChange={e => { setBalance(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
                className="w-full rounded-xl pl-7 pr-3 py-2 text-body-sm outline-none border transition-all focus:border-secondary"
                style={{ backgroundColor: 'var(--color-surface-container)', borderColor: error ? '#ba1a1a' : 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }}
              />
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-label-sm" style={{ color: '#ba1a1a' }}>{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <X size={13} /> Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-sm font-semibold transition-colors"
          style={{ background: '#4c49c9', color: '#fff' }}
        >
          <Check size={13} /> Save
        </button>
      </div>
    </div>
  )
}

// ─── Account row ──────────────────────────────────────────────────────────────

/**
 * One account on one line: what it is on the left, what it holds on the right,
 * its two controls in the corner. Cards gave every account a screen of its own
 * and most of that screen was empty — seven accounts became a long scroll for
 * seven numbers nobody could compare.
 */
function AccountRow({
  account,
  owed,
  isEditing,
  onEdit,
  onRemove,
  onEditSave,
  onEditCancel,
  balanceReadOnly,
}: {
  account: Account
  /** Debts read as a magnitude, coloured as what they cost. */
  owed?: boolean
  isEditing: boolean
  onEdit: () => void
  onRemove: () => void
  onEditSave: (name: string, balance: number) => void
  onEditCancel: () => void
  balanceReadOnly?: boolean
}) {
  const balance = Math.abs(Number(account.current_balance))
  const name = account.name || account.official_name || 'Account'

  return (
    <div className="px-3 sm:px-4 py-2.5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            owed ? 'bg-sunset/12 text-sunset' : 'bg-surface-container text-on-surface-variant'
          }`}
          aria-hidden
        >
          {owed ? <AlertCircle size={16} /> : <CreditCard size={16} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body-md font-semibold text-on-surface truncate">
            {name}
            {account.mask && (
              <span className="text-label-sm text-on-surface-variant font-normal ml-1.5">···{account.mask}</span>
            )}
          </p>
          <p className="text-label-sm text-on-surface-variant capitalize truncate">
            {account.subtype ?? account.type}
            {!account.is_active && <span className="normal-case"> · inactive</span>}
          </p>
        </div>

        <p
          className={`text-body-md font-bold tabular-nums shrink-0 ${owed ? 'text-sunset' : 'text-on-surface'}`}
        >
          {money(balance)}
        </p>

        <div className="flex items-center shrink-0 -mr-1">
          <button
            onClick={onEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant/70 hover:text-secondary hover:bg-on-surface/[0.06] transition-colors"
            aria-label={`Edit ${name}`}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant/70 hover:text-error hover:bg-error/[0.08] transition-colors"
            aria-label={`Remove ${name}`}
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isEditing && (
        <EditForm
          initial={{ name: account.name || account.official_name || '', balance: String(balance) }}
          onSave={onEditSave}
          onCancel={onEditCancel}
          balanceLabel={owed ? 'Amount owed' : 'Current balance'}
          balanceReadOnly={balanceReadOnly}
        />
      )}
    </div>
  )
}

/**
 * A section's name, how many it holds, and what they come to. The preview
 * shows its totals at the top of the page, so there it is only the count.
 */
function SectionHeader({ title, count, total, tone, noun }: { title: string; count: number; total: number; tone?: 'debt'; noun: string }) {
  if (usePreview()) {
    return (
      <p className="text-body-md text-on-surface-variant px-1">
        {count} {noun}{count !== 1 ? 's' : ''}
      </p>
    )
  }

  return (
    <div className="flex items-baseline justify-between gap-3 px-1">
      <h3 className="text-title-md font-semibold text-on-surface">
        {title}{' '}
        <span className="text-label-md font-normal text-on-surface-variant tabular-nums">({count})</span>
      </h3>
      <p className={`text-title-md font-bold tabular-nums ${tone === 'debt' ? 'text-sunset' : 'text-on-surface'}`}>
        {money(total)}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AccountsPageTool() {
  const { accounts, loading: accountsLoading, error: accountsError, refresh: refreshAccounts } = useAccounts()
  const { debts, loading: debtsLoading, error: debtsError, refresh: refreshDebts } = useDebts()
  const {
    removeManualAccount,
    updateManualAccount,
    updateParsedAccount,
    removeParsedAccount,
  } = useFinancialData()
  const preview = usePreview()

  const [editingId, setEditingId] = useState<string | null>(null)
  /** The account a remove was clicked on. It waits here to be confirmed. */
  const [pendingRemove, setPendingRemove] = useState<Account | null>(null)

  // Every account is entered by hand, so every balance is editable
  const isReadOnly = useCallback((_id: string) => false, [])

  function getEditHandler(account: Account) {
    return () => setEditingId(prev => prev === account.id ? null : account.id)
  }

  function getSaveHandler(account: Account) {
    return (name: string, balance: number) => {
      if (account.id.startsWith('manual_')) {
        updateManualAccount(account.id, { name, balance })
      } else if (account.id.startsWith('acc_')) {
        updateParsedAccount(account.id, { name, balance })
      }
      setEditingId(null)
    }
  }

  // Removing an account is one tap away from a balance nobody can get back, so
  // the tap opens the confirmation and the confirmation does the removing.
  function confirmRemove() {
    const account = pendingRemove
    setPendingRemove(null)
    if (!account) return
    if (account.id.startsWith('manual_')) removeManualAccount(account.id)
    else if (account.id.startsWith('acc_')) removeParsedAccount(account.id)
    if (editingId === account.id) setEditingId(null)
  }

  if (accountsLoading || debtsLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Accounts" />
        <div className="flex-1 px-4 sm:px-8 pb-10 flex flex-col gap-6">
          <div className="h-12 bg-surface-container-lowest rounded-lg animate-pulse" />
          <div className="h-32 bg-surface-container-lowest rounded-2xl animate-pulse" />
          <div className="h-32 bg-surface-container-lowest rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (accountsError || debtsError) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Accounts" />
        <div className="flex-1 px-4 sm:px-8 pb-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-headline-sm text-on-surface mb-4">Failed to load accounts</p>
            <p className="text-body-md text-on-surface-variant mb-6">
              {accountsError?.message || debtsError?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => { refreshAccounts(); refreshDebts() }}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0)
  const totalDebts = debts.reduce((sum, d) => sum + Math.abs(Number(d.current_balance)), 0)
  const netWorth = totalAssets - totalDebts

  const depositoryAccounts = accounts.filter(a => a.type === 'depository' || a.type === 'investment')

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Accounts" />

      <div className="flex-1 px-4 sm:px-8 pb-10 flex flex-col gap-5">
        {!preview && (
          <div className="flex justify-end">
            <AddAccountForm />
          </div>
        )}

        {/* Assets — one list, one line each, so the balances stack into a
            column that can be read down. */}
        <div className="flex flex-col gap-2">
          <SectionHeader title="Accounts" noun="account" count={depositoryAccounts.length} total={totalAssets} />
          {depositoryAccounts.length > 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card divide-y divide-outline-variant/25 overflow-hidden">
              {depositoryAccounts.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isEditing={editingId === account.id}
                  onEdit={getEditHandler(account)}
                  onRemove={() => setPendingRemove(account)}
                  onEditSave={getSaveHandler(account)}
                  onEditCancel={() => setEditingId(null)}
                  balanceReadOnly={isReadOnly(account.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-8 text-center">
              <p className="text-body-md text-on-surface mb-1">No accounts yet</p>
              <p className="text-body-sm text-on-surface-variant">
                Add each one by hand — that is how you find the ones you forgot about.
              </p>
            </div>
          )}
        </div>

        {/* Debts */}
        <div className="flex flex-col gap-2">
          <SectionHeader title="Debts owed" noun="debt account" count={debts.length} total={totalDebts} tone="debt" />
          {debts.length > 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card divide-y divide-outline-variant/25 overflow-hidden">
              {debts.map(debt => (
                <AccountRow
                  key={debt.id}
                  account={debt}
                  owed
                  isEditing={editingId === debt.id}
                  onEdit={getEditHandler(debt)}
                  onRemove={() => setPendingRemove(debt)}
                  onEditSave={getSaveHandler(debt)}
                  onEditCancel={() => setEditingId(null)}
                  balanceReadOnly={isReadOnly(debt.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-6 text-center">
              <p className="text-body-sm text-on-surface-variant">Nothing owed.</p>
            </div>
          )}
        </div>

        {/* The one subtraction the two lists exist for. Their totals are in the
            headers above, so this states the result and how it was reached.
            The preview shows it at the top of the page instead. */}
        {!preview && <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Net worth</p>
            <p className={`text-headline-lg sm:text-display-sm font-bold tabular-nums mt-0.5 ${netWorth < 0 ? 'text-error' : 'text-success'}`}>
              {netWorth < 0 ? '−' : ''}{money(netWorth)}
            </p>
          </div>
          <p className="text-label-md text-on-surface-variant tabular-nums">
            {money(totalAssets)} assets − {money(totalDebts)} debt
          </p>
        </div>}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={pendingRemove ? `Remove "${pendingRemove.name || pendingRemove.official_name || 'this account'}"?` : 'Remove this account?'}
        body="The account and its balance come off your net worth. This cannot be undone."
        confirmLabel="Remove account"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}

// The tool is gated behind its learning track — see SectionGate.
export default function AccountsPage() {
  return (
    <SectionGate trackId="accounts">
      <AccountsPageTool />
    </SectionGate>
  )
}
