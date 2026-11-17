"use server";

import { revalidatePath } from "next/cache";
import {
  acceptFosterProposal,
  cancelAppointmentSlot,
  cancelSchedulingRequest,
  confirmSlotBooking,
  publishAppointmentSlots,
} from "@/lib/scheduling/mutations";
import {
  acceptProposalSchema,
  publishSlotsSchema,
  type AcceptProposalInput,
  type PublishSlotsInput,
} from "@/lib/scheduling/validation";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function revalidateStaff(supplyRequestId?: string) {
  revalidatePath("/staff/appointments");
  if (supplyRequestId) {
    revalidatePath(`/supply-request/${supplyRequestId}/schedule`);
  }
}

export async function publishSlotsAction(
  input: PublishSlotsInput,
): Promise<ActionResult> {
  const parsed = publishSlotsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid slots",
    };
  }

  try {
    await publishAppointmentSlots(parsed.data);
    revalidateStaff();
    return { ok: true, message: "Open slots published." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not publish slots.",
    };
  }
}

export async function confirmSlotBookingAction(
  schedulingRequestId: string,
  supplyRequestId: string,
): Promise<ActionResult> {
  try {
    await confirmSlotBooking(schedulingRequestId);
    revalidateStaff(supplyRequestId);
    return { ok: true, message: "Appointment confirmed." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not confirm booking.",
    };
  }
}

export async function acceptProposalAction(
  input: AcceptProposalInput & { supplyRequestId: string },
): Promise<ActionResult> {
  const parsed = acceptProposalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid accept",
    };
  }

  try {
    await acceptFosterProposal(parsed.data);
    revalidateStaff(input.supplyRequestId);
    return { ok: true, message: "Proposal accepted. Appointment confirmed." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not accept proposal.",
    };
  }
}

export async function cancelSchedulingStaffAction(
  schedulingRequestId: string,
  supplyRequestId: string,
): Promise<ActionResult> {
  try {
    await cancelSchedulingRequest(schedulingRequestId);
    revalidateStaff(supplyRequestId);
    return { ok: true, message: "Scheduling request cancelled." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not cancel request.",
    };
  }
}

export async function cancelOpenSlotAction(
  slotId: string,
): Promise<ActionResult> {
  try {
    await cancelAppointmentSlot(slotId);
    revalidateStaff();
    return { ok: true, message: "Open slot cancelled." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not cancel slot.",
    };
  }
}
