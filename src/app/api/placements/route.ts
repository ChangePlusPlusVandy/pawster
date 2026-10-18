import {
  created,
  errorResponse,
  ok,
  parseJsonBody,
} from "@/lib/api/http";
import { createPlacementSchema, parseWith } from "@/lib/api/validation";
import { getCurrentProfile, requireStaff } from "@/lib/auth/get-current-profile";
import { createPlacement } from "@/lib/placements/create-placement";
import { getActivePlacements } from "@/lib/placements/get-active-placements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    const placements = await getActivePlacements(supabase, profile);

    return ok(placements);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    requireStaff(profile);

    const input = parseWith(createPlacementSchema, await parseJsonBody(request));
    const placement = await createPlacement(supabase, input);

    return created(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
