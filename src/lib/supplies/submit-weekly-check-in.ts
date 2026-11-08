import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  submitWeeklyCheckInSchema,
  type SubmitWeeklyCheckInInput,
} from "@/lib/supplies/validation";

export type SubmitWeeklyCheckInResult = {
  checkInId: string;
  requestId: string | null;
};

export async function submitWeeklyCheckIn(
  input: SubmitWeeklyCheckInInput,
): Promise<SubmitWeeklyCheckInResult> {
  const parsed = submitWeeklyCheckInSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid check-in");
  }

  const data = parsed.data;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to submit a check-in.");
  }

  const rpcItems = data.needsSupplies
    ? data.items.map((item) => {
        if ("supplyItemId" in item && item.supplyItemId) {
          return {
            supply_item_id: item.supplyItemId,
            quantity: item.quantity,
          };
        }
        return {
          custom_name: item.customName,
          quantity: item.quantity,
        };
      })
    : [];

  const { data: result, error } = await supabase.rpc("submit_weekly_check_in", {
    p_needs_supplies: data.needsSupplies,
    p_comments: data.comments || null,
    p_fulfillment_method: data.needsSupplies
      ? data.fulfillmentMethod
      : null,
    p_notes_to_staff: data.needsSupplies ? data.notesToStaff || null : null,
    p_items: rpcItems,
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = result as {
    check_in_id?: string;
    request_id?: string | null;
  } | null;

  if (!payload?.check_in_id) {
    throw new Error("Check-in did not return an id.");
  }

  return {
    checkInId: payload.check_in_id,
    requestId: payload.request_id ?? null,
  };
}
