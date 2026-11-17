import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapSchedulingRequest,
  type SchedulingRequestRow,
} from "@/lib/scheduling/mappers";
import type { SchedulingRequest } from "@/types";

export async function getActiveSchedulingForSupplyRequest(
  supplyRequestId: string,
): Promise<SchedulingRequest | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scheduling_requests")
    .select(
      `
      id,
      supply_request_id,
      foster_id,
      status,
      mode,
      selected_slot_id,
      confirmed_starts_at,
      confirmed_ends_at,
      cancelled_at,
      created_at,
      updated_at,
      appointment_slots (
        id,
        created_by,
        starts_at,
        ends_at,
        status,
        created_at,
        updated_at
      ),
      scheduling_proposal_windows (
        id,
        scheduling_request_id,
        day,
        start_time,
        end_time
      )
    `,
    )
    .eq("supply_request_id", supplyRequestId)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapSchedulingRequest(data as unknown as SchedulingRequestRow);
}
