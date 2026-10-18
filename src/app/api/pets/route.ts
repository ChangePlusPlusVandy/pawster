import {
  created,
  errorResponse,
  ok,
  parseJsonBody,
} from "@/lib/api/http";
import { createPetSchema, parseWith } from "@/lib/api/validation";
import { getCurrentProfile, requireStaff } from "@/lib/auth/get-current-profile";
import { createPet } from "@/lib/pets/create-pet";
import { getPets } from "@/lib/pets/get-pets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    const pets = await getPets(supabase, profile);

    return ok(pets);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const profile = await getCurrentProfile(supabase);
    requireStaff(profile);

    const input = parseWith(createPetSchema, await parseJsonBody(request));
    const pet = await createPet(supabase, input);

    return created(pet);
  } catch (error) {
    return errorResponse(error);
  }
}
