/**
 * The report as a standalone printable page.
 *
 * Export to PDF goes through the browser's own print pipeline: this document
 * is written into a hidden frame and printed, so the learner gets a real,
 * selectable-text PDF with no extra dependency shipped to the phone. Nothing
 * here may reference the app's stylesheet — the frame has none.
 */

import {
  money,
  moneyExact,
  reportDate,
  type FinancialReport,
  type ReportAccount,
} from './report'

const GREY = '#d6d7dd'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rowsHtml(rows: Array<[string, string, string?]>): string {
  return rows
    .map(([left, right, sub]) => `
      <tr>
        <td class="left">${esc(left)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</td>
        <td class="right">${esc(right)}</td>
      </tr>`)
    .join('')
}

function section(title: string, body: string): string {
  return `<section><h2>${esc(title)}</h2>${body}</section>`
}

function emptyNote(text: string): string {
  return `<p class="empty">${esc(text)}</p>`
}

function accountTable(accounts: ReportAccount[], totalLabel: string, total: number): string {
  if (accounts.length === 0) {
    return `${emptyNote('None recorded.')}<table><tbody>${rowsHtml([[totalLabel, money(total)]])}</tbody></table>`
  }
  const rows = accounts.map(a =>
    [a.name, money(a.balance), [a.kind, a.institution].filter(Boolean).join(' · ')] as [string, string, string],
  )
  return `<table><tbody>${rowsHtml(rows)}<tr class="total"><td class="left">${esc(totalLabel)}</td><td class="right">${esc(money(total))}</td></tr></tbody></table>`
}

