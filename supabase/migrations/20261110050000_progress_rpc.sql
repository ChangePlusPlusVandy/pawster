-- Progress access via SECURITY DEFINER functions keyed on auth.uid(), so it
-- works regardless of profiles RLS and self-heals a missing/unlinked profile.

create or replace function public.current_profile_id()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  pid uuid;
begin
  if uid is null then
    return null;
  end if;

  select id into pid from public.profiles where auth_user_id = uid limit 1;
  if pid is not null then
    return pid;
  end if;

  select email into user_email from auth.users where id = uid;
  if user_email is null or btrim(user_email) = '' then
    return null;
  end if;

  -- claim an unlinked roster profile with the same email
  update public.profiles
  set auth_user_id = uid
  where id = (
    select p.id from public.profiles p
    where p.auth_user_id is null
      and lower(btrim(p.email)) = lower(btrim(user_email))
    order by p.created_at, p.id
    limit 1
  )
  returning id into pid;
  if pid is not null then
    return pid;
  end if;

  insert into public.profiles (auth_user_id, full_name, email, role)
  values (
    uid,
    coalesce(nullif(split_part(user_email, '@', 1), ''), 'New Foster'),
    user_email,
    'foster'
  )
  returning id into pid;
  return pid;
end;
$$;

create or replace function public.get_resource_progress()
returns table (resource_type text, resource_id text, completed_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select rp.resource_type, rp.resource_id, rp.completed_at
  from public.resource_progress rp
  where rp.profile_id = public.current_profile_id();
$$;

create or replace function public.mark_resource_complete(p_type text, p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := public.current_profile_id();
begin
  if pid is null then
    raise exception 'No profile for current user' using errcode = '28000';
  end if;
  insert into public.resource_progress (profile_id, resource_type, resource_id)
  values (pid, p_type, p_id)
  on conflict (profile_id, resource_type, resource_id) do nothing;
end;
$$;

revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.get_resource_progress() from public, anon;
revoke all on function public.mark_resource_complete(text, text) from public, anon;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.get_resource_progress() to authenticated;
grant execute on function public.mark_resource_complete(text, text) to authenticated;
