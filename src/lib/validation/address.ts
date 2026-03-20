import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().max(80).optional(),
  fullName: z.string().min(2).max(120),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100).default("Tamil Nadu"),
  country: z.string().min(2).max(100).default("India"),
  pincode: z.string().regex(/^\d{6}$/),
  phone: z.string().min(10).max(15),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressSchema.partial();
