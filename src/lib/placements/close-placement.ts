import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPlacement, type PlacementRow } from "@/lib/supabase/mappers";
import type { ClosePlacementRequest, Placement } from "@/types";
import { getPlacement } from "@/lib/placements/get-placement";
import { notFound } from "@/lib/api/http";
import { checkClosePlacement } from "@/lib/placements/placement-rules";
import { todayInShelterTimeZone } from "@/lib/placements/today";

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

    // 2. Validate against the close rules
    const decision = checkClosePlacement(
        existing,
        input.endDate,
        todayInShelterTimeZone(),
    );

    if(decision === "noop") {
        return existing;
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
