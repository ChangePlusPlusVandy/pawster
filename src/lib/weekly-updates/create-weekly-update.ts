import type { WeeklyUpdate } from "@/types";

export type CreateWeeklyUpdateInput = {
  placementId: string;
  notes: string;
  behaviorConcerns?: string | null;
  medicalConcerns?: string | null;
  needsSupplies?: boolean;
};

export async function createWeeklyUpdate(
  input: CreateWeeklyUpdateInput,
): Promise<WeeklyUpdate | null> {
  // TODO: Validate input, insert the weekly update in Supabase, and attach uploaded photos.
  void input;

  return null;
}
