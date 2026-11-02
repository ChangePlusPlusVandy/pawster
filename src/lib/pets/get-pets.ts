import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pet } from "@/types";

export async function getPets(): Promise<Pet[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("pets").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data.map((pet) => ({
    id: pet.id,
    shelterluvAnimalId: pet.shelterluv_animal_id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    photoUrl: pet.photo_url,
    status: pet.status,
    createdAt: pet.created_at,
    updatedAt: pet.updated_at,
  }));
}