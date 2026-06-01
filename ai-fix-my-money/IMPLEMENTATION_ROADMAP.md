# 🚀 Luminous Ledger - Implementation Roadmap

**Last Updated:** April 5, 2026
**Goal:** Integrate Clerk authentication and Plaid API for real user data

---

## 📊 Progress Overview

- **Phase 1:** Environment Setup - `4/4 tasks` ✅ **COMPLETE**
- **Phase 2:** Plaid Integration - `8/8 tasks` ✅ **COMPLETE**
- **Phase 3:** Goals & Budgets - `6/6 tasks` ✅ **COMPLETE**
- **Phase 4:** UI Data Integration - `7/7 tasks` ✅ **COMPLETE**
- **Phase 5:** Plaid Link Flow - `0/5 tasks`
- **Phase 6:** Webhooks & Sync - `0/5 tasks`
- **Phase 7:** Testing & Polish - `0/8 tasks`
- **Phase 8:** Advanced Features - `0/6 tasks` (Optional)
- **Bonus:** AI-Powered Investing Advisor - `0/6 tasks` (Optional)

**Total Progress:** `25/49 tasks completed` (51%)

---

## Phase 1: Environment Setup & Configuration ⚙️ ✅ **COMPLETE**

**Goal:** Configure Plaid sandbox and Supabase credentials

### 1.1 Get Plaid Developer Account
- [x] Sign up at https://dashboard.plaid.com/signup
- [x] Verify email and complete account setup
- [x] Navigate to Team Settings → Keys
- [x] Copy `client_id` and `sandbox` secret
- [x] **Store credentials securely** (do not commit to git)




### 1.2 Get Supabase Credentials
- [x] Log into Supabase dashboard
- [x] Navigate to Project Settings → API
- [x] Copy `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
- [x] Copy `anon/public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [x] Copy `service_role` key (SUPABASE_SERVICE_ROLE_KEY)

### 1.3 Create Environment File
- [x] Create `.env.local` in project root
- [x] Add all required environment variables (✅ Complete with actual credentials)
- [x] Verify `.env.local` is in `.gitignore`

### 1.4 Test Configuration
- [x] Run `npm run dev` and verify no environment errors
- [x] Test login/signup flow works with Supabase
- [x] Database migrations executed (all tables created in Supabase)
- [x] Fixed TypeScript compilation errors
- [x] Check middleware allows access to protected routes after login

---

## Phase 2: Complete Plaid Integration 🏦 ✅ **COMPLETE**

**Goal:** Sync accounts, balances, transactions, and debts from Plaid

### 2.1 Enhanced Token Exchange ✅
**File:** `/app/api/plaid/exchange-token/route.ts`

- [x] After token exchange, fetch accounts via `plaidClient.accountsGet()`
- [x] Store accounts in `accounts` table with:
  - [x] account name, type, subtype, mask
  - [x] current_balance, available_balance
  - [x] currency_code
  - [x] Reference to plaid_item_id
- [x] Handle account sync errors gracefully
- [x] Return account count in response

### 2.2 Create Accounts Sync Endpoint ✅
**File:** `/app/api/plaid/sync-accounts/route.ts` (NEW)

- [x] Create new POST endpoint
- [x] Authenticate user via Supabase
- [x] Fetch all active plaid_items for user
- [x] For each item:
  - [x] Call `plaidClient.accountsBalanceGet()`
  - [x] Update balances in `accounts` table
- [x] Return updated account count
- [x] Add error handling and logging

### 2.3 Fix Transaction Sync ✅
**File:** `/app/api/plaid/sync-transactions/route.ts`

- [x] Fix account_id mapping (currently using Plaid ID instead of DB UUID)
  - [x] Query accounts table to get DB UUID from plaid_account_id
  - [x] Map Plaid account_id → database account UUID
- [x] Improve category mapping
  - [x] Use personal_finance_category when available
  - [x] Fall back to category array
  - [x] Store first category in plaid_category array
- [x] Add recurring transaction detection
  - [x] Check if transaction has recurring_stream_id
  - [x] Set is_recurring flag appropriately
- [x] Test with sandbox transactions

### 2.4 Add Liabilities Support ✅
**File:** `/app/api/plaid/sync-liabilities/route.ts` (NEW)

