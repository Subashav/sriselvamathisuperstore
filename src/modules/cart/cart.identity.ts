import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const getCartIdentityFromRequest = (request: NextRequest): { userId?: string; guestToken?: string } => {
  const accessToken = request.cookies.get("tn_access_token")?.value;

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      return { userId: payload.sub };
    } catch {
      throw new AppError("Invalid auth session", 401);
    }
  }

  const guestToken = request.cookies.get("tn_guest_session")?.value;
  if (guestToken) {
    return { guestToken };
  }

  throw new AppError("Guest session not found. Call /api/auth/guest-session first", 401);
};
