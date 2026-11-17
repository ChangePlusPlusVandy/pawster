import {
  errorResponse,
  forbidden,
  ok,
  parseJsonBody,
  unauthenticated,
} from "@/lib/api/http";
import {
  closePlacementSchema,
  parseWith,
  placementParamsSchema,
} from "@/lib/api/validation";
import { requireStaff } from "@/lib/auth/require-staff";
import { closePlacement } from "@/lib/placements/close-placement";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
)  {
  try {
    const { id } = parseWith(placementParamsSchema, await params);
    const auth = await requireStaff();
    if (!auth.authorized) {
      throw auth.reason === "unauthenticated"
        ? unauthenticated()
        : forbidden("Only shelter staff can perform this action.");
    }

    const supabase = await createSupabaseServerClient();

    const input = parseWith(closePlacementSchema, await parseJsonBody(request));
    const placement = await closePlacement(supabase, id, input);

    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
