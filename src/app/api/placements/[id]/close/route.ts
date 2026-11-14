import {
  errorResponse,
  ok,
  parseJsonBody,
} from "@/lib/api/http";
import {
  closePlacementSchema,
  parseWith,
  placementParamsSchema,
} from "@/lib/api/validation";
import { getCurrentProfile, requireStaff } from "@/lib/auth/get-current-profile";
import { closePlacement } from "@/lib/placements/close-placement";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
)  {
  try {
    const { id } = parseWith(placementParamsSchema, await params);
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    requireStaff(profile);

    const input = parseWith(closePlacementSchema, await parseJsonBody(request));
    const placement = await closePlacement(supabase, id, input);

    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
