# AI Fix My Money — Local Data Guide

## Where your data lives

```
ai-fix-my-money/data/financial-data.json
```

This is the single source of truth for your entire financial dashboard. Perplexity Computer writes to this file directly on your machine — you never need to copy/paste anything.

---

## How Perplexity Computer updates your data

Perplexity Computer is a local AI agent that runs on your machine and has access to your filesystem, browser, and apps. It can read your financial accounts and **write the JSON file directly** without you having to touch it.

### Step 1 — Open Perplexity Computer on your machine

### Step 2 — Go to Import Data → Local Data File in the app

The setup page generates a prompt that contains the **exact absolute path** to your `financial-data.json` on disk and instructs Perplexity Computer to write the file directly.

### Step 3 — Paste the prompt into Perplexity Computer

Perplexity Computer will:
1. Access your financial accounts and investment portfolio
2. Compile the data into the required JSON format
3. Write it directly to the file path shown in the prompt
4. Confirm the file was written

### Step 4 — Click "Refresh Dashboard from File" in the app

The app re-reads the file and your dashboard updates immediately — no reload needed.

---

## How often to update

Run the Perplexity Computer prompt **once a month** to keep your dashboard current. You can also run it any time you want a fresh snapshot — after a big purchase, after your investment portfolio shifts, etc.

---

## Editing the file manually

If you prefer to edit `financial-data.json` directly (or fix a value Perplexity got wrong), open it in any text editor. The structure is:

```json
{
  "_last_updated": "YYYY-MM-DD",
  "income": {
    "total_monthly": 5000,
    "sources": [
      { "name": "Primary Salary", "amount": 4500 },
      { "name": "Freelance", "amount": 500 }
    ]
  },
  "expenses_fixed": [
    { "name": "Rent", "category": "Housing", "amount": 1500 },
    { "name": "Electric", "category": "Utilities", "amount": 80 }
  ],
  "expenses_variable": [
    { "category": "Food & Dining", "amount": 600 },
    { "category": "Shopping", "amount": 200 }
  ],
  "subscriptions": [
    { "name": "Netflix", "amount": 15.99, "frequency": "monthly" },
    { "name": "Spotify", "amount": 10.99, "frequency": "monthly" }
  ],
  "accounts": [
    { "name": "Chase Checking", "type": "checking", "balance": 3200, "institution": "Chase" },
    { "name": "Fidelity Roth IRA", "type": "roth_ira", "balance": 22000, "institution": "Fidelity" },
    { "name": "Visa Credit Card", "type": "credit", "balance": -1200, "institution": "Chase" }
  ],
  "summary": {
    "total_income": 5000,
    "total_expenses": 3595,
    "monthly_savings": 1405,
    "savings_rate": 28
  }
}
```

After saving, click **"Refresh Dashboard from File"** in the app (Import Data → Local Data File) to pull the update in.

---

## Field reference

### `income`
| Field | Type | Description |
|---|---|---|
| `total_monthly` | number | Your total take-home income per month |
| `sources` | array | Each income stream with a name and monthly amount |

### `expenses_fixed`
Recurring, predictable monthly costs.

| Field | Type | Description |
|---|---|---|
| `name` | string | What the expense is (e.g. "Rent", "Electric") |
| `category` | string | One of: Housing, Utilities, Transportation, Insurance, Healthcare |
| `amount` | number | Monthly cost in USD |

### `expenses_variable`
Average monthly spending by category.

| Field | Type | Description |
|---|---|---|
| `category` | string | e.g. "Food & Dining", "Shopping", "Entertainment" |
| `amount` | number | Average monthly spend |

### `subscriptions`
Recurring digital or service subscriptions.

| Field | Type | Description |
|---|---|---|
| `name` | string | Service name (e.g. "Netflix", "Spotify") |
| `amount` | number | Monthly cost — divide annual plans by 12 |
| `frequency` | string | Always `"monthly"` |

### `accounts`
All financial accounts — assets and debts.

| Field | Type | Description |
|---|---|---|
| `name` | string | Your display name for the account |
| `type` | string | See types below |
| `balance` | number | **Positive** for assets, **negative** for debts |
| `institution` | string | Bank or broker name |

**Asset types:** `checking`, `savings`, `money market`, `cd`, `brokerage`, `retirement`, `401k`, `ira`, `roth_ira`

**Debt types:** `credit`, `credit card`, `mortgage`, `auto`, `loan`, `student loan`, `heloc`

### `summary`
Monthly snapshot — the app can compute these, but you can set them explicitly too.

| Field | Type | Description |
|---|---|---|
| `total_income` | number | Same as `income.total_monthly` |
| `total_expenses` | number | Sum of fixed + variable + subscriptions |
| `monthly_savings` | number | `total_income - total_expenses` |
| `savings_rate` | number | `(monthly_savings / total_income) × 100`, as an integer |

---

## Tips

- **Investments**: enter the current market value as the balance, not what you contributed.
- **Credit cards**: enter the current statement balance as a negative number (e.g. `-1200`).
- **Mortgages and loans**: enter the remaining balance owed as a negative number.
- **Annual subscriptions**: divide the annual cost by 12 for the monthly amount.
- **Don't worry about exact cents** — round to the nearest dollar.
