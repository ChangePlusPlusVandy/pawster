-- Tracks per-user completion of video and article resources on the Videos page.
-- resource_type: 'video' | 'article'
-- resource_id: YouTube video ID for videos, full URL for articles

create table public.resource_progress (
  id uuid primary key default extensions.gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  completed_at timestamptz not null default now(),
  constraint resource_progress_type_check check (resource_type in ('video', 'article')),
  constraint resource_progress_unique unique (profile_id, resource_type, resource_id)
);

create index resource_progress_profile_id_idx on public.resource_progress(profile_id);
