import { badRequest, conflict } from "@/lib/api/http";
import type { Placement } from "@/types";

export type ClosePlacementDecision = "close" | "noop";
export type EditEndDateDecision = "edit" | "noop";

// Shared date rules for any change to a placement's end date (close and edit).
// All dates are YYYY-MM-DD strings, which compare correctly as plain strings.
export function checkEndDate(startDate: string, endDate: string, today: string): void {
  // Validation -- end date can't be before the existing start date
  if (endDate < startDate) {
    throw badRequest("Invalid request body.", {
      endDate: ["End date cannot be before start date."],
    });
  }

  // throws badRequest if endDate is after today because placements should only be closed after
  // it already happened
  if (endDate > today) {
    throw badRequest("Invalid request body.", {
      endDate: ["End date cannot be in the future."],
    });
  }
}

// Rules for closing a placement
export function checkClosePlacement(
  existing: Placement,
  endDate: string,
  today: string,
): ClosePlacementDecision {
  // Already closed with same end date - do nothing
  if (existing.status === "closed" && existing.endDate === endDate) {
    return "noop";
  }

  // Already closed with different end date - throw conflict
  // Updating closed placement is different request
  if (existing.status === "closed") {
    throw conflict("Placement is already closed with a different end date.");
  }

  // Throws conflict if status isn't explicitly "active"
  if (existing.status !== "active") {
    throw conflict("Only active placements can be closed.");
  }

  checkEndDate(existing.startDate, endDate, today);

  // every check passed -- set end_date and status "closed".
  return "close";
}

// Rules for editing the end date of an already-closed placement
export function checkEditEndDate(
  existing: Placement,
  endDate: string,
  today: string,
): EditEndDateDecision {
  // Only closed placements have a real end date to correct; active ones should be closed instead
  if (existing.status !== "closed") {
    throw conflict("Only closed placements can have their end date edited.");
  }

  // Same end date as already stored - do nothing
  if (existing.endDate === endDate) {
    return "noop";
  }

  checkEndDate(existing.startDate, endDate, today);

  // every check passed -- update end_date only.
  return "edit";
}
