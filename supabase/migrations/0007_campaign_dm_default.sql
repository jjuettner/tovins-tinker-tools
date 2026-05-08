-- Allow creating campaigns without explicitly sending dm in insert payload.
-- RLS already requires dm = auth.uid(); this default makes that pass.

alter table public.campaigns
  alter column dm set default auth.uid();

