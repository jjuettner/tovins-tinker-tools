-- Campaign invites + self-serve join.
-- Token is only returned once on creation; only SHA-256 hash is stored.

create table if not exists public.campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  token_hash text not null unique,
  role text not null default 'player' check (role in ('player')),
  max_uses int not null default 1 check (max_uses > 0),
  uses_count int not null default 0 check (uses_count >= 0),
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists campaign_invites_campaign_idx on public.campaign_invites (campaign_id);

alter table public.campaign_invites enable row level security;

create policy "campaign_invites_select_dm_or_admin"
  on public.campaign_invites for select
  using (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "campaign_invites_insert_dm_or_admin"
  on public.campaign_invites for insert
  with check (public.is_admin() or public.is_campaign_dm(campaign_id));

create policy "campaign_invites_delete_dm_or_admin"
  on public.campaign_invites for delete
  using (public.is_admin() or public.is_campaign_dm(campaign_id));

-- Create invite and return the raw token (only time caller sees it).
create or replace function public.create_campaign_invite(
  p_campaign_id uuid,
  p_ttl_minutes int default 10080,
  p_max_uses int default 1
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_token text;
  v_expires timestamptz;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_ttl_minutes is null or p_ttl_minutes <= 0 then
    raise exception 'ttl must be positive';
  end if;
  if p_max_uses is null or p_max_uses <= 0 then
    raise exception 'max_uses must be positive';
  end if;
  if not (public.is_admin() or public.is_campaign_dm(p_campaign_id)) then
    raise exception 'not allowed';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires := now() + make_interval(mins => p_ttl_minutes);

  insert into public.campaign_invites (campaign_id, token_hash, max_uses, expires_at, created_by)
  values (p_campaign_id, v_hash, p_max_uses, v_expires, auth.uid());

  return query select v_token, v_expires;
end;
$$;

grant execute on function public.create_campaign_invite(uuid, int, int) to authenticated;

-- Redeem invite and join campaign as player.
create or replace function public.join_campaign_with_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_hash text;
  v_inv public.campaign_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_token is null or length(trim(p_token)) < 20 then
    raise exception 'invalid token';
  end if;

  v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

  select *
    into v_inv
  from public.campaign_invites i
  where i.token_hash = v_hash
  limit 1;

  if not found then
    raise exception 'invite not found';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'invite expired';
  end if;
  if v_inv.uses_count >= v_inv.max_uses then
    raise exception 'invite exhausted';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_inv.campaign_id, auth.uid(), v_inv.role)
  on conflict (campaign_id, user_id) do nothing;

  update public.campaign_invites
    set uses_count = uses_count + 1
  where id = v_inv.id;

  return v_inv.campaign_id;
end;
$$;

grant execute on function public.join_campaign_with_invite(text) to authenticated;

