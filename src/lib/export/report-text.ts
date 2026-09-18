/**
 * The report as a plain text file — the copy that opens anywhere, pastes into
 * an email, and survives without a browser.
 */

import {
  money,
  moneyExact,
  reportDate,
  type FinancialReport,
} from './report'

const WIDTH = 64

function heading(title: string): string {
  return `${title.toUpperCase()}\n${'-'.repeat(Math.min(WIDTH, title.length + 8))}`
}

/** `Rent .................... $1,200` — readable in a fixed-width font. */
function row(left: string, right: string): string {
  const dots = Math.max(2, WIDTH - left.length - right.length)
  return `${left}${' '.repeat(1)}${'.'.repeat(dots - 1)} ${right}`
}

export function reportToText(report: FinancialReport): string {
  const { monthly, recurring, allocation, investments, savingsGoals, accounts } = report
  const out: string[] = []

  out.push('MY MONEY PLAN')
  out.push(`Generated ${reportDate(report.generatedAt)} · AI Fix My Money`)
  out.push('')

  // ── Monthly ───────────────────────────────────────────────────────────────
  out.push(heading('This month'))
  out.push(row('Income', money(monthly.income)))
  out.push(row(`Spending (${monthly.spendingPctOfIncome}% of income)`, money(monthly.spending)))
  out.push(row(
    monthly.net >= 0 ? `Saved (${monthly.savingsRatePct}% savings rate)` : 'Deficit',
    money(monthly.net),
  ))
  if (report.spendingLimit) {
    out.push(row(`Spending limit (${report.spendingLimit.period})`, money(report.spendingLimit.limit)))
  }
  out.push('')

  // ── Recurring ─────────────────────────────────────────────────────────────
  out.push(heading(`Recurring expenses (${recurring.items.length})`))
  if (recurring.items.length === 0) {
    out.push('None recorded.')
  } else {
    recurring.items.forEach(item => out.push(row(item.name, moneyExact(item.amount))))
    out.push(row('Total monthly', moneyExact(recurring.total)))
  }
  out.push('')

  // ── Allocation ────────────────────────────────────────────────────────────
  out.push(heading('Income allocation'))
  allocation.rows.forEach(r => out.push(row(`${r.label} — ${r.detail}`, `${r.pct}%`)))
  out.push(row('Allocated', `${allocation.allocatedPct}%`))
  out.push(row('Free', `${allocation.unallocatedPct}%`))
  out.push('')

  // ── Investments ───────────────────────────────────────────────────────────
  out.push(heading('Investments'))
  if (investments.items.length === 0) {
    out.push('No investments chosen yet.')
  } else {
    out.push(row('Monthly into investments', money(investments.monthlyAmount)))
    out.push('')
    investments.items.forEach(inv =>
      out.push(row(`${inv.name} (${inv.label})`, `${inv.pct}% · ${money(inv.monthly)}/mo`)),
    )
  }
  out.push('')

  // ── Savings goals ─────────────────────────────────────────────────────────
  out.push(heading('Savings goals'))
  if (savingsGoals.length === 0) {
    out.push('No goals set yet.')
  } else {
    savingsGoals.forEach(g =>
      out.push(row(
        `${g.name} (${g.allocationPct}% of income)`,
        `${money(g.current)} of ${money(g.target)} · ${g.progressPct}%`,
      )),
    )
  }
  out.push('')

  // ── Accounts ──────────────────────────────────────────────────────────────
  out.push(heading('Accounts'))
  out.push(`Assets (${accounts.assets.length})`)
  if (accounts.assets.length === 0) {
    out.push('  None recorded.')
  } else {
    accounts.assets.forEach(a => out.push(row(`  ${a.name} — ${a.kind}`, money(a.balance))))
  }
  out.push(row('  Total assets', money(accounts.totalAssets)))
  out.push('')
  out.push(`Liabilities (${accounts.liabilities.length})`)
  if (accounts.liabilities.length === 0) {
    out.push('  None recorded.')
  } else {
    accounts.liabilities.forEach(a => out.push(row(`  ${a.name} — ${a.kind}`, money(a.balance))))
  }
  out.push(row('  Total liabilities', money(accounts.totalLiabilities)))
  out.push('')
  out.push(row('NET WORTH (assets - liabilities)', money(accounts.netWorth)))
  out.push('')
  out.push('-'.repeat(WIDTH))
  out.push('Educational use only. Not financial advice.')

  return out.join('\n')
}
