import type { SupabaseClient } from "@supabase/supabase-js";

import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { Placement } from "@/types";

export async function getPlacement(
  supabase: SupabaseClient,
  placementId: string,
): Promise<Placement | null> {
  const { data, error } = await supabase
    .from("placements")
    .select("*")
    .eq("id", placementId)
    .maybeSingle<PlacementRow>();

  if (error) {
    throw error;
  }

  return data ? mapPlacement(data) : null;
}
