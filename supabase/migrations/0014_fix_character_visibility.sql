-- Fix character visibility leak:
-- campaign members should not automatically see other players' characters.
-- Only the owner, admin, or campaign DM may select characters in that campaign.

drop policy if exists "characters_select_owner_or_campaign_member" on public.characters;

create policy "characters_select_owner_or_campaign_dm"
  on public.characters for select
  using (
    public.is_admin()
    or owner = auth.uid()
    or (campaign_id is not null and public.is_campaign_dm(campaign_id))
  );

