import type { NextRequest } from "next/server";

import {
  created,
  errorResponse,
  forbidden,
  notFound,
  ok,
  parseJsonBody,
} from "@/lib/api/http";
import {
  createWeeklyUpdateSchema,
  parseWith,
  weeklyUpdatesQuerySchema,
} from "@/lib/api/validation";
import { getCurrentProfile, isStaff } from "@/lib/auth/get-current-profile";
import { getPlacement } from "@/lib/placements/get-placement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createWeeklyUpdate } from "@/lib/weekly-updates/create-weekly-update";
import { getWeeklyUpdates } from "@/lib/weekly-updates/get-weekly-updates";

// GET /api/weekly-updates?placementId=<uuid>
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);

    const filters = parseWith(weeklyUpdatesQuerySchema, {
      placementId: request.nextUrl.searchParams.get("placementId") ?? undefined,
    });
    const weeklyUpdates = await getWeeklyUpdates(supabase, profile, filters);

    return ok(weeklyUpdates);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);

    const input = parseWith(createWeeklyUpdateSchema, await parseJsonBody(request));

    const placement = await getPlacement(supabase, input.placementId);

    if (!placement) {
      throw notFound("Placement not found.");
    }

    if (!isStaff(profile) && placement.fosterId !== profile.id) {
      throw forbidden("You can only submit updates for your own placements.");
    }

    const weeklyUpdate = await createWeeklyUpdate(supabase, {
      ...input,
      submittedBy: profile.id,
    });

    return created(weeklyUpdate);
  } catch (error) {
    return errorResponse(error);
  }
}
