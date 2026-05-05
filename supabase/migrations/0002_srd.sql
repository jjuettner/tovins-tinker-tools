-- SRD tables (ruleset-scoped) + RLS
-- Pattern: extracted columns + data jsonb tail, unique (ruleset_id, slug)

create extension if not exists pgcrypto;

-- Common helper: admin gate (defined in 0001_core.sql). Re-create if migration order differs.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
$$;

-- Spells
create table if not exists public.spells (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  level int not null,
  school text,
  casting_time text,
  range_text text,
  duration text,
  concentration boolean,
  ritual boolean,
  classes text[],
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.spells enable row level security;

create policy "spells_select_public"
  on public.spells for select
  using (true);

create policy "spells_write_admin_only"
  on public.spells for all
  using (public.is_admin())
  with check (public.is_admin());

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  hit_die int,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.classes enable row level security;

create policy "classes_select_public"
  on public.classes for select
  using (true);

create policy "classes_write_admin_only"
  on public.classes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Races
create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.races enable row level security;

create policy "races_select_public"
  on public.races for select
  using (true);

create policy "races_write_admin_only"
  on public.races for all
  using (public.is_admin())
  with check (public.is_admin());

-- Feats
create table if not exists public.feats (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  feat_type text,
  repeatable text,
  description text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.feats enable row level security;

create policy "feats_select_public"
  on public.feats for select
  using (true);

create policy "feats_write_admin_only"
  on public.feats for all
  using (public.is_admin())
  with check (public.is_admin());

-- Equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  category text,
  weapon_category text,
  armor_category text,
  cost jsonb,
  weight numeric,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.equipment enable row level security;

create policy "equipment_select_public"
  on public.equipment for select
  using (true);

create policy "equipment_write_admin_only"
  on public.equipment for all
  using (public.is_admin())
  with check (public.is_admin());

-- Features
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  class_slug text,
  subclass_slug text,
  level int,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.features enable row level security;

create policy "features_select_public"
  on public.features for select
  using (true);

create policy "features_write_admin_only"
  on public.features for all
  using (public.is_admin())
  with check (public.is_admin());

-- Traits
create table if not exists public.traits (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  races text[],
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.traits enable row level security;

create policy "traits_select_public"
  on public.traits for select
  using (true);

create policy "traits_write_admin_only"
  on public.traits for all
  using (public.is_admin())
  with check (public.is_admin());

-- Weapon mastery properties
create table if not exists public.weapon_mastery_properties (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, slug)
);

alter table public.weapon_mastery_properties enable row level security;

create policy "weapon_mastery_select_public"
  on public.weapon_mastery_properties for select
  using (true);

create policy "weapon_mastery_write_admin_only"
  on public.weapon_mastery_properties for all
  using (public.is_admin())
  with check (public.is_admin());

-- Spell slots table (expanded from spell-slots.json)
create table if not exists public.class_spell_slots (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references public.rulesets (id) on delete cascade,
  class_slug text not null,
  level int not null,
  slots jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ruleset_id, class_slug, level)
);

alter table public.class_spell_slots enable row level security;

create policy "class_spell_slots_select_public"
  on public.class_spell_slots for select
  using (true);

create policy "class_spell_slots_write_admin_only"
  on public.class_spell_slots for all
  using (public.is_admin())
  with check (public.is_admin());

