import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupplyItem } from "@/types";

type SupplyItemRow = {
  id: string;
  name: string;
  category: string;
  unit_label: string;
  created_at: string;
};

function mapSupplyItem(row: SupplyItemRow): SupplyItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unitLabel: row.unit_label,
    createdAt: row.created_at,
  };
}

export async function getSupplyItems(): Promise<SupplyItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("supply_items")
    .select("id, name, category, unit_label, created_at")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapSupplyItem(row as SupplyItemRow));
}
