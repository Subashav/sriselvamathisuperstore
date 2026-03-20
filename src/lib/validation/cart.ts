import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40),
});

export const cartIdentitySchema = z.object({
  guestToken: z.string().optional(),
});