export function reportToHtml(report: FinancialReport): string {
  const { monthly, recurring, allocation, investments, savingsGoals, accounts } = report

  // ── Header stats ──────────────────────────────────────────────────────────
  const stats = `
    <div class="stats">
      <div class="stat"><p class="cap">Income</p><p class="fig">${esc(money(monthly.income))}</p><p class="sub">total monthly</p></div>
      <div class="stat"><p class="cap">Spending</p><p class="fig">${esc(money(monthly.spending))}</p><p class="sub">${monthly.spendingPctOfIncome}% of income</p></div>
      <div class="stat"><p class="cap">${monthly.net >= 0 ? 'Saved' : 'Deficit'}</p><p class="fig" style="color:${monthly.net >= 0 ? '#1a6b3a' : '#ba1a1a'}">${esc(money(Math.abs(monthly.net)))}</p><p class="sub">${monthly.net >= 0 ? `${monthly.savingsRatePct}% savings rate` : 'over budget'}</p></div>
      <div class="stat"><p class="cap">Net worth</p><p class="fig">${esc(money(accounts.netWorth))}</p><p class="sub">assets − liabilities</p></div>
    </div>`

  // ── Allocation ────────────────────────────────────────────────────────────
  const allocationBar = allocation.rows
    .filter(r => r.pct > 0)
    .map(r => `<span style="width:${r.pct}%;background:${r.color ?? GREY}"></span>`)
    .join('')

  const allocationBody = `
    <div class="bar">${allocationBar}</div>
    <table><tbody>${rowsHtml(
      allocation.rows.map(r => [r.label, `${r.pct}%`, r.detail] as [string, string, string]),
    )}</tbody></table>
    <p class="note">${allocation.allocatedPct}% allocated · ${allocation.unallocatedPct}% free</p>`

  // ── Recurring ─────────────────────────────────────────────────────────────
  const recurringBody = recurring.items.length === 0
    ? emptyNote('None recorded.')
    : `<table><tbody>${rowsHtml(recurring.items.map(i => [i.name, moneyExact(i.amount)] as [string, string]))}
       <tr class="total"><td class="left">Total monthly</td><td class="right">${esc(moneyExact(recurring.total))}</td></tr></tbody></table>`

  // ── Investments ───────────────────────────────────────────────────────────
  const investmentsBody = investments.items.length === 0
    ? emptyNote('No investments chosen yet.')
    : `<p class="lead">${esc(money(investments.monthlyAmount))} <span>monthly</span></p>
       <table><tbody>${investments.items.map(inv => `
         <tr>
           <td class="left"><span class="dot" style="background:${inv.color}"></span>${esc(inv.name)}<span class="sub">${esc(inv.label)}</span></td>
           <td class="right">${inv.pct}%<span class="sub">${esc(money(inv.monthly))}/mo</span></td>
         </tr>`).join('')}</tbody></table>`

  // ── Savings goals ─────────────────────────────────────────────────────────
  const goalsBody = savingsGoals.length === 0
    ? emptyNote('No goals set yet.')
    : `<table><tbody>${rowsHtml(savingsGoals.map(g => [
        g.name,
        `${money(g.current)} of ${money(g.target)}`,
        `${g.allocationPct}% of income · ${g.progressPct}% there`,
      ] as [string, string, string]))}</tbody></table>`

  // ── Accounts ──────────────────────────────────────────────────────────────
  const accountsBody = `
    <h3>Assets (${accounts.assets.length})</h3>
    ${accountTable(accounts.assets, 'Total assets', accounts.totalAssets)}
    <h3>Liabilities (${accounts.liabilities.length})</h3>
    ${accountTable(accounts.liabilities, 'Total liabilities', accounts.totalLiabilities)}
    <div class="networth">
      <p class="cap">Net worth</p>
      <p class="fig" style="color:${accounts.netWorth >= 0 ? '#1a6b3a' : '#ba1a1a'}">${esc(money(accounts.netWorth))}</p>
      <p class="sub">${esc(money(accounts.totalAssets))} in assets − ${esc(money(accounts.totalLiabilities))} in liabilities</p>
    </div>`

  const limitLine = report.spendingLimit
    ? `<p class="note">Spending limit: ${esc(money(report.spendingLimit.limit))} ${esc(report.spendingLimit.period)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>My Money Plan — ${esc(reportDate(report.generatedAt))}</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #17171c;
    font-size: 11pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  header { border-bottom: 2px solid #17171c; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-size: 20pt; margin: 0; letter-spacing: -0.01em; }
  header p { margin: 4px 0 0; color: #5b5c64; font-size: 9pt; }
  section { margin-bottom: 20px; page-break-inside: avoid; }
  h2 {
    font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em;
    color: #5b5c64; margin: 0 0 8px; border-bottom: 1px solid #e7e8ee; padding-bottom: 4px;
  }
  h3 { font-size: 10pt; margin: 12px 0 4px; color: #17171c; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 0; border-bottom: 1px solid #f0f0f4; vertical-align: top; }
  td.left { text-align: left; }
  td.right { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr.total td { font-weight: 700; border-bottom: none; border-top: 1px solid #d6d7dd; }
  .sub { display: block; font-size: 8.5pt; color: #5b5c64; font-weight: 400; }
  .note { color: #5b5c64; font-size: 9pt; margin: 6px 0 0; }
  .empty { color: #5b5c64; font-style: italic; margin: 4px 0; }
  .lead { font-size: 15pt; font-weight: 700; margin: 0 0 8px; }
  .lead span { font-size: 9pt; font-weight: 400; color: #5b5c64; }
  .stats { display: flex; gap: 10px; }
  .stat { flex: 1; border: 1px solid #e7e8ee; border-radius: 10px; padding: 10px; }
  .cap { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #5b5c64; margin: 0; }
  .fig { font-size: 14pt; font-weight: 700; margin: 2px 0 0; font-variant-numeric: tabular-nums; }
  .bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: ${GREY}; margin-bottom: 10px; }
  .bar span { display: block; height: 100%; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; margin-right: 6px; }
  .networth { margin-top: 12px; border: 1px solid #e7e8ee; border-radius: 10px; padding: 10px; }
  footer { margin-top: 24px; border-top: 1px solid #e7e8ee; padding-top: 8px; color: #5b5c64; font-size: 8.5pt; }
</style>
</head>
<body>
  <header>
    <h1>My Money Plan</h1>
    <p>Generated ${esc(reportDate(report.generatedAt))} · AI Fix My Money</p>
  </header>

  ${stats}

  ${section('This month', `<table><tbody>${rowsHtml([
    ['Monthly income', money(monthly.income)],
    ['Monthly spending', money(monthly.spending), `${monthly.spendingPctOfIncome}% of income`],
    [monthly.net >= 0 ? 'Saved' : 'Deficit', money(monthly.net), monthly.net >= 0 ? `${monthly.savingsRatePct}% savings rate` : 'over budget'],
  ])}</tbody></table>${limitLine}`)}

  ${section(`Recurring expenses (${recurring.items.length})`, recurringBody)}
  ${section('Income allocation', allocationBody)}
  ${section('Investments', investmentsBody)}
  ${section('Savings goals', goalsBody)}
  ${section('Accounts', accountsBody)}

  <footer>Educational use only. Not financial advice. Figures are the ones you recorded in AI Fix My Money.</footer>
</body>
</html>`
}
