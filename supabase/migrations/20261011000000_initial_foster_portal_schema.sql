create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  shelterluv_person_id text,
  full_name text not null,
  email text not null,
  phone text,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  shelterluv_animal_id text unique,
  name text not null,
  species text not null,
  breed text,
  photo_url text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete restrict,
  foster_id uuid not null references public.profiles(id) on delete restrict,
  shelterluv_placement_id text,
  start_date date not null,
  end_date date,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_updates (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  notes text not null,
  behavior_concerns text,
  medical_concerns text,
  needs_supplies boolean not null default false,
  status text not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create table public.weekly_update_photos (
  id uuid primary key default gen_random_uuid(),
  weekly_update_id uuid not null references public.weekly_updates(id) on delete cascade,
  storage_path text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create index placements_pet_id_idx on public.placements(pet_id);
create index placements_foster_id_idx on public.placements(foster_id);
create index weekly_updates_placement_id_idx on public.weekly_updates(placement_id);
create index weekly_update_photos_weekly_update_id_idx on public.weekly_update_photos(weekly_update_id);
