-- VERDIKT core schema — apply in Supabase SQL editor or via CLI.
-- Enable RLS and tighten policies per environment before production launch.

create extension if not exists "pgcrypto";

-- Profiles (extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_statement text,
  onboarding_completed boolean default false,
  plan text default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.validation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  idea_title text not null,
  idea_brief jsonb not null,
  verdict text check (verdict in ('BUILD', 'PIVOT', 'KILL')),
  opportunity_score integer,
  results jsonb not null,
  model_version text,
  created_at timestamptz default now()
);

create index if not exists validation_runs_user_created_idx on public.validation_runs (user_id, created_at desc);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id uuid references public.validation_runs (id) on delete set null,
  idea_key text not null,
  verdict text not null,
  action text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('oneoff', 'subscription')),
  remaining_uses integer,
  status text not null default 'active',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  note text,
  invite_code text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- New user → profile row (trigger after signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
