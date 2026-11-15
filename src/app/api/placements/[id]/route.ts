import {
  errorResponse,
  ok,
  parseJsonBody,
} from "@/lib/api/http";
import {
  editPlacementSchema,
  parseWith,
  placementParamsSchema,
} from "@/lib/api/validation";
import { getCurrentProfile, requireStaff } from "@/lib/auth/get-current-profile";
import { editPlacement } from "@/lib/placements/edit-placement";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PATCH /api/placements/[id] - staff correct the end date of a closed placement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = parseWith(placementParamsSchema, await params);
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    requireStaff(profile);

    const input = parseWith(editPlacementSchema, await parseJsonBody(request));
    const placement = await editPlacement(supabase, id, input);

    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
