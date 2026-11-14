import { describe, expect, it } from "vitest";
import {
  submitWeeklyUpdateSchema,
  WEEK_SUMMARY_MAX,
} from "../../src/lib/weekly-updates/validation";

const placementId = "6f1c2b7e-4d3a-4c5b-9e8f-1a2b3c4d5e6f";

function validSubmission() {
  return {
    placementId,
    questionnaireVersion: 1,
    answers: {
      travelDates: "No",
      weekSummary: "Biscuit loved the squeaky duck and napped a lot.",
      problems: "Chewed one shoe.",
    },
  };
}

describe("submitWeeklyUpdateSchema (questionnaire version 1)", () => {
  it("accepts a valid submission and trims answers", () => {
    const result = submitWeeklyUpdateSchema.parse({
      ...validSubmission(),
      answers: {
        travelDates: "  11/24 - 11/30  ",
        weekSummary: "  Great week!  ",
        problems: "  ",
      },
    });

    expect(result).toEqual({
      placementId,
      questionnaireVersion: 1,
      answers: {
        travelDates: "11/24 - 11/30",
        weekSummary: "Great week!",
        problems: null,
      },
    });
  });

  it("stores a missing optional problems answer as null", () => {
    const submission = validSubmission();
    const answers = {
      travelDates: submission.answers.travelDates,
      weekSummary: submission.answers.weekSummary,
    };

    const result = submitWeeklyUpdateSchema.parse({ ...submission, answers });

    expect(result.answers.problems).toBeNull();
  });

  it("rejects a missing required travel answer", () => {
    const submission = validSubmission();
    const answers = {
      weekSummary: submission.answers.weekSummary,
      problems: submission.answers.problems,
    };

    const result = submitWeeklyUpdateSchema.safeParse({
      ...submission,
      answers,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a blank required week summary", () => {
    const submission = validSubmission();

    const result = submitWeeklyUpdateSchema.safeParse({
      ...submission,
      answers: { ...submission.answers, weekSummary: "   " },
    });

    expect(result.success).toBe(false);
  });

  it("rejects answers that are too long", () => {
    const submission = validSubmission();

    const result = submitWeeklyUpdateSchema.safeParse({
      ...submission,
      answers: {
        ...submission.answers,
        weekSummary: "a".repeat(WEEK_SUMMARY_MAX + 1),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects questions that are not part of version 1", () => {
    const submission = validSubmission();

    const result = submitWeeklyUpdateSchema.safeParse({
      ...submission,
      answers: { ...submission.answers, favoriteColor: "blue" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown questionnaire version", () => {
    const result = submitWeeklyUpdateSchema.safeParse({
      ...validSubmission(),
      questionnaireVersion: 2,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a placement ID that is not a UUID", () => {
    const result = submitWeeklyUpdateSchema.safeParse({
      ...validSubmission(),
      placementId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});
