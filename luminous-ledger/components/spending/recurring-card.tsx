interface RecurringItem {
  icon: string
  name: string
  amount: number
}

interface RecurringCardProps {
  total: number
  count: number
  items: RecurringItem[]
}

function formatDollars(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RecurringCard({ total, count, items }: RecurringCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-4">
      {/* Label */}
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
        Recurring Expenses
      </p>

      {/* Amount */}
      <p className="text-display-md font-bold text-on-surface">
        {formatDollars(total)}
      </p>

      {/* Subscription count */}
      <p className="text-label-md text-on-surface-variant">
        {count} Active Subscriptions
      </p>

      {/* Items list */}
      <div className="flex flex-col gap-3 mt-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <p className="text-label-lg font-medium text-on-surface flex-1 truncate">
              {item.name}
            </p>
            <p className="text-label-lg font-semibold text-on-surface flex-shrink-0">
              {formatDollars(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
