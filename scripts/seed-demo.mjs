/**
 * Luminous Ledger — Demo Seed Script
 *
 * Creates a high-earning UAT account preloaded with 13+ months of financial
 * history: $19k+/mo income, meaningful multi-category spending, strong
 * investment portfolio, and 5 active savings goals.
 *
 * Credentials: demo@luminousledger.com / Demo1234!
 *
 * Usage (from luminous-ledger/ directory):
 *   node --env-file=.env.local scripts/seed-demo.mjs
 *
 * Safe to re-run — cleans and rebuilds demo data each time.
 */

import { createClient } from '@supabase/supabase-js'

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.')
  console.error('Run with: node --env-file=.env.local scripts/seed-demo.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_EMAIL    = 'demo@luminousledger.com'
const DEMO_PASSWORD = 'Demo1234!'
const DEMO_NAME     = 'Alex Morgan'

// Fixed UUIDs so re-runs are idempotent
const ID = {
  plaidItem:        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  checking:         'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  savings:          'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  brokerage:        'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  retirement:       'c6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  credit:           'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  mortgage:         'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  carLoan:          'c7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  goalEmergency:    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  goalTravel:       'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  goalCar:          'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  goalHome:         'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  goalEducation:    'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamSalary:     'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamFreelance:  'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamRent:       'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamGym:        'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamNetflix:    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamSpotify:    'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamInternet:   'f7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  streamRentalInc:  'f8eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dt(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

const TODAY = dt(2026, 5, 2)

function isPast(dateStr) {
  return dateStr <= TODAY
}

function clampDay(year, month, day) {
  const last = new Date(year, month, 0).getDate()
  return Math.min(day, last)
}

function monthRange() {
  const months = []
  let y = 2025, m = 3
  while (y < 2026 || (y === 2026 && m <= 5)) {
    months.push({ year: y, month: m })
    m++; if (m > 12) { m = 1; y++ }
  }
  return months
}

function fuzz(base, variance, seed) {
  const offset = ((seed * 1103515245 + 12345) & 0x7fffffff) % (variance * 2 + 1) - variance
  return Math.round((base + offset) * 100) / 100
}

let _txCounter = 0
function txId(tag, year, month) {
  return `demo-${tag}-${year}${String(month).padStart(2,'0')}-${++_txCounter}`
}

function seasonalFactor(month) {
  const factors = { 1:0.85, 2:0.90, 3:0.95, 4:1.00, 5:1.05, 6:1.10,
                    7:1.15, 8:1.12, 9:1.00, 10:1.00, 11:1.05, 12:1.40 }
  return factors[month] ?? 1.0
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║   Luminous Ledger — Demo Seed Script      ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  // ── 1. Create or fetch demo user ──────────────────────────────────────────
  console.log('→ Setting up demo user…')

  let userId
  const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.find(u => u.email === DEMO_EMAIL)

  if (existing) {
    userId = existing.id
    console.log(`  Found existing user: ${userId}`)
    await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD })
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    })
    if (error) throw new Error(`Failed to create user: ${error.message}`)
    userId = data.user.id
    console.log(`  Created user: ${userId}`)
  }

  await supabase.from('users').upsert({
    id: userId,
    email: DEMO_EMAIL,
    full_name: DEMO_NAME,
    onboarding_complete: true,
    onboarding_step: 5,
  }, { onConflict: 'id' })

  console.log('  ✓ User ready\n')

  // ── 2. Fetch system category IDs ─────────────────────────────────────────
  console.log('→ Loading system categories…')
  const { data: cats, error: catsErr } = await supabase
    .from('budget_categories')
    .select('id, name')
    .is('user_id', null)
    .eq('is_system', true)

  if (catsErr) throw new Error(`Failed to fetch categories: ${catsErr.message}`)

  const catId = Object.fromEntries(cats.map(c => [c.name, c.id]))
  const CATS = {
    income:        catId['Income'],
    housing:       catId['Housing'],
    food:          catId['Food & Dining'],
    transport:     catId['Transport'],
    healthcare:    catId['Healthcare'],
    entertainment: catId['Entertainment'],
    shopping:      catId['Shopping'],
    electronics:   catId['Electronics'],
    utilities:     catId['Utilities'],
    subscriptions: catId['Subscriptions'],
    other:         catId['Other'],
  }
  console.log('  ✓ Categories loaded\n')

  // ── 3. Wipe existing demo data ────────────────────────────────────────────
  console.log('→ Cleaning existing demo data…')
  await supabase.from('allocation_transfers').delete().eq('user_id', userId)
  await supabase.from('investment_allocations').delete().eq('user_id', userId)
  await supabase.from('savings_goals').delete().eq('user_id', userId)
  await supabase.from('budget_limits').delete().eq('user_id', userId)
  await supabase.from('recurring_streams').delete().eq('user_id', userId)
  await supabase.from('transactions').delete().eq('user_id', userId)
  await supabase.from('accounts').delete().eq('user_id', userId)
  await supabase.from('plaid_items').delete().eq('user_id', userId)
  console.log('  ✓ Cleaned\n')

  // ── 4. Plaid item ─────────────────────────────────────────────────────────
  console.log('→ Creating bank connections…')
  const { error: itemErr } = await supabase.from('plaid_items').insert({
    id:               ID.plaidItem,
    user_id:          userId,
    plaid_item_id:    'item-demo-chase-001',
    access_token:     'access-sandbox-demo-token-do-not-use',
    institution_id:   'ins_3',
    institution_name: 'Chase',
    status:           'active',
    last_synced_at:   new Date().toISOString(),
  })
  if (itemErr) throw new Error(`Plaid item: ${itemErr.message}`)

  // ── 5. Accounts ───────────────────────────────────────────────────────────
  const { error: acctErr } = await supabase.from('accounts').insert([
    {
      id: ID.checking, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-checking-001',
      name: 'Chase Total Checking', official_name: 'Chase Total Checking Account',
      type: 'depository', subtype: 'checking', mask: '1234', currency_code: 'USD',
      current_balance: 42800.00, available_balance: 42600.00,
      is_selected: true, is_active: true,
    },
    {
      id: ID.savings, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-savings-001',
      name: 'Chase Premier Savings', official_name: 'Chase Premier Savings Account',
      type: 'depository', subtype: 'savings', mask: '5678', currency_code: 'USD',
      current_balance: 95400.00, available_balance: 95400.00,
      is_selected: true, is_active: true,
    },
    {
      id: ID.brokerage, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-invest-001',
      name: 'Fidelity Brokerage', official_name: 'Fidelity Individual Brokerage Account',
      type: 'investment', subtype: 'brokerage', mask: '9012', currency_code: 'USD',
      current_balance: 185600.00, available_balance: 185600.00,
      is_selected: true, is_active: true,
    },
    {
      id: ID.retirement, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-retire-001',
      name: 'Vanguard 401(k)', official_name: 'Vanguard Retirement Account',
      type: 'investment', subtype: 'retirement', mask: '4321', currency_code: 'USD',
      current_balance: 142300.00, available_balance: 142300.00,
      is_selected: true, is_active: true,
    },
    {
      id: ID.credit, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-credit-001',
      name: 'Chase Sapphire Reserve', official_name: 'Chase Sapphire Reserve Credit Card',
      type: 'credit', subtype: 'credit card', mask: '3456', currency_code: 'USD',
      current_balance: 5840.00, available_balance: null,
      is_selected: true, is_active: true,
    },
    {
      id: ID.mortgage, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-mortgage-001',
      name: 'Wells Fargo Mortgage', official_name: 'Wells Fargo Home Mortgage',
      type: 'loan', subtype: 'mortgage', mask: '7890', currency_code: 'USD',
      current_balance: 485000.00, available_balance: null,
      is_selected: true, is_active: true,
    },
    {
      id: ID.carLoan, user_id: userId, plaid_item_id: ID.plaidItem,
      plaid_account_id: 'acc-demo-car-001',
      name: 'BMW Financial Services', official_name: 'BMW Financial Auto Loan',
      type: 'loan', subtype: 'auto', mask: '2468', currency_code: 'USD',
      current_balance: 28500.00, available_balance: null,
      is_selected: true, is_active: true,
    },
  ])
  if (acctErr) throw new Error(`Accounts: ${acctErr.message}`)
  console.log('  ✓ 7 accounts created\n')

  // ── 6. Recurring streams ──────────────────────────────────────────────────
  console.log('→ Creating recurring streams…')
  const { error: streamErr } = await supabase.from('recurring_streams').insert([
    {
      id: ID.streamSalary, user_id: userId, plaid_stream_id: 'stream-salary-001',
      merchant_name: 'Nexus Capital Partners', category_id: CATS.income,
      average_amount: 7500.00, frequency: 'semi_monthly',
      last_date: '2026-05-01', next_expected_date: '2026-05-15',
      stream_type: 'income', is_active: true,
    },
    {
      id: ID.streamFreelance, user_id: userId, plaid_stream_id: 'stream-freelance-001',
      merchant_name: 'Stripe Transfer', category_id: CATS.income,
      average_amount: 2500.00, frequency: 'monthly',
      last_date: '2026-04-28', next_expected_date: '2026-05-28',
      stream_type: 'income', is_active: true,
    },
    {
      id: ID.streamRentalInc, user_id: userId, plaid_stream_id: 'stream-rental-inc-001',
      merchant_name: 'Zelle Transfer — Tenant', category_id: CATS.income,
      average_amount: 1800.00, frequency: 'monthly',
      last_date: '2026-05-01', next_expected_date: '2026-06-01',
      stream_type: 'income', is_active: true,
    },
    {
      id: ID.streamRent, user_id: userId, plaid_stream_id: 'stream-rent-001',
      merchant_name: 'Horizon Living LLC', category_id: CATS.housing,
      average_amount: 3800.00, frequency: 'monthly',
      last_date: '2026-05-01', next_expected_date: '2026-06-01',
      stream_type: 'expense', is_active: true,
    },
    {
      id: ID.streamGym, user_id: userId, plaid_stream_id: 'stream-gym-001',
      merchant_name: 'Equinox Fitness', category_id: CATS.subscriptions,
      average_amount: 89.99, frequency: 'monthly',
      last_date: '2026-05-01', next_expected_date: '2026-06-01',
      stream_type: 'expense', is_active: true,
    },
    {
      id: ID.streamNetflix, user_id: userId, plaid_stream_id: 'stream-netflix-001',
      merchant_name: 'Netflix', category_id: CATS.subscriptions,
      average_amount: 22.99, frequency: 'monthly',
      last_date: '2026-05-01', next_expected_date: '2026-06-01',
      stream_type: 'expense', is_active: true,
    },
    {
      id: ID.streamSpotify, user_id: userId, plaid_stream_id: 'stream-spotify-001',
      merchant_name: 'Spotify', category_id: CATS.subscriptions,
      average_amount: 16.99, frequency: 'monthly',
      last_date: '2026-05-05', next_expected_date: '2026-06-05',
      stream_type: 'expense', is_active: true,
    },
    {
      id: ID.streamInternet, user_id: userId, plaid_stream_id: 'stream-internet-001',
      merchant_name: 'AT&T Fiber', category_id: CATS.utilities,
      average_amount: 90.00, frequency: 'monthly',
      last_date: '2026-04-20', next_expected_date: '2026-05-20',
      stream_type: 'expense', is_active: true,
    },
  ])
  if (streamErr) throw new Error(`Recurring streams: ${streamErr.message}`)
  console.log('  ✓ 8 recurring streams\n')

  // ── 7. Generate transactions ──────────────────────────────────────────────
  console.log('→ Generating 15 months of transactions…')

  const allTx = []
  const months = monthRange()

  for (const { year, month } of months) {
    const sf = seasonalFactor(month)
    const mi = months.findIndex(m => m.year === year && m.month === month)

    // ── Income ──────────────────────────────────────────────────────────────

    // Primary salary — 1st of month
    const sal1Date = dt(year, month, 1)
    if (isPast(sal1Date)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('sal1', year, month),
      amount: -7500.00, currency_code: 'USD',
      name: 'Nexus Capital Partners Payroll', merchant_name: 'Nexus Capital Partners',
      category_id: CATS.income, plaid_category: ['Payroll', 'Income'],
      transaction_date: sal1Date, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamSalary,
    })

    // Primary salary — 15th of month
    const sal2Day  = clampDay(year, month, 15)
    const sal2Date = dt(year, month, sal2Day)
    if (isPast(sal2Date)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('sal2', year, month),
      amount: -7500.00, currency_code: 'USD',
      name: 'Nexus Capital Partners Payroll', merchant_name: 'Nexus Capital Partners',
      category_id: CATS.income, plaid_category: ['Payroll', 'Income'],
      transaction_date: sal2Date, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamSalary,
    })

    // Freelance consulting — 28th
    const freeDay  = clampDay(year, month, 28)
    const freeDate = dt(year, month, freeDay)
    if (isPast(freeDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('free', year, month),
      amount: fuzz(-2500, 400, mi * 7),
      currency_code: 'USD',
      name: 'Stripe Transfer — Consulting', merchant_name: 'Stripe',
      category_id: CATS.income, plaid_category: ['Transfer', 'Income'],
      transaction_date: freeDate, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamFreelance,
    })

    // Rental income — 1st
    const rentalDate = dt(year, month, 1)
    if (isPast(rentalDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('rent-in', year, month),
      amount: -1800.00, currency_code: 'USD',
      name: 'Zelle Transfer — Tenant', merchant_name: 'Zelle',
      category_id: CATS.income, plaid_category: ['Transfer', 'Income'],
      transaction_date: rentalDate, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamRentalInc,
    })

    // ── Housing ─────────────────────────────────────────────────────────────

    const rentDate = dt(year, month, 1)
    if (isPast(rentDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('rent', year, month),
      amount: 3800.00, currency_code: 'USD',
      name: 'Horizon Living LLC', merchant_name: 'Horizon Living LLC',
      category_id: CATS.housing, plaid_category: ['Mortgage and Rent', 'Housing'],
      transaction_date: rentDate, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamRent,
    })

    // Mortgage payment on investment property — 5th
    const mortDate = dt(year, month, 5)
    if (isPast(mortDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('mort', year, month),
      amount: 2850.00, currency_code: 'USD',
      name: 'Wells Fargo Mortgage Payment', merchant_name: 'Wells Fargo',
      category_id: CATS.housing, plaid_category: ['Mortgage and Rent', 'Mortgage'],
      transaction_date: mortDate, pending: false, is_recurring: true,
    })

    // ── Subscriptions ────────────────────────────────────────────────────────

    if (isPast(dt(year, month, 1))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('gym', year, month),
      amount: 89.99, currency_code: 'USD',
      name: 'Equinox Fitness', merchant_name: 'Equinox',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Gyms and Fitness Centers'],
      transaction_date: dt(year, month, 1), pending: false,
      is_recurring: true, recurring_stream_id: ID.streamGym,
    })

    const netflixDate = dt(year, month, clampDay(year, month, 15))
    if (isPast(netflixDate)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('nflx', year, month),
      amount: 22.99, currency_code: 'USD',
      name: 'Netflix', merchant_name: 'Netflix',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: netflixDate, pending: false,
      is_recurring: true, recurring_stream_id: ID.streamNetflix,
    })

    if (isPast(dt(year, month, 5))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('spot', year, month),
      amount: 16.99, currency_code: 'USD',
      name: 'Spotify', merchant_name: 'Spotify',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: dt(year, month, 5), pending: false,
      is_recurring: true, recurring_stream_id: ID.streamSpotify,
    })

    // Adobe Creative Cloud monthly
    if (isPast(dt(year, month, 12))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('adbe', year, month),
      amount: 59.99, currency_code: 'USD',
      name: 'Adobe Creative Cloud', merchant_name: 'Adobe',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: dt(year, month, 12), pending: false, is_recurring: true,
    })

    // iCloud
    if (isPast(dt(year, month, 8))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('icld', year, month),
      amount: 9.99, currency_code: 'USD',
      name: 'Apple iCloud+', merchant_name: 'Apple',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: dt(year, month, 8), pending: false, is_recurring: true,
    })

    // LinkedIn Premium
    if (isPast(dt(year, month, 3))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('lnkd', year, month),
      amount: 39.99, currency_code: 'USD',
      name: 'LinkedIn Premium', merchant_name: 'LinkedIn',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: dt(year, month, 3), pending: false, is_recurring: true,
    })

    // NYT + WSJ — alternating months
    if (mi % 2 === 0 && isPast(dt(year, month, 10))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('nyt', year, month),
      amount: 17.00, currency_code: 'USD',
      name: 'New York Times', merchant_name: 'New York Times',
      category_id: CATS.subscriptions, plaid_category: ['Service', 'Digital Purchase'],
      transaction_date: dt(year, month, 10), pending: false, is_recurring: true,
    })

    // ── Utilities ────────────────────────────────────────────────────────────

    if (isPast(dt(year, month, 20))) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('inet', year, month),
      amount: 90.00, currency_code: 'USD',
      name: 'AT&T Fiber', merchant_name: 'AT&T',
      category_id: CATS.utilities, plaid_category: ['Utilities', 'Internet Service'],
      transaction_date: dt(year, month, 20), pending: false,
      is_recurring: true, recurring_stream_id: ID.streamInternet,
    })

    const electricBase = (month >= 6 && month <= 8) ? 185 : (month === 12 || month === 1) ? 170 : 130
    if (isPast(dt(year, month, 10))) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('elec', year, month),
      amount: fuzz(electricBase, 20, mi * 3), currency_code: 'USD',
      name: 'PG&E Electric', merchant_name: 'Pacific Gas & Electric',
      category_id: CATS.utilities, plaid_category: ['Utilities', 'Electric'],
      transaction_date: dt(year, month, 10), pending: false, is_recurring: true,
    })

    if (isPast(dt(year, month, 25))) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('phne', year, month),
      amount: 85.00, currency_code: 'USD',
      name: 'Verizon Wireless', merchant_name: 'Verizon',
      category_id: CATS.utilities, plaid_category: ['Utilities', 'Telecommunication Services'],
      transaction_date: dt(year, month, 25), pending: false, is_recurring: true,
    })

    // ── Groceries (4× per month) ─────────────────────────────────────────────

    const groceryDays    = [6, 13, 20, 27]
    const groceryAmounts = [
      fuzz(165, 30, mi),
      fuzz(140, 25, mi + 1),
      fuzz(175, 35, mi + 2),
      fuzz(150, 28, mi + 3),
    ]
    const groceryMerchants = [
      ['Whole Foods Market', 'Whole Foods'],
      ["Erewhon Market",     "Erewhon"],
      ['Whole Foods Market', 'Whole Foods'],
      ["Bristol Farms",      "Bristol Farms"],
    ]
    for (let g = 0; g < groceryDays.length; g++) {
      const grocDate = dt(year, month, clampDay(year, month, groceryDays[g]))
      if (!isPast(grocDate)) continue
      allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId(`groc${g}`, year, month),
        amount: Math.round(groceryAmounts[g] * sf * 100) / 100,
        currency_code: 'USD',
        name: groceryMerchants[g][0], merchant_name: groceryMerchants[g][1],
        category_id: CATS.food, plaid_category: ['Food and Drink', 'Groceries'],
        transaction_date: grocDate, pending: false, is_recurring: false,
      })
    }

    // ── Restaurants (8–13 per month) ─────────────────────────────────────────

    const restaurants = [
      { name: 'Nobu Restaurant',         merchant: 'Nobu',         amount: 185.00, day: 2  },
      { name: 'Sweetgreen',              merchant: 'Sweetgreen',   amount: 22.50,  day: 7  },
      { name: 'Catch LA',                merchant: 'Catch LA',     amount: 240.00, day: 9  },
      { name: 'DoorDash',                merchant: 'DoorDash',     amount: 68.40,  day: 11 },
      { name: 'Blue Bottle Coffee',      merchant: 'Blue Bottle',  amount: 11.50,  day: 14 },
      { name: 'Starbucks',               merchant: 'Starbucks',    amount: 12.95,  day: 16 },
      { name: 'Uber Eats',               merchant: 'Uber Eats',    amount: 74.60,  day: 18 },
      { name: 'Mastros Steakhouse',      merchant: "Mastro's",     amount: 320.00, day: 20 },
      { name: 'SugarFish Sushi',         merchant: 'SugarFish',    amount: 95.80,  day: 23 },
      { name: 'Alfred Coffee',           merchant: 'Alfred',       amount: 14.50,  day: 25 },
      { name: 'Nobu Restaurant',         merchant: 'Nobu',         amount: 210.00, day: 27 },
      { name: 'The Ivy Restaurant',      merchant: 'The Ivy',      amount: 175.00, day: 29 },
      { name: 'Postmates',               merchant: 'Postmates',    amount: 58.00,  day: 30 },
    ]
    const restaurantCount = Math.min(Math.round(8 * sf), restaurants.length)
    for (let r = 0; r < restaurantCount; r++) {
      const rest     = restaurants[r]
      const restDate = dt(year, month, clampDay(year, month, rest.day))
      if (!isPast(restDate)) continue
      allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId(`rest${r}`, year, month),
        amount: fuzz(rest.amount, Math.ceil(rest.amount * 0.12), mi + r),
        currency_code: 'USD',
        name: rest.name, merchant_name: rest.merchant,
        category_id: CATS.food, plaid_category: ['Food and Drink', 'Restaurants'],
        transaction_date: restDate, pending: false, is_recurring: false,
      })
    }

    // ── Transport ────────────────────────────────────────────────────────────

    // Car loan payment
    const carLoanDate = dt(year, month, clampDay(year, month, 3))
    if (isPast(carLoanDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('car', year, month),
      amount: 680.00, currency_code: 'USD',
      name: 'BMW Financial Services', merchant_name: 'BMW Financial',
      category_id: CATS.transport, plaid_category: ['Payment', 'Auto Loan'],
      transaction_date: carLoanDate, pending: false, is_recurring: true,
    })

    // Gas (premium fuel — 2×/month)
    if (isPast(dt(year, month, 8))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('gas1', year, month),
      amount: fuzz(95, 15, mi * 2), currency_code: 'USD',
      name: 'Shell Gas Station', merchant_name: 'Shell',
      category_id: CATS.transport, plaid_category: ['Travel', 'Gas Stations'],
      transaction_date: dt(year, month, 8), pending: false, is_recurring: false,
    })

    const gas2Date = dt(year, month, clampDay(year, month, 22))
    if (isPast(gas2Date)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('gas2', year, month),
      amount: fuzz(88, 14, mi * 2 + 1), currency_code: 'USD',
      name: 'Chevron', merchant_name: 'Chevron',
      category_id: CATS.transport, plaid_category: ['Travel', 'Gas Stations'],
      transaction_date: gas2Date, pending: false, is_recurring: false,
    })

    // Rideshare (2–3× per month)
    const uberDate = dt(year, month, clampDay(year, month, 17))
    if (isPast(uberDate)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('uber', year, month),
      amount: fuzz(38, 18, mi * 3), currency_code: 'USD',
      name: 'Uber', merchant_name: 'Uber',
      category_id: CATS.transport, plaid_category: ['Travel', 'Ride Share'],
      transaction_date: uberDate, pending: false, is_recurring: false,
    })

    // Airport parking / tolls quarterly
    if ([3, 6, 9, 12].includes(month) && isPast(dt(year, month, 14))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('toll', year, month),
      amount: fuzz(55, 20, mi * 9), currency_code: 'USD',
      name: 'LAX Airport Parking', merchant_name: 'LAX Parking',
      category_id: CATS.transport, plaid_category: ['Travel', 'Parking'],
      transaction_date: dt(year, month, 14), pending: false, is_recurring: false,
    })

    // ── Entertainment ─────────────────────────────────────────────────────────

    const movieDate = dt(year, month, clampDay(year, month, 11))
    if (isPast(movieDate)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('mov', year, month),
      amount: Math.round(fuzz(48, 12, mi) * sf * 100) / 100,
      currency_code: 'USD',
      name: 'ArcLight Cinemas', merchant_name: 'ArcLight',
      category_id: CATS.entertainment, plaid_category: ['Entertainment', 'Cinema'],
      transaction_date: movieDate, pending: false, is_recurring: false,
    })

    // Live events / concerts — most months
    if (mi % 3 !== 0) {
      const eventDate = dt(year, month, clampDay(year, month, 19))
      if (isPast(eventDate)) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('evnt', year, month),
        amount: fuzz(185, 80, mi * 4), currency_code: 'USD',
        name: 'StubHub', merchant_name: 'StubHub',
        category_id: CATS.entertainment, plaid_category: ['Entertainment', 'Music'],
        transaction_date: eventDate, pending: false, is_recurring: false,
      })
    }

    // Sports / golf — quarterly
    if ([4, 7, 10, 1].includes(month)) {
      const golfDate = dt(year, month, clampDay(year, month, 16))
      if (isPast(golfDate)) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('golf', year, month),
        amount: fuzz(220, 60, mi * 5), currency_code: 'USD',
        name: 'Riviera Country Club', merchant_name: 'Riviera CC',
        category_id: CATS.entertainment, plaid_category: ['Entertainment', 'Sports'],
        transaction_date: golfDate, pending: false, is_recurring: false,
      })
    }

    // ── Shopping ──────────────────────────────────────────────────────────────

    // Amazon (2× per month)
    const amzn1Amt  = month === 12 ? fuzz(380, 80, mi) : fuzz(120, 45, mi)
    if (isPast(dt(year, month, 4))) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('amz1', year, month),
      amount: amzn1Amt, currency_code: 'USD',
      name: 'Amazon.com', merchant_name: 'Amazon',
      category_id: CATS.shopping, plaid_category: ['Shops', 'Digital Purchase'],
      transaction_date: dt(year, month, 4), pending: false, is_recurring: false,
    })

    const amzn2Amt = month === 12 ? fuzz(250, 60, mi + 1) : fuzz(85, 30, mi + 1)
    const amzn2Date = dt(year, month, clampDay(year, month, 18))
    if (isPast(amzn2Date)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('amz2', year, month),
      amount: amzn2Amt, currency_code: 'USD',
      name: 'Amazon.com', merchant_name: 'Amazon',
      category_id: CATS.shopping, plaid_category: ['Shops', 'Digital Purchase'],
      transaction_date: amzn2Date, pending: false, is_recurring: false,
    })

    // High-end clothing — bi-monthly
    if (mi % 2 === 1) {
      const clothingMerchants = ['Nordstrom', 'Saks Fifth Avenue', 'AllSaints', 'Suits Supply', 'Bloomingdales']
      const merchant = clothingMerchants[mi % clothingMerchants.length]
      const clothDate = dt(year, month, clampDay(year, month, 24))
      if (isPast(clothDate)) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('clth', year, month),
        amount: fuzz(340, 120, mi * 6), currency_code: 'USD',
        name: merchant, merchant_name: merchant,
        category_id: CATS.shopping, plaid_category: ['Shops', 'Clothing and Accessories'],
        transaction_date: clothDate, pending: false, is_recurring: false,
      })
    }

    // Home goods / Restoration Hardware bi-monthly
    if (mi % 2 === 0) {
      const homeDate = dt(year, month, clampDay(year, month, 21))
      if (isPast(homeDate)) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('home', year, month),
        amount: fuzz(280, 120, mi * 8), currency_code: 'USD',
        name: 'Restoration Hardware', merchant_name: 'RH',
        category_id: CATS.shopping, plaid_category: ['Shops', 'Home Furnishings'],
        transaction_date: homeDate, pending: false, is_recurring: false,
      })
    }

    // Dec: holiday spending spree
    if (month === 12) {
      if (isPast(dt(year, month, 10))) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('bby', year, month),
        amount: fuzz(650, 150, mi * 9), currency_code: 'USD',
        name: 'Apple Store', merchant_name: 'Apple',
        category_id: CATS.electronics, plaid_category: ['Electronics', 'Electronics Stores'],
        transaction_date: dt(year, month, 10), pending: false, is_recurring: false,
      })
      if (isPast(dt(year, month, 16))) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('bst', year, month),
        amount: fuzz(480, 100, mi * 11), currency_code: 'USD',
        name: 'Best Buy', merchant_name: 'Best Buy',
        category_id: CATS.electronics, plaid_category: ['Electronics', 'Electronics Stores'],
        transaction_date: dt(year, month, 16), pending: false, is_recurring: false,
      })
    }

    // ── Healthcare ────────────────────────────────────────────────────────────

    // Quarterly specialist visit
    if ([3, 6, 9, 12].includes(month)) {
      const coPayDate = dt(year, month, clampDay(year, month, 15))
      if (isPast(coPayDate)) allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('copay', year, month),
        amount: fuzz(55, 15, mi * 8), currency_code: 'USD',
        name: 'Cedars-Sinai Medical Group', merchant_name: 'Cedars-Sinai',
        category_id: CATS.healthcare, plaid_category: ['Healthcare', 'Doctors and Clinics'],
        transaction_date: coPayDate, pending: false, is_recurring: false,
      })
    }

    // Pharmacy monthly
    const cvsDate = dt(year, month, clampDay(year, month, 12))
    if (isPast(cvsDate)) allTx.push({
      user_id: userId, account_id: ID.credit,
      plaid_transaction_id: txId('cvs', year, month),
      amount: fuzz(48, 12, mi * 7), currency_code: 'USD',
      name: 'CVS Pharmacy', merchant_name: 'CVS',
      category_id: CATS.healthcare, plaid_category: ['Healthcare', 'Pharmacies'],
      transaction_date: cvsDate, pending: false, is_recurring: false,
    })

    // Personal trainer — monthly
    const ptDate = dt(year, month, clampDay(year, month, 7))
    if (isPast(ptDate)) allTx.push({
      user_id: userId, account_id: ID.checking,
      plaid_transaction_id: txId('pt', year, month),
      amount: 320.00, currency_code: 'USD',
      name: 'Personal Training — Jordan R.', merchant_name: 'Zelle',
      category_id: CATS.healthcare, plaid_category: ['Healthcare', 'Fitness'],
      transaction_date: ptDate, pending: false, is_recurring: true,
    })

    // ── Debt payments ─────────────────────────────────────────────────────────

    // Credit card full payment monthly
    const ccPayDate = dt(year, month, clampDay(year, month, 22))
    if (isPast(ccPayDate)) {
      const ccAmt = fuzz(4800, 600, mi * 4)
      allTx.push({
        user_id: userId, account_id: ID.checking,
        plaid_transaction_id: txId('ccpay', year, month),
        amount: ccAmt, currency_code: 'USD',
        name: 'Chase Sapphire Payment', merchant_name: 'Chase',
        category_id: CATS.other, plaid_category: ['Payment', 'Credit Card'],
        transaction_date: ccPayDate, pending: false, is_recurring: true,
      })
      allTx.push({
        user_id: userId, account_id: ID.credit,
        plaid_transaction_id: txId('ccpay-cr', year, month),
        amount: -ccAmt, currency_code: 'USD',
        name: 'Payment Received - Thank You', merchant_name: 'Chase',
        category_id: CATS.other, plaid_category: ['Payment', 'Credit Card'],
        transaction_date: ccPayDate, pending: false, is_recurring: true,
      })
    }
  }

  const safeTx = allTx.filter(tx => isPast(tx.transaction_date))
  console.log(`  Generated ${safeTx.length} transactions across ${months.length} months`)

  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < safeTx.length; i += BATCH) {
    const { error } = await supabase.from('transactions').insert(safeTx.slice(i, i + BATCH))
    if (error) throw new Error(`Transaction batch ${Math.floor(i/BATCH)}: ${error.message}`)
    inserted += Math.min(BATCH, safeTx.length - i)
    process.stdout.write(`\r  Inserting… ${inserted}/${safeTx.length}`)
  }
  console.log(`\n  ✓ All transactions inserted\n`)

  // ── 8. Savings goals ──────────────────────────────────────────────────────
  console.log('→ Creating savings goals…')
  const { error: goalsErr } = await supabase.from('savings_goals').insert([
    {
      id: ID.goalEmergency, user_id: userId,
      name: 'Emergency Fund',
      target_amount: 50000.00, current_amount: 45200.00,
      allocation_pct: 0,
      allocation_locked: false,
      priority: 1, color: '#1a6b3a',
      target_date: '2026-07-01', is_active: true,
    },
    {
      id: ID.goalTravel, user_id: userId,
      name: 'Europe & Japan Trip',
      target_amount: 18000.00, current_amount: 9200.00,
      allocation_pct: 8,
      allocation_locked: false,
      priority: 2, color: '#4c49c9',
      target_date: '2026-09-01', is_active: true,
    },
    {
      id: ID.goalCar, user_id: userId,
      name: 'Tesla Model S Down Payment',
      target_amount: 25000.00, current_amount: 18000.00,
      allocation_pct: 10,
      allocation_locked: false,
      priority: 3, color: '#ff9817',
      target_date: '2026-12-01', is_active: true,
    },
    {
      id: ID.goalHome, user_id: userId,
      name: 'Second Property Down Payment',
      target_amount: 150000.00, current_amount: 38000.00,
      allocation_pct: 12,
      allocation_locked: false,
      priority: 4, color: '#c92049',
      target_date: '2028-06-01', is_active: true,
    },
    {
      id: ID.goalEducation, user_id: userId,
      name: "Kids' Education Fund (529)",
      target_amount: 200000.00, current_amount: 28500.00,
      allocation_pct: 15,
      allocation_locked: false,
      priority: 5, color: '#0991c9',
      target_date: '2034-08-01', is_active: true,
    },
  ])
  if (goalsErr) throw new Error(`Savings goals: ${goalsErr.message}`)
  console.log('  ✓ 5 savings goals\n')

  // ── 9. Investment allocation ──────────────────────────────────────────────
  console.log('→ Setting investment allocation…')
  const { error: investErr } = await supabase.from('investment_allocations').insert({
    user_id: userId,
    allocation_pct: 25,
    risk_profile: 'aggressive',
    allocation_locked: false,
  })
  if (investErr) throw new Error(`Investment allocation: ${investErr.message}`)
  console.log('  ✓ 25% / aggressive\n')

  // ── 10. Budget limits ─────────────────────────────────────────────────────
  console.log('→ Setting budget limits…')
  const budgetRows = [
    { category: CATS.housing,        monthly: 7000  },
    { category: CATS.food,           monthly: 2000  },
    { category: CATS.transport,      monthly: 1200  },
    { category: CATS.subscriptions,  monthly: 400   },
    { category: CATS.utilities,      monthly: 450   },
    { category: CATS.entertainment,  monthly: 800   },
    { category: CATS.shopping,       monthly: 1500  },
    { category: CATS.healthcare,     monthly: 600   },
    { category: CATS.other,          monthly: 1000  },
  ].filter(r => r.category)

  const { error: budgetErr } = await supabase.from('budget_limits').insert(
    budgetRows.map(r => ({
      user_id: userId, category_id: r.category,
      monthly_limit: r.monthly, period: 'monthly',
    }))
  )
  if (budgetErr) throw new Error(`Budget limits: ${budgetErr.message}`)
  console.log(`  ✓ ${budgetRows.length} budget limits\n`)

  // ── 11. Allocation transfers ──────────────────────────────────────────────
  console.log('→ Adding allocation transfer history…')
  const transferRows = []
  for (const { year, month } of months) {
    const d1  = dt(year, month, clampDay(year, month, 2))
    const d15 = dt(year, month, clampDay(year, month, 16))
    if (!isPast(d1)) continue

    transferRows.push({
      user_id: userId, type: 'auto_allocation',
      amount: 600.00,
      description: 'Auto-allocation → Europe & Japan Trip',
      related_goal_id: ID.goalTravel,
      created_at: `${d1}T10:00:00Z`,
    })

    transferRows.push({
      user_id: userId, type: 'auto_allocation',
      amount: 750.00,
      description: 'Auto-allocation → Tesla Down Payment',
      related_goal_id: ID.goalCar,
      created_at: `${d1}T10:05:00Z`,
    })

    if (!isPast(d15)) continue

    transferRows.push({
      user_id: userId, type: 'auto_allocation',
      amount: 900.00,
      description: 'Auto-allocation → Second Property Fund',
      related_goal_id: ID.goalHome,
      created_at: `${d15}T10:00:00Z`,
    })

    transferRows.push({
      user_id: userId, type: 'auto_allocation',
      amount: 1125.00,
      description: "Auto-allocation → Kids' 529 Fund",
      related_goal_id: ID.goalEducation,
      created_at: `${d15}T10:05:00Z`,
    })

    transferRows.push({
      user_id: userId, type: 'investment',
      amount: 1875.00,
      description: 'Auto-invest → Fidelity Brokerage (25%)',
      related_goal_id: null,
      created_at: `${d15}T11:00:00Z`,
    })
  }

  const { error: txfrErr } = await supabase.from('allocation_transfers').insert(transferRows)
  if (txfrErr) throw new Error(`Allocation transfers: ${txfrErr.message}`)
  console.log(`  ✓ ${transferRows.length} allocation transfers\n`)

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║   ✓  Demo seed complete!                  ║')
  console.log('╚═══════════════════════════════════════════╝')
  console.log()
  console.log('  Login at http://localhost:3000/login')
  console.log(`  Email   : ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
  console.log()
  console.log('  Profile snapshot:')
  console.log('  ┌──────────────────────────────────────────┐')
  console.log('  │ Monthly income    ~$19,300               │')
  console.log('  │ Monthly spending  ~$8,500                │')
  console.log('  │ Net cash flow     ~$10,800               │')
  console.log('  │ Checking          $42,800                │')
  console.log('  │ Savings           $95,400                │')
  console.log('  │ Brokerage         $185,600               │')
  console.log('  │ Retirement 401k   $142,300               │')
  console.log('  │ Total assets      $466,100               │')
  console.log('  │ Total debt        $513,500 (mortgage)    │')
  console.log('  │ Savings goals     5 active               │')
  console.log('  │ History           15 months              │')
  console.log('  └──────────────────────────────────────────┘')
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
