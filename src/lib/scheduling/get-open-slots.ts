import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSlot, type AppointmentSlotRow } from "@/lib/scheduling/mappers";
import type { AppointmentSlot } from "@/types";

export async function getOpenSlots(): Promise<AppointmentSlot[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("id, created_by, starts_at, ends_at, status, created_at, updated_at")
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AppointmentSlotRow[]).map(mapSlot);
}
