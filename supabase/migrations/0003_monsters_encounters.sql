-- Monster compendium (bulk-seeded) + campaign encounters

-- Monsters (reference data; client read-only)
create table if not exists public.monsters (
  id uuid primary key default gen_random_uuid(),
  source_index int not null unique,
  name text not null,
  cr numeric not null,
  xp int not null default 0,
  hp int not null,
  hp_dice text,
  ac text,
  meta text,
  img_url text,
  traits_html text,
  actions_html text,
  legendary_html text,
  created_at timestamptz not null default now()
);

create index if not exists monsters_name_idx on public.monsters (name);
create index if not exists monsters_cr_idx on public.monsters (cr);

alter table public.monsters enable row level security;

create policy "monsters_select_authenticated"
  on public.monsters for select
  to authenticated
  using (true);

-- Encounters (DM/admin write; members may read)
create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name text not null,
  status text not null check (status in ('draft', 'ongoing', 'finished')),
  data jsonb not null default '{"schemaVersion": 1}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists encounters_campaign_idx on public.encounters (campaign_id);

alter table public.encounters enable row level security;

create policy "encounters_select_member"
  on public.encounters for select
  using (
    public.is_admin()
    or public.is_campaign_dm(campaign_id)
    or public.is_campaign_member(campaign_id)
  );

create policy "encounters_insert_dm_or_admin"
  on public.encounters for insert
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "encounters_update_dm_or_admin"
  on public.encounters for update
  using (public.is_admin() or public.is_campaign_dm(campaign_id))
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "encounters_delete_dm_or_admin"
  on public.encounters for delete
  using (public.is_admin() or public.is_campaign_dm(campaign_id));

create or replace function public.touch_encounters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists encounters_touch_updated_at on public.encounters;
create trigger encounters_touch_updated_at
  before update on public.encounters
  for each row execute function public.touch_encounters_updated_at();
