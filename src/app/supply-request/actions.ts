"use server";

import { revalidatePath } from "next/cache";
import { cancelSupplyRequest } from "@/lib/supplies/cancel-supply-request";
import { submitWeeklyCheckIn } from "@/lib/supplies/submit-weekly-check-in";
import {
  submitWeeklyCheckInSchema,
  type SubmitWeeklyCheckInInput,
} from "@/lib/supplies/validation";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function submitWeeklyCheckInAction(
  input: SubmitWeeklyCheckInInput,
): Promise<ActionResult> {
  const parsed = submitWeeklyCheckInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid check-in",
    };
  }

  try {
    const result = await submitWeeklyCheckIn(parsed.data);
    revalidatePath("/supply-request");
    return {
      ok: true,
      message: result.requestId
        ? "Supply request submitted. Thanks for checking in."
        : "Check-in saved. No supplies needed this time.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Could not submit check-in.",
    };
  }
}

export async function cancelSupplyRequestAction(
  requestId: string,
): Promise<ActionResult> {
  try {
    await cancelSupplyRequest(requestId);
    revalidatePath("/supply-request");
    return { ok: true, message: "Request cancelled." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not cancel the request.",
    };
  }
}
