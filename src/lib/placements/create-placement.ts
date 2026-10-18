import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreatePlacementInput, Placement } from "@/types";

export async function createPlacement(
  input: CreatePlacementInput,
): Promise<Placement> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("placements")
    .insert({
      pet_id: input.petId,
      foster_id: input.fosterId,
      shelterluv_placement_id: input.shelterluvPlacementId ?? null,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create placement: ${error.message}`);
  }

  return {
    id: data.id,
    petId: data.pet_id,
    fosterId: data.foster_id,
    shelterluvPlacementId: data.shelterluv_placement_id,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}