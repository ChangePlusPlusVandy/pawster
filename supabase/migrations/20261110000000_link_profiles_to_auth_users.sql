-- Keep Pawster profile rows linked to Supabase Auth users. New email sign-ins
-- receive a temporary display name based on the email local part and the
-- default foster role; onboarding can replace the name later.

alter table public.profiles
  alter column role set default 'foster';

-- Link existing profiles by email when possible. Keep their existing name and
-- role so this migration does not overwrite manually maintained profile data.
update public.profiles as profile
set auth_user_id = auth_user.id
from auth.users as auth_user
where (
    profile.auth_user_id is null
    or not exists (
      select 1
      from auth.users as linked_user
      where linked_user.id = profile.auth_user_id
    )
  )
  and profile.email is not null
  and lower(btrim(profile.email)) = lower(btrim(auth_user.email));

-- Backfill profiles for existing email Auth accounts. New accounts are handled
-- by the trigger below. The unique auth_user_id constraint makes this safe to
-- run if a profile already exists for the account.
insert into public.profiles (auth_user_id, full_name, email, role)
select
  auth_user.id,
  coalesce(nullif(split_part(auth_user.email, '@', 1), ''), 'New Foster'),
  auth_user.email,
  'foster'
from auth.users as auth_user
where auth_user.email is not null
on conflict (auth_user_id) do update
set email = excluded.email;

do $$
begin
  if exists (
    select 1
    from public.profiles as profile
    where profile.auth_user_id is null
       or not exists (
         select 1
         from auth.users as auth_user
         where auth_user.id = profile.auth_user_id
       )
  ) then
    raise exception
      'Cannot require profile auth links: map existing profiles to auth.users by email or remove obsolete profiles first';
  end if;
end;
$$;

alter table public.profiles
  alter column auth_user_id set not null;

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
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Pawster accounts require an email address';
  end if;

  temporary_name := coalesce(
    nullif(split_part(new.email, '@', 1), ''),
    'New Foster'
  );

  insert into public.profiles (auth_user_id, full_name, email, role)
  values (new.id, temporary_name, new.email, 'foster')
  on conflict (auth_user_id) do update
    set email = excluded.email;

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
