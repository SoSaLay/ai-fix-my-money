import Link from 'next/link'
import { clsx } from 'clsx'

export interface Transaction {
  id: string
  merchant_name: string | null
  name: string
  plaid_category: string | null
  amount: number
  transaction_date: string
  pending: boolean
}

interface RecentActivityProps {
  transactions: Transaction[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount)
  return `${amount > 0 ? '+' : '-'}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-headline-sm text-on-surface">Recent Activity</h3>
        <Link
          href="/spending"
          className="text-label-md text-secondary font-medium hover:opacity-75 transition-opacity duration-150"
        >
          View All
        </Link>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-4">
        {transactions.map((tx) => {
          const displayName = tx.merchant_name ?? tx.name
          const firstLetter = displayName.charAt(0).toUpperCase()
          const isExpense = tx.amount > 0
          const amountStr = formatAmount(tx.amount)

          return (
            <div
              key={tx.id}
              className="flex items-center gap-4"
            >
              {/* Merchant icon */}
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-label-md font-semibold text-on-surface-variant flex-shrink-0">
                {firstLetter}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-label-lg font-medium text-on-surface truncate">
                  {displayName}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {tx.plaid_category ?? 'Uncategorized'} &middot; {formatDate(tx.transaction_date)}
                </p>
              </div>

              {/* Amount */}
              <p
                className={clsx(
                  'text-label-lg font-semibold flex-shrink-0',
                  isExpense ? 'text-error' : 'text-success',
                )}
              >
                {amountStr}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
