import type { Placement } from "@/types";

export async function getPlacement(
  placementId: string,
): Promise<Placement | null> {
  // TODO: Query Supabase for one placement and enforce server-side authorization.
  void placementId;

  return null;
}
