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
