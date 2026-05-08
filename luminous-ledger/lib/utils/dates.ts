export function currentMonthRange(): { start: string; end: string } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function last30Days(): { start: string; end: string } {
  const end   = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}
