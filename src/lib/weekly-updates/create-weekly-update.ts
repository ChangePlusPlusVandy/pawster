import type { SupabaseClient } from "@supabase/supabase-js";

import { mapWeeklyUpdate, type WeeklyUpdateRow } from "@/lib/supabase/mappers";
import type { CreateWeeklyUpdateRequest, WeeklyUpdate } from "@/types";

export type CreateWeeklyUpdateInput = CreateWeeklyUpdateRequest & {
  submittedBy: string;
};

// Callers must verify the submitter has access to the placement first.
export async function createWeeklyUpdate(
  supabase: SupabaseClient,
  input: CreateWeeklyUpdateInput,
): Promise<WeeklyUpdate> {
  // TODO: Attach uploaded photos once storage uploads are wired up.
  const { data, error } = await supabase
    .from("weekly_updates")
    .insert({
      placement_id: input.placementId,
      submitted_by: input.submittedBy,
      notes: input.notes,
      behavior_concerns: input.behaviorConcerns ?? null,
      medical_concerns: input.medicalConcerns ?? null,
      needs_supplies: input.needsSupplies ?? false,
      status: "submitted",
    })
    .select("*")
    .single<WeeklyUpdateRow>();

  if (error) {
    throw error;
  }

  return mapWeeklyUpdate(data);
}
