import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { env } from "@/lib/config/env";
import type { JwtPayload } from "@/types/auth";
import type { UserRole } from "@prisma/client";
import type { SignOptions } from "jsonwebtoken";

const accessTtl = env.JWT_ACCESS_TTL as SignOptions["expiresIn"];
const refreshTtl = env.JWT_REFRESH_TTL as SignOptions["expiresIn"];

export const createAccessToken = (userId: string, role: UserRole, jti: string) => {
  return jwt.sign({ sub: userId, role, jti, tokenType: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: accessTtl,
  });
};

export const createRefreshToken = (userId: string, role: UserRole, jti: string) => {
  return jwt.sign({ sub: userId, role, jti, tokenType: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTtl,
  });
};

export const issueTokenBundle = (userId: string, role: UserRole) => {
  const jti = nanoid(24);
  return {
    jti,
    accessToken: createAccessToken(userId, role, jti),
    refreshToken: createRefreshToken(userId, role, jti),
  };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
