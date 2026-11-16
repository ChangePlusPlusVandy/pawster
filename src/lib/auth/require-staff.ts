import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export async function requireStaff() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      authorized: false as const,
      reason: "unauthenticated" as const,
    };
  }

  if (profile.role !== "staff") {
    return {
      authorized: false as const,
      reason: "forbidden" as const,
    };
  }

  return {
    authorized: true as const,
    profile,
  };
}