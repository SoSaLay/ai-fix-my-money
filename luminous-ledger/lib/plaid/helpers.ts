// Map Plaid's category arrays to our internal budget_categories names

const PLAID_CATEGORY_MAP: Record<string, string> = {
  'Food and Drink':        'Food & Dining',
  'Restaurants':           'Food & Dining',
  'Travel':                'Transport',
  'Transportation':        'Transport',
  'Shops':                 'Shopping',
  'Healthcare':            'Healthcare',
  'Medical':               'Healthcare',
  'Entertainment':         'Entertainment',
  'Service':               'Subscriptions',
  'Bank Fees':             'Other',
  'Transfer':              'Other',
  'Payment':               'Other',
  'Utilities':             'Utilities',
  'Electronics':           'Electronics',
  'Mortgage and Rent':     'Housing',
  'Rent':                  'Housing',
}

export function mapPlaidCategory(plaidCategories: string[]): string {
  for (const cat of plaidCategories) {
    if (PLAID_CATEGORY_MAP[cat]) return PLAID_CATEGORY_MAP[cat]
  }
  return 'Other'
}

export function formatAccountType(type: string, subtype: string | null): string {
  const sub = subtype ?? ''
  const map: Record<string, string> = {
    'checking':    'Checking',
    'savings':     'Savings',
    'credit card': 'Credit Card',
    'money market':'Money Market',
    'cd':          'CD',
  }
  return map[sub.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1))
}
