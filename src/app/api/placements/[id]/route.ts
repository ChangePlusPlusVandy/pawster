import {
  errorResponse,
  forbidden,
  ok,
  parseJsonBody,
  unauthenticated,
} from "@/lib/api/http";
import {
  editPlacementSchema,
  parseWith,
  placementParamsSchema,
} from "@/lib/api/validation";
import { requireStaff } from "@/lib/auth/require-staff";
import { editPlacement } from "@/lib/placements/edit-placement";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH /api/placements/[id] - staff correct the end date of a closed placement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = parseWith(placementParamsSchema, await params);
    const auth = await requireStaff();
    if (!auth.authorized) {
      throw auth.reason === "unauthenticated"
        ? unauthenticated()
        : forbidden("Only shelter staff can perform this action.");
    }

    const supabase = await createSupabaseServerClient();

    const input = parseWith(editPlacementSchema, await parseJsonBody(request));
    const placement = await editPlacement(supabase, id, input);

    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
