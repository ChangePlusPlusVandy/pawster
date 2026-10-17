import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreatePetRequest, Pet } from "@/types";

export async function createPet(input: CreatePetRequest): Promise<Pet> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pets")
    .insert({
      shelterluv_animal_id: input.shelterluvAnimalId ?? null,
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      photo_url: input.photoUrl ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    shelterluvAnimalId: data.shelterluv_animal_id,
    name: data.name,
    species: data.species,
    breed: data.breed,
    photoUrl: data.photo_url,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}