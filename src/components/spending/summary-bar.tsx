interface SummaryBarProps {
  income: number
  spending: number
  netIncome: number
}

function formatDollars(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function SummaryBar({ income, spending, netIncome }: SummaryBarProps) {
  const negative = netIncome < 0

  // Stacked rows on narrow screens, three columns side by side from lg up.
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card px-5 py-2 lg:p-6 flex flex-col lg:flex-row lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-surface-container-low">
      {/* Monthly Income */}
      <div className="flex-1 flex items-baseline justify-between gap-3 py-3 lg:flex-col lg:justify-start lg:gap-1 lg:py-0 lg:px-6 lg:first:pl-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Income
        </p>
        <p className="text-headline-sm lg:text-display-sm font-bold text-on-surface tabular-nums">
          {formatDollars(income)}
        </p>
      </div>

      {/* Monthly Spending */}
      <div className="flex-1 flex items-baseline justify-between gap-3 py-3 lg:flex-col lg:justify-start lg:gap-1 lg:py-0 lg:px-6">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Spending
        </p>
        <p className="text-headline-sm lg:text-display-sm font-bold text-on-surface tabular-nums">
          {formatDollars(spending)}
        </p>
      </div>

      {/* Monthly Net Income — highlighted, and negative when it is negative */}
      <div className="flex-1 flex items-baseline justify-between gap-3 py-3 lg:flex-col lg:justify-start lg:gap-1 lg:py-0 lg:px-6 lg:last:pr-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          Monthly Net Income
        </p>
        <p
          className="text-headline-sm lg:text-display-sm font-bold tabular-nums"
          style={negative ? { color: '#ba1a1a' } : undefined}
        >
          <span className={negative ? undefined : 'text-secondary'}>
            {negative ? '−' : ''}{formatDollars(netIncome)}
          </span>
          {negative && (
            <span className="text-label-sm font-normal ml-1.5">deficit</span>
          )}
        </p>
      </div>
    </div>
  )
}
