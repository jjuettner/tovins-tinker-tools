-- Delete campaign and all related data (but keep characters).
-- Note: characters.campaign_id is ON DELETE SET NULL, so characters remain and are unlinked.

create or replace function public.delete_campaign_cascade(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not (public.is_admin() or public.is_campaign_dm(p_campaign_id)) then
    raise exception 'not allowed';
  end if;

  -- Delete campaign (cascades members/rulesets/invites/encounters/campaign_data/etc).
  delete from public.campaigns c
   where c.id = p_campaign_id;
end;
$$;

grant execute on function public.delete_campaign_cascade(uuid) to authenticated;

