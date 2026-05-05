-- Core tables + RLS for Tovin's Tinker Tools
-- Assumptions:
-- - roles: admin is global (profiles.is_admin); dm is per-campaign (campaigns.dm); player is any authed user
-- - campaigns can attach N rulesets via campaign_rulesets
-- - characters optionally belong to a campaign

create extension if not exists pgcrypto;

-- 1:1 app profile for auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Create profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Rulesets catalog (admin-managed)
create table if not exists public.rulesets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.rulesets enable row level security;

create policy "rulesets_select_public"
  on public.rulesets for select
  using (true);

create policy "rulesets_write_admin_only"
  on public.rulesets for all
  using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Prevent updates/deletes of builtin rulesets.
create or replace function public.reject_builtin_ruleset_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.is_builtin then
    raise exception 'builtin rulesets are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists rulesets_reject_builtin_update on public.rulesets;
create trigger rulesets_reject_builtin_update
  before update on public.rulesets
  for each row execute function public.reject_builtin_ruleset_mutation();

drop trigger if exists rulesets_reject_builtin_delete on public.rulesets;
create trigger rulesets_reject_builtin_delete
  before delete on public.rulesets
  for each row execute function public.reject_builtin_ruleset_mutation();

-- Campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  dm uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

-- Campaign membership (dm/player)
create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('dm','player')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

alter table public.campaign_members enable row level security;

-- Campaign ↔ rulesets
create table if not exists public.campaign_rulesets (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  ruleset_id uuid not null references public.rulesets (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (campaign_id, ruleset_id)
);

alter table public.campaign_rulesets enable row level security;

-- Helper predicates
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
$$;

create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid()
  )
$$;

create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.campaigns c where c.id = cid and c.dm = auth.uid())
$$;

-- campaigns policies
create policy "campaigns_select_dm_or_member"
  on public.campaigns for select
  using (public.is_admin() or public.is_campaign_dm(id) or public.is_campaign_member(id));

create policy "campaigns_insert_authed"
  on public.campaigns for insert
  with check (dm = auth.uid());

create policy "campaigns_update_dm_or_admin"
  on public.campaigns for update
  using (public.is_admin() or public.is_campaign_dm(id))
  with check (public.is_admin() or public.is_campaign_dm(id));

create policy "campaigns_delete_dm_or_admin"
  on public.campaigns for delete
  using (public.is_admin() or public.is_campaign_dm(id));

-- campaign_members policies
create policy "campaign_members_select_self_or_dm_or_admin"
  on public.campaign_members for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_campaign_dm(campaign_id)
  );

create policy "campaign_members_insert_dm_or_admin"
  on public.campaign_members for insert
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "campaign_members_delete_dm_or_admin"
  on public.campaign_members for delete
  using (public.is_admin() or public.is_campaign_dm(campaign_id));

-- campaign_rulesets policies
create policy "campaign_rulesets_select_campaign_visible"
  on public.campaign_rulesets for select
  using (public.is_admin() or public.is_campaign_dm(campaign_id) or public.is_campaign_member(campaign_id));

create policy "campaign_rulesets_insert_dm_or_admin"
  on public.campaign_rulesets for insert
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "campaign_rulesets_delete_dm_or_admin"
  on public.campaign_rulesets for delete
  using (public.is_admin() or public.is_campaign_dm(campaign_id));

-- Characters
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  campaign_id uuid null references public.campaigns (id) on delete set null,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_owner_idx on public.characters (owner);
create index if not exists characters_campaign_idx on public.characters (campaign_id);

alter table public.characters enable row level security;

create policy "characters_select_owner_or_campaign_member"
  on public.characters for select
  using (
    public.is_admin()
    or owner = auth.uid()
    or (campaign_id is not null and (public.is_campaign_dm(campaign_id) or public.is_campaign_member(campaign_id)))
  );

create policy "characters_insert_owner_or_admin"
  on public.characters for insert
  with check (public.is_admin() or owner = auth.uid());

create policy "characters_update_owner_or_admin"
  on public.characters for update
  using (public.is_admin() or owner = auth.uid())
  with check (public.is_admin() or owner = auth.uid());

create policy "characters_delete_owner_or_admin"
  on public.characters for delete
  using (public.is_admin() or owner = auth.uid());

-- campaign_data (DM-owned)
create table if not exists public.campaign_data (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  kind text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists campaign_data_campaign_idx on public.campaign_data (campaign_id);

alter table public.campaign_data enable row level security;

create policy "campaign_data_select_member"
  on public.campaign_data for select
  using (public.is_admin() or public.is_campaign_dm(campaign_id) or public.is_campaign_member(campaign_id));

create policy "campaign_data_write_dm_or_admin"
  on public.campaign_data for all
  using (public.is_admin() or public.is_campaign_dm(campaign_id))
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