- [x] Create new POST endpoint for liabilities
- [x] Call `plaidClient.liabilitiesGet()` for each item
- [x] Store credit card data:
  - [x] Current balance (amount owed)
  - [x] Minimum payment due
  - [x] Due date
  - [x] APR (if available)
- [x] Store loan data (mortgage, student, auto):
  - [x] Principal balance
  - [x] Interest rate
  - [x] Next payment due date
  - [x] Monthly payment amount
- [x] Decide on schema: separate `debts` table or flag in `accounts`?
- [x] Implement chosen schema and store debt data
- [x] Return debt summary in response

### 2.5 Create Unified Sync Endpoint ✅
**File:** `/app/api/plaid/sync-all/route.ts` (NEW)

- [x] Create POST endpoint that triggers all syncs
- [x] Call sync-accounts internally
- [x] Call sync-transactions internally
- [x] Call sync-liabilities internally
- [x] Return combined summary of all synced data
- [x] Add to "Refresh" button in UI

---

## Phase 3: Goals & Budgets Backend 🎯 ✅ **COMPLETE**

**Goal:** CRUD operations for spending limits and goals

### 3.1 Review Existing Schema ✅
**File:** `/supabase/migrations/0002_budget_tables.sql`, `0003_savings_tables.sql`

- [x] Review budget_categories table structure
- [x] Review budget_periods table structure
- [x] Determine if schema supports:
  - [x] Monthly spending limits
  - [x] Monthly savings goals
  - [x] Monthly investing goals
- [x] Add migrations if schema changes needed (Created `0005_spending_limit.sql`)

### 3.2 Spending Limit Endpoints ✅
**Files:** `/app/api/v1/budget/spending-limit/route.ts` (NEW)

- [x] Create `POST /api/v1/budget/spending-limit`
  - [x] Accept: `{ amount: number, period: 'monthly' | 'yearly' }`
  - [x] Store in database linked to user
  - [x] Validate amount is positive
  - [x] Return created/updated limit
- [x] Create `GET /api/v1/budget/spending-limit`
  - [x] Fetch current spending limit for user
  - [x] Calculate current spending in period
  - [x] Return limit, spent, remaining, percentage
- [x] Create `DELETE /api/v1/budget/spending-limit`
  - [x] Remove spending limit for user

### 3.3 Savings Goal Endpoints ✅
**Files:** `/app/api/v1/goals/savings/route.ts`, `/app/api/v1/goals/savings/[id]/route.ts` (NEW)

- [x] Create `POST /api/v1/goals/savings`
  - [x] Accept: `{ amount: number, period: 'monthly' | 'yearly', name?: string }`
  - [x] Store goal in database
  - [x] Return created goal
- [x] Create `GET /api/v1/goals/savings`
  - [x] Fetch all active savings goals
  - [x] Calculate progress towards each goal
  - [x] Return goals with progress data
- [x] Create `PUT /api/v1/goals/savings/:id`
  - [x] Update existing goal
- [x] Create `DELETE /api/v1/goals/savings/:id`
  - [x] Soft delete or archive goal

### 3.4 Investing Goal Endpoints ✅
**Files:** `/app/api/v1/goals/investing/route.ts` (NEW)

- [x] Create `POST /api/v1/goals/investing`
  - [x] Accept: `{ allocation_pct: number, riskLevel?: string }`
  - [x] Store goal in database
  - [x] Return created goal
- [x] Create `GET /api/v1/goals/investing`
  - [x] Fetch active investing goals
  - [x] Return goals with allocation data
- [x] Create `PUT /api/v1/goals/investing/:id` (via POST upsert)
  - [x] Update existing goal
- [x] Create `DELETE /api/v1/goals/investing/:id`
  - [x] Remove goal

### 3.5 Dashboard Summary Endpoint ✅
**File:** `/app/api/v1/dashboard/summary/route.ts` (NEW)

- [x] Enhance existing endpoint (if exists) or create new one
- [x] Return aggregated data:
  - [x] Monthly spending vs. limit
  - [x] Savings goal progress
  - [x] Investing goal progress
  - [x] Net cash flow
  - [x] Total assets
  - [x] Total debts
- [x] Optimize with single query where possible
- [x] Add caching for performance

