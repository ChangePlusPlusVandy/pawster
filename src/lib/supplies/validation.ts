import { z } from "zod";

export const CUSTOM_NAME_MAX = 100;
export const COMMENTS_MAX = 1000;
export const NOTES_MAX = 1000;

export const supplyRequestItemSchema = z
  .object({
    supplyItemId: z.string().uuid().nullable().optional(),
    customName: z.string().nullable().optional(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
  })
  .superRefine((item, ctx) => {
    const customName = item.customName?.trim() ?? "";
    const hasCatalog = Boolean(item.supplyItemId);
    const hasCustom = customName.length > 0;

    if (hasCatalog === hasCustom) {
      ctx.addIssue({
        code: "custom",
        message: "Each row needs either a catalog item or a custom name",
        path: hasCatalog ? ["customName"] : ["supplyItemId"],
      });
    }

    if (hasCustom && customName.length > CUSTOM_NAME_MAX) {
      ctx.addIssue({
        code: "custom",
        message: `Custom name must be ${CUSTOM_NAME_MAX} characters or fewer`,
        path: ["customName"],
      });
    }
  })
  .transform((item) => {
    const customName = item.customName?.trim() || null;
    if (item.supplyItemId) {
      return {
        supplyItemId: item.supplyItemId,
        customName: null as string | null,
        quantity: item.quantity,
      };
    }
    return {
      supplyItemId: null as string | null,
      customName,
      quantity: item.quantity,
    };
  });

export const submitWeeklyCheckInSchema = z
  .object({
    needsSupplies: z.boolean(),
    comments: z
      .string()
      .trim()
      .max(COMMENTS_MAX, `Comments must be ${COMMENTS_MAX} characters or fewer`)
      .optional()
      .nullable(),
    fulfillmentMethod: z.enum(["pickup", "delivery"]).optional().nullable(),
    notesToStaff: z
      .string()
      .trim()
      .max(NOTES_MAX, `Notes must be ${NOTES_MAX} characters or fewer`)
      .optional()
      .nullable(),
    items: z.array(supplyRequestItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.needsSupplies) {
      if (data.items.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: "Items are only allowed when requesting supplies",
          path: ["items"],
        });
      }
      return;
    }

    if (!data.fulfillmentMethod) {
      ctx.addIssue({
        code: "custom",
        message: "Choose pickup or delivery",
        path: ["fulfillmentMethod"],
      });
    }

    if (data.items.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one supply item",
        path: ["items"],
      });
    }

    const seen = new Set<string>();
    data.items.forEach((item, index) => {
      if (item.supplyItemId) {
        if (seen.has(item.supplyItemId)) {
          ctx.addIssue({
            code: "custom",
            message: "Each catalog item can only be selected once",
            path: ["items", index, "supplyItemId"],
          });
        }
        seen.add(item.supplyItemId);
      }
    });
  });

export type SubmitWeeklyCheckInInput = z.infer<typeof submitWeeklyCheckInSchema>;
export type SupplyRequestItemInput = z.infer<typeof supplyRequestItemSchema>;
