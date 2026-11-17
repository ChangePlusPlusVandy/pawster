import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapSchedulingRequest,
  mapSlot,
  type AppointmentSlotRow,
  type SchedulingRequestRow,
} from "@/lib/scheduling/mappers";
import type { AppointmentSlot, SchedulingRequest } from "@/types";

const schedulingSelect = `
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
`;

export async function getStaffOpenSlots(): Promise<AppointmentSlot[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("id, created_by, starts_at, ends_at, status, created_at, updated_at")
    .in("status", ["open", "held", "booked"])
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AppointmentSlotRow[]).map(mapSlot);
}

export async function getPendingSchedulingRequests(): Promise<
  SchedulingRequest[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scheduling_requests")
    .select(schedulingSelect)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as SchedulingRequestRow[]).map(
    mapSchedulingRequest,
  );
}

export async function getConfirmedSchedulingRequests(): Promise<
  SchedulingRequest[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("scheduling_requests")
    .select(schedulingSelect)
    .eq("status", "confirmed")
    .order("confirmed_starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as SchedulingRequestRow[]).map(
    mapSchedulingRequest,
  );
}