---

## Phase 4: Replace Mock Data with Real API Calls 🔄 ✅ **COMPLETE**

**Goal:** Connect all UI pages to real backend data

### 4.1 Create Data Fetching Hooks ✅
**File:** `/hooks/use-data.ts` (NEW)

- [x] Create `useAccounts()` hook
  - [x] Fetch from Supabase directly
  - [x] Return accounts, loading state, error
  - [x] Include refresh function
- [x] Create `useDebts()` hook
  - [x] Fetch debt accounts
  - [x] Calculate totals and due dates
  - [x] Return debts, loading, error, refresh
- [x] Create `useTransactions()` hook
  - [x] Accept filters: date range, category, account
  - [x] Fetch paginated transactions
  - [x] Return transactions, loading, error, pagination controls
- [x] Create `useDashboardSummary()` hook
  - [x] Fetch aggregated spending data
  - [x] Return monthly/weekly spending, income, net flow
- [x] Create `useSpendingLimit()`, `useSavingsGoals()`, `useInvestingGoal()` hooks
  - [x] Fetch spending limit
  - [x] Fetch savings goals
  - [x] Fetch investing goals
  - [x] Return all budget data with progress

### 4.2 Update Dashboard Page ✅
**File:** `/app/(app)/dashboard/page.tsx`

- [x] Remove all MOCK constants
- [x] Add `const { data, loading, error } = useDashboardSummary()`
- [x] Add `const { transactions } = useTransactions()`
- [x] Replace hardcoded values with real data
- [x] Add loading skeleton components
  - [x] Skeleton for spending chart
  - [x] Skeleton for financial summary card
  - [x] Skeleton for goal cards
- [x] Add error state UI
  - [x] Show error message
  - [x] Provide retry button
- [x] Handle empty states (no data yet)

### 4.3 Update Accounts Page ✅
**File:** `/app/(app)/accounts/page.tsx`

- [x] Remove MOCK_ACCOUNTS and MOCK_DEBTS
- [x] Add `const { accounts, loading, error, refresh } = useAccounts()`
- [x] Add `const { debts, loading: debtsLoading } = useDebts()`
- [x] Add loading skeletons
- [x] Add error handling
- [x] Add empty state: "No accounts connected yet"
- [ ] Connect Plaid Link button (will be done in Phase 5)
  - [ ] Trigger link flow on click
  - [ ] Call sync-all after successful link
  - [ ] Refresh accounts list

### 4.4 Update Spending Page ✅
**File:** `/app/(app)/spending/page.tsx`

- [x] Remove MOCK data constants
- [x] Add `const { transactions } = useTransactions()`
- [x] Add `const { data: summary } = useDashboardSummary()`
- [x] Add `const { data: spendingLimitData, updateLimit } = useSpendingLimit()`
- [x] Connect circular dial to real data
  - [x] Load current limit on mount
  - [x] Save changes via API on dial change
  - [x] Show save button when changes are made
- [x] Add loading states
- [x] Add empty state: "No transactions yet"

### 4.5 Update Savings Page ✅
**File:** `/app/(app)/savings/page.tsx`

- [x] Remove MOCK data
- [x] Add `const { goals } = useSavingsGoals()`
- [x] Connect allocation dial to real data
- [x] Save allocation changes to API
- [x] Update goals list with real data
- [x] Add loading and error states

### 4.6 Update Investing Page ✅
**File:** `/app/(app)/investing/page.tsx`

- [x] Remove MOCK data
- [x] Add `const { goal, updateGoal } = useInvestingGoal()`
- [x] Connect allocation dial to API
- [x] Save risk level and allocation to DB
- [x] Add loading and error states

### 4.7 Debug Data Loading Issues & Add Error Handling ✅
**Files:** Multiple API endpoints and sync routes

**Issue:** After Phase 4 completion, dashboard, spending, savings, and investing pages showed "error loading data" despite accounts page working correctly.

**Root Causes Identified:**
1. `sync-liabilities` endpoint was using regular `createClient()` instead of `createServiceClient()`, causing RLS policy issues
2. Missing error logging made it difficult to identify which API queries were failing

