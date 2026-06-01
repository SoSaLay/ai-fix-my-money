export function formatCurrency(amount: number, opts?: { showSign?: boolean; compact?: boolean }): string {
  const abs = Math.abs(amount)

  if (opts?.compact && abs >= 1000) {
    const val = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : `${(abs / 1000).toFixed(1)}K`
    return `${amount < 0 ? '-' : opts.showSign ? '+' : ''}$${val}`
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)

  if (opts?.showSign && amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

export function pctToAmount(pct: number, base: number): number {
  return Math.round((pct / 100) * base * 100) / 100
}
