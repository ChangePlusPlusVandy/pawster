-- UPD-01-T01: version the weekly update questionnaire.
--
-- Each weekly update records which questionnaire version the foster answered
-- and stores the foster's original answers as a JSON object. The questions and
-- validation rules for each version live in
-- src/lib/weekly-updates/validation.ts.
--
-- Version 1 answers look like:
--   {"travelDates": "No", "weekSummary": "...", "problems": null}
-- The week summary is also saved in the existing notes column.

-- The defaults fill in any rows that already exist.
alter table public.weekly_updates
  add column questionnaire_version integer not null default 1,
  add column answers jsonb not null default '{}'::jsonb;

-- Remove the defaults so every new update must say which version it used
-- and include its answers.
alter table public.weekly_updates
  alter column questionnaire_version drop default,
  alter column answers drop default;

alter table public.weekly_updates
  add constraint weekly_updates_questionnaire_version_positive
    check (questionnaire_version >= 1),
  add constraint weekly_updates_answers_is_object
    check (jsonb_typeof(answers) = 'object');
