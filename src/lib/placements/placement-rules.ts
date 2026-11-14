import { badRequest, conflict } from "@/lib/api/http";
import type { Placement } from "@/types";

export type ClosePlacementDecision = "close" | "noop";

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

  // Validation -- end date must be after the existing start date
  if (endDate < existing.startDate) {
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

  // every check passed -- set end_date and status "closed".
  return "close";
}
