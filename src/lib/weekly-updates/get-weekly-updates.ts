import type { SupabaseClient } from "@supabase/supabase-js";

import { isStaff } from "@/lib/auth/get-current-profile";
import { getFosterPlacementIds } from "@/lib/placements/get-foster-placement-ids";
import { mapWeeklyUpdate, type WeeklyUpdateRow } from "@/lib/supabase/mappers";
import type { Profile, WeeklyUpdate } from "@/types";

export type GetWeeklyUpdatesFilters = {
  placementId?: string;
};

// Staff see every weekly update; fosters only see updates for their placements.
// TODO: Mirror this rule in Supabase RLS.
export async function getWeeklyUpdates(
  supabase: SupabaseClient,
  profile: Profile,
  filters: GetWeeklyUpdatesFilters = {},
): Promise<WeeklyUpdate[]> {
  let query = supabase
    .from("weekly_updates")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (filters.placementId) {
    query = query.eq("placement_id", filters.placementId);
  }

  if (!isStaff(profile)) {
    const { placementIds } = await getFosterPlacementIds(supabase, profile.id);

    if (placementIds.length === 0) {
      return [];
    }

    query = query.in("placement_id", placementIds);
  }

  const { data, error } = await query.returns<WeeklyUpdateRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapWeeklyUpdate);
}
