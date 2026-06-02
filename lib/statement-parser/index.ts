// ============================================================================
// Financial Statement Parser
// Handles CSV exports from Chase, Bank of America, Discover, Capital One,
// and any generic bank CSV. OFX/QFX XML support also included.
// PDF: guide users to export CSV from their bank portal.
// ============================================================================

export interface StatementTransaction {
  id: string
  date: string          // YYYY-MM-DD
  description: string
  amount: number        // positive = expense, negative = income/credit
  category: string
  account: string       // filename/account identifier
  source: 'csv' | 'ofx'
  is_recurring: boolean
}

export interface ParsedStatement {
  filename: string
  bank: string
  accountName?: string   // user-supplied label; used to group multiple files under one account
  transactions: StatementTransaction[]
  dateRange: { start: string; end: string }
  importedAt: string
  transactionCount: number
}

export interface StatementImportResult {
  success: boolean
  statement?: ParsedStatement
  errors: string[]
  warnings: string[]
}

// ─── Category keyword map ──────────────────────────────────────────────────────

const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  // Transfers must be checked first — they shadow the Income and Debt Payment rules
  {
    keywords: [
      'internet transfer', 'online transfer', 'account transfer', 'internal transfer',
      'wire transfer', 'from account ending', 'to account ending', 'account ending in',
      'transfer from account', 'transfer to account', 'between accounts',
      'ach transfer', 'book transfer', 'funds transfer',
    ],
    category: 'Transfers',
  },
  { keywords: ['rent', 'mortgage', 'apartment', 'hoa', 'lease'], category: 'Housing' },
  { keywords: ['electric', 'duke energy', 'water', 'gas bill', 'utility', 'utilities', 'comcast', 'att ', 'verizon', 'xfinity', 'spectrum', 'internet'], category: 'Utilities' },
  { keywords: ['grocery', 'grocer', 'aldi', 'trader joe', 'whole foods', 'kroger', 'publix', 'safeway', 'wegmans', 'sprouts', 'market', 'supermarket', 'walmart supercenter', 'costco', 'sam\'s club'], category: 'Groceries' },
  { keywords: ['restaurant', 'mcdonald', 'chick-fil', 'chipotle', 'subway', 'burger', 'pizza', 'taco', 'wendy', 'starbucks', 'dunkin', 'panera', 'five guys', 'food', 'dining', 'cafe', 'coffee', 'bar ', 'grill', 'diner', 'eat', 'qdoba', 'teriyaki', 'sushi'], category: 'Food & Dining' },
  { keywords: ['uber', 'lyft', 'taxi', 'gas station', 'shell', 'bp ', 'exxon', 'chevron', 'sunoco', 'quiktrip', 'marathon gas', 'speedway', 'circle k', 'transport', 'transit', 'parking', 'toll', 'dmv', 'auto'], category: 'Transportation' },
  { keywords: ['amazon', 'walmart', 'target', 'best buy', 'ebay', 'etsy', 'wish', 'shein', 'zara', 'h&m', 'nordstrom', 'macy', 'tjmaxx', 'marshalls', 'homegoods', 'merchandise', 'shop', 'store', 'retail'], category: 'Shopping' },
  { keywords: ['netflix', 'hulu', 'disney', 'hbo', 'spotify', 'apple music', 'youtube premium', 'paramount', 'peacock', 'entertainment', 'cinema', 'movie', 'concert', 'ticket'], category: 'Entertainment' },
  { keywords: ['claude', 'openai', 'chatgpt', 'github', 'aws', 'amazon web services', 'google cloud', 'digitalocean', 'vercel', 'heroku', 'notion', 'figma', 'adobe', 'microsoft', 'software', 'subscription', 'saas'], category: 'Software & Subscriptions' },
  { keywords: ['gym', 'ymca', 'planet fitness', 'anytime fitness', 'crossfit', 'fitness', 'sport', 'health club'], category: 'Health & Fitness' },
  { keywords: ['doctor', 'hospital', 'pharmacy', 'cvs', 'walgreens', 'rite aid', 'medical', 'dental', 'vision', 'health', 'urgent care', 'clinic'], category: 'Healthcare' },
  { keywords: ['payroll', 'direct deposit', 'salary', 'wages', 'irs', 'tax refund', 'venmo', 'zelle', 'cashapp', 'paypal'], category: 'Income' },
  { keywords: ['insurance', 'geico', 'state farm', 'allstate', 'progressive', 'liberty mutual', 'nationwide'], category: 'Insurance' },
  { keywords: ['loan', 'apple card', 'credit card payment', 'payment thank you', 'autopay'], category: 'Debt Payments' },
  { keywords: ['home depot', 'lowe\'s', 'ace hardware', 'home improvement', 'furniture', 'ikea', 'wayfair'], category: 'Home & Garden' },
  { keywords: ['school', 'tuition', 'university', 'college', 'student', 'education', 'coursera', 'udemy', 'book'], category: 'Education' },
  { keywords: ['church', 'donate', 'charity', 'nonprofit', 'gofundme', 'red cross'], category: 'Donations' },
]

