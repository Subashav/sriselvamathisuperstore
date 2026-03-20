import { z } from "zod";

export const quoteSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
});

export const checkoutPlaceOrderSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  paymentMethod: z.enum(["UPI", "CARD", "NET_BANKING", "WALLET", "COD"]),
  address: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(3),
    line2: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2).default("Tamil Nadu"),
    country: z.string().min(2).default("India"),
    pincode: z.string().regex(/^\d{6}$/),
    phone: z.string().min(10),
  }),
  notes: z.string().max(500).optional(),
});
