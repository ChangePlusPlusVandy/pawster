import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Placement } from "@/types";

export async function getActivePlacements(): Promise<Placement[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("placements")
    .select("*")
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to get active placements: ${error.message}`);
  }

  return data.map((placement) => ({
    id: placement.id,
    petId: placement.pet_id,
    fosterId: placement.foster_id,
    shelterluvPlacementId: placement.shelterluv_placement_id,
    startDate: placement.start_date,
    endDate: placement.end_date,
    status: placement.status,
    createdAt: placement.created_at,
    updatedAt: placement.updated_at,
  }));
}