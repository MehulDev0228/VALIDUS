-- Validation attempt logs (48h tracker) + Row Level Security for user-owned tables.
-- Service role (server) bypasses RLS; anon/authenticated clients use policies below.

create table if not exists public.validation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  idea_id text not null,
  action_taken text not null,
  result text not null,
  learnings text not null,
  created_at timestamptz default now()
);

create index if not exists validation_logs_user_idea_idx on public.validation_logs (user_id, idea_id, created_at desc);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.validation_runs enable row level security;
alter table public.decisions enable row level security;
alter table public.entitlements enable row level security;
alter table public.validation_logs enable row level security;
alter table public.founder_memory_bundles enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "validation_runs_own" on public.validation_runs;
create policy "validation_runs_own" on public.validation_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "decisions_own" on public.decisions;
create policy "decisions_own" on public.decisions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements for select using (auth.uid() = user_id);

drop policy if exists "validation_logs_own" on public.validation_logs;
create policy "validation_logs_own" on public.validation_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "founder_memory_own" on public.founder_memory_bundles;
create policy "founder_memory_own" on public.founder_memory_bundles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Waitlist rows are written only via service role from /api/waitlist — no end-user policies.
