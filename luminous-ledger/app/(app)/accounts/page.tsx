'use client'

import { CreditCard, AlertCircle, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { TopNav } from '@/components/layout/top-nav'
import { useAccounts, useDebts, type Account } from '@/hooks/use-data'
import { useFinancialData } from '@/contexts/financial-data-context'

function AccountCard({ account, onRemove }: { account: Account; onRemove?: () => void }) {
  const isActive = account.is_active

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex items-center gap-5">
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
        style={{ backgroundColor: isActive ? '#1a6b3a' : '#acadb1' }}
        title={isActive ? 'Active' : 'Inactive'}
      />

      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors flex-shrink-0"
          title="Remove account"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

function DebtCard({ debt, onRemove }: { debt: Account; onRemove?: () => void }) {
  const isActive = debt.is_active

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex items-center gap-5">
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
        style={{ backgroundColor: isActive ? '#1a6b3a' : '#acadb1' }}
        title={isActive ? 'Active' : 'Inactive'}
      />

      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/8 transition-colors flex-shrink-0"
          title="Remove account"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

export default function AccountsPage() {
  const { accounts, loading: accountsLoading, error: accountsError, refresh: refreshAccounts } = useAccounts()
  const { debts, loading: debtsLoading, error: debtsError, refresh: refreshDebts } = useDebts()
  const { removeManualAccount, removeStatementGroup } = useFinancialData()

  function getRemoveHandler(account: Account): (() => void) | undefined {
    if (account.id.startsWith('manual_')) return () => removeManualAccount(account.id)
    if (account.id.startsWith('stmt_grp_')) return () => removeStatementGroup(account.name)
    return undefined
  }

  // Show loading state
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

  // Show error state
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
              onClick={() => {
                refreshAccounts()
                refreshDebts()
              }}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0)
  const totalDebts = debts.reduce((sum, d) => sum + Math.abs(Number(d.current_balance)), 0)

  // Separate depository accounts from investment accounts
  const depositoryAccounts = accounts.filter(a => a.type === 'depository' || a.type === 'investment')

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Accounts" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md text-on-surface-variant">
              {depositoryAccounts.length} account{depositoryAccounts.length !== 1 ? 's' : ''} imported
            </p>
          </div>
          <Link
            href="/setup"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-label-md font-semibold transition-all hover:opacity-80"
            style={{ background: '#4c49c9', color: '#fff' }}
          >
            <Upload size={15} />
            Update Data
          </Link>
        </div>

        {/* Account cards */}
        {depositoryAccounts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {depositoryAccounts.map((account) => (
              <AccountCard key={account.id} account={account} onRemove={getRemoveHandler(account)} />
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-sm font-semibold text-on-surface">Debts Owed</h3>
              <p className="text-body-md text-on-surface-variant mt-1">
                {debts.length} debt account{debts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {debts.length > 0 ? (
            debts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} onRemove={getRemoveHandler(debt)} />
            ))
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 text-center">
              <p className="text-body-md text-on-surface-variant">No debt accounts found</p>
            </div>
          )}
        </div>

        {/* Total summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Total Assets
            </p>
            <p className="text-display-sm font-bold text-on-surface">
              ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Total Debt
            </p>
            <p className="text-display-sm font-bold text-sunset">
              ${totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
