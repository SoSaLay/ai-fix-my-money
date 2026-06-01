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
