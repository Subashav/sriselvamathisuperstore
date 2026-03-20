import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { setAuthCookies } from "@/lib/auth/cookies";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIdentifier } from "@/lib/security/request";
import { loginUser } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const client = getClientIdentifier(request);
    const rate = checkRateLimit(`login:${client}`, 10, 60_000);
    if (!rate.allowed) {
      throw new AppError("Too many login attempts. Please try again later.", 429);
    }

    const body = await request.json();
    const input = loginSchema.parse(body);

    const result = await loginUser(input.identifier, input.password);
    const response = ok({ user: result.user, message: "Login successful" });

    setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
