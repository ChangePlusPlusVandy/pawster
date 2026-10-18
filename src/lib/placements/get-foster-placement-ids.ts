import type { SupabaseClient } from "@supabase/supabase-js";

export async function getFosterPlacementIds(
  supabase: SupabaseClient,
  fosterId: string,
): Promise<{ placementIds: string[]; petIds: string[] }> {
  const { data, error } = await supabase
    .from("placements")
    .select("id, pet_id")
    .eq("foster_id", fosterId)
    .returns<{ id: string; pet_id: string }[]>();

  if (error) {
    throw error;
  }

  return {
    placementIds: data.map((row) => row.id),
    petIds: [...new Set(data.map((row) => row.pet_id))],
  };
}
