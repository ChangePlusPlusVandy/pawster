import { z } from "zod";

import { validationError } from "@/lib/api/http";

const optionalText = z.string().trim().min(1).nullish();

export const createPetSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  species: z.string().trim().min(1, "species is required"),
  breed: optionalText,
  photoUrl: z.url().nullish(),
  status: z.string().trim().min(1).optional(),
  shelterluvAnimalId: optionalText,
});

export const createPlacementSchema = z
  .object({
    petId: z.uuid("petId must be a valid UUID"),
    fosterId: z.uuid("fosterId must be a valid UUID"),
    startDate: z.iso.date("startDate must be a YYYY-MM-DD date"),
    endDate: z.iso.date("endDate must be a YYYY-MM-DD date").nullish(),
    status: z.string().trim().min(1).optional(),
    shelterluvPlacementId: optionalText,
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "endDate cannot be before startDate",
    path: ["endDate"],
  });

export const createWeeklyUpdateSchema = z.object({
  placementId: z.uuid("placementId must be a valid UUID"),
  notes: z.string().trim().min(1, "notes is required"),
  behaviorConcerns: optionalText,
  medicalConcerns: optionalText,
  needsSupplies: z.boolean().optional(),
});

export const weeklyUpdatesQuerySchema = z.object({
  placementId: z.uuid("placementId must be a valid UUID").optional(),
});

export function parseWith<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw validationError(result.error);
  }

  return result.data;
}
