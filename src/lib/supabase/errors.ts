import type { PostgrestError } from "@supabase/supabase-js";

// https://www.postgresql.org/docs/current/errcodes-appendix.html
export function isForeignKeyViolation(error: PostgrestError) {
  return error.code === "23503";
}

export function isUniqueViolation(error: PostgrestError) {
  return error.code === "23505";
}
