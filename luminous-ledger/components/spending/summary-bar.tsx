interface SummaryBarProps {
  income: number
  spending: number
  netIncome: number
}

function formatDollars(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function SummaryBar({ income, spending, netIncome }: SummaryBarProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex items-stretch gap-0">
      {/* Monthly Income */}
      <div className="flex-1 flex flex-col gap-1 px-6 first:pl-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Income
        </p>
        <p className="text-display-sm font-bold text-on-surface">
          {formatDollars(income)}
        </p>
      </div>

      {/* Divider */}
      <div className="w-px bg-surface-container-low self-stretch mx-2" />

      {/* Monthly Spending */}
      <div className="flex-1 flex flex-col gap-1 px-6">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Spending
        </p>
        <p className="text-display-sm font-bold text-on-surface">
          {formatDollars(spending)}
        </p>
      </div>

      {/* Divider */}
      <div className="w-px bg-surface-container-low self-stretch mx-2" />

      {/* Monthly Net Income — highlighted */}
      <div className="flex-1 flex flex-col gap-1 px-6 last:pr-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Net Income
        </p>
        <p className="text-display-sm font-bold text-secondary">
          {formatDollars(netIncome)}
        </p>
      </div>
    </div>
  )
}
