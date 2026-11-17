-- SCHED-02 / SCHED-03: pickup scheduling for supply requests
-- Modes: staff open slots + foster proposed availability (WhenIsGood-style)
-- Staff trump (option B): foster proposal stays pending even if slots exist

-- Staff-published bookable windows
create table public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'held', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_slots_range check (ends_at > starts_at)
);

-- One scheduling attempt tied to a supply request
create table public.scheduling_requests (
  id uuid primary key default gen_random_uuid(),
  supply_request_id uuid not null references public.supply_requests(id) on delete cascade,
  foster_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  mode text not null
    check (mode in ('slot_pick', 'foster_proposal')),
  selected_slot_id uuid references public.appointment_slots(id) on delete set null,
  confirmed_starts_at timestamptz,
  confirmed_ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduling_requests_slot_pick_has_slot check (
    mode <> 'slot_pick' or selected_slot_id is not null
  ),
  constraint scheduling_requests_confirmed_has_times check (
    status <> 'confirmed'
    or (confirmed_starts_at is not null and confirmed_ends_at is not null)
  )
);

-- Foster availability windows (day + hour range)
create table public.scheduling_proposal_windows (
  id uuid primary key default gen_random_uuid(),
  scheduling_request_id uuid not null
    references public.scheduling_requests(id) on delete cascade,
  day date not null,
  start_time time not null,
  end_time time not null,
  constraint scheduling_proposal_windows_range check (end_time > start_time)
);

create index appointment_slots_status_starts_at_idx
  on public.appointment_slots(status, starts_at);
create index scheduling_requests_supply_request_id_idx
  on public.scheduling_requests(supply_request_id);
create index scheduling_requests_status_idx
  on public.scheduling_requests(status);
create index scheduling_proposal_windows_request_id_idx
  on public.scheduling_proposal_windows(scheduling_request_id);

-- Only one active (pending/confirmed) scheduling request per supply request
create unique index scheduling_requests_one_active_per_supply_idx
  on public.scheduling_requests(supply_request_id)
  where status in ('pending', 'confirmed');

alter table public.appointment_slots enable row level security;
alter table public.scheduling_requests enable row level security;
alter table public.scheduling_proposal_windows enable row level security;

-- TEMP until AUTH: open reads for testing; writes go through RPCs only
create policy appointment_slots_select_public
  on public.appointment_slots
  for select
  to anon, authenticated
  using (true);

create policy scheduling_requests_select_public
  on public.scheduling_requests
  for select
  to anon, authenticated
  using (true);

create policy scheduling_proposal_windows_select_public
  on public.scheduling_proposal_windows
  for select
  to anon, authenticated
  using (true);

-- TEMP: allow browsing supply requests so schedule links work without auth
drop policy if exists supply_requests_select_own on public.supply_requests;
create policy supply_requests_select_public
  on public.supply_requests
  for select
  to anon, authenticated
  using (true);

grant select on public.appointment_slots to anon, authenticated;
grant select on public.scheduling_requests to anon, authenticated;
grant select on public.scheduling_proposal_windows to anon, authenticated;
grant select on public.supply_requests to anon;

revoke insert, update, delete on public.appointment_slots from anon, authenticated;
revoke insert, update, delete on public.scheduling_requests from anon, authenticated;
revoke insert, update, delete on public.scheduling_proposal_windows from anon, authenticated;

-- Staff publishes one or more open slots: [{starts_at, ends_at}, ...]
create or replace function public.publish_appointment_slots(p_slots jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_item jsonb;
  v_starts timestamptz;
  v_ends timestamptz;
  v_ids uuid[] := '{}';
  v_id uuid;
begin
  if p_slots is null or jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) < 1 then
    raise exception 'Provide at least one slot';
  end if;

  for v_item in select * from jsonb_array_elements(p_slots)
  loop
    v_starts := (v_item->>'starts_at')::timestamptz;
    v_ends := (v_item->>'ends_at')::timestamptz;
    if v_starts is null or v_ends is null or v_ends <= v_starts then
      raise exception 'Each slot needs a valid starts_at and ends_at';
    end if;

    insert into public.appointment_slots (created_by, starts_at, ends_at, status)
    values (v_actor, v_starts, v_ends, 'open')
    returning id into v_id;

    v_ids := array_append(v_ids, v_id);
  end loop;

  return jsonb_build_object('slot_ids', to_jsonb(v_ids));
