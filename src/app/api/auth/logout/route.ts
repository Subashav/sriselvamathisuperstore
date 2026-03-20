import { NextRequest } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { revokeSessionByRefreshToken } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("tn_refresh_token")?.value;

    const response = ok({ message: "Logged out" });
    clearAuthCookies(response);

    if (refreshToken) {
      await revokeSessionByRefreshToken(refreshToken);
    }

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
