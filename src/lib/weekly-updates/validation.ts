import { z } from "zod";

// UPD-01-T01: the weekly update questionnaire, modeled on the shelter's
// current "Weekly Update" Google Form.
//
// Versioning: every saved weekly update records the questionnaire version it
// was answered with. Once a version has been used, do not change its
// questions; add a new version (V2) instead, so older updates can still be
// read correctly.
//
// Rules decided with the team for V1 (enforced when saving, UPD-01-T03/T05):
// - one update per pet (placement), only for active placements
// - one update per placement per week
// - status is "submitted" when saved; fosters cannot edit after submitting
// - the submission time (submitted_at) replaces the form's "Today's Date"
// - "Pet(s) Name" is replaced by choosing the placement

export const CURRENT_QUESTIONNAIRE_VERSION = 1;

export const TRAVEL_DATES_MAX = 500;
export const WEEK_SUMMARY_MAX = 2000;
export const PROBLEMS_MAX = 2000;

// Photos and videos are part of the form but are uploaded and stored
// separately (weekly_update_photos, UPD-01-T04). Allowed file types and size
// limits come from the shared private storage work (CORE-04).
export const PHOTOS_MIN = 1;
export const PHOTOS_MAX = 10;

// Question wording copied from the Google Form so the UI can show it as-is.
export const weeklyUpdateQuestionsV1 = {
  travelDates: {
    label: "Are you going out of town this month?",
    helpText:
      'If so, please write down the exact dates you will need a holiday foster for your foster pet. e.g. "11/24 - 11/30"',
    required: true,
  },
  weekSummary: {
    label:
      "How was your foster pet's week? Do they have a favorite toy? A favorite activity?",
    helpText:
      "How would you describe their personality? Just a sentence or two is great!",
    required: true,
  },
  problems: {
    label: "Any problems or issues?",
    helpText: null,
    required: false,
  },
  photos: {
    label: "Please upload pictures and videos of your foster pet!",
    helpText:
      "These are so important for sending to our owners and helping spread the mission on social media",
    required: true,
  },
} as const;

const TRAVEL_DATES_REQUIRED =
  "Please tell us if you are going out of town this month.";
const WEEK_SUMMARY_REQUIRED = "Please tell us how your foster pet's week went.";

// The answers a foster gives for version 1. strictObject rejects any extra
// keys, so nothing unexpected ends up stored in the database.
export const weeklyUpdateAnswersV1Schema = z.strictObject({
  travelDates: z
    .string({ error: TRAVEL_DATES_REQUIRED })
    .trim()
    .min(1, TRAVEL_DATES_REQUIRED)
    .max(
      TRAVEL_DATES_MAX,
      `Travel dates must be ${TRAVEL_DATES_MAX} characters or fewer.`,
    ),
  weekSummary: z
    .string({ error: WEEK_SUMMARY_REQUIRED })
    .trim()
    .min(1, WEEK_SUMMARY_REQUIRED)
    .max(
      WEEK_SUMMARY_MAX,
      `Your update must be ${WEEK_SUMMARY_MAX} characters or fewer.`,
    ),
  // Optional: a blank or missing answer is stored as null.
  problems: z
    .string()
    .trim()
    .max(PROBLEMS_MAX, `Problems must be ${PROBLEMS_MAX} characters or fewer.`)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

// What the browser sends when a foster submits an update. The
// questionnaireVersion value decides which answers schema applies; a future
// version is added as another entry in this list.
export const submitWeeklyUpdateSchema = z.discriminatedUnion(
  "questionnaireVersion",
  [
    z.object({
      placementId: z.uuid("Choose which pet this update is for."),
      questionnaireVersion: z.literal(1),
      answers: weeklyUpdateAnswersV1Schema,
    }),
  ],
);

export type WeeklyUpdateAnswersV1 = z.infer<typeof weeklyUpdateAnswersV1Schema>;
export type SubmitWeeklyUpdateInput = z.infer<typeof submitWeeklyUpdateSchema>;
