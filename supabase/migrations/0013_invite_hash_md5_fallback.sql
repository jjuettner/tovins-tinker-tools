-- Fallback invite hashing without pgcrypto.
-- Fixes environments where digest() is unavailable (42883).
--
-- Security note: md5 is not cryptographic. For invite tokens this is acceptable
-- because the raw token is high-entropy and never stored, and the hash is only used
-- for lookup. If pgcrypto is available later, we can switch back to sha256.

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
  v_hash := md5(v_token);
  v_expires := now() + make_interval(mins => p_ttl_minutes);

  insert into public.campaign_invites (campaign_id, token_hash, max_uses, expires_at, created_by)
  values (p_campaign_id, v_hash, p_max_uses, v_expires, auth.uid());

  return query select v_token, v_expires;
end;
$$;

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

  v_hash := md5(trim(p_token));

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