**Fixes Applied:**
- [x] **Fixed sync-liabilities endpoint** (`/app/api/plaid/sync-liabilities/route.ts`):
  - [x] Changed from `createClient()` to `createServiceClient()` for database operations
  - [x] Now consistent with other sync endpoints (sync-accounts, sync-transactions)
  - [x] Bypasses RLS policies for trusted server-side operations

- [x] **Added comprehensive error logging** to all v1 API endpoints:
  - [x] `/app/api/v1/dashboard/summary/route.ts`
    - [x] Log user ID on fetch start
    - [x] Log each database query result (transactions, accounts, goals)
    - [x] Log errors with detailed error messages
    - [x] Log successful completion
  - [x] `/app/api/v1/budget/spending-limit/route.ts`
    - [x] Log fetch operations
    - [x] Log transaction count
    - [x] Enhanced error messages with specific failure reasons
  - [x] `/app/api/v1/goals/savings/route.ts`
    - [x] Log fetch operations
    - [x] Log goals count
    - [x] Enhanced error messages
  - [x] `/app/api/v1/goals/investing/route.ts`
    - [x] Log fetch operations
    - [x] Log allocation status
    - [x] Enhanced error messages

**Benefits:**
- Easier debugging: Console logs show exactly which query is failing
- Better error messages: Users see specific error reasons instead of generic messages
- Consistent service client usage: All sync endpoints now properly bypass RLS
- Improved observability: Can track API performance and identify bottlenecks

**Next Steps:**
- User should restart dev server and check browser console logs
- Console will show detailed logs for each API call
- Error messages will pinpoint exact failure points
- Once errors are identified, specific fixes can be applied

---

## Phase 5: Plaid Link Flow 🔗

**Goal:** Allow users to connect bank accounts via Plaid Link

### 5.1 Create PlaidLink Component
**File:** `/components/plaid/plaid-link-button.tsx` (NEW)

- [ ] Install `react-plaid-link` if not already: `npm install react-plaid-link`
- [ ] Create component using `usePlaidLink` hook
- [ ] Fetch link token from `/api/plaid/create-link-token`
- [ ] Handle `onSuccess` callback:
  - [ ] Receive public_token
  - [ ] Call `/api/plaid/exchange-token` with token
  - [ ] Trigger `/api/plaid/sync-all`
  - [ ] Show success message
  - [ ] Refresh accounts list
- [ ] Handle `onExit` callback (user closed modal)
- [ ] Handle `onEvent` for analytics (optional)
- [ ] Add loading state while fetching link token
- [ ] Style button to match existing UI

**File:** `/app/(app)/accounts/page.tsx`

- [ ] Import PlaidLinkButton component
- [ ] Replace "Add Account" button with PlaidLinkButton
- [ ] Pass refresh callback to re-fetch accounts after success
- [ ] Show toast notification on success
- [ ] Handle errors from Plaid Link

### 5.3 Add to Onboarding Flow
**File:** `/app/(app)/onboarding/accounts/page.tsx`

- [ ] Review existing onboarding flow
- [ ] Add PlaidLinkButton to accounts step
- [ ] Guide user through bank connection
- [ ] On success:
  - [ ] Mark onboarding step as complete
  - [ ] Update user.onboarding_complete = true
  - [ ] Redirect to dashboard
- [ ] Allow skip (optional) with warning

### 5.4 Test Plaid Link in Sandbox
- [ ] Use Plaid sandbox credentials
- [ ] Test with "First Platypus Bank" (test institution)
- [ ] Use credentials: `user_good` / `pass_good`
- [ ] Verify accounts appear in database
- [ ] Verify transactions sync correctly
- [ ] Test error scenarios (e.g., `user_bad` / `pass_good`)

---

## Phase 6: Real-time Updates & Webhooks 🔔

**Goal:** Keep data fresh with webhooks and manual refresh

### 6.1 Implement Webhook Handler
**File:** `/app/api/plaid/webhook/route.ts`

- [ ] Create POST endpoint for Plaid webhooks
- [ ] Verify webhook signature (Plaid docs)
- [ ] Handle `INITIAL_UPDATE` webhook type
  - [ ] Trigger initial sync of transactions
- [ ] Handle `HISTORICAL_UPDATE` webhook type
  - [ ] Trigger full historical sync
