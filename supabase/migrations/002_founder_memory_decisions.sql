-- Optional columns for decision ledger + founder memory JSON bundle

alter table public.decisions add column if not exists idea_title text;
alter table public.decisions add column if not exists opportunity_score integer;

-- Full-text friendly title search (denormalized from first run; optional)
create index if not exists decisions_user_created_idx on public.decisions (user_id, created_at desc);

create table if not exists public.founder_memory_bundles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bundle jsonb not null default '{}',
  updated_at timestamptz default now()
);

