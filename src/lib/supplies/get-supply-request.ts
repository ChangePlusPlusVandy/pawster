import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FulfillmentMethod,
  SupplyRequest,
  SupplyRequestStatus,
} from "@/types";

type SupplyRequestRow = {
  id: string;
  check_in_id: string;
  foster_id: string | null;
  placement_id: string | null;
  status: SupplyRequestStatus;
  fulfillment_method: FulfillmentMethod;
  notes_to_staff: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSupplyRequest(
  id: string,
): Promise<SupplyRequest | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("supply_requests")
    .select(
      `
      id,
      check_in_id,
      foster_id,
      placement_id,
      status,
      fulfillment_method,
      notes_to_staff,
      fulfilled_at,
      cancelled_at,
      created_at,
      updated_at
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as SupplyRequestRow;
  return {
    id: row.id,
    checkInId: row.check_in_id,
    fosterId: row.foster_id,
    placementId: row.placement_id,
    status: row.status,
    fulfillmentMethod: row.fulfillment_method,
    notesToStaff: row.notes_to_staff,
    fulfilledAt: row.fulfilled_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [],
  };
}

export async function getRecentPickupRequests(
  limit = 20,
): Promise<SupplyRequest[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("supply_requests")
    .select(
      `
      id,
      check_in_id,
      foster_id,
      placement_id,
      status,
      fulfillment_method,
      notes_to_staff,
      fulfilled_at,
      cancelled_at,
      created_at,
      updated_at
    `,
    )
    .eq("fulfillment_method", "pickup")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SupplyRequestRow[]).map((row) => ({
    id: row.id,
    checkInId: row.check_in_id,
    fosterId: row.foster_id,
    placementId: row.placement_id,
    status: row.status,
    fulfillmentMethod: row.fulfillment_method,
    notesToStaff: row.notes_to_staff,
    fulfilledAt: row.fulfilled_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [],
  }));
}
