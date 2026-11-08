-- TEMP (until AUTH-01): allow anyone to read the catalog and submit check-ins.
-- foster_id is nullable when there is no signed-in user.

alter table public.weekly_check_ins
  alter column foster_id drop not null;

alter table public.supply_requests
  alter column foster_id drop not null;

-- Catalog visible without login (so the dropdown works for everyone)
drop policy if exists supply_items_select_authenticated on public.supply_items;

create policy supply_items_select_public
  on public.supply_items
  for select
  to anon, authenticated
  using (true);

grant select on public.supply_items to anon;

create or replace function public.submit_weekly_check_in(
  p_needs_supplies boolean,
  p_comments text default null,
  p_fulfillment_method text default null,
  p_notes_to_staff text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foster_id uuid := auth.uid(); -- null when unauthenticated (temporary)
  v_comments text;
  v_notes text;
  v_check_in_id uuid;
  v_request_id uuid;
  v_item jsonb;
  v_supply_item_id uuid;
  v_custom_name text;
  v_quantity integer;
  v_seen_item_ids uuid[] := '{}';
begin
  v_comments := nullif(btrim(coalesce(p_comments, '')), '');
  if v_comments is not null and char_length(v_comments) > 1000 then
    raise exception 'Comments must be 1000 characters or fewer';
  end if;

  v_notes := nullif(btrim(coalesce(p_notes_to_staff, '')), '');
  if v_notes is not null and char_length(v_notes) > 1000 then
    raise exception 'Notes to staff must be 1000 characters or fewer';
  end if;

  if p_needs_supplies then
    if p_fulfillment_method is null
       or p_fulfillment_method not in ('pickup', 'delivery') then
      raise exception 'Fulfillment method is required when requesting supplies';
    end if;

    if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
      raise exception 'At least one supply item is required';
    end if;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
      v_quantity := nullif(v_item->>'quantity', '')::integer;
      if v_quantity is null or v_quantity < 1 then
        raise exception 'Each item needs a quantity of at least 1';
      end if;

      if v_item ? 'supply_item_id'
         and nullif(v_item->>'supply_item_id', '') is not null then
        v_supply_item_id := (v_item->>'supply_item_id')::uuid;
        v_custom_name := null;

        if not exists (
          select 1 from public.supply_items si where si.id = v_supply_item_id
        ) then
          raise exception 'Unknown supply item';
        end if;

        if v_supply_item_id = any (v_seen_item_ids) then
          raise exception 'Duplicate catalog items are not allowed';
        end if;
        v_seen_item_ids := array_append(v_seen_item_ids, v_supply_item_id);
      else
        v_supply_item_id := null;
        v_custom_name := nullif(btrim(coalesce(v_item->>'custom_name', '')), '');
        if v_custom_name is null then
          raise exception 'Each row needs a catalog item or a custom name';
        end if;
        if char_length(v_custom_name) > 100 then
          raise exception 'Custom item name must be 100 characters or fewer';
        end if;
      end if;
    end loop;
  elsif p_items is not null
        and jsonb_typeof(p_items) = 'array'
        and jsonb_array_length(p_items) > 0 then
    raise exception 'Items are only allowed when needs_supplies is true';
  end if;

  insert into public.weekly_check_ins (foster_id, needs_supplies, comments)
  values (v_foster_id, p_needs_supplies, v_comments)
  returning id into v_check_in_id;

  if not p_needs_supplies then
    return jsonb_build_object(
      'check_in_id', v_check_in_id,
      'request_id', null
    );
  end if;

  insert into public.supply_requests (
    check_in_id,
    foster_id,
    fulfillment_method,
    notes_to_staff
  )
  values (
    v_check_in_id,
    v_foster_id,
    p_fulfillment_method,
    v_notes
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;

    if v_item ? 'supply_item_id'
       and nullif(v_item->>'supply_item_id', '') is not null then
      v_supply_item_id := (v_item->>'supply_item_id')::uuid;
      v_custom_name := null;
    else
      v_supply_item_id := null;
      v_custom_name := btrim(v_item->>'custom_name');
    end if;

    insert into public.supply_request_items (
      request_id,
      supply_item_id,
      custom_name,
      quantity
    )
    values (
      v_request_id,
      v_supply_item_id,
      v_custom_name,
      v_quantity
    );
  end loop;

  return jsonb_build_object(
    'check_in_id', v_check_in_id,
    'request_id', v_request_id
  );
end;
$$;

revoke all on function public.submit_weekly_check_in(
  boolean, text, text, text, jsonb
) from public;
grant execute on function public.submit_weekly_check_in(
  boolean, text, text, text, jsonb
) to anon, authenticated;
