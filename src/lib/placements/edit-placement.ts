import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { EditPlacementRequest, Placement } from "@/types";
import { getPlacement } from "@/lib/placements/get-placement";
import { notFound } from "@/lib/api/http";
import { checkEditEndDate } from "@/lib/placements/placement-rules";
import { todayInShelterTimeZone } from "@/lib/placements/today";

export type EditPlacementInput = EditPlacementRequest;

// Corrects the end date of an already-closed placement.
// Always updates the existing row (never inserts), so repeated edits stay on one record.
export async function editPlacement(
  supabase: SupabaseClient,
  placementId: string,
  input: EditPlacementInput,
): Promise<Placement> {
  // 1. Load the existing placement
  const existing = await getPlacement(supabase, placementId);
  if (!existing) {
    throw notFound("Placement not found.");
  }

  // 2. Validate against the edit rules
  const decision = checkEditEndDate(existing, input.endDate, todayInShelterTimeZone());

  // Same end date as already stored - nothing to change
  if (decision === "noop") {
    return existing;
  }

  // 3. Update only the end date and return result
  const { data, error } = await supabase
    .from("placements")
    .update({ end_date: input.endDate })
    .eq("id", placementId)
    .select("*")
    .single<PlacementRow>();

  if (error) {
    throw error;
  }

  return mapPlacement(data);
}
