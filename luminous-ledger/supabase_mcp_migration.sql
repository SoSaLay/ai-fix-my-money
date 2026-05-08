-- finance_snapshots: stores the latest Perplexity-written finance snapshot per user.
-- One row per user (upserted on conflict user_id).

create table if not exists finance_snapshots (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null unique,
  data        jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists finance_snapshots_user_updated
  on finance_snapshots (user_id, updated_at desc);

-- RLS: users can only read their own snapshot.
-- Writes happen via service role key (bypasses RLS).
alter table finance_snapshots enable row level security;

create policy "Users can read own snapshot"
  on finance_snapshots
  for select
  using (auth.uid()::text = user_id);
