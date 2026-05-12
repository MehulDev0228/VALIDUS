-- Public memo sharing, opt-in library listing, API-friendly metadata
alter table public.validation_runs
  add column if not exists is_public boolean not null default false,
  add column if not exists listed_in_library boolean not null default false;

create index if not exists validation_runs_public_library_idx
  on public.validation_runs (listed_in_library, is_public, created_at desc)
  where is_public = true and listed_in_library = true;

comment on column public.validation_runs.is_public is 'When true, /memo/{run_id} is readable without auth (service role only).';
comment on column public.validation_runs.listed_in_library is 'When true and is_public, row may appear on /explore.';
