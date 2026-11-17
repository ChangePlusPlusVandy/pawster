import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function logout() {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}