import { z } from "zod";

const mobileRegex = /^[6-9]\d{9}$/;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    email: z.email().trim().toLowerCase().optional(),
    mobile: z.string().trim().regex(mobileRegex, "Invalid Indian mobile number").optional(),
    password: z.string().min(8).max(64),
  })
  .refine((value) => Boolean(value.email || value.mobile), {
    message: "Either email or mobile is required",
    path: ["email"],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(8).max(64),
});

export const verifyOtpSchema = z.object({
  target: z.string().trim().min(3),
  code: z.string().length(6),
  purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD"]),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3),
});

export const resetPasswordSchema = z.object({
  target: z.string().trim().min(3),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(64),
});
