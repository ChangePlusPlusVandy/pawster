-- Link profiles to Supabase Auth accounts. New email sign-ins get a temporary
-- display name based on the email local part and the default foster role.
-- Existing profiles without an Auth account remain available to be claimed
-- when that person signs in for the first time.

alter table public.profiles
  alter column role set default 'foster';

-- Attach existing profiles to Auth users with matching email addresses.
-- Choose at most one profile for each Auth user to preserve the unique link.
with matching_profiles as (
  select
    profile.id as profile_id,
    auth_user.id as auth_user_id,
    row_number() over (
      partition by auth_user.id
      order by profile.created_at, profile.id
    ) as match_number
  from public.profiles as profile
  join auth.users as auth_user
    on lower(btrim(profile.email)) = lower(btrim(auth_user.email))
  where (
      profile.auth_user_id is null
      or not exists (
        select 1
        from auth.users as linked_user
        where linked_user.id = profile.auth_user_id
      )
    )
    and not exists (
      select 1
      from public.profiles as already_linked
      where already_linked.auth_user_id = auth_user.id
    )
)
update public.profiles as profile
set auth_user_id = matching_profiles.auth_user_id
from matching_profiles
where matching_profiles.match_number = 1
  and profile.id = matching_profiles.profile_id;

-- Clear stale IDs that do not refer to an Auth account. The profile data is
-- retained and can be claimed by email when the person signs in.
update public.profiles as profile
set auth_user_id = null
where profile.auth_user_id is not null
  and not exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = profile.auth_user_id
  );

-- Create profiles for existing email Auth users that do not already have one.
insert into public.profiles (auth_user_id, full_name, email, role)
select
  auth_user.id,
  coalesce(nullif(split_part(auth_user.email, '@', 1), ''), 'New Foster'),
  auth_user.email,
  'foster'
from auth.users as auth_user
where auth_user.email is not null
  and not exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id = auth_user.id
  )
on conflict (auth_user_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_auth_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users (id)
      on delete cascade;
  end if;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  temporary_name text;
  matched_profile_id uuid;
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Pawster accounts require an email address';
  end if;

  temporary_name := coalesce(
    nullif(split_part(new.email, '@', 1), ''),
    'New Foster'
  );

  -- Keep an already-linked profile intact and sync its email.
  update public.profiles
  set email = new.email
  where auth_user_id = new.id;

  if found then
    return new;
  end if;

  -- Reuse a roster profile with the same email, preserving its profile ID,
  -- name, role, and any foreign-key references to it.
  update public.profiles
  set
    auth_user_id = new.id,
    email = new.email,
    full_name = coalesce(nullif(btrim(full_name), ''), temporary_name)
  where id = (
    select profile.id
    from public.profiles as profile
    where profile.auth_user_id is null
      and lower(btrim(profile.email)) = lower(btrim(new.email))
    order by profile.created_at, profile.id
    limit 1
  )
  returning id into matched_profile_id;

  if matched_profile_id is not null then
    return new;
  end if;

  insert into public.profiles (auth_user_id, full_name, email, role)
  values (new.id, temporary_name, new.email, 'foster');

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_email_updated_sync_profile on auth.users;
create trigger on_auth_user_email_updated_sync_profile
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_new_auth_user();
