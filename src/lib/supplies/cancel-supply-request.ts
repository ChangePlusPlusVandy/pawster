import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function cancelSupplyRequest(requestId: string): Promise<void> {
  if (!requestId) {
    throw new Error("Request id is required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to cancel a request.");
  }

  const { error } = await supabase.rpc("cancel_supply_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
