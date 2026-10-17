import { z } from "zod";

export const createPetSchema = z.object({
  shelterluvAnimalId: z.string().nullable().optional(),
  name: z.string().trim().min(1, "name is required"),
  species: z.string().trim().min(1, "species is required"),
  breed: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: z.string().trim().min(1, "status is required"),
});