- [ ] Handle `DEFAULT_UPDATE` webhook type
  - [ ] Trigger incremental sync
- [ ] Handle `TRANSACTIONS_REMOVED` webhook type
  - [ ] Remove deleted transactions from DB
- [ ] Handle `ITEM_ERROR` webhook type
  - [ ] Mark plaid_item status as 'error'
  - [ ] Log error for debugging
- [ ] Return 200 OK to Plaid immediately
- [ ] Process webhook asynchronously if needed

### 6.2 Configure Webhook URL
- [ ] For local dev: Install ngrok (`npm install -g ngrok`)
- [ ] Run `ngrok http 3000`
- [ ] Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
- [ ] Add webhook URL in Plaid dashboard:
  - [ ] `https://abc123.ngrok.io/api/plaid/webhook`
- [ ] Test webhook by linking test account
- [ ] For production: Use actual domain webhook URL

### 6.3 Add Manual Sync Buttons
**File:** `/app/(app)/accounts/page.tsx`

- [ ] Add "Sync All" button to accounts page
- [ ] On click, call `/api/plaid/sync-all`
- [ ] Show loading spinner during sync
- [ ] Show success toast with sync summary
- [ ] Refresh accounts and transactions data
- [ ] Display last synced timestamp
  - [ ] Fetch from plaid_items.last_synced_at
  - [ ] Format as "Last synced: 5 minutes ago"

### 6.4 Add Auto-sync Scheduling (Optional)
**File:** `/app/api/cron/sync-plaid/route.ts` (NEW)

- [ ] Create cron job endpoint (Vercel Cron or similar)
- [ ] Trigger sync for all users periodically (e.g., every 6 hours)
- [ ] Add rate limiting to avoid Plaid API limits
- [ ] Log sync results
- [ ] Configure in `vercel.json` or cron service

---

## Phase 7: Testing & Polish ✨

**Goal:** Ensure production-ready quality

### 7.1 End-to-End User Flow Testing
- [ ] **Test Signup Flow:**
  - [ ] Create new account
  - [ ] Verify email verification (if enabled)
  - [ ] Complete onboarding
  - [ ] Link test bank account
  - [ ] View synced data in dashboard
- [ ] **Test Dashboard:**
  - [ ] Verify spending chart displays real data
  - [ ] Check financial summary accuracy
  - [ ] Verify goal cards show correct progress
  - [ ] Test all data refreshes on reload
- [ ] **Test Accounts Page:**
  - [ ] View all linked accounts
  - [ ] View debts section
  - [ ] Verify totals calculate correctly
  - [ ] Test "Add Account" flow
  - [ ] Test manual sync button
- [ ] **Test Spending Page:**
  - [ ] View transaction list
  - [ ] Set spending limit via dial
  - [ ] Verify limit saves to database
  - [ ] Check spending progress bar accuracy
- [ ] **Test Settings:**
  - [ ] Update profile information
  - [ ] Manage connected accounts
  - [ ] Test logout functionality

### 7.2 Add Empty States
- [ ] **No accounts connected:**
  - [ ] Show illustration or icon
  - [ ] Add message: "Connect your first account to get started"
  - [ ] Prominent "Connect Account" CTA button
- [ ] **No transactions:**
  - [ ] Message: "No transactions found. Sync may take a few moments."
  - [ ] Show refresh button
- [ ] **No goals set:**
  - [ ] Message: "Set your first savings goal"
  - [ ] Guide user to set goal
- [ ] **No spending limit:**
  - [ ] Prompt to set spending limit in spending page

### 7.3 Add Loading States
- [ ] **Skeleton loaders:**
  - [ ] Create reusable Skeleton component
  - [ ] Add to dashboard cards
  - [ ] Add to accounts list
  - [ ] Add to transaction table
  - [ ] Add to goals sections
- [ ] **Button loading states:**
  - [ ] Show spinner in "Add Account" during link flow
  - [ ] Show spinner in "Sync" button during refresh
  - [ ] Disable buttons while loading
- [ ] **Page-level loading:**
  - [ ] Add loading.tsx files for route segments
  - [ ] Show full-page loader for initial data fetch

### 7.4 Error Handling
- [ ] **API error display:**
  - [ ] Show user-friendly error messages
  - [ ] Avoid exposing technical details
  - [ ] Add "Try Again" buttons
