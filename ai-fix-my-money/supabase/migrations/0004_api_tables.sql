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
