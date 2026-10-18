import type { SupabaseClient } from "@supabase/supabase-js";

import { isStaff } from "@/lib/auth/get-current-profile";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { Placement, Profile } from "@/types";

// Staff see every active placement; fosters only see their own.
// TODO: Mirror this rule in Supabase RLS.
export async function getActivePlacements(
  supabase: SupabaseClient,
  profile: Profile,
): Promise<Placement[]> {
  let query = supabase
    .from("placements")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: false });

  if (!isStaff(profile)) {
    query = query.eq("foster_id", profile.id);
  }

  const { data, error } = await query.returns<PlacementRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapPlacement);
}
