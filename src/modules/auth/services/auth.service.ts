import { addMinutes } from "date-fns";
import type { OtpPurpose } from "@prisma/client";
import { AppError } from "@/lib/api/errors";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/db/prisma";
import { issueTokenBundle } from "@/lib/auth/jwt";
import { generateOtp, sha256 } from "@/lib/security/hash";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { logger } from "@/lib/logging/logger";

type RegisterInput = {
  fullName: string;
  email?: string;
  mobile?: string;
  password: string;
};

const normalizeIdentifier = (identifier: string) => identifier.trim().toLowerCase();

export const registerUser = async (input: RegisterInput) => {
  const email = input.email?.trim().toLowerCase();
  const mobile = input.mobile?.trim();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email ?? undefined }, { mobile: mobile ?? undefined }],
    },
  });

  if (existing) {
    throw new AppError("User already exists with email or mobile", 409);
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      mobile,
      passwordHash: await hashPassword(input.password),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      role: true,
      isEmailVerified: true,
      isMobileVerified: true,
    },
  });

  const target = email ?? mobile;
  if (!target) {
    throw new AppError("Email or mobile is required", 400);
  }

  const otp = await createOtp({
    target,
    purpose: "REGISTER",
    userId: user.id,
  });

  return {
    user,
    otp,
  };
};

export const loginUser = async (identifier: string, password: string) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { mobile: identifier.trim() }],
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  const tokens = issueTokenBundle(user.id, user.role);
  await prisma.authSession.create({
    data: {
      userId: user.id,
      jti: tokens.jti,
      refreshTokenHash: sha256(tokens.refreshToken),
      expiresAt: addMinutes(new Date(), 60 * 24 * 30),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    },
    tokens,
  };
};

type CreateOtpInput = {
  userId?: string;
  target: string;
  purpose: OtpPurpose;
};

export const createOtp = async (input: CreateOtpInput) => {
  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      userId: input.userId,
      target: input.target,
      codeHash: sha256(code),
      purpose: input.purpose,
      expiresAt: addMinutes(new Date(), env.OTP_TTL_MINUTES),
    },
  });

  logger.info(
    {
      target: input.target,
      purpose: input.purpose,
      otpCode: code,
    },
    "Generated OTP",
  );

  return process.env.NODE_ENV === "production" ? undefined : code;
};

export const verifyOtp = async (target: string, code: string, purpose: OtpPurpose) => {
  const record = await prisma.otpCode.findFirst({
    where: {
      target,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!record) {
    throw new AppError("OTP expired or not found", 404);
  }

  const valid = sha256(code) === record.codeHash;
  if (!valid) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError("Invalid OTP", 400);
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  if (purpose === "REGISTER" && record.userId) {
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: user.email ? user.email === target || user.isEmailVerified : user.isEmailVerified,
          isMobileVerified: user.mobile ? user.mobile === target || user.isMobileVerified : user.isMobileVerified,
        },
      });
    }
  }

  return true;
};

export const requestPasswordReset = async (identifier: string) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { mobile: identifier.trim() }],
    },
  });

  if (!user) {
    return { otp: undefined };
  }

  const target = user.email ?? user.mobile;
  if (!target) {
    throw new AppError("No recovery channel available for this account", 400);
  }

  const otp = await createOtp({
    target,
    userId: user.id,
    purpose: "RESET_PASSWORD",
  });

  return { otp };
};

export const resetPassword = async (target: string, otpCode: string, newPassword: string) => {
  await verifyOtp(target, otpCode, "RESET_PASSWORD");

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: target.toLowerCase() }, { mobile: target }],
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  return true;
};

export const revokeSessionByRefreshToken = async (refreshToken: string) => {
  const hashed = sha256(refreshToken);
  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash: hashed,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      role: true,
      isEmailVerified: true,
      isMobileVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