- [ ] **Network failures:**
  - [ ] Detect offline status
  - [ ] Show "No internet connection" message
  - [ ] Retry automatically when back online
- [ ] **Plaid errors:**
  - [ ] Handle ITEM_LOGIN_REQUIRED (re-authenticate)
  - [ ] Handle INVALID_CREDENTIALS
  - [ ] Show actionable error messages
- [ ] **Form validation:**
  - [ ] Validate spending limit input (positive numbers)
  - [ ] Validate goal amounts
  - [ ] Show inline validation errors

### 7.5 UX Improvements
- [ ] **Success feedback:**
  - [ ] Add toast notifications library (e.g., `sonner`)
  - [ ] Show success toast after account linked
  - [ ] Show success after limit/goal saved
  - [ ] Show sync completion notification
- [ ] **Confirmation dialogs:**
  - [ ] Confirm before deleting account connection
  - [ ] Confirm before deleting goal
  - [ ] Use modal or dialog component
- [ ] **Optimistic updates:**
  - [ ] Update UI immediately when setting limit
  - [ ] Revert on API failure
  - [ ] Show temporary "Saving..." indicator

### 7.6 Accessibility
- [ ] Test keyboard navigation throughout app
- [ ] Ensure all interactive elements are focusable
- [ ] Add ARIA labels to icons and buttons
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Add focus visible styles

### 7.7 Mobile Responsiveness
- [ ] Test dashboard on mobile (320px - 768px)
- [ ] Ensure circular dials work on touch
- [ ] Test Plaid Link modal on mobile
- [ ] Verify tables are scrollable on small screens
- [ ] Test navigation menu on mobile

---

## Phase 8: Advanced Features (Optional) 🚀

**Goal:** Add powerful features to enhance user experience

### 8.1 Smart Recurring Transaction Detection
**File:** `/lib/plaid/recurring-detector.ts` (NEW)

- [ ] Use Plaid's `personal_finance_category_icon_url` as recurring indicator
- [ ] Implement custom algorithm:
  - [ ] Group transactions by merchant name
  - [ ] Detect similar amounts (±10%)
  - [ ] Detect monthly patterns (±3 days)
- [ ] Auto-tag as "subscription" or "recurring"
- [ ] Allow user to confirm/deny recurring status
- [ ] Show dedicated "Subscriptions" section in UI

### 8.2 Budget Alerts & Notifications
**Files:** `/app/api/notifications/*` (NEW)

- [ ] Create notification system:
  - [ ] Send email when 80% of spending limit reached
  - [ ] Send email when spending limit exceeded
  - [ ] Send weekly spending summary
- [ ] Add notification preferences to settings
- [ ] Use email service (Resend, SendGrid, etc.)
- [ ] Create email templates
- [ ] Add unsubscribe functionality

### 8.3 Transaction Search & Filtering
**File:** `/app/(app)/spending/page.tsx`

- [ ] Add search bar for merchant name
- [ ] Add category filter dropdown
- [ ] Add date range picker
- [ ] Add amount range filter (min/max)
- [ ] Add "pending only" toggle
- [ ] Implement filter logic in API
- [ ] Persist filters in URL query params

### 8.4 Data Export
**Files:** `/app/api/export/*` (NEW)

- [ ] Create CSV export endpoint
  - [ ] Export transactions to CSV
  - [ ] Include all relevant fields
  - [ ] Handle date range selection
- [ ] Create PDF report generator
  - [ ] Monthly spending report
  - [ ] Include charts and summaries
  - [ ] Use library like `jsPDF` or `react-pdf`
- [ ] Add export buttons to UI
- [ ] Test with large datasets

### 8.5 Advanced Analytics
**Files:** `/app/(app)/analytics/page.tsx` (NEW)

- [ ] Create dedicated analytics page
- [ ] **Spending by Category Chart:**
  - [ ] Pie chart of top categories
  - [ ] Use Recharts library
- [ ] **Income vs. Expenses Trend:**
  - [ ] Line chart over time
  - [ ] Compare month-over-month
- [ ] **Monthly Comparison:**
  - [ ] Bar chart comparing current vs. previous months
- [ ] **Net Worth Tracking:**
  - [ ] Calculate: Assets - Debts
  - [ ] Show historical trend
