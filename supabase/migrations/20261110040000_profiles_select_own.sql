-- The progress API routes and RLS policies look up the signed-in user's
-- profile row (profiles.auth_user_id = auth.uid()). With RLS enabled on
-- profiles and no policy, that lookup returns nothing and progress can't
-- be saved or loaded.

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth_user_id = auth.uid());

grant select on public.profiles to authenticated;
