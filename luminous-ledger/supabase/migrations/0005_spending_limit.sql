-- ============================================================
-- Migration 0005: User Spending Limits
-- Overall spending limit per user (not category-specific)
-- ============================================================

-- ── user_spending_limits ─────────────────────────────────────
create table public.user_spending_limits (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references public.users(id) on delete cascade,
  amount          numeric(12,2) not null,
  period          text          not null default 'monthly'
                  check (period in ('monthly', 'yearly')),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now(),
  constraint user_spending_limits_unique_user unique (user_id)
);

create index user_spending_limits_user_idx on public.user_spending_limits(user_id);

alter table public.user_spending_limits enable row level security;

create policy "Users can manage own spending limit"
  on public.user_spending_limits for all
  using (auth.uid() = user_id);
