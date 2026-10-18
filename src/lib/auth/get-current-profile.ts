import type { SupabaseClient } from "@supabase/supabase-js";

import { forbidden, unauthenticated } from "@/lib/api/http";
import { mapProfile, type ProfileRow } from "@/lib/supabase/mappers";
import type { Profile } from "@/types";

const STAFF_ROLES = new Set(["staff", "admin"]);

export function isStaff(profile: Profile) {
  return STAFF_ROLES.has(profile.role);
}

// Resolves the signed-in Supabase user to their Pawster profile.
// Throws 401 when there is no session and 403 when the user has no profile.
export async function getCurrentProfile(
  supabase: SupabaseClient,
): Promise<Profile> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw unauthenticated();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw forbidden("No Pawster profile is linked to this account.");
  }

  return mapProfile(data);
}

export function requireStaff(profile: Profile) {
  if (!isStaff(profile)) {
    throw forbidden("Only shelter staff can perform this action.");
  }
}
