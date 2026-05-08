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
