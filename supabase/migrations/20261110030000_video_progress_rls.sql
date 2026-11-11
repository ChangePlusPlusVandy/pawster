-- Lock down video/progress tables and grant the access the API routes need.
-- Progress rows are owned by the profile linked to the signed-in auth user.

alter table public.resource_progress enable row level security;
alter table public.video_sections enable row level security;
alter table public.video_resources enable row level security;

drop policy if exists resource_progress_select_own on public.resource_progress;
drop policy if exists resource_progress_insert_own on public.resource_progress;
drop policy if exists resource_progress_update_own on public.resource_progress;
drop policy if exists video_sections_select on public.video_sections;
drop policy if exists video_resources_select on public.video_resources;

create policy resource_progress_select_own on public.resource_progress
  for select to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy resource_progress_insert_own on public.resource_progress
  for insert to authenticated
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- upsert (ON CONFLICT DO UPDATE) also needs an update policy
create policy resource_progress_update_own on public.resource_progress
  for update to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy video_sections_select on public.video_sections
  for select to authenticated using (true);
create policy video_resources_select on public.video_resources
  for select to authenticated using (true);

grant select, insert, update on public.resource_progress to authenticated;
grant select on public.video_sections to authenticated;
grant select on public.video_resources to authenticated;
