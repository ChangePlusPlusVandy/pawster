"use server";

import { revalidatePath } from "next/cache";
import {
  bookAppointmentSlot,
  cancelSchedulingRequest,
  proposeFosterAvailability,
} from "@/lib/scheduling/mutations";
import {
  bookSlotSchema,
  proposeAvailabilitySchema,
  type BookSlotInput,
  type ProposeAvailabilityInput,
} from "@/lib/scheduling/validation";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function revalidateSchedule(supplyRequestId: string) {
  revalidatePath(`/supply-request/${supplyRequestId}/schedule`);
  revalidatePath("/staff/appointments");
  revalidatePath("/supply-request");
}

export async function proposeAvailabilityAction(
  input: ProposeAvailabilityInput,
): Promise<ActionResult> {
  const parsed = proposeAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid proposal",
    };
  }

  try {
    await proposeFosterAvailability(parsed.data);
    revalidateSchedule(parsed.data.supplyRequestId);
    return {
      ok: true,
      message: "Availability submitted. Waiting on staff to confirm a time.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not submit availability.",
    };
  }
}

export async function bookSlotAction(
  input: BookSlotInput,
): Promise<ActionResult> {
  const parsed = bookSlotSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid booking",
    };
  }

  try {
    await bookAppointmentSlot(parsed.data);
    revalidateSchedule(parsed.data.supplyRequestId);
    return {
      ok: true,
      message: "Slot selected. Waiting on staff confirmation.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not book this slot.",
    };
  }
}

export async function cancelSchedulingAction(
  schedulingRequestId: string,
  supplyRequestId: string,
): Promise<ActionResult> {
  try {
    await cancelSchedulingRequest(schedulingRequestId);
    revalidateSchedule(supplyRequestId);
    return {
      ok: true,
      message: "Schedule cancelled. You can book or propose again.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not cancel schedule.",
    };
  }
}
