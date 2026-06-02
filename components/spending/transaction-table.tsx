import { Badge } from '@/components/ui/badge'

export interface TableTransaction {
  id: string
  merchant_name: string | null
  name: string
  plaid_category: string | null
  amount: number
  transaction_date: string
  pending: boolean
}

interface TransactionTableProps {
  transactions: TableTransaction[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':  '#ff9817',
  'Transport':      '#4c49c9',
  'Shopping':       '#9b59b6',
  'Healthcare':     '#e74c3c',
  'Entertainment':  '#2ecc71',
  'Subscriptions':  '#3498db',
  'Utilities':      '#1abc9c',
  'Housing':        '#e67e22',
  'Other':          '#acadb1',
}

function getCategoryColor(category: string | null): string {
  if (!category) return CATEGORY_COLORS['Other']
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Other']
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatAmount(amount: number): { str: string; isExpense: boolean } {
  const isExpense = amount > 0
  const abs = Math.abs(amount)
  return {
    str: `${isExpense ? '-' : '+'}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    isExpense,
  }
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[2fr_1fr_1fr] px-6 py-3 bg-surface-container-low/50">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Merchant</p>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Category</p>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Amount</p>
      </div>

      {/* Data rows */}
      <div className="divide-y-0">
        {transactions.map((tx) => {
          const displayName = tx.merchant_name ?? tx.name
          const firstLetter = displayName.charAt(0).toUpperCase()
          const { str: amountStr, isExpense } = formatAmount(tx.amount)
          const categoryColor = getCategoryColor(tx.plaid_category)

          return (
            <div
              key={tx.id}
              className="grid grid-cols-[2fr_1fr_1fr] px-6 py-4 hover:bg-surface-container-low/50 transition-colors duration-100"
            >
              {/* Merchant */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-label-md font-semibold text-on-surface-variant flex-shrink-0">
                  {firstLetter}
                </div>
                <div>
                  <p className="text-label-lg font-medium text-on-surface">{displayName}</p>
                  <p className="text-label-sm text-on-surface-variant">{formatDate(tx.transaction_date)}</p>
                </div>
              </div>

              {/* Category badge */}
              <div className="flex items-center">
                <Badge
                  label={tx.plaid_category ?? 'Other'}
                  color={categoryColor}
                />
              </div>

              {/* Amount */}
              <div className="flex items-center justify-end">
                <p
                  className="text-label-lg font-semibold"
                  style={{ color: isExpense ? '#ba1a1a' : '#1a6b3a' }}
                >
                  {amountStr}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
