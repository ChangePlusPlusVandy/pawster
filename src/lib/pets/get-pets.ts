import type { SupabaseClient } from "@supabase/supabase-js";

import { isStaff } from "@/lib/auth/get-current-profile";
import { getFosterPlacementIds } from "@/lib/placements/get-foster-placement-ids";
import { mapPet, type PetRow } from "@/lib/supabase/mappers";
import type { Pet, Profile } from "@/types";

// Staff see every pet; fosters only see pets they have been placed with.
// TODO: Mirror this rule in Supabase RLS.
export async function getPets(
  supabase: SupabaseClient,
  profile: Profile,
): Promise<Pet[]> {
  let query = supabase.from("pets").select("*").order("name");

  if (!isStaff(profile)) {
    const { petIds } = await getFosterPlacementIds(supabase, profile.id);

    if (petIds.length === 0) {
      return [];
    }

    query = query.in("id", petIds);
  }

  const { data, error } = await query.returns<PetRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapPet);
}