- [ ] Add to navigation menu

### 8.6 Multi-currency Support
**Files:** Multiple

- [ ] Add currency selection to user settings
- [ ] Store preferred currency in user profile
- [ ] Convert all amounts to user's currency
- [ ] Use exchange rate API (e.g., exchangerate-api.com)
- [ ] Display amounts with proper currency symbols
- [ ] Support accounts in different currencies

---

## 📝 Notes & Best Practices

### Security Considerations
- **Never expose Plaid access_tokens to frontend**
  - Always stored server-side only
  - Use RLS policies in Supabase
- **Validate all API inputs**
  - Sanitize user inputs
  - Use Zod or similar for validation
- **Rate limiting**
  - Protect API endpoints from abuse
  - Use middleware for rate limiting
- **Environment variables**
  - Never commit .env files
  - Use different credentials per environment

### Performance Optimization
- **Database Indexing:**
  - Ensure indexes on user_id, transaction_date
  - Monitor slow queries in Supabase dashboard
- **API Response Caching:**
  - Cache dashboard summary data (5-10 min)
  - Use SWR or React Query for client-side caching
- **Pagination:**
  - Limit transactions to 50-100 per page
  - Implement infinite scroll or pagination
- **Lazy Loading:**
  - Load transactions on-demand
  - Use React.lazy() for route-based code splitting

### Development Workflow
1. **Branch Strategy:**
   - Create feature branches: `feature/plaid-integration`
   - Use pull requests for code review
2. **Testing:**
   - Test each API endpoint with Postman/Insomnia
   - Write unit tests for critical functions
3. **Commit Messages:**
   - Use conventional commits: `feat:`, `fix:`, `chore:`
4. **Documentation:**
   - Document API endpoints
   - Add JSDoc comments to complex functions

---

## 🎯 Quick Start Checklist

Ready to begin? Start here:

1. ✅ Complete Phase 1 (Environment Setup)
2. ✅ Test login/signup works with Supabase
3. ✅ Complete Phase 2.1 (Enhanced Token Exchange)
4. ✅ Complete Phase 5.1 (Create PlaidLink Component)
5. ✅ Test end-to-end: Signup → Link Bank → View Data
6. ✅ Iterate on remaining phases

---

## 🆘 Troubleshooting

### Common Issues

**Plaid Link won't open:**
- Check PLAID_CLIENT_ID and PLAID_SECRET are set
- Verify link token is generated successfully
- Check browser console for errors

**Accounts not syncing:**
- Verify account_id mapping in sync-transactions
- Check Supabase RLS policies allow inserts
- Review API route logs for errors

**Transactions missing:**
- Ensure cursor is updated in plaid_items table
- Check transaction date range in query
- Verify transactions exist in Plaid sandbox

**Webhook not triggering:**
- Verify ngrok is running (for local dev)
- Check webhook URL is correct in Plaid dashboard
- Review webhook endpoint logs

---

## 📚 Resources

- **Plaid Docs:** https://plaid.com/docs/
- **Plaid API Reference:** https://plaid.com/docs/api/
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Plaid Sandbox Test Credentials:** https://plaid.com/docs/sandbox/test-credentials/

---

## Bonus: AI-Powered Investing Advisor 🤖

**Goal:** Let users ask Claude for personalized investment advice based on their real financial profile — liquidity, risk tolerance, goals, and live market data.

**Architecture overview:** A Next.js API route acts as the agent orchestrator. It pulls the user's financial context from Supabase, loads live market data via tool calls, and streams a structured recommendation back to the UI — no separate Python server or MCP process required in production.

```
User clicks "Get AI Advice"
        ↓
POST /api/ai/invest-advice
        ↓
1. Fetch user context from Supabase
   (net cash flow, risk profile, investable surplus, goals)
        ↓
2. Call Anthropic API (claude-sonnet-4-6) with:
   - System prompt: finance advisor persona + user profile
   - User message: "How should I invest my monthly surplus?"
   - Tools: get_stock_price, get_company_news, get_financials, get_balance_sheet
        ↓
3. Claude reasons, calls tools → your route proxies to financialdatasets.ai
        ↓
4. Claude returns structured allocation recommendation
        ↓
Stream response back to UI
```

