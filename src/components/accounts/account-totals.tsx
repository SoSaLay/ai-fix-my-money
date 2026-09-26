'use client'

import { useAccounts, useDebts } from '@/hooks/use-data'

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Total assets, total debt, and the net worth they make. */
export function AccountTotals() {
  const { accounts } = useAccounts()
  const { debts } = useDebts()

  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.current_balance), 0)
  const totalDebts = debts.reduce((sum, d) => sum + Math.abs(Number(d.current_balance)), 0)
  const netWorth = totalAssets - totalDebts

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Assets</p>
        <p className="text-display-sm font-bold text-on-surface">{money(totalAssets)}</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Debt</p>
        <p className="text-display-sm font-bold text-sunset">{money(totalDebts)}</p>
      </div>

      {/* The one subtraction the two totals above exist for */}
      <div className="col-span-2 bg-surface-container-lowest rounded-2xl shadow-card p-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Net Worth</p>
          <p className={`text-display-sm font-bold tabular-nums ${netWorth < 0 ? 'text-error' : 'text-success'}`}>
            {netWorth < 0 ? '−' : ''}{money(Math.abs(netWorth))}
          </p>
        </div>
        <p className="text-body-md text-on-surface-variant">Total assets − total debt</p>
      </div>
    </div>
  )
}
