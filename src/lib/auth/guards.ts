import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { getAuthUserIdFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const requireUser = async (request: NextRequest) => {
  const userId = await getAuthUserIdFromRequest(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, mobile: true, fullName: true },
  });

  if (!user) {
    throw new AppError("Unauthorized", 401);
  }

  return user;
};

export const requireAdmin = async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user.role !== "ADMIN") {
    throw new AppError("Forbidden. Admin access required", 403);
  }

  return user;
};
