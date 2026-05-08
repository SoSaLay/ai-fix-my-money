import { TrendingUp, TrendingDown } from 'lucide-react'

interface SpendingCardProps {
  total: number
  vsLastMonth: number
  budgetPct: number
}

function formatDollars(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getBudgetColor(pct: number): string {
  if (pct <= 60) return '#1a6b3a'
  if (pct <= 85) return '#ff9817'
  return '#ba1a1a'
}

export function SpendingCard({ total, vsLastMonth, budgetPct }: SpendingCardProps) {
  const isUp = vsLastMonth >= 0
  const barColor = getBudgetColor(budgetPct)

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col gap-4">
      {/* Label */}
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
        Monthly Spending
      </p>

      {/* Amount + trend chip */}
      <div className="flex items-end gap-3">
        <p className="text-display-md font-bold text-on-surface">
          {formatDollars(total)}
        </p>
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold mb-1"
          style={{
            backgroundColor: isUp ? 'rgba(186,26,26,0.12)' : 'rgba(26,107,58,0.12)',
            color: isUp ? '#ba1a1a' : '#1a6b3a',
          }}
        >
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(vsLastMonth)}% vs last month
        </span>
      </div>

      {/* Budget progress bar */}
      <div className="flex flex-col gap-2">
        <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(budgetPct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <p className="text-label-sm text-on-surface-variant">
          <span className="font-semibold" style={{ color: barColor }}>{Math.min(budgetPct, 100)}%</span>
          {' '}of monthly budget used
        </p>
      </div>
    </div>
  )
}