function categorize(description: string): string {
  const lower = description.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.category
  }
  return 'Other'
}

// ─── Date normaliser ───────────────────────────────────────────────────────────

function normaliseDate(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()

  // Already ISO: 2026-04-12
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // MM/DD/YYYY or M/D/YYYY
  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`

  // MM-DD-YYYY
  const mdy2 = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (mdy2) return `${mdy2[3]}-${mdy2[1].padStart(2,'0')}-${mdy2[2].padStart(2,'0')}`

  // Try Date constructor as fallback
  try {
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch { /* ignore */ }

  return trimmed
}

// ─── Stable transaction ID ────────────────────────────────────────────────────
// FNV-1a 32-bit hash over filename + date + description + amount.
// Stable across re-imports of the same file; unique across different files.

function txHash(filename: string, date: string, desc: string, amount: number): string {
  const input = `${filename}|${date}|${desc}|${amount}`
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (Math.imul(h, 0x01000193) >>> 0)
  }
  return h.toString(16).padStart(8, '0')
}

// ─── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function findColIndex(headers: string[], ...candidates: string[]): number {
  const lower = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim())
  for (const c of candidates) {
    const idx = lower.findIndex(h => h.includes(c.toLowerCase()))
    if (idx !== -1) return idx
  }
  return -1
}

type BankFormat = 'chase' | 'bofa' | 'discover' | 'capitalone' | 'generic'

function detectFormat(headers: string[]): BankFormat {
  const joined = headers.join('|').toLowerCase()
  if (joined.includes('transaction date') && joined.includes('post date') && joined.includes('type')) return 'chase'
  if (joined.includes('trans. date') || (joined.includes('trans date') && joined.includes('category'))) return 'discover'
  if (joined.includes('running bal') || joined.includes('running balance')) return 'bofa'
  if (joined.includes('transaction date') && joined.includes('balance')) return 'capitalone'
  return 'generic'
}

// ─── Main CSV parser ───────────────────────────────────────────────────────────

export function parseCSV(
  text: string,
  filename: string,
): StatementImportResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Strip BOM
  const clean = text.replace(/^\uFEFF/, '').trim()
  const lines = clean.split(/\r?\n/).filter(l => l.trim())

  if (lines.length < 2) {
    return { success: false, errors: ['File appears empty or has no transaction rows.'], warnings }
  }

  // Find header row (skip preamble rows from some banks)
  let headerIdx = 0
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lower = lines[i].toLowerCase()
    if (lower.includes('date') && (lower.includes('amount') || lower.includes('description') || lower.includes('debit'))) {
      headerIdx = i
      break
    }
  }

  const headers = parseCSVLine(lines[headerIdx])
  const format = detectFormat(headers)
  let bank = 'Your Bank'

  // Resolve column indices per format
  let dateCol: number, descCol: number, amountCol: number, creditCol = -1, debitCol = -1

  switch (format) {
    case 'chase':
      bank = 'Chase'
      dateCol = findColIndex(headers, 'transaction date')
      descCol = findColIndex(headers, 'description')
      amountCol = findColIndex(headers, 'amount')
      break
    case 'discover':
      bank = 'Discover'
      dateCol = findColIndex(headers, 'trans. date', 'trans date', 'date')
      descCol = findColIndex(headers, 'description')
      amountCol = findColIndex(headers, 'amount')
      break
    case 'bofa':
      bank = 'Bank of America'
      dateCol = findColIndex(headers, 'date')
      descCol = findColIndex(headers, 'description', 'payee')
      amountCol = findColIndex(headers, 'amount')
      break
    case 'capitalone':
      bank = 'Capital One'
      dateCol = findColIndex(headers, 'transaction date')
      descCol = findColIndex(headers, 'description', 'merchant')
      debitCol = findColIndex(headers, 'debit')
      creditCol = findColIndex(headers, 'credit')
      amountCol = debitCol !== -1 ? debitCol : findColIndex(headers, 'amount')
      break
    default:
      bank = 'Bank'
      dateCol = findColIndex(headers, 'date', 'trans date', 'posting date')
      descCol = findColIndex(headers, 'description', 'merchant', 'payee', 'memo')
      amountCol = findColIndex(headers, 'amount', 'debit', 'transaction amount')
      creditCol = findColIndex(headers, 'credit', 'deposit')
  }

  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    errors.push(
      `Could not identify columns in this CSV. Found headers: ${headers.join(', ')}. ` +
      'Try re-exporting from your bank and ensure the file includes Date, Description, and Amount columns.'
    )
    return { success: false, errors, warnings }
  }

  const transactions: StatementTransaction[] = []
  let skipped = 0

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.every(c => !c)) continue // blank row

    const dateRaw = row[dateCol] ?? ''
    const desc = row[descCol] ?? ''
    const amtRaw = row[amountCol] ?? ''

    const date = normaliseDate(dateRaw)
    if (!date) { skipped++; continue }

    // Parse amount — remove $, commas, parentheses (negative indicator)
    let amtStr = amtRaw.replace(/[$,\s]/g, '')
    const isNegParen = amtStr.startsWith('(') && amtStr.endsWith(')')
    if (isNegParen) amtStr = '-' + amtStr.slice(1, -1)
    let amount = parseFloat(amtStr)
    if (isNaN(amount)) { skipped++; continue }

    // Capital One: separate debit/credit columns
    if (format === 'capitalone' && creditCol !== -1) {
      const creditRaw = (row[creditCol] ?? '').replace(/[$,\s]/g, '')
      const credit = parseFloat(creditRaw)
      if (!isNaN(credit) && credit > 0) amount = -credit // credit = money in = negative expense
    }

    // BofA & Chase: positive = debit (expense), negative = credit (income)
    // Discover: positive = charge (expense)
    // We normalise to: positive = expense, negative = income
    // Most formats already follow this — just Chase/BofA may have inverted signs for credits

    const category = categorize(desc)

    transactions.push({
      id: txHash(filename, date, desc, amount),
      date,
      description: desc,
      amount,
      category,
      account: filename.replace(/\.[^.]+$/, ''),
      source: 'csv',
      is_recurring: false,
    })
  }

  if (transactions.length === 0) {
    return { success: false, errors: ['No valid transactions found in file.'], warnings }
  }

  if (skipped > 0) warnings.push(`${skipped} row(s) were skipped (unrecognised format or missing fields).`)

  const tagged = detectRecurring(transactions)
  const dates = tagged.map(t => t.date).filter(Boolean).sort()
  const dateRange = { start: dates[0] ?? '', end: dates[dates.length - 1] ?? '' }

  return {
    success: true,
    warnings,
    errors: [],
    statement: {
      filename,
      bank,
      transactions: tagged,
      dateRange,
      importedAt: new Date().toISOString(),
      transactionCount: tagged.length,
    },
  }
}

// ─── OFX / QFX parser ─────────────────────────────────────────────────────────

export function parseOFX(text: string, filename: string): StatementImportResult {
  const errors: string[] = []
  const warnings: string[] = []

  const transactions: StatementTransaction[] = []

  // OFX uses SGML-like syntax: <DTPOSTED>20260412 <TRNAMT>-45.23 <MEMO>WALMART
  const stmtTrnMatches = text.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)

  for (const match of stmtTrnMatches) {
    const block = match[1]
    const get = (tag: string) => block.match(new RegExp(`<${tag}>([^<\n]+)`, 'i'))?.[1]?.trim() ?? ''

    const dateRaw = get('DTPOSTED') || get('DTUSER')
    // OFX date: YYYYMMDD or YYYYMMDDHHMMSS
    const dateStr = dateRaw.length >= 8
      ? `${dateRaw.slice(0,4)}-${dateRaw.slice(4,6)}-${dateRaw.slice(6,8)}`
      : normaliseDate(dateRaw)

    const amtRaw = get('TRNAMT')
    const amount = parseFloat(amtRaw)
    if (isNaN(amount) || !dateStr) continue

    const desc = get('MEMO') || get('NAME') || get('PAYEE') || 'Unknown'

    transactions.push({
      id: txHash(filename, dateStr, desc, -amount),
      date: dateStr,
      description: desc,
      amount: -amount, // OFX: negative = debit (expense), so flip
      category: categorize(desc),
      account: filename.replace(/\.[^.]+$/, ''),
      source: 'ofx',
      is_recurring: false,
    })
  }

  if (transactions.length === 0) {
    return { success: false, errors: ['No transactions found in OFX/QFX file.'], warnings }
  }

  const tagged = detectRecurring(transactions)
  const dates = tagged.map(t => t.date).sort()
  return {
    success: true, errors: [], warnings,
    statement: {
      filename,
      bank: text.match(/ORG:([^\r\n]+)/i)?.[1]?.trim() ?? 'Bank',
      transactions: tagged,
      dateRange: { start: dates[0], end: dates[dates.length - 1] },
      importedAt: new Date().toISOString(),
      transactionCount: tagged.length,
    },
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function parseStatement(text: string, filename: string): StatementImportResult {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ofx') || lower.endsWith('.qfx')) return parseOFX(text, filename)
  return parseCSV(text, filename)
}

// ─── Recurring payment detection ──────────────────────────────────────────────
// Two signals mark a transaction as recurring:
//   1. The same normalised merchant name appears in 2+ distinct calendar months.
//   2. The merchant name matches a known subscription service keyword.
//
// Run this over the full accumulated transaction list for an account group,
// not just a single file, so multi-month history is used when available.

const SUBSCRIPTION_KEYWORDS = [
  // Streaming
  'netflix', 'hulu', 'disney+', 'disney plus', 'hbo', 'max ', 'peacock', 'paramount',
  'apple tv', 'youtube premium', 'crunchyroll', 'fubo', 'sling',
  // Music / Podcasts
  'spotify', 'apple music', 'tidal', 'pandora', 'amazon music', 'audible',
  // Cloud / Software
  'icloud', 'google one', 'google storage', 'dropbox', 'onedrive',
  'adobe', 'creative cloud', 'figma', 'notion', 'microsoft 365', 'office 365',
  'github', 'vercel', 'heroku', 'aws ', 'digitalocean', 'cloudflare',
  'openai', 'chatgpt', 'claude', 'anthropic',
  // Fitness / Health
  'gym', 'peloton', 'equinox', 'planet fitness', 'ymca', 'anytime fitness',
  'noom', 'calm', 'headspace',
  // News / Reading
  'new york times', 'nytimes', 'wall street journal', 'wsj', 'the atlantic',
  'medium', 'substack', 'kindle unlimited',
  // Finance / Business
  'linkedin premium', 'quickbooks', 'freshbooks', 'slack', 'zoom',
  // Delivery / Shopping clubs
  'amazon prime', 'instacart', 'doordash pass', 'grubhub+', 'walmart+',
  // Utilities / Telecom that recur predictably
  'at&t', 'verizon', 't-mobile', 'comcast', 'xfinity', 'spectrum', 'cox',
]

function normaliseMerchant(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40) // cap length so minor suffixes don't create separate buckets
}

function isKnownSubscription(description: string): boolean {
  const lower = description.toLowerCase()
  return SUBSCRIPTION_KEYWORDS.some(k => lower.includes(k))
}

export function detectRecurring(transactions: StatementTransaction[]): StatementTransaction[] {
  // Count distinct months each normalised merchant appears in
  const merchantMonths: Record<string, Set<string>> = {}
  for (const tx of transactions) {
    if (tx.amount <= 0) continue // skip credits / income
    const key = normaliseMerchant(tx.description)
    if (!merchantMonths[key]) merchantMonths[key] = new Set()
    merchantMonths[key].add(tx.date.slice(0, 7)) // 'YYYY-MM'
  }

  const multiMonthMerchants = new Set(
    Object.entries(merchantMonths)
      .filter(([, months]) => months.size >= 2)
      .map(([key]) => key),
  )

  return transactions.map(tx => {
    if (tx.is_recurring) return tx // already tagged
    if (tx.amount <= 0) return tx  // credits are not subscriptions
    const key = normaliseMerchant(tx.description)
    const recurring = multiMonthMerchants.has(key) || isKnownSubscription(tx.description)
    return recurring ? { ...tx, is_recurring: true } : tx
  })
}

// ─── Derive monthly summaries from transactions ────────────────────────────────

export interface StatementMonth {
  month: string       // 'YYYY-MM'
  label: string       // 'February 2026'
  income: number
  expenses: number
  savings: number
  categories: Record<string, number>
  transactionCount: number
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function deriveMonthlyStats(transactions: StatementTransaction[]): StatementMonth[] {
  const byMonth: Record<string, StatementTransaction[]> = {}

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7) // 'YYYY-MM'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(tx)
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, txs]) => {
      const [year, monthNum] = key.split('-')
      const label = `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year}`

      const nonTransfer = txs.filter(t => t.category !== 'Transfers')
      const income = nonTransfer.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      const expenses = nonTransfer.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)

      const categories: Record<string, number> = {}
      nonTransfer.filter(t => t.amount > 0).forEach(t => {
        categories[t.category] = (categories[t.category] ?? 0) + t.amount
      })

      return {
        month: key,
        label,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savings: Math.round((income - expenses) * 100) / 100,
        categories,
        transactionCount: txs.length,
      }
    })
}