end;
$$;

-- Foster proposes WhenIsGood windows for a supply request
-- p_windows: [{day: 'YYYY-MM-DD', start_time: 'HH:MM', end_time: 'HH:MM'}, ...]
create or replace function public.propose_foster_availability(
  p_supply_request_id uuid,
  p_windows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foster_id uuid := auth.uid();
  v_scheduling_id uuid;
  v_item jsonb;
  v_day date;
  v_start time;
  v_end time;
begin
  if not exists (
    select 1 from public.supply_requests sr
    where sr.id = p_supply_request_id
      and sr.status = 'pending'
      and sr.fulfillment_method = 'pickup'
  ) then
    raise exception 'Supply request not found, not pending, or not pickup';
  end if;

  if exists (
    select 1 from public.scheduling_requests sr
    where sr.supply_request_id = p_supply_request_id
      and sr.status in ('pending', 'confirmed')
  ) then
    raise exception 'This supply request already has an active schedule';
  end if;

  if p_windows is null or jsonb_typeof(p_windows) <> 'array' or jsonb_array_length(p_windows) < 1 then
    raise exception 'Propose at least one availability window';
  end if;

  insert into public.scheduling_requests (
    supply_request_id, foster_id, status, mode
  )
  values (
    p_supply_request_id, v_foster_id, 'pending', 'foster_proposal'
  )
  returning id into v_scheduling_id;

  for v_item in select * from jsonb_array_elements(p_windows)
  loop
    v_day := (v_item->>'day')::date;
    v_start := (v_item->>'start_time')::time;
    v_end := (v_item->>'end_time')::time;
    if v_day is null or v_start is null or v_end is null or v_end <= v_start then
      raise exception 'Each window needs day, start_time, and end_time';
    end if;

    insert into public.scheduling_proposal_windows (
      scheduling_request_id, day, start_time, end_time
    )
    values (v_scheduling_id, v_day, v_start, v_end);
  end loop;

  return jsonb_build_object('scheduling_request_id', v_scheduling_id);
end;
$$;

-- Foster picks a staff open slot → pending staff confirm; slot held
create or replace function public.book_appointment_slot(
  p_supply_request_id uuid,
  p_slot_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foster_id uuid := auth.uid();
  v_scheduling_id uuid;
  v_updated integer;
begin
  if not exists (
    select 1 from public.supply_requests sr
    where sr.id = p_supply_request_id
      and sr.status = 'pending'
      and sr.fulfillment_method = 'pickup'
  ) then
    raise exception 'Supply request not found, not pending, or not pickup';
  end if;

  if exists (
    select 1 from public.scheduling_requests sr
    where sr.supply_request_id = p_supply_request_id
      and sr.status in ('pending', 'confirmed')
  ) then
    raise exception 'This supply request already has an active schedule';
  end if;

  update public.appointment_slots
  set status = 'held', updated_at = now()
  where id = p_slot_id and status = 'open';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Slot is not available';
  end if;

  insert into public.scheduling_requests (
    supply_request_id, foster_id, status, mode, selected_slot_id
  )
  values (
    p_supply_request_id, v_foster_id, 'pending', 'slot_pick', p_slot_id
  )
  returning id into v_scheduling_id;

  return jsonb_build_object('scheduling_request_id', v_scheduling_id);
end;
$$;

-- Staff confirms a foster slot pick → confirmed; slot booked
create or replace function public.confirm_slot_booking(p_scheduling_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_id uuid;
  v_starts timestamptz;
  v_ends timestamptz;
  v_updated integer;
begin
  select selected_slot_id into v_slot_id
  from public.scheduling_requests
  where id = p_scheduling_request_id
    and status = 'pending'
    and mode = 'slot_pick';

  if v_slot_id is null then
    raise exception 'Pending slot booking not found';
  end if;

  select starts_at, ends_at into v_starts, v_ends
  from public.appointment_slots
  where id = v_slot_id;

  update public.appointment_slots
  set status = 'booked', updated_at = now()
  where id = v_slot_id and status = 'held';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Held slot not found';
  end if;

  update public.scheduling_requests
  set
    status = 'confirmed',
    confirmed_starts_at = v_starts,
    confirmed_ends_at = v_ends,
    updated_at = now()
  where id = p_scheduling_request_id;
end;
$$;

-- Staff accepts foster proposal by selecting one proposed window
create or replace function public.accept_foster_proposal(
  p_scheduling_request_id uuid,
  p_window_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_start time;
  v_end time;
  v_updated integer;
begin
  select w.day, w.start_time, w.end_time
  into v_day, v_start, v_end
  from public.scheduling_proposal_windows w
  join public.scheduling_requests sr on sr.id = w.scheduling_request_id
  where w.id = p_window_id
    and sr.id = p_scheduling_request_id
    and sr.status = 'pending'
    and sr.mode = 'foster_proposal';

  if v_day is null then
    raise exception 'Proposal window not found for this pending request';
  end if;

  update public.scheduling_requests
  set
    status = 'confirmed',
    confirmed_starts_at = (v_day + v_start),
    confirmed_ends_at = (v_day + v_end),
    updated_at = now()
  where id = p_scheduling_request_id
    and status = 'pending'
    and mode = 'foster_proposal';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Pending foster proposal not found';
  end if;
end;
$$;

-- Cancel active scheduling (foster or staff). Releases held slots.
create or replace function public.cancel_scheduling_request(p_scheduling_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_id uuid;
  v_status text;
  v_updated integer;
begin
  select selected_slot_id, status
  into v_slot_id, v_status
  from public.scheduling_requests
  where id = p_scheduling_request_id;

  if v_status is null then
    raise exception 'Scheduling request not found';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Already cancelled';
  end if;

  update public.scheduling_requests
  set
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  where id = p_scheduling_request_id
    and status in ('pending', 'confirmed');

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Could not cancel scheduling request';
  end if;

  if v_slot_id is not null then
    update public.appointment_slots
    set
      status = case when status in ('held', 'booked') then 'open' else status end,
      updated_at = now()
    where id = v_slot_id
      and status in ('held', 'booked');
  end if;
end;
$$;

create or replace function public.cancel_appointment_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.appointment_slots
  set status = 'cancelled', updated_at = now()
  where id = p_slot_id and status = 'open';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Only open slots can be cancelled';
  end if;
end;
$$;

revoke all on function public.publish_appointment_slots(jsonb) from public;
revoke all on function public.propose_foster_availability(uuid, jsonb) from public;
revoke all on function public.book_appointment_slot(uuid, uuid) from public;
revoke all on function public.confirm_slot_booking(uuid) from public;
revoke all on function public.accept_foster_proposal(uuid, uuid) from public;
revoke all on function public.cancel_scheduling_request(uuid) from public;
revoke all on function public.cancel_appointment_slot(uuid) from public;

grant execute on function public.publish_appointment_slots(jsonb) to anon, authenticated;
grant execute on function public.propose_foster_availability(uuid, jsonb) to anon, authenticated;
grant execute on function public.book_appointment_slot(uuid, uuid) to anon, authenticated;
grant execute on function public.confirm_slot_booking(uuid) to anon, authenticated;
grant execute on function public.accept_foster_proposal(uuid, uuid) to anon, authenticated;
grant execute on function public.cancel_scheduling_request(uuid) to anon, authenticated;
grant execute on function public.cancel_appointment_slot(uuid) to anon, authenticated;
