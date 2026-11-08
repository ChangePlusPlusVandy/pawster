import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FulfillmentMethod,
  SupplyRequest,
  SupplyRequestItem,
  SupplyRequestStatus,
} from "@/types";

type SupplyItemEmbed = {
  id: string;
  name: string;
  category: string;
  unit_label: string;
};

type SupplyRequestItemRow = {
  id: string;
  request_id: string;
  supply_item_id: string | null;
  custom_name: string | null;
  quantity: number;
  supply_items: SupplyItemEmbed | SupplyItemEmbed[] | null;
};

type SupplyRequestRow = {
  id: string;
  check_in_id: string;
  foster_id: string;
  placement_id: string | null;
  status: SupplyRequestStatus;
  fulfillment_method: FulfillmentMethod;
  notes_to_staff: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  supply_request_items: SupplyRequestItemRow[] | null;
};

function normalizeEmbed(
  value: SupplyItemEmbed | SupplyItemEmbed[] | null,
): SupplyItemEmbed | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapItem(row: SupplyRequestItemRow): SupplyRequestItem {
  const supplyItem = normalizeEmbed(row.supply_items);
  return {
    id: row.id,
    requestId: row.request_id,
    supplyItemId: row.supply_item_id,
    customName: row.custom_name,
    quantity: row.quantity,
    supplyItem: supplyItem
      ? {
          id: supplyItem.id,
          name: supplyItem.name,
          category: supplyItem.category,
          unitLabel: supplyItem.unit_label,
        }
      : null,
  };
}

function mapRequest(row: SupplyRequestRow): SupplyRequest {
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
    items: (row.supply_request_items ?? []).map(mapItem),
  };
}

export async function getMySupplyRequests(): Promise<SupplyRequest[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

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
      updated_at,
      supply_request_items (
        id,
        request_id,
        supply_item_id,
        custom_name,
        quantity,
        supply_items (
          id,
          name,
          category,
          unit_label
        )
      )
    `,
    )
    .eq("foster_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as SupplyRequestRow[]).map(mapRequest);
}
