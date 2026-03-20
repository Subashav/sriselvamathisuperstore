import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const getAuthUserIdFromRequest = async (request: NextRequest) => {
  const token = request.cookies.get("tn_access_token")?.value;
  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  const payload = verifyAccessToken(token);

  const session = await prisma.authSession.findFirst({
    where: {
      userId: payload.sub,
      jti: payload.jti,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new AppError("Session expired", 401);
  }

  return payload.sub;
};
