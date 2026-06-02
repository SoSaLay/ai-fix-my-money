'use client'

import { useState, useCallback } from 'react'
import { CreditCard, AlertCircle, Upload, Trash2, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'
import { TopNav } from '@/components/layout/top-nav'
import { useAccounts, useDebts, type Account } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'

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

  const handleSave = () => {
    const amt = parseFloat(balance.replace(/[$,]/g, ''))
    if (isNaN(amt) || amt < 0) { setError('Enter a valid balance.'); return }
    onSave(name.trim() || initial.name, amt)
  }

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20 mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-body-sm outline-none border transition-all focus:border-secondary"
            style={{ backgroundColor: 'var(--color-surface-container)', borderColor: 'rgba(172,173,177,0.35)', color: 'var(--color-on-surface)' }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">{balanceLabel}</label>
          {balanceReadOnly ? (
            <p className="text-body-sm text-on-surface-variant px-3 py-2">
              Auto-calculated from uploaded transactions — re-upload to update.
            </p>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={balance}
                onChange={e => { setBalance(e.target.value); setError('') }}
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

// ─── Account card ──────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onEdit,
  onRemove,
  isEditing,
  onEditSave,
  onEditCancel,
  balanceReadOnly,
}: {
  account: Account
  onEdit: () => void
  onRemove: () => void
  isEditing: boolean
  onEditSave: (name: string, balance: number) => void
  onEditCancel: () => void
  balanceReadOnly?: boolean
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
          <CreditCard size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-label-sm text-on-surface-variant">{account.institution_name || 'Unknown Bank'}</p>
          <p className="text-headline-sm font-semibold text-on-surface mt-0.5">
            {account.name || account.official_name}
            {account.mask && (
              <span className="text-label-md text-on-surface-variant font-normal ml-2">···{account.mask}</span>
            )}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-0.5 capitalize">
            {account.subtype ?? account.type}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-label-sm text-on-surface-variant">Current Balance</p>
          <p className="text-headline-sm font-bold text-on-surface mt-0.5">
            ${Number(account.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {account.available_balance && Number(account.available_balance) !== Number(account.current_balance) && (
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              Available: ${Number(account.available_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: account.is_active ? '#1a6b3a' : '#acadb1' }}
          title={account.is_active ? 'Active' : 'Inactive'}
        />

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-on-surface-variant hover:text-secondary hover:bg-secondary/8 transition-colors"
            title="Edit account"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors"
            title="Remove account"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isEditing && (
        <EditForm
          initial={{ name: account.name || account.official_name || '', balance: String(Math.abs(Number(account.current_balance))) }}
          onSave={onEditSave}
          onCancel={onEditCancel}
          balanceLabel="Current Balance"
          balanceReadOnly={balanceReadOnly}
        />
      )}
    </div>
  )
}

// ─── Debt card ────────────────────────────────────────────────────────────────

function DebtCard({
  debt,
  onEdit,
  onRemove,
  isEditing,
  onEditSave,
  onEditCancel,
  balanceReadOnly,
}: {
  debt: Account
  onEdit: () => void
  onRemove: () => void
  isEditing: boolean
  onEditSave: (name: string, balance: number) => void
  onEditCancel: () => void
  balanceReadOnly?: boolean
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-sunset/12 flex items-center justify-center text-sunset flex-shrink-0">
          <AlertCircle size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-label-sm text-on-surface-variant">{debt.institution_name || 'Unknown Bank'}</p>
          <p className="text-headline-sm font-semibold text-on-surface mt-0.5">
            {debt.name || debt.official_name}
            {debt.mask && (
              <span className="text-label-md text-on-surface-variant font-normal ml-2">···{debt.mask}</span>
            )}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-0.5 capitalize">
            {debt.subtype ?? debt.type}
          </p>
        </div>

        <div className="text-right flex-shrink-0 min-w-[200px]">
          <p className="text-label-sm text-on-surface-variant">Amount Owed</p>
          <p className="text-headline-sm font-bold text-sunset mt-0.5">
            ${Math.abs(Number(debt.current_balance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-label-sm text-on-surface-variant mt-0.5">Credit account</p>
        </div>

        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: debt.is_active ? '#1a6b3a' : '#acadb1' }}
          title={debt.is_active ? 'Active' : 'Inactive'}
        />

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-on-surface-variant hover:text-secondary hover:bg-secondary/8 transition-colors"
            title="Edit account"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors"
            title="Remove account"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isEditing && (
        <EditForm
          initial={{ name: debt.name || debt.official_name || '', balance: String(Math.abs(Number(debt.current_balance))) }}
          onSave={onEditSave}
          onCancel={onEditCancel}
          balanceLabel="Amount Owed"
          balanceReadOnly={balanceReadOnly}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { accounts, loading: accountsLoading, error: accountsError, refresh: refreshAccounts } = useAccounts()
  const { debts, loading: debtsLoading, error: debtsError, refresh: refreshDebts } = useDebts()
  const {
    removeManualAccount,
    updateManualAccount,
    removeStatementGroup,
    updateParsedAccount,
    removeParsedAccount,
  } = useFinancialData()

  const [editingId, setEditingId] = useState<string | null>(null)

  // Whether the account's balance is read-only (derived from uploaded transactions)
  const isReadOnly = useCallback((id: string) => id.startsWith('stmt_grp_'), [])

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
      // stmt_grp accounts: balance is read-only, no-op
      setEditingId(null)
    }
  }

  function getRemoveHandler(account: Account) {
    if (account.id.startsWith('manual_')) return () => { removeManualAccount(account.id); if (editingId === account.id) setEditingId(null) }
    if (account.id.startsWith('stmt_grp_')) return () => { removeStatementGroup(account.name); if (editingId === account.id) setEditingId(null) }
    if (account.id.startsWith('acc_')) return () => { removeParsedAccount(account.id); if (editingId === account.id) setEditingId(null) }
    return () => {}
  }

  if (accountsLoading || debtsLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopNav title="Accounts" />
        <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
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
        <div className="flex-1 px-8 pb-10 flex items-center justify-center">
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

  const depositoryAccounts = accounts.filter(a => a.type === 'depository' || a.type === 'investment')

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Accounts" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-body-md text-on-surface-variant">
            {depositoryAccounts.length} account{depositoryAccounts.length !== 1 ? 's' : ''} · click <Pencil size={12} className="inline mb-0.5" /> to edit
          </p>
          <Link
            href="/setup"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-label-md font-semibold transition-all hover:opacity-80"
            style={{ background: '#4c49c9', color: '#fff' }}
          >
            <Upload size={15} />
            Update Data
          </Link>
        </div>

        {/* Asset account cards */}
        {depositoryAccounts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {depositoryAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={getEditHandler(account)}
                onRemove={getRemoveHandler(account)}
                isEditing={editingId === account.id}
                onEditSave={getSaveHandler(account)}
                onEditCancel={() => setEditingId(null)}
                balanceReadOnly={isReadOnly(account.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-12 text-center">
            <CreditCard size={48} className="mx-auto text-on-surface-variant mb-4" />
            <p className="text-headline-sm text-on-surface mb-2">No accounts imported yet</p>
            <p className="text-body-md text-on-surface-variant mb-6">
              Import your financial data to start tracking your accounts
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-label-md font-semibold transition-all hover:opacity-80"
              style={{ background: '#4c49c9', color: '#fff' }}
            >
              <Upload size={15} />
              Import Data
            </Link>
          </div>
        )}

        {/* Debts section */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-headline-sm font-semibold text-on-surface">Debts Owed</h3>
            <p className="text-body-md text-on-surface-variant mt-1">
              {debts.length} debt account{debts.length !== 1 ? 's' : ''}
            </p>
          </div>
          {debts.length > 0 ? (
            debts.map(debt => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onEdit={getEditHandler(debt)}
                onRemove={getRemoveHandler(debt)}
                isEditing={editingId === debt.id}
                onEditSave={getSaveHandler(debt)}
                onEditCancel={() => setEditingId(null)}
                balanceReadOnly={isReadOnly(debt.id)}
              />
            ))
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 text-center">
              <p className="text-body-md text-on-surface-variant">No debt accounts found</p>
            </div>
          )}
        </div>

        {/* Summary totals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Assets</p>
            <p className="text-display-sm font-bold text-on-surface">
              ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Debt</p>
            <p className="text-display-sm font-bold text-sunset">
              ${totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
