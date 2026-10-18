import type { SupabaseClient } from "@supabase/supabase-js";

import { badRequest } from "@/lib/api/http";
import { isForeignKeyViolation } from "@/lib/supabase/errors";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { CreatePlacementRequest, Placement } from "@/types";

export type CreatePlacementInput = CreatePlacementRequest;

export async function createPlacement(
  supabase: SupabaseClient,
  input: CreatePlacementInput,
): Promise<Placement> {
  const { data, error } = await supabase
    .from("placements")
    .insert({
      pet_id: input.petId,
      foster_id: input.fosterId,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      status: input.status ?? "active",
      shelterluv_placement_id: input.shelterluvPlacementId ?? null,
    })
    .select("*")
    .single<PlacementRow>();

  if (error) {
    if (isForeignKeyViolation(error)) {
      throw badRequest("petId or fosterId does not reference an existing record.");
    }
    throw error;
  }

  return mapPlacement(data);
}
