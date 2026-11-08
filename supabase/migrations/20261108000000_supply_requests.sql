-- SCHED-01: weekly supply check-ins and supply requests

-- TODO(AUTH-01): replace with a real staff/admin role check once roles land.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

-- Catalog of requestable supplies (dropdown source)
create table public.supply_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit_label text not null default 'each',
  created_at timestamptz not null default now()
);

-- One row per weekly check-in submission (yes or no)
create table public.weekly_check_ins (
  id uuid primary key default gen_random_uuid(),
  foster_id uuid not null references auth.users(id) on delete cascade,
  needs_supplies boolean not null,
  comments text,
  week_of date not null default (date_trunc('week', current_date)::date),
  created_at timestamptz not null default now(),
  constraint weekly_check_ins_comments_length check (
    comments is null or char_length(comments) <= 1000
  )
);

-- One row only when needs_supplies = true
create table public.supply_requests (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null unique references public.weekly_check_ins(id) on delete cascade,
  foster_id uuid not null references auth.users(id) on delete cascade,
  placement_id uuid references public.placements(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'fulfilled', 'cancelled')),
  fulfillment_method text not null
    check (fulfillment_method in ('pickup', 'delivery')),
  notes_to_staff text,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_requests_notes_length check (
    notes_to_staff is null or char_length(notes_to_staff) <= 1000
  )
);

-- Line items for a supply request
create table public.supply_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.supply_requests(id) on delete cascade,
  supply_item_id uuid references public.supply_items(id) on delete restrict,
  custom_name text,
  quantity integer not null check (quantity > 0),
  constraint supply_request_items_item_xor_custom check (
    (supply_item_id is not null and custom_name is null)
    or (supply_item_id is null and custom_name is not null and char_length(btrim(custom_name)) > 0)
  ),
  constraint supply_request_items_custom_name_length check (
    custom_name is null or char_length(custom_name) <= 100
  )
);

create index weekly_check_ins_foster_id_idx on public.weekly_check_ins(foster_id);
create index supply_requests_foster_id_idx on public.supply_requests(foster_id);
create index supply_requests_status_idx on public.supply_requests(status);
create index supply_request_items_request_id_idx on public.supply_request_items(request_id);

-- Placeholder catalog; real list TBD
insert into public.supply_items (name, category, unit_label) values
  ('Dry dog food', 'Food', 'bags'),
  ('Wet cat food', 'Food', 'cans'),
  ('Puppy pads', 'Bedding', 'packs'),
  ('Fleece blanket', 'Bedding', 'each'),
  ('Flea treatment', 'Medical', 'doses'),
  ('Cone / e-collar', 'Medical', 'each'),
  ('Chew toy', 'Toys', 'each'),
  ('Catnip mouse', 'Toys', 'each');

-- RLS
alter table public.supply_items enable row level security;
alter table public.weekly_check_ins enable row level security;
alter table public.supply_requests enable row level security;
alter table public.supply_request_items enable row level security;

-- supply_items: any authenticated user can SELECT
create policy supply_items_select_authenticated
  on public.supply_items
  for select
  to authenticated
  using (true);

-- weekly_check_ins: foster owns rows; staff can read once is_staff() is real
create policy weekly_check_ins_select_own
  on public.weekly_check_ins
  for select
  to authenticated
  using (foster_id = auth.uid() or public.is_staff());

-- supply_requests: foster owns rows; staff can read
create policy supply_requests_select_own
  on public.supply_requests
  for select
  to authenticated
  using (foster_id = auth.uid() or public.is_staff());

-- Staff can mark fulfilled once AUTH-01 lands (is_staff currently false)
create policy supply_requests_staff_mark_fulfilled
  on public.supply_requests
  for update
  to authenticated
  using (public.is_staff())
  with check (
    public.is_staff()
    and status in ('pending', 'fulfilled', 'cancelled')
  );

-- supply_request_items: via parent request ownership or staff
create policy supply_request_items_select_own
  on public.supply_request_items
  for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1
      from public.supply_requests sr
      where sr.id = request_id
        and sr.foster_id = auth.uid()
    )
  );

-- Fosters must not insert/update/delete these tables directly; RPCs only.
revoke insert, update, delete on public.supply_items from authenticated, anon;
revoke insert, update, delete on public.weekly_check_ins from authenticated, anon;
revoke insert, update, delete on public.supply_requests from authenticated, anon;
revoke insert, update, delete on public.supply_request_items from authenticated, anon;

grant select on public.supply_items to authenticated;
grant select on public.weekly_check_ins to authenticated;
grant select on public.supply_requests to authenticated;
grant select on public.supply_request_items to authenticated;
-- UPDATE privilege required for staff RLS policy; fosters still blocked until is_staff() is true
grant update on public.supply_requests to authenticated;

-- Atomic submit: check-in (+ optional request + items) in one transaction
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
  v_foster_id uuid := auth.uid();
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
  if v_foster_id is null then
    raise exception 'Not authenticated';
  end if;

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
) to authenticated;

-- Cancel own pending request only; no direct UPDATE for fosters
create or replace function public.cancel_supply_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foster_id uuid := auth.uid();
  v_updated integer;
begin
  if v_foster_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.supply_requests
  set
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  where id = p_request_id
    and foster_id = v_foster_id
    and status = 'pending';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Request not found, not owned, or not pending';
  end if;
end;
$$;

revoke all on function public.cancel_supply_request(uuid) from public;
grant execute on function public.cancel_supply_request(uuid) to authenticated;
