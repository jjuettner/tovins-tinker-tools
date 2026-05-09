-- Global SRD conditions reference (not ruleset-scoped; same text for all campaigns).

create table if not exists public.conditions (
  slug text primary key,
  name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conditions_name_idx on public.conditions (name);

alter table public.conditions enable row level security;

create policy "conditions_select_public"
  on public.conditions for select
  using (true);

create policy "conditions_write_admin_only"
  on public.conditions for all
  using (public.is_admin())
  with check (public.is_admin());
