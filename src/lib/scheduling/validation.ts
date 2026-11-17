import { z } from "zod";

export const hourOptions = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
] as const;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const proposalWindowSchema = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid day"),
    startTime: z.string().regex(timeRegex, "Pick a start time"),
    endTime: z.string().regex(timeRegex, "Pick an end time"),
  })
  .refine((w) => w.endTime > w.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const proposeAvailabilitySchema = z.object({
  supplyRequestId: z.string().uuid(),
  windows: z
    .array(proposalWindowSchema)
    .min(1, "Add at least one availability window"),
});

export const bookSlotSchema = z.object({
  supplyRequestId: z.string().uuid(),
  slotId: z.string().uuid(),
});

export const publishSlotsSchema = z.object({
  slots: z
    .array(
      z
        .object({
          startsAt: z.string().datetime({ offset: true }),
          endsAt: z.string().datetime({ offset: true }),
        })
        .refine((s) => new Date(s.endsAt) > new Date(s.startsAt), {
          message: "End must be after start",
          path: ["endsAt"],
        }),
    )
    .min(1, "Add at least one slot"),
});

export const acceptProposalSchema = z.object({
  schedulingRequestId: z.string().uuid(),
  windowId: z.string().uuid(),
});

export type ProposeAvailabilityInput = z.infer<typeof proposeAvailabilitySchema>;
export type BookSlotInput = z.infer<typeof bookSlotSchema>;
export type PublishSlotsInput = z.infer<typeof publishSlotsSchema>;
export type AcceptProposalInput = z.infer<typeof acceptProposalSchema>;
