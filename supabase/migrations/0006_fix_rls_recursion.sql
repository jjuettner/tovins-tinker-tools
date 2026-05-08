-- Fix RLS recursion (stack depth exceeded) by ensuring helper
-- predicates don't re-enter RLS-protected tables.
--
-- Symptom: Postgres error 54001 "stack depth limit exceeded" from REST.
-- Cause: RLS policy on campaigns calls is_campaign_dm(), which queried
-- campaigns again, recursively triggering the same policy.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin
  )
$$;

create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1
    from public.campaign_members m
    where m.campaign_id = cid
      and m.user_id = auth.uid()
  )
$$;

create or replace function public.is_campaign_dm(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(
    select 1
    from public.campaigns c
    where c.id = cid
      and c.dm = auth.uid()
  )
$$;

