import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  acceptProposalSchema,
  bookSlotSchema,
  proposeAvailabilitySchema,
  publishSlotsSchema,
  type AcceptProposalInput,
  type BookSlotInput,
  type ProposeAvailabilityInput,
  type PublishSlotsInput,
} from "@/lib/scheduling/validation";

export async function publishAppointmentSlots(input: PublishSlotsInput) {
  const parsed = publishSlotsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid slots");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("publish_appointment_slots", {
    p_slots: parsed.data.slots.map((slot) => ({
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
    })),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { slot_ids: string[] };
}

export async function proposeFosterAvailability(
  input: ProposeAvailabilityInput,
) {
  const parsed = proposeAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid proposal");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("propose_foster_availability", {
    p_supply_request_id: parsed.data.supplyRequestId,
    p_windows: parsed.data.windows.map((window) => ({
      day: window.day,
      start_time: window.startTime,
      end_time: window.endTime,
    })),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { scheduling_request_id: string };
}

export async function bookAppointmentSlot(input: BookSlotInput) {
  const parsed = bookSlotSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("book_appointment_slot", {
    p_supply_request_id: parsed.data.supplyRequestId,
    p_slot_id: parsed.data.slotId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { scheduling_request_id: string };
}

export async function confirmSlotBooking(schedulingRequestId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("confirm_slot_booking", {
    p_scheduling_request_id: schedulingRequestId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptFosterProposal(input: AcceptProposalInput) {
  const parsed = acceptProposalSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid accept");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_foster_proposal", {
    p_scheduling_request_id: parsed.data.schedulingRequestId,
    p_window_id: parsed.data.windowId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function cancelSchedulingRequest(schedulingRequestId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_scheduling_request", {
    p_scheduling_request_id: schedulingRequestId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function cancelAppointmentSlot(slotId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_appointment_slot", {
    p_slot_id: slotId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
