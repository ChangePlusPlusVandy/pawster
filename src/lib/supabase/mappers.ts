import type { Placement } from "@/types";

// Row shapes as returned by Supabase (snake_case columns).

export type PlacementRow = {
  id: string;
  pet_id: string;
  foster_id: string;
  shelterluv_placement_id: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapPlacement(row: PlacementRow): Placement {
  return {
    id: row.id,
    petId: row.pet_id,
    fosterId: row.foster_id,
    shelterluvPlacementId: row.shelterluv_placement_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
