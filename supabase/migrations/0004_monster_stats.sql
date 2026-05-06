-- Extend monsters table with basic stats for UI cards.

alter table public.monsters
  add column if not exists str int,
  add column if not exists dex int,
  add column if not exists con int,
  add column if not exists int int,
  add column if not exists wis int,
  add column if not exists cha int,
  add column if not exists str_mod int,
  add column if not exists dex_mod int,
  add column if not exists con_mod int,
  add column if not exists int_mod int,
  add column if not exists wis_mod int,
  add column if not exists cha_mod int,
  add column if not exists saving_throws text,
  add column if not exists skills text;

