-- Allow campaign members to persist *their own* PC state during an ongoing encounter.
-- This does not grant broad UPDATE on encounters; it validates and merges a tiny allowlist.

create or replace function public.apply_encounter_pc_state(
  p_encounter_id uuid,
  p_entities jsonb
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_enc record;
  v_patches jsonb := '{}'::jsonb;
  v_el jsonb;
  v_id text;
  v_hp int;
  v_status text;
  v_ds jsonb;
  v_new_entities jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select e.id, e.campaign_id, e.status, e.data
    into v_enc
  from public.encounters e
  where e.id = p_encounter_id;

  if not found then
    raise exception 'encounter not found';
  end if;

  if v_enc.status <> 'ongoing' then
    raise exception 'encounter not ongoing';
  end if;

  if not (public.is_admin() or public.is_campaign_dm(v_enc.campaign_id) or public.is_campaign_member(v_enc.campaign_id)) then
    raise exception 'not allowed';
  end if;

  if jsonb_typeof(p_entities) <> 'array' then
    raise exception 'invalid payload';
  end if;

  -- Build patches keyed by entity id.
  for v_el in select * from jsonb_array_elements(p_entities)
  loop
    v_id := null;
    v_hp := null;
    v_status := null;
    v_ds := null;

    if jsonb_typeof(v_el) <> 'object' then
      continue;
    end if;

    v_id := nullif(trim(v_el->>'id'), '');
    if v_id is null then
      continue;
    end if;

    if (v_el ? 'currentHp') then
      begin
        v_hp := (v_el->>'currentHp')::int;
      exception when others then
        v_hp := null;
      end;
    end if;

    if (v_el ? 'status') then
      v_status := nullif(trim(v_el->>'status'), '');
      if v_status is not null and v_status <> 'dead' then
        v_status := null;
      end if;
    end if;

    if (v_el ? 'deathSaves') then
      v_ds := v_el->'deathSaves';
      if jsonb_typeof(v_ds) <> 'object' then
        v_ds := null;
      end if;
    end if;

    if v_hp is null and v_status is null and v_ds is null then
      continue;
    end if;

    v_patches := v_patches || jsonb_build_object(
      v_id,
      jsonb_strip_nulls(
        jsonb_build_object(
          'currentHp', v_hp,
          'status', v_status,
          'deathSaves', v_ds
        )
      )
    );
  end loop;

  if v_patches = '{}'::jsonb then
    return;
  end if;

  -- Merge allowlisted fields for player-owned PC entities only.
  select jsonb_agg(
           case
             when (e.value->>'kind') = 'pc'
               and (v_patches ? (e.value->>'id'))
               and (e.value ? 'characterId')
               and exists(
                 select 1
                 from public.characters c
                 where c.id = (e.value->>'characterId')::uuid
                   and c.owner = auth.uid()
                   and c.campaign_id = v_enc.campaign_id
               )
             then
               jsonb_strip_nulls(
                 e.value
                 || jsonb_build_object(
                   'currentHp',
                   greatest(
                     0,
                     least(
                       (e.value->>'maxHp')::int,
                       coalesce((v_patches->(e.value->>'id'))->>'currentHp', (e.value->>'currentHp'))::int
                     )
                   )
                 )
                 || jsonb_build_object(
                   'status',
                   case when (v_patches->(e.value->>'id')) ? 'status' then (v_patches->(e.value->>'id'))->'status' else e.value->'status' end
                 )
                 || jsonb_build_object(
                   'deathSaves',
                   case when (v_patches->(e.value->>'id')) ? 'deathSaves' then (v_patches->(e.value->>'id'))->'deathSaves' else e.value->'deathSaves' end
                 )
               )
             else e.value
           end
           order by e.ord
         )
    into v_new_entities
  from jsonb_array_elements(v_enc.data->'entities') with ordinality as e(value, ord);

  if v_new_entities is null then
    raise exception 'encounter entities missing';
  end if;

  update public.encounters
     set data = jsonb_set(v_enc.data, '{entities}', v_new_entities, true)
   where id = v_enc.id;
end;
$$;

grant execute on function public.apply_encounter_pc_state(uuid, jsonb) to authenticated;

