-- Stores the sections and resources (videos + articles) shown on the Videos page.

create table public.video_sections (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  display_order int not null,
  created_at timestamptz not null default now()
);

create table public.video_resources (
  id uuid primary key default extensions.gen_random_uuid(),
  section_id uuid not null references public.video_sections(id) on delete cascade,
  resource_type text not null,
  title text not null,
  youtube_id text,       -- videos only
  start_seconds int,     -- videos only, optional
  href text,             -- articles only
  required boolean not null default false,
  display_order int not null,
  created_at timestamptz not null default now(),
  constraint video_resources_type_check check (resource_type in ('video', 'article'))
);

create index video_resources_section_id_idx on public.video_resources(section_id);

-- Seed: Fostering Dogs
insert into public.video_sections (id, title, display_order) values
  ('a1000000-0000-0000-0000-000000000001', 'Fostering Dogs', 1),
  ('a1000000-0000-0000-0000-000000000002', 'Fostering Cats', 2);

insert into public.video_resources (section_id, resource_type, title, youtube_id, start_seconds, href, required, display_order) values
  ('a1000000-0000-0000-0000-000000000001', 'video',   'How to Greet a Dog So You''ll Become Friends',                      '4ugWXnbMoIo', null, null, true,  1),
  ('a1000000-0000-0000-0000-000000000001', 'video',   'Dog Training With Positive Reinforcement',                          'c-GW0zi7nmk', null, null, true,  2),
  ('a1000000-0000-0000-0000-000000000001', 'video',   'Meeting New Dogs',                                                  'qD4M9gpHkNI', null, null, true,  3),
  ('a1000000-0000-0000-0000-000000000001', 'video',   'Keeping Interactions between Foster Dogs and Children Safe',        'm5RbwhhzlNo', 3,    null, true,  4),
  ('a1000000-0000-0000-0000-000000000001', 'video',   'Introducing Your Foster Dog to Cats',                               'BRlxhvQ8I9g', null, null, true,  5),
  ('a1000000-0000-0000-0000-000000000001', 'article', 'How to Successfully Introduce Two Dogs',                            null,          null, 'https://www.animalhumanesociety.org/resource/how-successfully-introduce-two-dogs', true, 6),

  ('a1000000-0000-0000-0000-000000000002', 'video',   'How To Properly Greet Cats',                                        '00ZUeW-6wBI', null, null, true,  1),
  ('a1000000-0000-0000-0000-000000000002', 'video',   'Bringing Your Foster Cat Home',                                     'd-ZcYXmkvjY', null, null, true,  2),
  ('a1000000-0000-0000-0000-000000000002', 'video',   'Low Stress Cat Transport Best',                                     'b_M-AuwrDY8', null, null, true,  3),
  ('a1000000-0000-0000-0000-000000000002', 'video',   'The Do''s & Don''ts of Introducing Cats',                           'lSDI5diNu4Y', 5,    null, true,  4),
  ('a1000000-0000-0000-0000-000000000002', 'video',   'Cat Introductions: Good First Impressions are a must!',             'ojS7XwtoXtw', null, null, false, 5),
  ('a1000000-0000-0000-0000-000000000002', 'article', 'The Do''s & Don''ts of Introducing Cats',                           null,          null, 'https://www.jacksongalaxy.com/blogs/news/the-dos-and-donts-of-introducing-cats', false, 6);
