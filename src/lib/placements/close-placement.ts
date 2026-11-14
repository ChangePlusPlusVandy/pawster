import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { ClosePlacementRequest, Placement } from "@/types";
import { getPlacement } from "@/lib/placements/get-placement";
import { notFound, badRequest } from "@/lib/api/http";

export type ClosePlacementInput = ClosePlacementRequest;

export async function closePlacement(
    supabase: SupabaseClient,
    placementId: string,
    input: ClosePlacementInput,
):  Promise<Placement>   {
    // 1. Load the existing placement
    const existing = await getPlacement(supabase, placementId);
    if(!existing)   {
        throw notFound("Placement not found.");
    }

    // 2. Validate
    const startDate = new Date(existing.startDate).getTime();
    const endDate = new Date(input.endDate).getTime();

    if(startDate >= endDate) {
        throw badRequest("Invalid request body.",   {
            endDate: ["End date must be after start date."],
        });
    }

    // 3. Update and return result
    const { data, error } = await supabase
        .from("placements")
        .update({
            end_date: input.endDate,
            status: "closed"
        })
        .eq("id", placementId)
        .select("*")
        .single<PlacementRow>();

    if(error)   {
        throw error;
    }

    return mapPlacement(data);
}
