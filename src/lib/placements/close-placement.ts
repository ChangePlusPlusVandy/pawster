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

    // 3. Update and return result.
    // Filtering on status = "active" makes the write conditional: if another request
    // closed the placement after we loaded it, no row matches and nothing is overwritten.
    const { data, error } = await supabase
        .from("placements")
        .update({
            end_date: input.endDate,
            status: "closed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", placementId)
        .eq("status", "active")
        .select("*")
        .maybeSingle<PlacementRow>();

    if(error)   {
        throw error;
    }

    // 4. Lost a race with another close: reload and re-apply the rules so a
    // same-date repeat is still a no-op and a different date is still a 409.
    if(!data)   {
        const current = await getPlacement(supabase, placementId);
        if(!current)    {
            throw notFound("Placement not found.");
        }
        checkClosePlacement(current, input.endDate, todayInShelterTimeZone());
        return current;
    }

    return mapPlacement(data);
}
