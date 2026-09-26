// ============================================================================
// Jane Doe — the example profile behind the "What can I unlock?" preview.
//
// A single American earning $100K a year, a few years into a career. Every
// figure is monthly and meant to look like an ordinary household, not a model
// one: a car payment, student loans, a couple of credit cards, the usual
// streaming services, and a savings rate that is good rather than heroic.
//
// Income is take-home. $100K gross is about $8,333 a month; after federal and
// state tax, FICA, health insurance and a 6% pre-tax 401(k) contribution, a
// paycheck lands near $5,900. The 401(k) is therefore already paid for and
// shows up only as a balance, while the Roth IRA — funded from take-home — is
// what the Investing page allocates to.
// ============================================================================

import type { FinancialSeed } from '@/contexts/financial-data-context'

const CREATED = '2026-01-05T00:00:00.000Z'

export const DEMO_NAME = 'Jane Doe'

export const DEMO_PROFILE: FinancialSeed = {
  profile: {
    income: {
      total_monthly: 0,
      sources: [
        { name: 'Salary (take-home)', amount: 5900 },
        { name: 'Freelance design', amount: 300 },
      ],
    },
    expenses_fixed: [
      { name: 'Rent', category: 'Housing', amount: 1850 },
      { name: 'Car payment', category: 'Transportation', amount: 475 },
      { name: 'Student loan payment', category: 'Debt', amount: 310 },
      { name: 'Utilities', category: 'Utilities', amount: 140 },
      { name: 'Car insurance', category: 'Insurance', amount: 140 },
      { name: 'Verizon (phone)', category: 'Utilities', amount: 75 },
      { name: 'Xfinity (internet)', category: 'Utilities', amount: 70 },
      { name: 'Gym membership', category: 'Health', amount: 25 },
      { name: 'Netflix', category: 'Subscriptions', amount: 17.99 },
      { name: 'Disney+ / Hulu bundle', category: 'Subscriptions', amount: 16.99 },
      { name: 'Amazon Prime', category: 'Subscriptions', amount: 14.99 },
      { name: 'Spotify', category: 'Subscriptions', amount: 11.99 },
    ],
    expenses_variable: [
      { category: 'Groceries', amount: 450 },
      { category: 'Dining out & takeout', amount: 300 },
      { category: 'Shopping', amount: 200 },
      { category: 'Gas', amount: 160 },
      { category: 'Entertainment', amount: 100 },
      { category: 'Personal care', amount: 60 },
    ],
    accounts: [
      { name: 'Chase Total Checking', type: 'Checking', balance: 4250, institution: 'Chase' },
      { name: 'Ally High-Yield Savings', type: 'High-yield savings', balance: 11400, institution: 'Ally Bank' },
      { name: 'Workplace 401(k)', type: '401(k)', balance: 48600, institution: 'Fidelity' },
      { name: 'Roth IRA', type: 'Roth IRA', balance: 21300, institution: 'Vanguard' },
      { name: 'Individual brokerage', type: 'Brokerage', balance: 6800, institution: 'Robinhood' },
      { name: 'Sapphire Preferred', type: 'Credit card', balance: 1840, limit: 15000, institution: 'Chase' },
      { name: 'Blue Cash Everyday', type: 'Credit card', balance: 620, limit: 8000, institution: 'American Express' },
      { name: 'Federal student loans', type: 'Student loan', balance: 18400, institution: 'Nelnet' },
      { name: 'Auto loan', type: 'Auto loan', balance: 14200, institution: 'Toyota Financial Services' },
    ],
    summary: { total_income: 0, total_expenses: 0, monthly_savings: 0, savings_rate: 0 },
    imported_at: CREATED,
  },

  spendingLimit: {
    id: 'demo_limit',
    amount: 4500,
    period: 'monthly',
    created_at: CREATED,
    updated_at: CREATED,
  },

  // Percentages are of monthly income, as everywhere else in the app.
  savingsGoals: [
    { name: 'Emergency fund (6 months)', target_amount: 18000, current_amount: 11400, allocation_pct: 5, priority: 1 },
    { name: 'House down payment', target_amount: 60000, current_amount: 14500, allocation_pct: 3, priority: 2 },
    { name: 'Trip to Japan', target_amount: 5000, current_amount: 1800, allocation_pct: 2, priority: 3 },
  ].map((g, i) => ({
    ...g,
    id: `demo_goal_${i + 1}`,
    user_id: 'demo',
    is_active: true,
    created_at: CREATED,
    updated_at: CREATED,
  })),

  generalSavingsPct: 2,

  investingGoal: {
    id: 'demo_investing',
    user_id: 'demo',
    allocation_pct: 13,
    risk_profile: 'conservative',
    categories: { retirement: 8, etfs: 3, stocks: 1, crypto: 1 },
    custom: [],
    created_at: CREATED,
    updated_at: CREATED,
  },
}
