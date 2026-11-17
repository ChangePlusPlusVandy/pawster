import { z } from "zod";

import { validationError } from "@/lib/api/http";

export const placementParamsSchema = z.object({
  id: z.uuid("id must be a valid UUID"),
});

export const closePlacementSchema = z.object({
  endDate: z.iso.date("endDate must be a YYYY-MM-DD date"),
});

export const editPlacementSchema = z.object({
  endDate: z.iso.date("endDate must be a YYYY-MM-DD date"),
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
