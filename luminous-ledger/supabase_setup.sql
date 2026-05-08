-- ============================================================
-- LUMINOUS LEDGER - COMPLETE DATABASE SETUP
-- Copy this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Migration 0001: Core Schema
-- users, plaid_items, accounts, transactions
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── users ────────────────────────────────────────────────────
create table public.users (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  email                 text        not null unique,
  full_name             text,
  avatar_url            text,
  onboarding_complete   boolean     not null default false,
  onboarding_step       integer     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_email_idx on public.users(email);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-insert user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── plaid_items ──────────────────────────────────────────────
create table public.plaid_items (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users(id) on delete cascade,
  plaid_item_id     text        not null unique,
  access_token      text        not null,
  institution_id    text        not null,
  institution_name  text        not null,
  status            text        not null default 'active'
                    check (status in ('active', 'error', 'disconnected')),
  cursor            text,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index plaid_items_user_id_idx       on public.plaid_items(user_id);
create index plaid_items_plaid_item_id_idx on public.plaid_items(plaid_item_id);

alter table public.plaid_items enable row level security;

-- Access tokens must never be exposed to the browser client
create policy "Users can view own items (no token)"
  on public.plaid_items for select
  using (auth.uid() = user_id);

-- ── accounts ─────────────────────────────────────────────────
create table public.accounts (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references public.users(id) on delete cascade,
  plaid_item_id     uuid          not null references public.plaid_items(id) on delete cascade,
  plaid_account_id  text          not null unique,
  name              text          not null,
  official_name     text,
  type              text          not null,
  subtype           text,
  mask              text,
  currency_code     text          not null default 'USD',
  current_balance   numeric(12,2),
  available_balance numeric(12,2),
  is_selected       boolean       not null default true,
  is_active         boolean       not null default true,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

create index accounts_user_id_idx         on public.accounts(user_id);
create index accounts_plaid_account_id_idx on public.accounts(plaid_account_id);
create index accounts_user_selected_idx   on public.accounts(user_id, is_selected)
  where is_selected = true;

alter table public.accounts enable row level security;

create policy "Users can view own accounts"
  on public.accounts for select using (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update using (auth.uid() = user_id);

-- ── transactions ─────────────────────────────────────────────
create table public.transactions (
  id                      uuid          primary key default gen_random_uuid(),
  user_id                 uuid          not null references public.users(id) on delete cascade,
  account_id              uuid          not null references public.accounts(id) on delete cascade,
  plaid_transaction_id    text          not null unique,
  amount                  numeric(12,2) not null,
  currency_code           text          not null default 'USD',
  name                    text          not null,
  merchant_name           text,
  category_id             uuid,
  plaid_category          text[],
  transaction_date        date          not null,
  authorized_date         date,
  pending                 boolean       not null default false,
  is_recurring            boolean       not null default false,
  recurring_stream_id     uuid,
  notes                   text,
  created_at              timestamptz   not null default now(),
  updated_at              timestamptz   not null default now()
);

create index transactions_user_id_idx      on public.transactions(user_id);
create index transactions_account_id_idx   on public.transactions(account_id);
create index transactions_date_idx         on public.transactions(user_id, transaction_date desc);
create index transactions_pending_idx      on public.transactions(user_id, pending)
  where pending = false;
create index transactions_recurring_idx    on public.transactions(user_id, is_recurring)
  where is_recurring = true;

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update using (auth.uid() = user_id);

-- ============================================================
-- Migration 0002: Budget Tables
-- budget_categories, budget_limits, recurring_streams
-- ============================================================

-- ── budget_categories ────────────────────────────────────────
create table public.budget_categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references public.users(id) on delete cascade,
  name        text        not null,
  icon        text,
  color       text,
  is_income   boolean     not null default false,
  is_system   boolean     not null default false,
  created_at  timestamptz not null default now(),
  constraint budget_categories_unique_user_name unique (user_id, name)
);

create index budget_categories_user_idx   on public.budget_categories(user_id);
create index budget_categories_system_idx on public.budget_categories(is_system)
  where is_system = true;

alter table public.budget_categories enable row level security;

create policy "Users can view system and own categories"
  on public.budget_categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.budget_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.budget_categories for update
  using (auth.uid() = user_id and is_system = false);

create policy "Users can delete own categories"
  on public.budget_categories for delete
  using (auth.uid() = user_id and is_system = false);

-- ── budget_limits ────────────────────────────────────────────
create table public.budget_limits (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references public.users(id) on delete cascade,
  category_id     uuid          not null references public.budget_categories(id) on delete cascade,
  monthly_limit   numeric(10,2) not null,
  daily_limit     numeric(10,2),
  period          text          not null default 'monthly',
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  constraint budget_limits_unique_user_category unique (user_id, category_id)
);

create index budget_limits_user_idx on public.budget_limits(user_id);

alter table public.budget_limits enable row level security;

create policy "Users can manage own budget limits"
  on public.budget_limits for all
  using (auth.uid() = user_id);

-- ── recurring_streams ─────────────────────────────────────────
create table public.recurring_streams (
  id                  uuid          primary key default gen_random_uuid(),
  user_id             uuid          not null references public.users(id) on delete cascade,
  plaid_stream_id     text          unique,
  merchant_name       text          not null,
  category_id         uuid          references public.budget_categories(id),
  average_amount      numeric(10,2) not null,
  frequency           text          not null
                      check (frequency in ('weekly','biweekly','monthly','semi_monthly','annually')),
  last_date           date,
  next_expected_date  date,
  is_active           boolean       not null default true,
  stream_type         text          not null check (stream_type in ('expense','income')),
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

create index recurring_streams_user_idx   on public.recurring_streams(user_id);
create index recurring_streams_active_idx on public.recurring_streams(user_id, is_active)
  where is_active = true;

alter table public.recurring_streams enable row level security;

create policy "Users can manage own recurring streams"
  on public.recurring_streams for all
  using (auth.uid() = user_id);

-- ── Seed system budget categories ─────────────────────────────
insert into public.budget_categories (user_id, name, icon, color, is_income, is_system) values
  (null, 'Income',         '💰', '#1a6b3a', true,  true),
  (null, 'Housing',        '🏠', '#4c49c9', false, true),
  (null, 'Food & Dining',  '🍽️', '#ff9817', false, true),
  (null, 'Transport',      '🚗', '#5a5b60', false, true),
  (null, 'Healthcare',     '❤️', '#ba1a1a', false, true),
  (null, 'Entertainment',  '🎬', '#7c3aed', false, true),
  (null, 'Shopping',       '🛍️', '#db2777', false, true),
  (null, 'Electronics',    '💻', '#0284c7', false, true),
  (null, 'Utilities',      '⚡', '#ca8a04', false, true),
  (null, 'Subscriptions',  '🔄', '#0891b2', false, true),
  (null, 'Other',          '📦', '#acadb1', false, true);

-- ============================================================
-- Migration 0003: Savings & Investment Tables
-- savings_goals, investment_allocations, allocation_transfers
-- ============================================================

-- ── savings_goals ────────────────────────────────────────────
create table public.savings_goals (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references public.users(id) on delete cascade,
  name              text          not null,
  target_amount     numeric(12,2),
  current_amount    numeric(12,2) not null default 0,
  allocation_pct    numeric(5,2)  not null default 0,
  last_quick_select integer       check (last_quick_select in (5, 10, 20, 50)),
  allocation_locked boolean       not null default false,
  locked_at         timestamptz,
  priority          integer       not null default 1,
  color             text,
  is_active         boolean       not null default true,
  target_date       date,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint savings_goals_pct_range check (allocation_pct >= 0 and allocation_pct <= 100)
);

create index savings_goals_user_idx   on public.savings_goals(user_id);
create index savings_goals_active_idx on public.savings_goals(user_id, is_active, priority);

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings goals"
  on public.savings_goals for all
  using (auth.uid() = user_id);

-- ── investment_allocations ───────────────────────────────────
create table public.investment_allocations (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references public.users(id) on delete cascade,
  allocation_pct    numeric(5,2)  not null default 0,
  risk_profile      text          not null default 'moderate'
                    check (risk_profile in ('conservative','moderate','aggressive')),
  allocation_locked boolean       not null default false,
  locked_at         timestamptz,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint investment_pct_range      check (allocation_pct >= 0 and allocation_pct <= 100),
  constraint investment_one_per_user   unique (user_id)
);

create index investment_allocations_user_idx on public.investment_allocations(user_id);

alter table public.investment_allocations enable row level security;

create policy "Users can manage own investment allocation"
  on public.investment_allocations for all
  using (auth.uid() = user_id);

-- ── allocation_transfers ─────────────────────────────────────
create table public.allocation_transfers (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references public.users(id) on delete cascade,
  type            text          not null
                  check (type in ('auto_allocation','interest','manual','investment')),
  amount          numeric(12,2) not null,
  description     text,
  related_goal_id uuid          references public.savings_goals(id) on delete set null,
  created_at      timestamptz   not null default now()
);

create index allocation_transfers_user_idx on public.allocation_transfers(user_id);
create index allocation_transfers_date_idx on public.allocation_transfers(user_id, created_at desc);

alter table public.allocation_transfers enable row level security;

create policy "Users can view own transfers"
  on public.allocation_transfers for select
  using (auth.uid() = user_id);

create policy "Users can insert own transfers"
  on public.allocation_transfers for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Migration 0004: API Infrastructure
-- api_keys, usage_logs
-- No RLS — accessed via service role only
-- ============================================================

-- ── api_keys ─────────────────────────────────────────────────
create table public.api_keys (
  id              uuid        primary key default gen_random_uuid(),
  key             text        not null unique,
  key_prefix      text        not null,
  email           text        not null,
  user_id         uuid        references public.users(id) on delete set null,
  name            text,
  requests_used   integer     not null default 0,
  requests_limit  integer     not null default 10000,
  is_active       boolean     not null default true,
  last_used_at    timestamptz,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,
  constraint api_keys_limit_positive check (requests_limit > 0)
);

create index api_keys_key_idx    on public.api_keys(key);
create index api_keys_email_idx  on public.api_keys(email);
create index api_keys_user_idx   on public.api_keys(user_id);
create index api_keys_active_idx on public.api_keys(is_active) where is_active = true;

-- No RLS: api_keys is only ever touched by the service role in middleware

-- ── usage_logs ───────────────────────────────────────────────
create table public.usage_logs (
  id                uuid        primary key default gen_random_uuid(),
  api_key_id        uuid        not null references public.api_keys(id) on delete cascade,
  endpoint          text        not null,
  method            text        not null,
  status_code       integer     not null,
  response_time_ms  integer,
  ip_address        text,
  user_agent        text,
  created_at        timestamptz not null default now()
);

create index usage_logs_api_key_idx  on public.usage_logs(api_key_id);
create index usage_logs_created_idx  on public.usage_logs(created_at desc);
create index usage_logs_key_date_idx on public.usage_logs(api_key_id, created_at desc);

-- No RLS: usage_logs is append-only via service role

-- ============================================================
-- ✅ SETUP COMPLETE!
-- You should now see all tables in the Table Editor
-- ============================================================
