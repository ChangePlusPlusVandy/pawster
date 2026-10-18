import type { SupabaseClient } from "@supabase/supabase-js";

import { badRequest } from "@/lib/api/http";
import { isUniqueViolation } from "@/lib/supabase/errors";
import { mapPet, type PetRow } from "@/lib/supabase/mappers";
import type { CreatePetRequest, Pet } from "@/types";

export type CreatePetInput = CreatePetRequest;

export async function createPet(
  supabase: SupabaseClient,
  input: CreatePetInput,
): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .insert({
      name: input.name,
      species: input.species,
      breed: input.breed ?? null,
      photo_url: input.photoUrl ?? null,
      status: input.status ?? "available",
      shelterluv_animal_id: input.shelterluvAnimalId ?? null,
    })
    .select("*")
    .single<PetRow>();

  if (error) {
    if (isUniqueViolation(error)) {
      throw badRequest("A pet with this shelterluvAnimalId already exists.");
    }
    throw error;
  }

  return mapPet(data);
}
