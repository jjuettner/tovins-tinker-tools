-- Allow campaign DMs to apply PC HP/conditions updates during an ongoing encounter.
-- This updates BOTH `encounters.data.entities[].currentHp` and the linked `characters.data`.

create or replace function public.dm_update_pc_from_encounter(
  p_encounter_id uuid,
  p_entity_id text,
  p_current_hp int,
  p_condition_slugs text default null
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_enc record;
  v_entity jsonb;
  v_character_id uuid;
  v_new_entities jsonb;
  v_hp int;
  v_slugs text[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_entity_id is null or nullif(trim(p_entity_id), '') is null then
    raise exception 'invalid entity id';
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

  if not (public.is_admin() or public.is_campaign_dm(v_enc.campaign_id)) then
    raise exception 'not allowed';
  end if;

  -- Find the PC entity by id.
  select el.value
    into v_entity
  from jsonb_array_elements(v_enc.data->'entities') as el(value)
  where (el.value->>'id') = p_entity_id
    and (el.value->>'kind') = 'pc'
    and (el.value ? 'characterId')
  limit 1;

  if v_entity is null then
    raise exception 'pc entity not found';
  end if;

  v_character_id := (v_entity->>'characterId')::uuid;
  v_hp := greatest(0, least((v_entity->>'maxHp')::int, coalesce(p_current_hp, (v_entity->>'currentHp')::int)));

  if p_condition_slugs is not null then
    -- Client sends comma-separated slugs.
    v_slugs := string_to_array(p_condition_slugs, ',');
    -- Trim + drop empties + lower-case.
    select array_agg(lower(trim(s))) filter (where nullif(trim(s), '') is not null)
      into v_slugs
    from unnest(v_slugs) as s;
  end if;

  -- Update encounter entity currentHp.
  select jsonb_agg(
           case
             when (e.value->>'id') = p_entity_id then
               jsonb_strip_nulls(
                 e.value
                 || jsonb_build_object('currentHp', v_hp)
               )
             else e.value
           end
           order by e.ord
         )
    into v_new_entities
  from jsonb_array_elements(v_enc.data->'entities') with ordinality as e(value, ord);

  update public.encounters
     set data = jsonb_set(v_enc.data, '{entities}', v_new_entities, true)
   where id = v_enc.id;

  -- Update linked character: currentHp and optionally conditionSlugs.
  update public.characters c
     set data =
       case
         when v_slugs is null then
           jsonb_set(c.data, '{currentHp}', to_jsonb(v_hp), true)
         else
           jsonb_set(
             jsonb_set(c.data, '{currentHp}', to_jsonb(v_hp), true),
             '{conditionSlugs}',
             to_jsonb(v_slugs),
             true
           )
       end
   where c.id = v_character_id
     and c.campaign_id = v_enc.campaign_id;
end;
$$;

grant execute on function public.dm_update_pc_from_encounter(uuid, text, int, text) to authenticated;