### B.1 Create AI Invest Advice Route
**File:** `/app/api/ai/invest-advice/route.ts` (NEW)

- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Create `POST /api/ai/invest-advice`
  - [ ] Authenticate user via Supabase session
  - [ ] Fetch user's dashboard summary (cash flow, surplus, risk profile, goals)
  - [ ] Build system prompt injecting the user's financial snapshot:
    - Monthly net surplus available to invest
    - Risk profile (conservative / moderate / aggressive)
    - Existing investment balance
    - Active savings goals (to avoid over-allocating)
  - [ ] Define Anthropic tool schemas matching the MCP server's capabilities:
    - `get_stock_price(ticker)` → proxies to financialdatasets.ai
    - `get_company_news(ticker)` → proxies to financialdatasets.ai
    - `get_income_statements(ticker, period)` → proxies to financialdatasets.ai
    - `get_balance_sheets(ticker, period)` → proxies to financialdatasets.ai
    - `get_current_crypto_price(ticker)` → proxies to financialdatasets.ai
  - [ ] Run agentic loop: call Claude → execute tool calls → feed results back → repeat until `stop_reason === 'end_turn'`
  - [ ] Stream final text response back to client
  - [ ] Add error handling for API failures and rate limits

### B.2 Create Tool Executor
**File:** `/lib/ai/invest-tools.ts` (NEW)

- [ ] Implement each tool as an async function calling `financialdatasets.ai` directly via `fetch`
- [ ] Accept `FINANCIAL_DATASETS_API_KEY` from env
- [ ] Return typed responses Claude can reason over
- [ ] Add timeout handling (30s per tool call)

### B.3 Add UI Entry Point
**File:** `/app/(app)/investing/page.tsx`

- [ ] Add "Ask AI Advisor" button to the investing page
- [ ] On click, open a slide-over panel or modal
- [ ] Stream the response text into the panel using `ReadableStream`
- [ ] Show a loading indicator while Claude is reasoning
- [ ] Display the final recommendation with clear sections:
  - Summary of user's investable position
  - Suggested allocation breakdown (% by asset class)
  - Specific tickers or ETFs considered with rationale
  - Risk caveats / disclaimer

### B.4 Prompt Engineering
**File:** `/lib/ai/invest-prompt.ts` (NEW)

- [ ] Write a finance advisor system prompt that:
  - States Claude's role as a data-driven investment assistant
  - Instructs Claude to always call market data tools before making recommendations
  - Enforces the user's risk profile as a hard constraint
  - Requires Claude to account for existing savings goals before recommending investment amounts
  - Includes a standard disclaimer: "Not financial advice — for informational purposes only"
- [ ] Incorporate logic from `Awesome-finance-skills`:
  - `alphaear-sentiment`: sentiment signals to avoid momentum traps
  - `alphaear-signal-tracker`: confirm entry signals before recommending a ticker
  - `alphaear-predictor`: validate upside/downside before surfacing a position

### B.5 Environment & Security
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel env vars
- [ ] Add `FINANCIAL_DATASETS_API_KEY` to `.env.local` and Vercel env vars
- [ ] Rate-limit `/api/ai/invest-advice` to prevent runaway API costs (e.g., 5 calls/user/day)
- [ ] Never expose API keys to the browser — all tool calls happen server-side
- [ ] Log token usage per request to monitor costs

### B.6 Example Output Structure

```json
{
  "user_position": {
    "monthly_surplus": 5900,
    "investable_this_month": 1180,
    "risk_profile": "aggressive",
    "current_portfolio": 45200
  },
  "recommendation": {
    "allocation": [
      { "asset": "US Growth ETFs (QQQ, VUG)", "pct": 40, "amount": 472 },
      { "asset": "Individual Tech (NVDA, MSFT)", "pct": 30, "amount": 354 },
      { "asset": "International (VXUS)", "pct": 20, "amount": 236 },
      { "asset": "Crypto (BTC, ETH)", "pct": 10, "amount": 118 }
    ],
    "rationale": "...",
    "disclaimer": "Not financial advice..."
  }
}
```

---

**Happy Building! 🎉**

Track your progress by checking off tasks as you complete them. Update the Progress Overview section to stay motivated!
