-- Short play-mode text for spells, feats, and class features (optional; full text stays in description/data).

alter table public.spells add column if not exists summary text;
alter table public.feats add column if not exists summary text;
alter table public.features add column if not exists summary text;
