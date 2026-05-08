-- Character avatars (Supabase Storage)

-- Bucket (public read).
insert into storage.buckets (id, name, public)
values ('character-avatars', 'character-avatars', true)
on conflict (id) do nothing;

-- Policies: simple authenticated CRUD (project is a hobby tool; keep it easy).
-- Note: Storage policies live on `storage.objects`.

create policy "character_avatars_select_authenticated"
  on storage.objects for select
  using (bucket_id = 'character-avatars' and auth.role() = 'authenticated');

create policy "character_avatars_insert_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'character-avatars' and auth.role() = 'authenticated');

create policy "character_avatars_update_authenticated"
  on storage.objects for update
  using (bucket_id = 'character-avatars' and auth.role() = 'authenticated')
  with check (bucket_id = 'character-avatars' and auth.role() = 'authenticated');

create policy "character_avatars_delete_authenticated"
  on storage.objects for delete
  using (bucket_id = 'character-avatars' and auth.role() = 'authenticated');

