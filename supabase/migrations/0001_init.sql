-- ============================================================================
-- 0001 — accounts, per-user state, and the quiz record.
--
-- Two shapes, for two reasons.
--
-- `user_state` mirrors the browser storage keys verbatim: one row per user per
-- key, value as jsonb. The app's state shapes (FinancialProfile, ProgressMap,
-- the review queue) move across unchanged, so the client keeps its types and
-- the migration is a transport change rather than a rewrite.
--
-- Everything else is relational, because it is data worth querying: which
-- learner passed what, what the grader actually saw, and which embeds learners
-- report as dead. Those three are the question bank's feedback loop.
--
-- Every table is protected by row-level security. The anon key ships in the
-- browser by design, so RLS is the only thing standing between one user and
-- everyone else's finances. A table without it is a public table.
-- ============================================================================

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- auth.users is Supabase's, and is not ours to extend. This is the row the app
-- owns, keyed by the same id so `auth.uid()` joins straight to it.

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- A profile has to exist from the first request after sign-up, so it is made by
-- a trigger rather than by the client — a client that forgets leaves a user
-- with no row and no obvious way to recover.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── App state ──────────────────────────────────────────────────────────────
-- The key list is a constraint rather than documentation: a typo in a storage
-- key would otherwise write a row nothing ever reads again, and the bug would
-- look like data loss. Adding a key means a migration, which is the point.

create table if not exists public.user_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint user_state_key_allowed check (key in (
    'llg_financial_data',
    'llg_spending_limit',
    'llg_savings_goals',
    'llg_investing_goal',
    'llg_general_savings',
    'llg_manual_accounts',
    'llg_ledger',
    'llg_learning_progress_v2',
    'llg_learning_review',
    'llg_learning_ack',
    'llg_learning_guided'
  ))
);

-- `updated_at` decides the winner when the same account writes from two
-- devices, so the database sets it. A client clock would make the rule
-- unenforceable.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch
  before update on public.user_state
  for each row execute function public.touch_updated_at();

-- ─── Quiz history ───────────────────────────────────────────────────────────
-- A row is written when the paper is issued, not when it is submitted, so an
-- abandoned attempt is still visible. That is the drop-off signal.

create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_id     text not null check (track_id in ('accounts','spending','savings','investing')),
  video_ids    text[] not null default '{}',
  choice_ids   text[] not null default '{}',
  correct      integer,
  total        integer,
  passed       boolean,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists quiz_attempts_user_idx
  on public.quiz_attempts (user_id, started_at desc);
create index if not exists quiz_attempts_track_idx
  on public.quiz_attempts (track_id, started_at desc);

-- Every graded written answer. Two jobs: it is the corpus for reviewing whether
-- a question is any good, and it is what the rate limiter counts — an hour of
-- grading history is already a rate limit, so there is no second table for it.
create table if not exists public.graded_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid references public.quiz_attempts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  track_id    text not null,
  question_id text not null,
  answer_text text not null,
  score       smallint not null check (score between 0 and 2),
  verdict     text not null check (verdict in ('missed','partial','full')),
  reasoning   text,
  missed      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists graded_answers_rate_idx
  on public.graded_answers (user_id, created_at desc);
create index if not exists graded_answers_question_idx
  on public.graded_answers (question_id, created_at desc);

-- A learner saying an embed will not play. The health-check script finds dead
-- videos on a weekly cycle; this finds them in the minute they break.
create table if not exists public.video_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  track_id   text not null,
  video_id   text not null,
  created_at timestamptz not null default now()
);

create index if not exists video_reports_video_idx
  on public.video_reports (video_id, created_at desc);

-- ─── Row-level security ─────────────────────────────────────────────────────
--
-- This is the whole security model, so it is worth being explicit about how it
-- works. PostgREST connects as `authenticator` and switches to `anon` for a
-- request with no session, or `authenticated` for one carrying a valid JWT. In
-- both cases the role is not the table owner and has no BYPASSRLS, so every
-- query it runs is filtered by the policies below.
--
-- `auth.uid()` is NULL for an anonymous request. `NULL = user_id` evaluates to
-- NULL, which is not true, so an anonymous caller matches no row on any table
-- here. There is no policy anywhere in this file that grants a read the caller
-- does not own.
--
-- Only `service_role` sees past this, and it is used in exactly three places:
-- opening a quiz attempt, writing a grade, and recording a dead video. Its key
-- is server-side only and `src/lib/supabase/admin.ts` is marked `server-only`,
-- so importing it into a client component fails the build rather than shipping
-- the key to a browser.

alter table public.profiles       enable row level security;
alter table public.user_state     enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.graded_answers enable row level security;
alter table public.video_reports  enable row level security;

-- Defence in depth. The policies already deny anonymous access; this means an
-- anonymous request is refused at the grant level, before a policy is even
-- evaluated. A future table added without a policy is then closed by default
-- rather than open by default.
revoke all on public.profiles       from anon;
revoke all on public.user_state     from anon;
revoke all on public.quiz_attempts  from anon;
revoke all on public.graded_answers from anon;
revoke all on public.video_reports  from anon;

-- Every policy below names `authenticated`. Without that clause a policy
-- applies to PUBLIC, which includes `anon` — the outcome is the same because
-- of the NULL comparison, but relying on that is relying on a coincidence.

-- Read and update your own profile. There is no INSERT policy because the
-- trigger above creates the row, and no DELETE policy because deleting the
-- profile without deleting the account would leave a signed-in user with no
-- row and no way to make one. Account deletion removes the auth.users row and
-- cascades from there.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The learner owns their own state outright: it is their figures and their
-- progress, and they are the only one who writes it.
drop policy if exists "own state" on public.user_state;
create policy "own state" on public.user_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Read-only. Attempts and grades are written by the server with the
-- service-role key: a client that could insert its own grade could pass every
-- quiz, and a client that could edit an attempt could hand itself a paper it
-- had already seen the answers to.
drop policy if exists "own attempts" on public.quiz_attempts;
create policy "own attempts" on public.quiz_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "read own grades" on public.graded_answers;
create policy "read own grades" on public.graded_answers
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insert only, and only as yourself. Nobody reads these through the API; a
-- review pass reads them in the dashboard.
drop policy if exists "report a video" on public.video_reports;
create policy "report a video" on public.video_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ─── Proving it ─────────────────────────────────────────────────────────────
--
-- Run this after applying the migration. Every table must come back with
-- rls_enabled = true and a policy count above zero. A table listed here with
-- rls_enabled = false is a public table, whatever else is true of it.
--
--   select
--     c.relname                                as table_name,
--     c.relrowsecurity                         as rls_enabled,
--     (select count(*) from pg_policies p
--       where p.schemaname = 'public'
--         and p.tablename = c.relname)         as policies
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by c.relname;
--
-- Then the behavioural check, which is the one that actually matters — sign in
-- as two different accounts and confirm each sees only its own rows. Supabase's
-- own linter (Database → Advisors) also flags any table left without RLS.
