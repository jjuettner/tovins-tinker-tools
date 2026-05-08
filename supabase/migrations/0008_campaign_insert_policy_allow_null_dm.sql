-- Make campaign creation resilient to missing/nullable dm in payload.
-- Still requires authenticated user; dm must resolve to auth.uid().

drop policy if exists "campaigns_insert_authed" on public.campaigns;

create policy "campaigns_insert_authed"
  on public.campaigns for insert
  with check (auth.uid() is not null and coalesce(dm, auth.uid()) = auth.uid());

