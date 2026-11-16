import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  shelterluv_person_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, auth_user_id, shelterluv_person_id, full_name, email, phone, role, created_at, updated_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get current profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const profile = data as ProfileRow;

  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    shelterluvPersonId: profile.shelterluv_person_id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}