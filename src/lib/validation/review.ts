import { z } from "zod";

export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

export const reviewModerationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
