import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { EditPlacementRequest, Placement } from "@/types";
import { getPlacement } from "@/lib/placements/get-placement";
import { conflict, notFound } from "@/lib/api/http";
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

  // 3. Update only the end date and return result.
  // Filtering on status = "closed" makes the write conditional: if the placement
  // stopped being closed after we loaded it, no row matches and nothing is changed.
  const { data, error } = await supabase
    .from("placements")
    .update({ end_date: input.endDate, updated_at: new Date().toISOString() })
    .eq("id", placementId)
    .eq("status", "closed")
    .select("*")
    .maybeSingle<PlacementRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw conflict("Placement changed while editing. Reload and try again.");
  }

  return mapPlacement(data);
}
